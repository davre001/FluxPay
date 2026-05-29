"""
EscrowClient — Python interface to FluxPayEscrow and FluxPayEscrowFactory on Morph.

The coordinator backend uses this to:
  1. Deploy a per-job escrow via the factory (createEscrow)
  2. Call markReady(manifestHash) once the manifest is attached
  3. Call executeMicroPayout(workers, amounts, batchHash) for each verified batch
  4. Call completeJob() to close out the escrow
  5. Call cancelJob(reasonHash) on failure

All signing is done with COORDINATOR_PRIVATE_KEY from settings.
Transactions are sent to Morph Holesky (chain 2810) or mainnet (2818).
"""
import hashlib
import json
import uuid
from pathlib import Path
from typing import Any

from app.config import settings
from app.infrastructure.logging import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# ABI definitions (minimal — only the functions we call from the backend)
# ---------------------------------------------------------------------------

ESCROW_ABI = [
    {
        "name": "initialize",
        "type": "function",
        "inputs": [
            {"name": "_requester",   "type": "address"},
            {"name": "_token",       "type": "address"},
            {"name": "_coordinator", "type": "address"},
            {"name": "_jobId",       "type": "bytes32"},
            {"name": "_deadline",    "type": "uint256"},
            {"name": "_admin",       "type": "address"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "name": "fund",
        "type": "function",
        "inputs": [{"name": "amount", "type": "uint256"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "name": "markReady",
        "type": "function",
        "inputs": [{"name": "_manifestHash", "type": "bytes32"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "name": "executeMicroPayout",
        "type": "function",
        "inputs": [
            {"name": "workers",   "type": "address[]"},
            {"name": "amounts",   "type": "uint256[]"},
            {"name": "batchHash", "type": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "name": "completeJob",
        "type": "function",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "name": "cancelJob",
        "type": "function",
        "inputs": [{"name": "reasonHash", "type": "bytes32"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "name": "state",
        "type": "function",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
    },
    {
        "name": "remainingBalance",
        "type": "function",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "name": "getBatchCount",
        "type": "function",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
]

FACTORY_ABI = [
    {
        "name": "createEscrow",
        "type": "function",
        "inputs": [
            {"name": "jobId",     "type": "bytes32"},
            {"name": "requester", "type": "address"},
            {"name": "deadline",  "type": "uint256"},
        ],
        "outputs": [{"name": "escrow", "type": "address"}],
        "stateMutability": "nonpayable",
    },
    {
        "name": "getEscrow",
        "type": "function",
        "inputs": [{"name": "jobId", "type": "bytes32"}],
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
    },
]


def _job_id_to_bytes32(job_id: uuid.UUID) -> bytes:
    """Convert a UUID to a bytes32 value (left-padded)."""
    return job_id.bytes.ljust(32, b"\x00")


def _usdc_to_units(amount_usdc: float) -> int:
    """Convert a float USDC amount to 6-decimal integer units."""
    return int(round(amount_usdc * 1_000_000))


class EscrowClient:
    """
    Async-safe coordinator interface to the on-chain escrow contracts.
    Web3.py calls are synchronous — wrap in asyncio.to_thread() if needed.
    """

    def __init__(self) -> None:
        self._w3: Any = None
        self._account: Any = None

    def _get_w3(self):
        if self._w3 is not None:
            return self._w3, self._account

        try:
            from web3 import Web3
            from eth_account import Account

            w3 = Web3(Web3.HTTPProvider(settings.morph_rpc_url))
            if not settings.coordinator_private_key:
                logger.warning("escrow_client_no_key", msg="COORDINATOR_PRIVATE_KEY not set — read-only mode")
                self._w3 = w3
                self._account = None
                return w3, None

            account = Account.from_key(settings.coordinator_private_key)
            self._w3 = w3
            self._account = account
            logger.info("escrow_client_ready", address=account.address, rpc=settings.morph_rpc_url)
            return w3, account

        except ImportError:
            raise RuntimeError("web3 package not installed. Run: pip install web3")

    def _get_factory(self):
        w3, _ = self._get_w3()
        if not settings.escrow_factory_address:
            raise ValueError("ESCROW_FACTORY_ADDRESS not set in config")
        return w3.eth.contract(
            address=w3.to_checksum_address(settings.escrow_factory_address),
            abi=FACTORY_ABI,
        )

    def _get_escrow(self, escrow_address: str):
        w3, _ = self._get_w3()
        return w3.eth.contract(
            address=w3.to_checksum_address(escrow_address),
            abi=ESCROW_ABI,
        )

    def _send_tx(self, fn) -> str:
        """Build, sign, and send a transaction. Returns tx hash."""
        w3, account = self._get_w3()
        if not account:
            raise RuntimeError("No coordinator private key configured")

        nonce = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price

        tx = fn.build_transaction({
            "from": account.address,
            "nonce": nonce,
            "gasPrice": gas_price,
        })
        gas = w3.eth.estimate_gas(tx)
        tx["gas"] = int(gas * 1.2)  # 20% buffer

        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if receipt["status"] != 1:
            raise RuntimeError(f"Transaction failed: {tx_hash.hex()}")

        logger.info("tx_confirmed", tx_hash=tx_hash.hex(), gas_used=receipt["gasUsed"])
        return tx_hash.hex()

    # -------------------------------------------------------------------------
    # Factory calls
    # -------------------------------------------------------------------------

    def create_escrow(self, job_id: uuid.UUID, requester_address: str, deadline: int) -> str:
        """Deploy a new escrow for a job. Returns the escrow contract address."""
        factory = self._get_factory()
        job_bytes = _job_id_to_bytes32(job_id)
        w3, account = self._get_w3()
        requester_cs = w3.to_checksum_address(requester_address)

        fn = factory.functions.createEscrow(job_bytes, requester_cs, deadline)
        tx_hash = self._send_tx(fn)

        # Read the deployed address back
        escrow_address = factory.functions.getEscrow(job_bytes).call()
        logger.info("escrow_created", job_id=str(job_id), escrow=escrow_address, tx=tx_hash)
        return escrow_address

    # -------------------------------------------------------------------------
    # Escrow calls
    # -------------------------------------------------------------------------

    def mark_ready(self, escrow_address: str, manifest_hash: str) -> str:
        """Attach manifest hash and transition escrow to ACTIVE."""
        escrow = self._get_escrow(escrow_address)
        mhash_bytes = bytes.fromhex(manifest_hash.removeprefix("0x").ljust(64, "0"))
        tx_hash = self._send_tx(escrow.functions.markReady(mhash_bytes))
        logger.info("escrow_marked_ready", escrow=escrow_address, manifest=manifest_hash)
        return tx_hash

    def execute_micro_payout(
        self,
        escrow_address: str,
        worker_wallets: list[str],
        amounts_usdc: list[float],
        batch_hash: str,
    ) -> str:
        """Execute a batch payout to workers. Returns tx hash."""
        w3, _ = self._get_w3()
        escrow = self._get_escrow(escrow_address)

        workers_cs = [w3.to_checksum_address(w) for w in worker_wallets]
        amounts_units = [_usdc_to_units(a) for a in amounts_usdc]
        bhash_bytes = bytes.fromhex(batch_hash.removeprefix("0x").ljust(64, "0"))

        tx_hash = self._send_tx(
            escrow.functions.executeMicroPayout(workers_cs, amounts_units, bhash_bytes)
        )
        total = sum(amounts_usdc)
        logger.info(
            "payout_executed",
            escrow=escrow_address,
            batch=batch_hash,
            workers=len(workers_cs),
            total_usdc=total,
            tx=tx_hash,
        )
        return tx_hash

    def complete_job(self, escrow_address: str) -> str:
        """Mark job complete — returns any leftover USDC to requester."""
        escrow = self._get_escrow(escrow_address)
        tx_hash = self._send_tx(escrow.functions.completeJob())
        logger.info("escrow_completed", escrow=escrow_address)
        return tx_hash

    def cancel_job(self, escrow_address: str, reason: str) -> str:
        """Cancel the job on-chain."""
        escrow = self._get_escrow(escrow_address)
        reason_hash = hashlib.sha256(reason.encode()).digest()
        tx_hash = self._send_tx(escrow.functions.cancelJob(reason_hash))
        logger.info("escrow_cancelled", escrow=escrow_address, reason=reason)
        return tx_hash

    # -------------------------------------------------------------------------
    # Read-only
    # -------------------------------------------------------------------------

    def get_remaining_balance(self, escrow_address: str) -> float:
        """Returns remaining USDC balance in the escrow as a float."""
        escrow = self._get_escrow(escrow_address)
        units = escrow.functions.remainingBalance().call()
        return units / 1_000_000

    def get_escrow_state(self, escrow_address: str) -> int:
        """Returns the raw EscrowState enum uint8."""
        escrow = self._get_escrow(escrow_address)
        return escrow.functions.state().call()


# Singleton — import and use directly
escrow_client = EscrowClient()
