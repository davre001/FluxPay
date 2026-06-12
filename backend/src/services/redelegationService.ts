import { parseUnits, getAddress } from 'viem';
import { createDelegation, getDeleGatorEnvironment } from '@metamask/delegation-toolkit';
import { config } from '../config/index.ts';
import { activeChain } from '../config/chains.ts';

// A2A (Agent-to-Agent) coordination via delegation redelegation.
//
// The brand delegates a broad permission to the PLATFORM agent. Rather than the
// platform agent spending directly, it *redelegates* a deliberately narrower
// permission (one job, capped amount, single token) to a SETTLEMENT agent, which
// performs the actual USDC release. The redelegation links to the parent via
// `parentDelegation`, so the settlement agent's authority is bounded by — and
// traceable to — the brand's original grant.
//
// Security story: a compromise of the settlement key can spend at most the
// redelegated cap for that job, never the brand's full authorization.
export class RedelegationService {
  isEnabled() {
    return Boolean(config.agent.privateKey && config.settlement.privateKey);
  }

  // Builds the platform→settlement child delegation, scoped to `amount` of
  // `token`, chained under `parentDelegation` (the brand→platform delegation).
  // The returned delegation still needs to be signed by the platform agent
  // (account.signDelegation) before it can be redeemed.
  buildChildDelegation(opts: {
    platformAddress: string;
    settlementAddress: string;
    token: string;
    amount: number | string;
    parentDelegation: any;
    chainId?: number;
  }) {
    const chainId = opts.chainId || activeChain.id;
    const environment = getDeleGatorEnvironment(chainId);

    return createDelegation({
      environment,
      from: getAddress(opts.platformAddress),
      to: getAddress(opts.settlementAddress),
      parentDelegation: opts.parentDelegation,
      scope: {
        type: 'erc20TransferAmount',
        tokenAddress: getAddress(opts.token) as `0x${string}`,
        maxAmount: parseUnits(String(opts.amount), 6),
      },
    });
  }
}
