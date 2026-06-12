// A2A redelegation harness (Stateless7702) — proves Agent-to-Agent coordination
// on-chain using the SAME account type real users get (EOAs upgraded in place).
//
//   Brand (7702)     --(root: up to N USDC)-->     Platform agent (7702)
//   Platform agent   --(child: redelegated)-->     Settlement agent (redeemer)
//   Settlement agent --redeems [child, root] chain--> pays the creator
//
// The settlement agent can spend ONLY what the platform redelegated, bounded by
// the brand's original grant — the A2A security story, demonstrated live.
//
// Run:  node --import tsx scripts/a2a-harness.ts
// Env (repo-root .env or shell):
//   BRAND_TEST_PRIVATE_KEY        brand owner (its address holds USDC + a little gas)
//   AGENT_PRIVATE_KEY / FAUCET_PRIVATE_KEY   platform agent owner (needs a little gas)
//   SETTLEMENT_AGENT_PRIVATE_KEY  settlement agent / redeemer (needs gas)
//   CREATOR_ADDRESS               recipient (defaults to settlement agent)
//   ACTIVE_CHAIN_ID / NETWORK_MODE   chain (default Base mainnet)
//   HARNESS_AMOUNT_USDC           default 1
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  createPublicClient, createWalletClient, http, encodeFunctionData, parseUnits, formatUnits, getAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getDeleGatorEnvironment, createDelegation, redeemDelegations, createExecution } from '@metamask/delegation-toolkit';
import { activeChain } from '../src/config/chains.ts';
import { ensure7702Account } from './_smart7702.ts';

const here = dirname(fileURLToPath(import.meta.url));
for (const p of [resolve(here, '../.env'), resolve(here, '../../.env')]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = t.slice(i + 1).trim();
  }
}

const AMOUNT = process.env.HARNESS_AMOUNT_USDC || '1';
const norm = (k?: string) => (k ? (k.startsWith('0x') ? k : `0x${k}`) : '') as `0x${string}`;
const USDC = getAddress(activeChain.usdc);

const ERC20 = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'a', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

async function main() {
  const brandKey = norm(process.env.BRAND_TEST_PRIVATE_KEY);
  const platformKey = norm(process.env.AGENT_PRIVATE_KEY || process.env.FAUCET_PRIVATE_KEY);
  const settlementKey = norm(process.env.SETTLEMENT_AGENT_PRIVATE_KEY);
  if (!brandKey || !platformKey || !settlementKey) {
    throw new Error('Need BRAND_TEST_PRIVATE_KEY, AGENT/FAUCET_PRIVATE_KEY, and SETTLEMENT_AGENT_PRIVATE_KEY');
  }

  const chain = activeChain.viemChain;
  const publicClient = createPublicClient({ chain, transport: http(activeChain.rpcUrl) });
  const environment = getDeleGatorEnvironment(activeChain.id);
  const settlement = privateKeyToAccount(settlementKey);
  const creator = getAddress(process.env.CREATOR_ADDRESS || settlement.address);

  console.log('── A2A redelegation harness (Stateless7702) ──────────');
  console.log('chain               :', activeChain.id, activeChain.name);

  // Brand + platform: EOAs upgraded in place via EIP-7702 (delegator + redelegator).
  const brand = await ensure7702Account({ ownerKey: brandKey, publicClient, chain, rpcUrl: activeChain.rpcUrl, environment, label: 'brand' });
  const platform = await ensure7702Account({ ownerKey: platformKey, publicClient, chain, rpcUrl: activeChain.rpcUrl, environment, label: 'platform' });

  console.log('brand address       :', brand.account.address, '(holds USDC)');
  console.log('platform agent      :', platform.account.address);
  console.log('settlement agent    :', settlement.address, '(redeemer)');
  console.log('creator (recipient) :', creator);
  console.log('──────────────────────────────────────────────────────');

  const brandUsdc = await publicClient.readContract({ address: USDC, abi: ERC20, functionName: 'balanceOf', args: [brand.account.address] }) as bigint;
  if (brandUsdc < parseUnits(AMOUNT, 6)) throw new Error(`Brand ${brand.account.address} needs >= ${AMOUNT} USDC.`);

  // 1. Brand → Platform (root delegation, up to AMOUNT USDC)
  const root = createDelegation({
    environment, from: brand.account.address, to: platform.account.address,
    scope: { type: 'erc20TransferAmount', tokenAddress: USDC, maxAmount: parseUnits(AMOUNT, 6) },
  });
  const signedRoot = { ...root, signature: await brand.smart.signDelegation({ delegation: root }) };
  console.log('✓ brand → platform root delegation signed');

  // 2. Platform → Settlement (redelegated child, chained under root)
  const child = createDelegation({
    environment, from: platform.account.address, to: settlement.address, parentDelegation: signedRoot,
    scope: { type: 'erc20TransferAmount', tokenAddress: USDC, maxAmount: parseUnits(AMOUNT, 6) },
  });
  const signedChild = { ...child, signature: await platform.smart.signDelegation({ delegation: child }) };
  console.log('✓ platform → settlement REDELEGATION signed (authority links to root)');

  // 3. Settlement agent redeems the [child, root] chain → pays the creator.
  const execution = createExecution({
    target: USDC, value: 0n,
    callData: encodeFunctionData({ abi: ERC20, functionName: 'transfer', args: [creator, parseUnits(AMOUNT, 6)] }),
  });
  const settlementWallet = createWalletClient({ account: settlement, chain, transport: http(activeChain.rpcUrl) });
  const before = await publicClient.readContract({ address: USDC, abi: ERC20, functionName: 'balanceOf', args: [creator] }) as bigint;

  const txHash = await redeemDelegations(
    settlementWallet as any, publicClient as any, environment.DelegationManager,
    [{ permissionContext: [signedChild, signedRoot], executions: [execution], mode: '0x0000000000000000000000000000000000000000000000000000000000000000' as any }],
  );
  console.log('redeem tx:', txHash);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const after = await publicClient.readContract({ address: USDC, abi: ERC20, functionName: 'balanceOf', args: [creator] }) as bigint;
  console.log(`creator USDC ${formatUnits(before, 6)} → ${formatUnits(after, 6)}`);
  console.log(after > before
    ? '✅ A2A PASSED — settlement agent paid via a redelegated, brand-bounded permission'
    : '❌ no balance change');
}

main().then(() => process.exit(0)).catch((e) => { console.error('✗ a2a harness failed:', e?.message || e); process.exit(1); });
