// Shared helper: turn an EOA into a Stateless7702 MetaMask smart account —
// exactly what Web3Auth does for real brands/creators. The EOA is upgraded
// IN PLACE (same address) by setting its code to the EIP-7702 stateless
// delegator implementation, so the account address == the EOA address and that
// single address both holds USDC and grants delegations.
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { toMetaMaskSmartAccount, Implementation } from '@metamask/delegation-toolkit';

// EIP-7702 marks an upgraded EOA with code beginning 0xef0100 + impl address.
const DELEGATION_DESIGNATOR = '0xef0100';

export async function ensure7702Account(opts: {
  ownerKey: `0x${string}`;
  publicClient: any;
  chain: any;
  rpcUrl: string;
  environment: any;
  label: string;
}) {
  const account = privateKeyToAccount(opts.ownerKey);
  const wallet = createWalletClient({ account, chain: opts.chain, transport: http(opts.rpcUrl) });
  const impl = opts.environment.implementations.EIP7702StatelessDeleGatorImpl as `0x${string}`;

  const code = await opts.publicClient.getCode({ address: account.address });
  const upgraded = Boolean(code && code.toLowerCase().startsWith(DELEGATION_DESIGNATOR));

  if (!upgraded) {
    console.log(`  upgrading ${opts.label} EOA ${account.address} via EIP-7702 authorization…`);
    // `executor: 'self'` — the EOA submits its own authorization, so viem bumps
    // the authorization nonce past the tx nonce.
    const authorization = await wallet.signAuthorization({ account, contractAddress: impl, executor: 'self' });
    const tx = await wallet.sendTransaction({ authorizationList: [authorization], to: account.address, value: 0n });
    await opts.publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`  ✓ ${opts.label} upgraded in tx ${tx}`);
  } else {
    console.log(`  ${opts.label} ${account.address} already 7702-upgraded`);
  }

  // address == EOA address (in-place upgrade), matching production Web3Auth.
  const smart = await toMetaMaskSmartAccount({
    client: opts.publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { account },
  });

  return { account, wallet, smart };
}
