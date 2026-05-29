// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FluxPayEscrow} from "./FluxPayEscrow.sol";

/**
 * @title FluxPayEscrowFactory
 * @notice Deploys a fresh FluxPayEscrow for every job and tracks them on-chain.
 *         The factory owner is set as admin on every child escrow (emergency pause).
 */
contract FluxPayEscrowFactory {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    address public owner;
    address public defaultCoordinator;
    address public defaultToken;           // USDC on Morph

    // jobId (bytes32) → escrow contract address
    mapping(bytes32 => address) public escrows;
    address[] public allEscrows;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event EscrowCreated(
        bytes32 indexed jobId,
        address indexed escrow,
        address indexed requester,
        address coordinator,
        uint256 deadline
    );
    event CoordinatorUpdated(address oldCoordinator, address newCoordinator);
    event OwnershipTransferred(address oldOwner, address newOwner);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error Unauthorized();
    error JobAlreadyExists(bytes32 jobId);
    error ZeroAddress();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _coordinator, address _token) {
        if (_coordinator == address(0) || _token == address(0)) revert ZeroAddress();
        owner              = msg.sender;
        defaultCoordinator = _coordinator;
        defaultToken       = _token;
    }

    // -------------------------------------------------------------------------
    // Factory
    // -------------------------------------------------------------------------

    /**
     * @notice Deploy a new FluxPayEscrow for a job.
     * @param jobId     bytes32 of the off-chain job UUID.
     * @param requester Requester wallet address.
     * @param deadline  Unix timestamp — after this the requester can trigger a refund.
     * @return escrow   Address of the newly deployed escrow contract.
     */
    function createEscrow(
        bytes32 jobId,
        address requester,
        uint256 deadline
    ) external returns (address escrow) {
        return createEscrowWithCoordinator(jobId, requester, defaultCoordinator, deadline);
    }

    /**
     * @notice Same as createEscrow but with an explicit coordinator override.
     *         Useful when rotating coordinator wallets.
     */
    function createEscrowWithCoordinator(
        bytes32 jobId,
        address requester,
        address coordinator,
        uint256 deadline
    ) public returns (address escrow) {
        if (escrows[jobId] != address(0)) revert JobAlreadyExists(jobId);
        if (requester == address(0) || coordinator == address(0)) revert ZeroAddress();

        FluxPayEscrow e = new FluxPayEscrow();
        e.initialize(requester, defaultToken, coordinator, jobId, deadline, owner);

        escrows[jobId] = address(e);
        allEscrows.push(address(e));

        emit EscrowCreated(jobId, address(e), requester, coordinator, deadline);
        return address(e);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    function setCoordinator(address newCoordinator) external {
        if (msg.sender != owner) revert Unauthorized();
        if (newCoordinator == address(0)) revert ZeroAddress();
        emit CoordinatorUpdated(defaultCoordinator, newCoordinator);
        defaultCoordinator = newCoordinator;
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert Unauthorized();
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getEscrow(bytes32 jobId) external view returns (address) {
        return escrows[jobId];
    }

    function totalEscrows() external view returns (uint256) {
        return allEscrows.length;
    }
}
