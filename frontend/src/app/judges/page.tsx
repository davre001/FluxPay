'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Bot, Zap, Loader2, CheckCircle2, ArrowRight, Coins, Wallet } from 'lucide-react';
import { oneshotAPI } from '@/lib/api-client';

// Live, read-only proof the 1Shot integration is wired — hits the real 1Shot
// read APIs (no funds, no auth) and shows the supported chain + USDC fee token +
// a real gas-in-USDC fee quote.
function OneShotWidget() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    oneshotAPI.status()
      .then(({ data }: any) => setStatus(data))
      .catch(() => setStatus({ live: false, reason: 'unreachable' }))
      .finally(() => setLoading(false));
  }, []);

  const fee = status?.feeQuote;
  const rate = fee?.rate ? Number(fee.rate) : null;

  return (
    <div className="rounded-2xl p-6 border" style={{ background: '#0d0d0d', borderColor: 'rgba(245,158,11,0.25)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f59e0b] flex items-center gap-2">
          <Zap size={16} fill="currentColor" /> 1Shot Settlement Rail — Live
        </h3>
        {loading ? (
          <Loader2 size={15} className="animate-spin text-[#6b7280]" />
        ) : status?.live ? (
          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">Connected</span>
        ) : (
          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">Unreachable</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[#6b7280]">Querying 1Shot capabilities…</p>
      ) : status?.live ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Settlement chain', val: `Base (${status.chainId})` },
            { label: 'Gas fee token', val: status.feeToken?.symbol ?? '—' },
            { label: 'Live USDC rate', val: rate ? rate.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl py-3 px-3" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
              <p className="text-sm font-black text-white truncate">{val}</p>
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#9ca3af]">1Shot relayer not reachable right now — the integration calls
          <code className="text-[#f59e0b]"> relayer_getCapabilities</code> / <code className="text-[#f59e0b]">relayer_getFeeData</code> live.</p>
      )}

      <p className="text-xs text-[#6b7280] mt-4 leading-relaxed">
        These are <span className="text-[#d1d5db] font-semibold">real, live</span> calls to 1Shot — no funds move. On mainnet,
        milestone payouts relay through this rail with <span className="text-[#f59e0b] font-semibold">gas paid in USDC</span>.
        On this Base Sepolia demo (1Shot is mainnet-only) the relay is <span className="text-[#d1d5db] font-semibold">simulated</span>,
        clearly labelled, using the live fee quote above.
      </p>
    </div>
  );
}

const TRACKS = [
  {
    icon: ShieldCheck, color: '#3b82f6',
    name: 'MetaMask Smart Accounts',
    what: 'Brands sign an ERC-7715 spending permission from their embedded smart account; the autonomous agent redeems it (ERC-7710) to pay creators — no per-payment signing.',
    extra: 'Unique extra: A2A re-delegation — the platform agent re-delegates a narrowed, capped permission to a separate settlement agent, so the spender is bounded below the brand’s full grant.',
  },
  {
    icon: Zap, color: '#f59e0b',
    name: '1Shot API',
    what: 'Milestone USDC settles through the 1Shot relayer, which pays gas in USDC — creators never need ETH. The USDC fee token is read live from getCapabilities, never hardcoded.',
    extra: 'Unique extra: multi-chain — settlement works across 8 mainnets, picking each chain’s USDC from live capabilities.',
  },
  {
    icon: Bot, color: '#22c55e',
    name: 'Venice AI',
    what: 'When a creator submits a deliverable, Venice AI verifies it against the brief and returns a 0–1 quality score — the AI verdict is the on-chain trigger; nobody clicks “approve”.',
    extra: 'Unique extra: quality-weighted payouts — the score sizes the release (0.85 → 85% of the milestone), so partial-quality work earns a partial payout.',
  },
];

export default function JudgesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Dev Cook-Off</p>
          <h1 className="text-lg font-bold text-white leading-none mt-0.5">Judge Guide</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-xl font-black text-white tracking-tight mb-2">Test FluxPay with zero real funds</h2>
          <p className="text-sm text-[#9ca3af] leading-relaxed">
            FluxPay runs on <span className="text-white font-semibold">Base Sepolia</span>. Sign in with the real
            MetaMask / Web3Auth modal, and the faucet drips test USDC to your smart account automatically. The
            full money path — ERC-7715 permission → Venice AI verification → USDC settlement — runs for real on
            testnet, no money out of pocket.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors">
              Start the demo <ArrowRight size={15} />
            </Link>
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#d1d5db]" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
              <Coins size={15} className="text-[#22c55e]" /> Faucet auto-funds your wallet
            </span>
          </div>
        </div>

        <OneShotWidget />

        <div className="space-y-4">
          {TRACKS.map((t) => (
            <div key={t.name} className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <t.icon size={18} style={{ color: t.color }} />
                <h3 className="text-base font-bold text-white">{t.name}</h3>
              </div>
              <p className="text-sm text-[#d1d5db] leading-relaxed">{t.what}</p>
              <p className="text-xs text-[#9ca3af] leading-relaxed mt-3 flex items-start gap-2">
                <CheckCircle2 size={14} style={{ color: t.color }} className="mt-0.5 flex-shrink-0" />
                <span>{t.extra}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight mb-4">Try both sides in ~2 minutes</h2>
          <ol className="space-y-3">
            {[
              ['Sign in', 'One click with Google/social or MetaMask — you get a real smart-account wallet, auto-funded by the faucet.'],
              ['As a Brand', 'Post a deal, sign the ERC-7715 permission once, then Approve & Release a milestone — Venice scores it and 1Shot settles, gas paid in USDC.'],
              ['As a Creator', 'Open the seeded $200 demo deal, submit the deliverable, and watch the autonomous loop pay out to your wallet.'],
            ].map(([h, b], i) => (
              <li key={h} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#252525] text-xs font-bold text-white flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="text-sm text-[#d1d5db] leading-relaxed"><span className="font-bold text-white">{h}.</span> {b}</p>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2 text-xs text-[#6b7280] mt-5 pt-4 border-t border-[#1a1a1a]">
            <Wallet size={14} /> Everything settles in test USDC — no real funds, ever.
          </div>
        </div>
      </div>
    </div>
  );
}
