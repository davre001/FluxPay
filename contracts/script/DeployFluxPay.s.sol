// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {FluxPayEscrowFactory} from "../src/FluxPayEscrowFactory.sol";

/**
 * @notice Deploy FluxPayEscrowFactory to Morph Holesky (or mainnet).
 *
 * Usage:
 *   # Local anvil
 *   forge script script/DeployFluxPay.s.sol --rpc-url localhost --broadcast
 *
 *   # Morph Holesky testnet
 *   forge script script/DeployFluxPay.s.sol \
 *     --rpc-url morph_holesky \
 *     --broadcast \
 *     --verify \
 *     --private-key $COORDINATOR_PRIVATE_KEY
 *
 * Required env vars:
 *   COORDINATOR_ADDRESS  — hot wallet that signs payouts
 *   USDC_ADDRESS         — USDC token on Morph (testnet mock or real)
 */
contract DeployFluxPay is Script {
    function run() external {
        address coordinator = vm.envAddress("COORDINATOR_ADDRESS");
        address usdc        = vm.envAddress("USDC_ADDRESS");

        console.log("Deploying FluxPayEscrowFactory");
        console.log("  Coordinator:", coordinator);
        console.log("  USDC token: ", usdc);
        console.log("  Chain ID:   ", block.chainid);

        vm.startBroadcast();

        FluxPayEscrowFactory factory = new FluxPayEscrowFactory(coordinator, usdc);

        vm.stopBroadcast();

        console.log("FluxPayEscrowFactory deployed at:", address(factory));
        console.log("Save this address as ESCROW_FACTORY_ADDRESS in your .env");
    }
}
