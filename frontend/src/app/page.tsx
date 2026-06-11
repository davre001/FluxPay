'use client';

import Link from 'next/link';
import { ArrowRight, Star, CheckCircle, TrendingUp, Bot, Lock } from 'lucide-react';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { motion, animate } from 'framer-motion';
import { useState, useEffect } from 'react';

// Counter component for metrics counting effect
function Counter({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    // Extract prefix, numeric part, and suffix
    const match = value.match(/^([^0-9.]*)([0-9.,]+)([^0-9.]*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1];
    const numStr = match[2].replace(/,/g, ""); 
    const suffix = match[3];
    const target = parseFloat(numStr);

    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    const decimalPlaces = numStr.includes(".") ? (numStr.split(".")[1]?.length || 0) : 0;

    const controls = animate(0, target, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        let formattedNum = latest.toFixed(decimalPlaces);
        if (match[2].includes(",")) {
          const parts = formattedNum.split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          formattedNum = parts.join(".");
        }
        setDisplayValue(`${prefix}${formattedNum}${suffix}`);
      },
    });

    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

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
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Creator CTA */}
          <Link href="/auth/signup?type=creator" className="group">
            <div className="relative w-64 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1"
                 style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)' }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'rgba(124,58,237,0.08)', boxShadow: '0 0 40px rgba(124,58,237,0.25)' }} />
              <div className="relative">
                <div className="w-12 h-12 mb-4 overflow-hidden rounded-xl">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Creator" className="w-full h-full object-cover shadow-glow-sm" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">I'm a Creator</h2>
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                  <div className="overflow-hidden">
                    <p className="text-sm text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Browse brand deals, apply, and get paid per milestone.
                    </p>
                  </div>
                </div>
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
                <div className="w-12 h-12 mb-4 overflow-hidden rounded-xl">
                  <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80" alt="Brand" className="w-full h-full object-cover shadow-glow-cyan" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">I'm a Brand</h2>
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                  <div className="overflow-hidden">
                    <p className="text-sm text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Post deals, find creators, and verify results automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        <p className="mt-8 text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Sign in</Link>
        </p>
      </HeroGeometric>

      <div className="relative z-10">

        {/* ── Stats bar ── */}
        <section className="border-y border-white/5 py-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <motion.div 
                key={s.label} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
              >
                <p className="text-3xl font-black gradient-text">
                  <Counter value={s.value} />
                </p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="container-custom py-24">
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              How <span className="gradient-text">FluxPay</span> works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete deal infrastructure — from posting to payment — without middlemen.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc, color, glow }, idx) => (
              <motion.div 
                key={title} 
                className="card group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 ${glow} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── How it works steps ── */}
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container-custom">
            <motion.h2 
              className="text-3xl font-black text-white text-center mb-14"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Deal flow in 5 steps
            </motion.h2>
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
                ].map(({ n, title, desc }, idx) => (
                  <motion.div 
                    key={n} 
                    className="relative flex gap-6 items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                  >
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black z-10"
                         style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
                      <span className="text-white">{n}</span>
                    </div>
                    <div className="card flex-1 py-4 px-5">
                      <h4 className="font-bold text-white">{title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="container-custom py-24 text-center">
          <motion.div 
            className="max-w-2xl mx-auto rounded-3xl p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.15) 100%)', border: '1px solid rgba(124,58,237,0.3)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>
        </section>
      </div>
    </main>
  );
}