import { createWalletClient, http, encodeFunctionData, parseUnits, getAddress, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { erc7710WalletActions } from '@metamask/delegation-toolkit/experimental';
import { config } from '../config/index.ts';
import { activeChain } from '../config/chains.ts';

const ERC20_TRANSFER_ABI = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
] as const;

type RedeemArgs = {
  recipient: string;          // creator wallet (0x…) to receive USDC
  amountUsdc: number | string; // human amount, e.g. 100
  tokenAddress?: string;       // defaults to configured USDC
  permissionsContext: string;  // from the stored ERC-7715 grant
  delegationManager: string;   // from the stored ERC-7715 grant
};

type RedeemResult = { redeemed: boolean; reason?: string; txHash?: string; error?: string };

// Redeems a brand's ERC-7715 spending permission (ERC-7710) to transfer USDC to
// a creator. The agent EOA signs the redemption directly via the Delegation
// Toolkit's wallet action — no smart-account wrapping needed. Never throws so a
// payout failure can't break the milestone-approval flow.
export class RedeemService {
  private enabled: boolean;

  constructor() {
    this.enabled = Boolean(config.agent.privateKey);
  }

  isEnabled() {
    return this.enabled;
  }

  async redeem(args: RedeemArgs): Promise<RedeemResult> {
    if (!this.enabled) return { redeemed: false, reason: 'agent_not_configured' };
    if (!args.permissionsContext || !args.delegationManager) {
      return { redeemed: false, reason: 'missing_permission_context' };
    }
    if (!args.recipient || !isAddress(args.recipient)) {
      return { redeemed: false, reason: 'invalid_recipient' };
    }

    try {
      const key = config.agent.privateKey.startsWith('0x')
        ? config.agent.privateKey
        : `0x${config.agent.privateKey}`;
      const account = privateKeyToAccount(key as `0x${string}`);

      const wallet = createWalletClient({
        account,
        chain: activeChain.viemChain,
        transport: http(config.agent.rpcUrl),
      }).extend(erc7710WalletActions());

      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [getAddress(args.recipient), parseUnits(String(args.amountUsdc), 6)],
      });

      const txHash = await wallet.sendTransactionWithDelegation({
        account,
        chain: activeChain.viemChain,
        to: getAddress(args.tokenAddress || config.agent.usdcAddress),
        data,
        permissionsContext: args.permissionsContext as `0x${string}`,
        delegationManager: args.delegationManager as `0x${string}`,
      } as any);

      console.log(`[redeem] ✓ released ${args.amountUsdc} USDC to ${args.recipient} — tx ${txHash}`);
      return { redeemed: true, txHash };
    } catch (error) {
      console.warn(`[redeem] ✗ redemption to ${args.recipient} failed:`, (error as Error).message);
      return { redeemed: false, reason: 'redeem_failed', error: (error as Error).message };
    }
  }
}
