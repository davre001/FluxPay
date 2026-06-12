'use client';

import { useState } from 'react';
import { createWalletClient, custom, parseUnits } from 'viem';
import { erc7715ProviderActions } from '@metamask/delegation-toolkit/experimental';
import { useWeb3Auth } from '@web3auth/modal/react';
import { permissionAPI } from '@/lib/api-client';
import { BASE_SEPOLIA_CHAIN_ID, USDC_BASE_SEPOLIA, USDC_DECIMALS, AGENT_ADDRESS } from '@/config/chain';

// 30-day window for the permission — one long period so the grant effectively
// caps total spend at the job budget (period amount = budget).
const PERIOD_SECONDS = 60 * 60 * 24 * 30;

type GrantArgs = {
  jobId: string;
  organizationId?: string;
  creatorId?: string;
  budgetUsdc: number | string;
};

// Brand grants an ERC-7715 spending permission so the FluxPay agent can release
// up to `budgetUsdc` of USDC for a job's milestones — without the brand signing
// each release. The signed permission context is persisted server-side (Neon).
export function useGrantMilestonePermission() {
  const { web3Auth } = useWeb3Auth();
  const [granting, setGranting] = useState(false);

  async function grant({ jobId, organizationId, creatorId, budgetUsdc }: GrantArgs) {
    if (!AGENT_ADDRESS) {
      throw new Error('NEXT_PUBLIC_AGENT_ADDRESS is not set — cannot grant permission');
    }
    const provider = (web3Auth as any)?.provider;
    if (!provider) throw new Error('Wallet not connected');

    setGranting(true);
    try {
      const client = createWalletClient({ transport: custom(provider) }).extend(erc7715ProviderActions());

      const expiry = Math.floor(Date.now() / 1000) + PERIOD_SECONDS;
      const responses = await client.requestExecutionPermissions([
        {
          chainId: BASE_SEPOLIA_CHAIN_ID,
          expiry,
          signer: AGENT_ADDRESS as `0x${string}`,
          isAdjustmentAllowed: true,
          permission: {
            type: 'erc20-token-periodic',
            data: {
              tokenAddress: USDC_BASE_SEPOLIA,
              periodAmount: parseUnits(String(budgetUsdc), USDC_DECIMALS),
              periodDuration: PERIOD_SECONDS,
              justification: `Release up to ${budgetUsdc} USDC for FluxPay job ${jobId}`,
            },
          },
        },
      ]);

      const response: any = responses[0];

      // Persist the signed permission so the backend can redeem it later. Even
      // if this POST fails, the on-chain grant already happened — surface the
      // error so the brand can retry the save.
      await permissionAPI.store({
        jobId,
        organization_id: organizationId,
        creator_id: creatorId,
        signer: AGENT_ADDRESS,
        token_address: USDC_BASE_SEPOLIA,
        amount: String(budgetUsdc),
        chain_id: BASE_SEPOLIA_CHAIN_ID,
        permissions_context: response?.context,
        delegation_manager: response?.delegationManager,
        account_meta: response?.dependencies ?? null,
        raw: response,
      });

      return response;
    } finally {
      setGranting(false);
    }
  }

  return { grant, granting };
}
