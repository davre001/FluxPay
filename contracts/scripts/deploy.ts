import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const coordinatorAddress = process.env.COORDINATOR_ADDRESS ?? deployer.address;
  const usdcAddress        = process.env.USDC_ADDRESS ?? "";

  if (!usdcAddress) {
    throw new Error("USDC_ADDRESS env var is required");
  }

  const Factory = await ethers.getContractFactory("FluxPayEscrowFactory");
  const factory = await Factory.deploy(coordinatorAddress, usdcAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("FluxPayEscrowFactory deployed at:", factoryAddress);
  console.log("Set ESCROW_FACTORY_ADDRESS=" + factoryAddress + " in your .env");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
