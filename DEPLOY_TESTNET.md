# FluxPay — Morph Holesky Testnet Deployment

## 1. Get a coordinator wallet

Create a new wallet (never use your main wallet as a hot key):

```bash
cast wallet new
```

Save the address and private key. Fund it with test ETH from the Morph Holesky faucet:
- Faucet: https://morphfaucet.com
- Explorer: https://explorer-holesky.morphl2.io
- RPC: https://rpc-holesky.morphl2.io
- Chain ID: 2810

## 2. Deploy a mock USDC (testnet only)

On testnet there is no real USDC. Deploy a mintable ERC-20:

```bash
cd contracts

forge create \
  --rpc-url morph_holesky \
  --private-key $COORDINATOR_PRIVATE_KEY \
  lib/openzeppelin-contracts/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol:ERC20PresetMinterPauser \
  --constructor-args "USD Coin" "USDC"
```

Save the deployed contract address as `USDC_ADDRESS`.

Mint test USDC to yourself:

```bash
cast send $USDC_ADDRESS \
  "mint(address,uint256)" \
  $COORDINATOR_ADDRESS 1000000000 \
  --rpc-url morph_holesky \
  --private-key $COORDINATOR_PRIVATE_KEY
```

(1000000000 = 1000 USDC at 6 decimals)

## 3. Deploy FluxPayEscrowFactory

```bash
cd contracts

export COORDINATOR_ADDRESS=0x...   # your coordinator wallet address
export USDC_ADDRESS=0x...          # mock USDC address from step 2

forge script script/DeployFluxPay.s.sol \
  --rpc-url morph_holesky \
  --broadcast \
  --private-key $COORDINATOR_PRIVATE_KEY
```

Copy the factory address from the output and save it as `ESCROW_FACTORY_ADDRESS`.

Verify on explorer (optional):
```bash
forge script script/DeployFluxPay.s.sol \
  --rpc-url morph_holesky \
  --verify \
  --private-key $COORDINATOR_PRIVATE_KEY
```

## 4. Update .env

```env
MORPH_RPC_URL=https://rpc-holesky.morphl2.io
COORDINATOR_ADDRESS=0x...
COORDINATOR_PRIVATE_KEY=0x...
USDC_ADDRESS=0x...
ESCROW_FACTORY_ADDRESS=0x...
```

Restart the backend after updating .env:
```powershell
# In terminal 1: Ctrl+C to stop, then:
.\start.ps1
```

## 5. End-to-end test

With the backend running and .env configured:

1. Register + login via `http://127.0.0.1:8000/docs`
2. `POST /api/jobs/quote` — create a job
3. On the frontend (or via wagmi), approve USDC and call `factory.createEscrow()` + `escrow.fund()`
4. `POST /api/jobs/{id}/funding-confirmation` — attach tx hash
5. Watch terminal 1 — coordinator will call `markReady()` on-chain
6. Verifier will call `executeMicroPayout()` and `completeJob()` after verification
7. Check `https://explorer-holesky.morphl2.io` for your transactions

## 6. Go to mainnet

When testnet works end-to-end:

```bash
# Morph Mainnet — Chain ID 2818
forge script script/DeployFluxPay.s.sol \
  --rpc-url morph_mainnet \
  --broadcast \
  --private-key $COORDINATOR_PRIVATE_KEY
```

Update `.env` with mainnet addresses and real USDC (`0x...` on Morph mainnet).
