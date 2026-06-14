import { encodeFunctionData, parseUnits, getAddress } from 'viem';
import { RedeemService } from './redeemService.ts';
import { RelayerService } from './relayerService.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';

const ERC20_TRANSFER_ABI = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const;

// Orchestrates a milestone payout: looks up the job's stored ERC-7715 permission,
// resolves the creator's wallet, and releases that milestone's USDC (ERC-7710).
// Two rails:
//   • direct  — agent EOA redeems and pays ETH gas (RedeemService). Works on
//               testnet; the default.
//   • relayer — 1Shot relays the redemption and pays gas in USDC (RelayerService).
//               MAINNET-only (1Shot is mainnet); this is the "all gas in USDC" path.
//
// Lives entirely in the (new) permission slice — it reads existing repos but
// changes none of the integrated job/milestone flows.
export class PayoutService {
  constructor(
    private permissions: any,
    private jobs: any,
    private milestones: any,
    private users: any,
    private redeem = new RedeemService(),
    private relayer = new RelayerService(),
  ) {}

  async releaseMilestone(
    milestoneId: string,
    opts: { via?: 'direct' | 'relayer'; chainId?: number; amountUsdc?: number } = {},
  ) {
    if (!milestoneId) throw new ValidationError('milestoneId is required');

    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status !== 'approved') {
      throw new ValidationError(`Milestone must be approved before payout (status: ${milestone.status})`);
    }

    const job = await this.jobs.findById(milestone.job_id);
    if (!job) throw new NotFoundError('Job not found for milestone');

    const permission = await this.permissions.findByJobId(job.id);
    if (!permission) throw new NotFoundError('No spending permission granted for this job');

    // Resolve the creator's payout wallet from the selected creator on the job.
    const creatorKey = job.selected_creator_id;
    if (!creatorKey) throw new ValidationError('Job has no selected creator');
    const creator = await this.users.findByKey(creatorKey);
    const recipient = creator?.walletAddress;
    if (!recipient) throw new ValidationError('Selected creator has no wallet address');

    const via = opts.via || 'direct';
    // Scored/partial payout: the AI score can release a fraction of the
    // milestone. Never exceed the milestone amount (the permission cap holds too).
    const amount = opts.amountUsdc != null
      ? Math.min(Number(opts.amountUsdc), Number(milestone.amount))
      : Number(milestone.amount);

    // Runtime budget guard: cumulative releases must never exceed the deal
    // budget (defense-in-depth atop the per-milestone cap and the permission
    // cap). Compared in integer cents to avoid float drift.
    const priorReleased = Number(job.released_total || 0);
    const budget = Number(job.total_budget || 0);
    if (budget > 0 && Math.round((priorReleased + amount) * 100) > Math.round(budget * 100)) {
      throw new ValidationError(
        `Release of ${amount} would exceed the job budget (${priorReleased} of ${budget} already released)`
      );
    }

    let result: any;

    if (via === 'relayer') {
      // Pay gas in USDC via 1Shot (mainnet). Build the USDC-transfer execution
      // the relayer will run on behalf of the brand's delegated account.
      const tokenAddress = getAddress(permission.token_address);
      const callData = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [getAddress(recipient), parseUnits(String(amount), 6)],
      });
      const relay = await this.relayer.relayRedemption({
        chainId: opts.chainId || permission.chain_id,
        permissionsContext: permission.permissions_context,
        delegationManager: permission.delegation_manager,
        executions: [{ target: tokenAddress, value: '0x0', callData }],
        memo: `FluxPay milestone ${milestoneId}`,
      });
      result = { ok: relay.relayed, txHash: relay.taskId || null, reason: relay.reason, via: 'relayer', ...relay };
    } else {
      const redeemed = await this.redeem.redeem({
        recipient,
        amountUsdc: amount,
        tokenAddress: permission.token_address,
        permissionsContext: permission.permissions_context,
        delegationManager: permission.delegation_manager,
      });
      result = { ok: redeemed.redeemed, txHash: redeemed.txHash || null, reason: redeemed.reason, via: 'direct', ...redeemed };
    }

    // Advance the deal's budget ledger on a successful release. Read-modify-write
    // on the Neon HTTP driver (no transactions) — fine here since releases for a
    // single job aren't concurrent in practice.
    if (result.ok) {
      const newReleased = Math.round((priorReleased + amount) * 1e6) / 1e6;
      // Done when the budget is fully released, or every milestone is approved
      // (quality-weighted payouts can sum to < budget yet still finish the deal).
      const allMilestones = await this.milestones.findMany({ job_id: job.id });
      const allApproved = allMilestones.length > 0 && allMilestones.every((m: any) => m.status === 'approved');
      const budgetReached = budget > 0 && Math.round(newReleased * 100) >= Math.round(budget * 100);
      const done = budgetReached || allApproved;
      await this.jobs.update(job.id, {
        released_total: newReleased,
        funding_status: done ? 'released' : 'partially_released',
        ...(done ? { status: 'completed' } : {}),
      });
    }

    // Record the attempt on the permission record (new slice — safe to mutate).
    await this.permissions.update(permission.id, {
      status: result.ok ? (via === 'relayer' ? 'relayed' : 'redeemed') : permission.status,
      last_payout: {
        milestone_id: milestoneId,
        amount,
        milestone_amount: milestone.amount,
        recipient,
        via,
        tx_hash: result.txHash || null,
        ok: Boolean(result.ok),
        reason: result.reason || null,
        at: new Date().toISOString(),
      },
    });

    return { milestone_id: milestoneId, recipient, amount, milestone_amount: milestone.amount, ...result };
  }
}
