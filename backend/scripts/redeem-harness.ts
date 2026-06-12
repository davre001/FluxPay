// Path B — on-chain validation of the ERC-7710 redeem mechanic, using the SAME
// account type real users get: a Stateless7702 smart account (the brand's EOA
// upgraded in place). The brand's address both holds USDC and grants the
// delegation — exactly like a real Web3Auth brand wallet.
//
// Flow: brand (7702) delegates "transfer up to N USDC" → brand signs → agent
// redeems it on the active chain, sending USDC to a creator.
//
// Run:  node --import tsx scripts/redeem-harness.ts
// Env (repo-root .env or shell):
//   BRAND_TEST_PRIVATE_KEY   throwaway brand owner; its address holds USDC + a little ETH
//   FAUCET_PRIVATE_KEY       (or AGENT_PRIVATE_KEY) the agent that redeems
//   CREATOR_ADDRESS          recipient of the USDC (defaults to the agent address)
//   ACTIVE_CHAIN_ID / NETWORK_MODE   chain (default Base mainnet; set testnet for Base Sepolia)
//   HARNESS_AMOUNT_USDC      optional, defaults to 1
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  createPublicClient, createWalletClient, http, encodeFunctionData,
  parseUnits, formatUnits, getAddress,
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
const USDC = getAddress(activeChain.usdc);
const norm = (k?: string) => (k ? (k.startsWith('0x') ? k : `0x${k}`) : '') as `0x${string}`;

const ERC20 = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'a', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

async function main() {
  const brandKey = norm(process.env.BRAND_TEST_PRIVATE_KEY);
  const agentKey = norm(process.env.AGENT_PRIVATE_KEY || process.env.FAUCET_PRIVATE_KEY);
  if (!brandKey) throw new Error('BRAND_TEST_PRIVATE_KEY is required');
  if (!agentKey) throw new Error('FAUCET_PRIVATE_KEY (agent) is required');

  const chain = activeChain.viemChain;
  const publicClient = createPublicClient({ chain, transport: http(activeChain.rpcUrl) });
  const environment = getDeleGatorEnvironment(activeChain.id);
  const agent = privateKeyToAccount(agentKey);
  const creator = getAddress(process.env.CREATOR_ADDRESS || agent.address);

  console.log('── Path B redeem harness (Stateless7702) ─────────────');
  console.log('chain               :', activeChain.id, activeChain.name);

  // Brand = its EOA upgraded in place via EIP-7702 (same address holds USDC).
  const brand = await ensure7702Account({ ownerKey: brandKey, publicClient, chain, rpcUrl: activeChain.rpcUrl, environment, label: 'brand' });

  console.log('brand address       :', brand.account.address, '(holds USDC + grants)');
  console.log('agent (redeemer)    :', agent.address);
  console.log('creator (recipient) :', creator);
  console.log('──────────────────────────────────────────────────────');

  const [brandUsdc, agentEth] = await Promise.all([
    publicClient.readContract({ address: USDC, abi: ERC20, functionName: 'balanceOf', args: [brand.account.address] }),
    publicClient.getBalance({ address: agent.address }),
  ]);
  if ((brandUsdc as bigint) < parseUnits(AMOUNT, 6)) {
    throw new Error(`Brand ${brand.account.address} needs >= ${AMOUNT} USDC.`);
  }
  if (agentEth === 0n) throw new Error(`Agent ${agent.address} needs gas (native) on ${activeChain.name}.`);

  // Brand grants: transfer up to AMOUNT of USDC, delegated to the agent.
  const delegation = createDelegation({
    environment, from: brand.account.address, to: agent.address,
    scope: { type: 'erc20TransferAmount', tokenAddress: USDC, maxAmount: parseUnits(AMOUNT, 6) },
  });
  const signature = await brand.smart.signDelegation({ delegation });
  const signedDelegation = { ...delegation, signature };
  console.log('✓ brand signed delegation');

  // Agent redeems: execute the USDC transfer to the creator.
  const execution = createExecution({
    target: USDC, value: 0n,
    callData: encodeFunctionData({ abi: ERC20, functionName: 'transfer', args: [creator, parseUnits(AMOUNT, 6)] }),
  });
  const agentWallet = createWalletClient({ account: agent, chain, transport: http(activeChain.rpcUrl) });
  const before = await publicClient.readContract({ address: USDC, abi: ERC20, functionName: 'balanceOf', args: [creator] }) as bigint;

  const txHash = await redeemDelegations(
    agentWallet as any, publicClient as any, environment.DelegationManager,
    [{ permissionContext: [signedDelegation], executions: [execution], mode: '0x0000000000000000000000000000000000000000000000000000000000000000' as any }],
  );
  console.log('redeem tx:', txHash);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const after = await publicClient.readContract({ address: USDC, abi: ERC20, functionName: 'balanceOf', args: [creator] }) as bigint;
  console.log(`creator USDC ${formatUnits(before, 6)} → ${formatUnits(after, 6)}`);
  console.log(after > before ? '✅ PATH B PASSED — agent redeemed the delegation and moved USDC on-chain' : '❌ no balance change');
}

main().then(() => process.exit(0)).catch((e) => { console.error('✗ harness failed:', e?.message || e); process.exit(1); });
