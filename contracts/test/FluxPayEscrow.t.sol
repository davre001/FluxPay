// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {FluxPayEscrow} from "../src/FluxPayEscrow.sol";
import {FluxPayEscrowFactory} from "../src/FluxPayEscrowFactory.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

// ---------------------------------------------------------------------------
// Minimal mock USDC (6 decimals)
// ---------------------------------------------------------------------------
contract MockUSDC {
    string public name     = "USD Coin";
    string public symbol   = "USDC";
    uint8  public decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
contract FluxPayEscrowTest is Test {
    MockUSDC              usdc;
    FluxPayEscrowFactory  factory;
    FluxPayEscrow         escrow;

    address admin       = address(0xAD1);
    address coordinator = address(0xC0);
    address requester   = address(0xBE);
    address worker1     = address(0xA1);
    address worker2     = address(0xA2);

    bytes32 constant JOB_ID       = keccak256("job-uuid-001");
    bytes32 constant MANIFEST     = keccak256("manifest-hash-001");
    bytes32 constant BATCH_HASH_1 = keccak256("batch-001");
    bytes32 constant BATCH_HASH_2 = keccak256("batch-002");

    uint256 constant FUND_AMOUNT = 100e6;  // 100 USDC
    uint256 constant DEADLINE    = 1_800_000_000;

    function setUp() public {
        usdc = new MockUSDC();

        // Deploy factory — admin is this test contract, coordinator is coordinator address
        vm.prank(admin);
        factory = new FluxPayEscrowFactory(coordinator, address(usdc));

        // Create escrow for the job
        vm.prank(admin);
        address escrowAddr = factory.createEscrow(JOB_ID, requester, DEADLINE);
        escrow = FluxPayEscrow(escrowAddr);

        // Fund requester
        usdc.mint(requester, FUND_AMOUNT * 10);
    }

    // -------------------------------------------------------------------------
    // State machine: happy path
    // -------------------------------------------------------------------------

    function test_FullHappyPath() public {
        // 1. Requester funds
        vm.startPrank(requester);
        usdc.approve(address(escrow), FUND_AMOUNT);
        escrow.fund(FUND_AMOUNT);
        vm.stopPrank();

        assertEq(uint(escrow.state()), uint(FluxPayEscrow.EscrowState.FUNDED));
        assertEq(escrow.fundedAmount(), FUND_AMOUNT);
        assertEq(escrow.remainingBalance(), FUND_AMOUNT);

        // 2. Coordinator marks ready
        vm.prank(coordinator);
        escrow.markReady(MANIFEST);

        assertEq(uint(escrow.state()), uint(FluxPayEscrow.EscrowState.ACTIVE));
        assertEq(escrow.manifestHash(), MANIFEST);

        // 3. Execute micro-payout batch 1
        address[] memory workers  = new address[](2);
        uint256[] memory amounts  = new uint256[](2);
        workers[0] = worker1; amounts[0] = 30e6;
        workers[1] = worker2; amounts[1] = 20e6;

        vm.prank(coordinator);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);

        assertEq(usdc.balanceOf(worker1), 30e6);
        assertEq(usdc.balanceOf(worker2), 20e6);
        assertEq(escrow.remainingBalance(), FUND_AMOUNT - 50e6);
        assertEq(escrow.batchPayouts(BATCH_HASH_1), 50e6);

        // 4. Execute micro-payout batch 2
        workers[0] = worker1; amounts[0] = 10e6;
        workers[1] = worker2; amounts[1] = 5e6;

        vm.prank(coordinator);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_2);

        assertEq(escrow.remainingBalance(), FUND_AMOUNT - 65e6);
        assertEq(escrow.getBatchCount(), 2);

        // 5. Complete job — leftover refunded to requester
        uint256 requesterBefore = usdc.balanceOf(requester);
        vm.prank(coordinator);
        escrow.completeJob();

        assertEq(uint(escrow.state()), uint(FluxPayEscrow.EscrowState.COMPLETED));
        assertEq(usdc.balanceOf(requester), requesterBefore + (FUND_AMOUNT - 65e6));
        assertEq(escrow.remainingBalance(), 0);
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    function test_EmitsJobFunded() public {
        vm.startPrank(requester);
        usdc.approve(address(escrow), FUND_AMOUNT);
        vm.expectEmit(true, true, false, true);
        emit FluxPayEscrow.JobFunded(JOB_ID, requester, FUND_AMOUNT);
        escrow.fund(FUND_AMOUNT);
        vm.stopPrank();
    }

    function test_EmitsManifestAttached() public {
        _fund();
        vm.expectEmit(true, false, false, true);
        emit FluxPayEscrow.ManifestAttached(JOB_ID, MANIFEST);
        vm.prank(coordinator);
        escrow.markReady(MANIFEST);
    }

    function test_EmitsWorkerPaid() public {
        _fundAndActivate();
        address[] memory workers = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        workers[0] = worker1; amounts[0] = 10e6;

        vm.expectEmit(true, true, false, true);
        emit FluxPayEscrow.WorkerPaid(JOB_ID, worker1, 10e6);
        vm.prank(coordinator);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);
    }

    // -------------------------------------------------------------------------
    // Access control
    // -------------------------------------------------------------------------

    function test_RevertFund_NotRequester() public {
        vm.startPrank(coordinator);
        usdc.approve(address(escrow), FUND_AMOUNT);
        vm.expectRevert(FluxPayEscrow.Unauthorized.selector);
        escrow.fund(FUND_AMOUNT);
        vm.stopPrank();
    }

    function test_RevertMarkReady_NotCoordinator() public {
        _fund();
        vm.prank(requester);
        vm.expectRevert(FluxPayEscrow.Unauthorized.selector);
        escrow.markReady(MANIFEST);
    }

    function test_RevertPayout_NotCoordinator() public {
        _fundAndActivate();
        address[] memory workers = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        workers[0] = worker1; amounts[0] = 1e6;
        vm.prank(requester);
        vm.expectRevert(FluxPayEscrow.Unauthorized.selector);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);
    }

    // -------------------------------------------------------------------------
    // Batch validation
    // -------------------------------------------------------------------------

    function test_RevertPayout_ExceedsBalance() public {
        _fundAndActivate();
        address[] memory workers = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        workers[0] = worker1; amounts[0] = FUND_AMOUNT + 1;
        vm.prank(coordinator);
        vm.expectRevert(abi.encodeWithSelector(FluxPayEscrow.InsufficientBalance.selector, FUND_AMOUNT + 1, FUND_AMOUNT));
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);
    }

    function test_RevertPayout_DuplicateBatch() public {
        _fundAndActivate();
        address[] memory workers = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        workers[0] = worker1; amounts[0] = 10e6;

        vm.prank(coordinator);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);

        vm.prank(coordinator);
        vm.expectRevert(abi.encodeWithSelector(FluxPayEscrow.DuplicateBatch.selector, BATCH_HASH_1));
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);
    }

    function test_RevertPayout_ArrayLengthMismatch() public {
        _fundAndActivate();
        address[] memory workers = new address[](2);
        uint256[] memory amounts = new uint256[](1);
        workers[0] = worker1; workers[1] = worker2; amounts[0] = 10e6;
        vm.prank(coordinator);
        vm.expectRevert(FluxPayEscrow.ArrayLengthMismatch.selector);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);
    }

    function test_RevertPayout_EmptyBatch() public {
        _fundAndActivate();
        address[] memory workers = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        vm.prank(coordinator);
        vm.expectRevert(FluxPayEscrow.EmptyBatch.selector);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);
    }

    // -------------------------------------------------------------------------
    // Cancellation & refund
    // -------------------------------------------------------------------------

    function test_CancelAndRefund_ByRequester() public {
        _fund();
        vm.prank(requester);
        escrow.cancelJob(keccak256("requester-cancelled"));
        assertEq(uint(escrow.state()), uint(FluxPayEscrow.EscrowState.CANCELLED));

        uint256 before = usdc.balanceOf(requester);
        escrow.refundRequester();
        assertEq(usdc.balanceOf(requester), before + FUND_AMOUNT);
        assertEq(uint(escrow.state()), uint(FluxPayEscrow.EscrowState.REFUNDED));
    }

    function test_CancelAndRefund_ByCoordinator_AfterPartialPayout() public {
        _fundAndActivate();
        address[] memory workers = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        workers[0] = worker1; amounts[0] = 30e6;
        vm.prank(coordinator);
        escrow.executeMicroPayout(workers, amounts, BATCH_HASH_1);

        vm.prank(coordinator);
        escrow.cancelJob(keccak256("coordinator-cancelled"));

        uint256 before = usdc.balanceOf(requester);
        escrow.refundRequester();
        assertEq(usdc.balanceOf(requester), before + (FUND_AMOUNT - 30e6));
    }

    function test_RevertRefund_AfterDeadline_NotCancelled() public {
        _fundAndActivate();
        // Deadline not passed, not cancelled → revert
        vm.expectRevert();
        escrow.refundRequester();
    }

    function test_RefundAfterDeadline() public {
        _fund();
        vm.warp(DEADLINE + 1);
        uint256 before = usdc.balanceOf(requester);
        escrow.refundRequester();
        assertEq(usdc.balanceOf(requester), before + FUND_AMOUNT);
    }

    // -------------------------------------------------------------------------
    // Pause
    // -------------------------------------------------------------------------

    function test_PauseBlocksFund() public {
        vm.prank(admin);
        escrow.pause();

        vm.startPrank(requester);
        usdc.approve(address(escrow), FUND_AMOUNT);
        vm.expectRevert(FluxPayEscrow.ContractPaused.selector);
        escrow.fund(FUND_AMOUNT);
        vm.stopPrank();
    }

    function test_UnpauseRestoresFund() public {
        vm.prank(admin);
        escrow.pause();
        vm.prank(admin);
        escrow.unpause();

        vm.startPrank(requester);
        usdc.approve(address(escrow), FUND_AMOUNT);
        escrow.fund(FUND_AMOUNT);
        vm.stopPrank();

        assertEq(uint(escrow.state()), uint(FluxPayEscrow.EscrowState.FUNDED));
    }

    // -------------------------------------------------------------------------
    // Factory
    // -------------------------------------------------------------------------

    function test_Factory_CreateEscrow() public {
        bytes32 newJobId = keccak256("job-002");
        vm.prank(admin);
        address newEscrow = factory.createEscrow(newJobId, requester, DEADLINE);

        assertEq(factory.getEscrow(newJobId), newEscrow);
        assertEq(factory.totalEscrows(), 2);
    }

    function test_Factory_RevertDuplicateJob() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(FluxPayEscrowFactory.JobAlreadyExists.selector, JOB_ID));
        factory.createEscrow(JOB_ID, requester, DEADLINE);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function _fund() internal {
        vm.startPrank(requester);
        usdc.approve(address(escrow), FUND_AMOUNT);
        escrow.fund(FUND_AMOUNT);
        vm.stopPrank();
    }

    function _fundAndActivate() internal {
        _fund();
        vm.prank(coordinator);
        escrow.markReady(MANIFEST);
    }
}
