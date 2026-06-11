'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Star, CheckCircle, TrendingUp, Bot, Lock } from 'lucide-react';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';

const features = [
  {
    icon: Bot,
    title: 'AI Milestone Verification',
    desc: 'Every deliverable is reviewed by AI against the original brief — no manual approvals needed.',
    color: 'from-brand-600 to-brand-500',
    glow: 'shadow-glow-sm',
  },
  {
    icon: Lock,
    title: 'On-Chain Escrow',
    desc: 'USDC locked in smart contracts per milestone. Funds release automatically on approval.',
    color: 'from-accent-600 to-accent-500',
    glow: 'shadow-glow-cyan',
  },
  {
    icon: Star,
    title: 'Reputation System',
    desc: 'Every deal updates on-chain scores for both creators and brands — building trust over time.',
    color: 'from-yellow-600 to-amber-500',
    glow: '',
  },
  {
    icon: TrendingUp,
    title: 'Milestone Payouts',
    desc: 'Split big deals into milestones. Get paid progressively as you deliver results.',
    color: 'from-emerald-600 to-green-500',
    glow: '',
  },
];

const stats = [
  { value: '$2.4M+', label: 'Escrowed to date' },
  { value: '1,200+', label: 'Deals completed' },
  { value: '98%',    label: 'AI approval rate' },
  { value: '< 24h',  label: 'Avg. verification time' },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>

      <HeroGeometric
        badge="Multichain · USDC Escrow"
        title1="Creator-Brand Deals,"
        title2="Secured On-Chain."
        description="FluxPay escrows every deal in a smart contract. Milestones are verified by AI. Payments release automatically. No trust required."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-4">

          {/* Creator CTA */}
          <Link href="/auth/signup?type=creator" className="group">
            <div className="relative w-64 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1"
                 style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)' }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'rgba(124,58,237,0.08)', boxShadow: '0 0 40px rgba(124,58,237,0.25)' }} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center mb-4 shadow-glow-sm">
                  <Star size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">I'm a Creator</h2>
                <p className="text-sm text-slate-400 mb-4">Browse brand deals, apply, and get paid per milestone.</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-400 group-hover:gap-2.5 transition-all">
                  Get started <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>

          {/* Brand CTA */}
          <Link href="/auth/signup?type=organization" className="group">
            <div className="relative w-64 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1"
                 style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.3)' }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'rgba(6,182,212,0.06)', boxShadow: '0 0 40px rgba(6,182,212,0.2)' }} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 flex items-center justify-center mb-4 shadow-glow-cyan">
                  <Shield size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">I'm a Brand</h2>
                <p className="text-sm text-slate-400 mb-4">Post deals, find creators, and verify results automatically.</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-400 group-hover:gap-2.5 transition-all">
                  Post a deal <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Sign in</Link>
        </p>
      </HeroGeometric>

      <div className="relative z-10">

        {/* ── Stats bar ── */}
        <section className="border-y border-white/5 py-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black gradient-text">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="container-custom py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              How <span className="gradient-text">FluxPay</span> works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete deal infrastructure — from posting to payment — without middlemen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc, color, glow }) => (
              <div key={title} className="card stagger-children fade-in group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 ${glow} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works steps ── */}
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container-custom">
            <h2 className="text-3xl font-black text-white text-center mb-14">Deal flow in 5 steps</h2>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-5 top-8 bottom-8 w-px hidden md:block" style={{ background: 'linear-gradient(to bottom, #7c3aed, #06b6d4)' }} />
              <div className="space-y-6 md:pl-16">
                {[
                  { n: '01', title: 'Brand posts a deal',           desc: 'Set milestones, budget, and requirements. Funds lock into escrow.' },
                  { n: '02', title: 'Creators apply',               desc: 'Eligible creators browse and submit applications with their portfolio.' },
                  { n: '03', title: 'Brand selects a creator',      desc: 'Review reputation, socials, and apply notes. Pick your partner.' },
                  { n: '04', title: 'Creator submits deliverables', desc: 'Upload the content link per milestone. AI reviews it instantly.' },
                  { n: '05', title: 'Funds release automatically',  desc: 'On AI approval, USDC flows to the creator. Reputation scores update.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="relative flex gap-6 items-start fade-in">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black z-10"
                         style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
                      <span className="text-white">{n}</span>
                    </div>
                    <div className="card flex-1 py-4 px-5">
                      <h4 className="font-bold text-white">{title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="container-custom py-24 text-center">
          <div className="max-w-2xl mx-auto rounded-3xl p-12 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.15) 100%)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <div className="orb orb-purple w-72 h-72 -top-16 -right-16 opacity-50" />
            <div className="relative z-10">
              <CheckCircle size={40} className="text-brand-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-4">Start your first deal today</h2>
              <p className="text-slate-400 mb-8">Join thousands of creators and brands already using FluxPay.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/auth/signup?type=creator" className="btn-primary btn-shimmer">
                  Join as Creator <ArrowRight size={16} />
                </Link>
                <Link href="/auth/signup?type=organization" className="btn-secondary">
                  Join as Brand <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}