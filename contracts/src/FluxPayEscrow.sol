// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/**
 * @title FluxPayEscrow
 * @notice Holds USDC for one FluxPay data job and releases micro-payouts to workers
 *         after the coordinator verifies results on-chain.
 *
 * State machine:
 *   PENDING → FUNDED → ACTIVE → COMPLETED
 *                    ↘ CANCELLED → REFUNDED
 *
 * Security model:
 *   - Only the coordinator (backend hot wallet) can executeMicroPayout and markReady.
 *   - Only the requester can fund() and request cancellation before ACTIVE.
 *   - Admin (deployer / factory owner) can pause in emergencies.
 *   - Reentrancy guard on all token-moving functions.
 *   - Batch payout sum is validated against remaining balance.
 *   - All batch hashes are stored for auditability.
 */
contract FluxPayEscrow {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    enum EscrowState { PENDING, FUNDED, ACTIVE, COMPLETED, CANCELLED, REFUNDED }

    IERC20 public token;          // USDC (6 decimals on Morph)
    address public requester;
    address public coordinator;
    address public admin;
    bytes32 public jobId;
    uint256 public deadline;

    uint256 public fundedAmount;
    uint256 public remainingBalance;
    bytes32 public manifestHash;

    EscrowState public state;
    bool public paused;

    // Audit trail: batchHash → total paid out in that batch
    mapping(bytes32 => uint256) public batchPayouts;
    bytes32[] public batchHashes;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event JobFunded(bytes32 indexed jobId, address indexed requester, uint256 amount);
    event ManifestAttached(bytes32 indexed jobId, bytes32 manifestHash);
    event MicroPayoutExecuted(bytes32 indexed jobId, bytes32 indexed batchHash, uint256 totalAmount);
    event WorkerPaid(bytes32 indexed jobId, address indexed worker, uint256 amount);
    event JobCancelled(bytes32 indexed jobId, bytes32 reasonHash);
    event RequesterRefunded(bytes32 indexed jobId, uint256 amount);
    event Paused(address by);
    event Unpaused(address by);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error Unauthorized();
    error InvalidState(EscrowState current, EscrowState required);
    error DeadlineExceeded();
    error InsufficientBalance(uint256 required, uint256 available);
    error ArrayLengthMismatch();
    error EmptyBatch();
    error DuplicateBatch(bytes32 batchHash);
    error ZeroAddress();
    error ContractPaused();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Guards
    // -------------------------------------------------------------------------

    bool private _entered;

    modifier nonReentrant() {
        if (_entered) revert ContractPaused();
        _entered = true;
        _;
        _entered = false;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyCoordinator() {
        if (msg.sender != coordinator) revert Unauthorized();
        _;
    }

    modifier onlyRequester() {
        if (msg.sender != requester) revert Unauthorized();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier inState(EscrowState required) {
        if (state != required) revert InvalidState(state, required);
        _;
    }

    // -------------------------------------------------------------------------
    // Initializer (called once by factory)
    // -------------------------------------------------------------------------

    /**
     * @notice Initialize the escrow. Called immediately after deployment by the factory.
     * @param _requester  Wallet that will fund the escrow and receive refunds.
     * @param _token      USDC token address on Morph.
     * @param _coordinator Backend coordinator wallet authorized to execute payouts.
     * @param _jobId      Off-chain job identifier (bytes32 of UUID).
     * @param _deadline   Unix timestamp after which the job can be cancelled.
     * @param _admin      Emergency admin (factory owner).
     */
    function initialize(
        address _requester,
        address _token,
        address _coordinator,
        bytes32 _jobId,
        uint256 _deadline,
        address _admin
    ) external {
        // Can only be called once
        if (requester != address(0)) revert Unauthorized();
        if (_requester == address(0) || _token == address(0) || _coordinator == address(0) || _admin == address(0)) {
            revert ZeroAddress();
        }

        requester   = _requester;
        token       = IERC20(_token);
        coordinator = _coordinator;
        jobId       = _jobId;
        deadline    = _deadline;
        admin       = _admin;
        state       = EscrowState.PENDING;
    }

    // -------------------------------------------------------------------------
    // Requester actions
    // -------------------------------------------------------------------------

    /**
     * @notice Fund the escrow with USDC.
     *         Requester must approve this contract for `amount` before calling.
     */
    function fund(uint256 amount) external nonReentrant whenNotPaused onlyRequester inState(EscrowState.PENDING) {
        if (amount == 0) revert EmptyBatch();

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        fundedAmount    = amount;
        remainingBalance = amount;
        state           = EscrowState.FUNDED;

        emit JobFunded(jobId, msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // Coordinator actions
    // -------------------------------------------------------------------------

    /**
     * @notice Attach the job manifest hash and mark the escrow active.
     *         Called after the coordinator plans micro-tasks and uploads the manifest.
     */
    function markReady(bytes32 _manifestHash) external onlyCoordinator whenNotPaused inState(EscrowState.FUNDED) {
        manifestHash = _manifestHash;
        state = EscrowState.ACTIVE;
        emit ManifestAttached(jobId, _manifestHash);
    }

    /**
     * @notice Pay workers for a verified result batch.
     * @param workers    Array of worker wallet addresses.
     * @param amounts    USDC amounts (6-decimal) for each worker.
     * @param batchHash  keccak256 of the verified result batch — stored on-chain for audit.
     */
    function executeMicroPayout(
        address[] calldata workers,
        uint256[] calldata amounts,
        bytes32 batchHash
    ) external nonReentrant whenNotPaused onlyCoordinator inState(EscrowState.ACTIVE) {
        if (workers.length == 0) revert EmptyBatch();
        if (workers.length != amounts.length) revert ArrayLengthMismatch();
        if (batchPayouts[batchHash] != 0) revert DuplicateBatch(batchHash);

        // Validate total before any transfers (checks-effects-interactions)
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        if (total > remainingBalance) revert InsufficientBalance(total, remainingBalance);

        // Record batch first (CEI pattern)
        batchPayouts[batchHash] = total;
        batchHashes.push(batchHash);
        remainingBalance -= total;

        emit MicroPayoutExecuted(jobId, batchHash, total);

        // Transfer to each worker
        for (uint256 i = 0; i < workers.length; i++) {
            if (amounts[i] == 0) continue;
            bool ok = token.transfer(workers[i], amounts[i]);
            if (!ok) revert TransferFailed();
            emit WorkerPaid(jobId, workers[i], amounts[i]);
        }
    }

    /**
     * @notice Mark the job complete and return any unspent USDC to the requester.
     *         Called by coordinator after all batches are paid.
     */
    function completeJob() external nonReentrant whenNotPaused onlyCoordinator inState(EscrowState.ACTIVE) {
        state = EscrowState.COMPLETED;
        uint256 leftover = remainingBalance;
        if (leftover > 0) {
            remainingBalance = 0;
            bool ok = token.transfer(requester, leftover);
            if (!ok) revert TransferFailed();
        }
    }

    // -------------------------------------------------------------------------
    // Cancellation / refund
    // -------------------------------------------------------------------------

    /**
     * @notice Cancel the job. Only callable by coordinator or requester.
     *         Requester can cancel while FUNDED (not yet active).
     *         Coordinator can cancel at any non-terminal state.
     */
    function cancelJob(bytes32 reasonHash) external whenNotPaused {
        bool isCoord = msg.sender == coordinator;
        bool isReq   = msg.sender == requester;
        if (!isCoord && !isReq) revert Unauthorized();

        // Requester can only cancel before ACTIVE
        if (isReq && state == EscrowState.ACTIVE) revert InvalidState(state, EscrowState.FUNDED);

        if (state == EscrowState.COMPLETED || state == EscrowState.CANCELLED || state == EscrowState.REFUNDED) {
            revert InvalidState(state, EscrowState.FUNDED);
        }

        state = EscrowState.CANCELLED;
        emit JobCancelled(jobId, reasonHash);
    }

    /**
     * @notice Refund the requester. Callable after CANCELLED or after deadline.
     */
    function refundRequester() external nonReentrant whenNotPaused {
        bool deadlinePassed = block.timestamp > deadline;
        bool isCancelled    = state == EscrowState.CANCELLED;
        if (!isCancelled && !deadlinePassed) revert InvalidState(state, EscrowState.CANCELLED);
        if (state == EscrowState.REFUNDED) revert InvalidState(state, EscrowState.CANCELLED);

        state = EscrowState.REFUNDED;
        uint256 amount = remainingBalance;
        if (amount == 0) return;

        remainingBalance = 0;
        bool ok = token.transfer(requester, amount);
        if (!ok) revert TransferFailed();

        emit RequesterRefunded(jobId, amount);
    }

    // -------------------------------------------------------------------------
    // Emergency pause (admin only)
    // -------------------------------------------------------------------------

    function pause() external onlyAdmin {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyAdmin {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getBatchHashes() external view returns (bytes32[] memory) {
        return batchHashes;
    }

    function getBatchCount() external view returns (uint256) {
        return batchHashes.length;
    }
}
