"""
FluxPay end-to-end on-chain demo (Morph Hoodi testnet).

Drives the full payment lifecycle directly against the deployed contracts:
  1. Create a per-job escrow via the factory
  2. Approve + fund the escrow with USDC (coordinator acts as requester for demo)
  3. markReady(manifestHash)
  4. executeMicroPayout(workers, amounts, batchHash)
  5. completeJob()

Run from backend/ with the venv active:
    .venv\\Scripts\\python.exe scripts\\demo_onchain.py
"""
import hashlib
import uuid

from web3 import Web3

from app.config import settings

USDC_ABI = [
    {"name": "approve", "type": "function", "inputs": [{"name": "s", "type": "address"}, {"name": "a", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable"},
    {"name": "balanceOf", "type": "function", "inputs": [{"name": "a", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
]

FACTORY_ABI = [
    {"name": "createEscrow", "type": "function", "inputs": [{"name": "jobId", "type": "bytes32"}, {"name": "requester", "type": "address"}, {"name": "deadline", "type": "uint256"}], "outputs": [{"name": "escrow", "type": "address"}], "stateMutability": "nonpayable"},
    {"name": "getEscrow", "type": "function", "inputs": [{"name": "jobId", "type": "bytes32"}], "outputs": [{"name": "", "type": "address"}], "stateMutability": "view"},
]

ESCROW_ABI = [
    {"name": "fund", "type": "function", "inputs": [{"name": "amount", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable"},
    {"name": "markReady", "type": "function", "inputs": [{"name": "h", "type": "bytes32"}], "outputs": [], "stateMutability": "nonpayable"},
    {"name": "executeMicroPayout", "type": "function", "inputs": [{"name": "workers", "type": "address[]"}, {"name": "amounts", "type": "uint256[]"}, {"name": "batchHash", "type": "bytes32"}], "outputs": [], "stateMutability": "nonpayable"},
    {"name": "completeJob", "type": "function", "inputs": [], "outputs": [], "stateMutability": "nonpayable"},
    {"name": "remainingBalance", "type": "function", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
    {"name": "state", "type": "function", "inputs": [], "outputs": [{"name": "", "type": "uint8"}], "stateMutability": "view"},
]

EXPLORER = "https://explorer-hoodi.morphl2.io/tx/"


def main() -> None:
    w3 = Web3(Web3.HTTPProvider(settings.morph_rpc_url))
    from eth_account import Account
    acct = Account.from_key(settings.coordinator_private_key)
    me = acct.address
    print(f"Coordinator: {me}")
    print(f"Chain ID:    {w3.eth.chain_id}\n")

    gas_price = 1_000_000_000  # 1 gwei

    def send(fn):
        nonce = w3.eth.get_transaction_count(me)
        tx = fn.build_transaction({"from": me, "nonce": nonce, "gasPrice": gas_price})
        tx["gas"] = int(w3.eth.estimate_gas(tx) * 1.3)
        signed = acct.sign_transaction(tx)
        h = w3.eth.send_raw_transaction(signed.raw_transaction)
        rcpt = w3.eth.wait_for_transaction_receipt(h, timeout=120)
        status = "OK" if rcpt["status"] == 1 else "FAILED"
        print(f"   tx {h.hex()}  [{status}]")
        return h.hex()

    usdc = w3.eth.contract(address=w3.to_checksum_address(settings.usdc_address), abi=USDC_ABI)
    factory = w3.eth.contract(address=w3.to_checksum_address(settings.escrow_factory_address), abi=FACTORY_ABI)

    bal = usdc.functions.balanceOf(me).call() / 1_000_000
    print(f"USDC balance: {bal}\n")

    # 1. Create escrow
    job_uuid = uuid.uuid4()
    job_bytes = job_uuid.bytes.ljust(32, b"\x00")
    deadline = w3.eth.get_block("latest")["timestamp"] + 86400
    print(f"[1] Creating escrow for job {job_uuid}...")
    send(factory.functions.createEscrow(job_bytes, me, deadline))
    escrow_addr = factory.functions.getEscrow(job_bytes).call()
    print(f"   Escrow deployed at: {escrow_addr}\n")

    escrow = w3.eth.contract(address=escrow_addr, abi=ESCROW_ABI)

    # 2. Approve + fund (10 USDC)
    fund_amount = 10_000_000  # 10 USDC
    print("[2] Approving USDC...")
    send(usdc.functions.approve(escrow_addr, fund_amount))
    print("    Funding escrow with 10 USDC...")
    send(escrow.functions.fund(fund_amount))
    print(f"   Escrow state: {escrow.functions.state().call()} (1=FUNDED)\n")

    # 3. markReady
    manifest_hash = hashlib.sha256(b"demo-manifest").digest()
    print("[3] Marking ready (attaching manifest)...")
    send(escrow.functions.markReady(manifest_hash))
    print(f"   Escrow state: {escrow.functions.state().call()} (2=ACTIVE)\n")

    # 4. executeMicroPayout — pay 3 demo workers
    workers = [
        w3.to_checksum_address("0x1111111111111111111111111111111111111111"),
        w3.to_checksum_address("0x2222222222222222222222222222222222222222"),
        w3.to_checksum_address("0x3333333333333333333333333333333333333333"),
    ]
    amounts = [2_000_000, 1_500_000, 1_000_000]  # 2, 1.5, 1 USDC
    batch_hash = hashlib.sha256(b"demo-batch-001").digest()
    print("[4] Executing micro-payout to 3 workers (4.5 USDC total)...")
    send(escrow.functions.executeMicroPayout(workers, amounts, batch_hash))
    for wkr in workers:
        wb = usdc.functions.balanceOf(wkr).call() / 1_000_000
        print(f"   {wkr}: {wb} USDC")
    print(f"   Remaining in escrow: {escrow.functions.remainingBalance().call() / 1_000_000} USDC\n")

    # 5. completeJob — refund leftover to requester
    print("[5] Completing job (refund leftover to requester)...")
    send(escrow.functions.completeJob())
    print(f"   Escrow state: {escrow.functions.state().call()} (3=COMPLETED)\n")

    print("=" * 60)
    print("DEMO COMPLETE — full payment lifecycle ran on Morph Hoodi.")
    print(f"View the escrow on explorer: https://explorer-hoodi.morphl2.io/address/{escrow_addr}")
    print("=" * 60)


if __name__ == "__main__":
    main()
