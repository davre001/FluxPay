'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { ChevronDown, Loader2 } from 'lucide-react';

// Lets the user switch between the EVM chains enabled in the Web3Auth dashboard.
// `useSwitchChain().chains` is populated automatically by Web3Auth's WagmiProvider,
// so this list reflects the dashboard config without any hardcoded chains.
export function ChainSwitcher() {
  const chainId = useChainId();
  const { chains, switchChain, isPending } = useSwitchChain();

  if (chains.length <= 1) return null;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={chainId}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        disabled={isPending}
        className="appearance-none bg-white/5 border border-white/10 text-sm text-white rounded-lg pl-3 pr-9 py-2 font-semibold focus:outline-none focus:border-brand-400 disabled:opacity-50 cursor-pointer"
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id} className="bg-surface-900 text-white">
            {c.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-slate-400">
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
      </span>
    </div>
  );
}

export default ChainSwitcher;
