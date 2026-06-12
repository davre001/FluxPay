import { createWalletClient, createPublicClient, http, parseUnits, getAddress, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { config } from '../config/index.ts';
import { isDbEnabled, query } from '../database/client.ts';

// Minimal ERC-20 ABI — just the calls the faucet needs.
const ERC20_ABI = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

// When there's no database, fall back to an in-memory record of who's been
// funded (resets on restart — fine for local dev; production uses Neon).
const memoryDrips = new Set<string>();

export class FaucetService {
  private enabled: boolean;

  constructor() {
    this.enabled = Boolean(config.faucet.privateKey);
  }

  private async alreadyFunded(address: string): Promise<boolean> {
    if (isDbEnabled()) {
      const rows = await query(`SELECT 1 FROM faucet_drips WHERE address = $1`, [address]);
      return rows.length > 0;
    }
    return memoryDrips.has(address);
  }

  private async recordDrip(address: string, txHash: string, amount: string) {
    if (isDbEnabled()) {
      await query(
        `INSERT INTO faucet_drips (address, tx_hash, amount) VALUES ($1, $2, $3)
         ON CONFLICT (address) DO NOTHING`,
        [address, txHash, amount],
      );
    } else {
      memoryDrips.add(address);
    }
  }

  // Sends the one-time welcome USDC drip. Never throws — a faucet failure must
  // not block signup. Returns a result the caller can surface or ignore.
  async drip(rawAddress: string): Promise<{ funded: boolean; reason?: string; txHash?: string; amount?: string }> {
    if (!this.enabled) {
      return { funded: false, reason: 'faucet_disabled' };
    }
    if (!rawAddress || !isAddress(rawAddress)) {
      return { funded: false, reason: 'invalid_address' };
    }
    const address = getAddress(rawAddress); // checksummed

    try {
      if (await this.alreadyFunded(address)) {
        return { funded: false, reason: 'already_funded' };
      }

      const account = privateKeyToAccount(
        (config.faucet.privateKey.startsWith('0x') ? config.faucet.privateKey : `0x${config.faucet.privateKey}`) as `0x${string}`,
      );
      const transport = http(config.faucet.rpcUrl);
      const wallet = createWalletClient({ account, chain: baseSepolia, transport });
      const publicClient = createPublicClient({ chain: baseSepolia, transport });

      const amount = parseUnits(config.faucet.dripUsdc, 6); // testnet USDC has 6 decimals
      const usdc = config.faucet.usdcAddress as `0x${string}`;

      const txHash = await wallet.writeContract({
        account,
        chain: baseSepolia,
        address: usdc,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [address, amount],
      });

      // Record immediately (before confirmation) so a slow receipt can't let a
      // double-submit through; the ON CONFLICT / Set keeps it idempotent.
      await this.recordDrip(address, txHash, config.faucet.dripUsdc);
      // Best-effort wait so the client knows it landed; ignore timeout.
      publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 }).catch(() => {});

      console.log(`[faucet] ✓ sent ${config.faucet.dripUsdc} USDC to ${address} — tx ${txHash}`);
      return { funded: true, txHash, amount: config.faucet.dripUsdc };
    } catch (error) {
      console.warn(`[faucet] ✗ drip to ${address} failed:`, (error as Error).message);
      return { funded: false, reason: 'send_failed' };
    }
  }
}
