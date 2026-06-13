'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, TrendingUp, Bot, Lock, Star, Briefcase, Users, UserCheck, Upload, Zap, UserRound, Building2, Search } from 'lucide-react';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { TestimonialsSection } from '@/components/ui/testimonials-section';
import Footer4Col from '@/components/ui/footer-column';
import { motion, animate, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';

// ─── Counter (fires on scroll-into-view) ────────────────────────────────────
function Counter({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const match = value.match(/^([^0-9.]*)([0-9.,]+)([^0-9.]*)$/);
    if (!match) { setDisplayValue(value); return; }

    const prefix = match[1];
    const numStr = match[2].replace(/,/g, '');
    const suffix = match[3];
    const target = parseFloat(numStr);
    if (isNaN(target)) { setDisplayValue(value); return; }

    const decimalPlaces = numStr.includes('.') ? (numStr.split('.')[1]?.length || 0) : 0;
    const el = spanRef.current;
    if (!el) return;

    let controls: { stop: () => void } | null = null;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        controls = animate(0, target, {
          duration: 2.2,
          ease: 'easeOut',
          onUpdate: (latest) => {
            let formattedNum = latest.toFixed(decimalPlaces);
            if (match[2].includes(',')) {
              const parts = formattedNum.split('.');
              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              formattedNum = parts.join('.');
            }
            setDisplayValue(`${prefix}${formattedNum}${suffix}`);
          },
        });
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => { observer.disconnect(); controls?.stop(); };
  }, [value]);

  return <span ref={spanRef}>{displayValue}</span>;
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function FadeInView({
  children, delay = 0, direction = 'up', className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}) {
  const initial: Record<string, number> = { opacity: 0 };
  if (direction === 'up') initial.y = 36;
  if (direction === 'left') initial.x = -36;
  if (direction === 'right') initial.x = 36;

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: false, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Deal flow data ───────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', icon: Briefcase, title: 'Brand posts a deal', desc: 'Set milestones, budget, and requirements. Funds lock into escrow instantly.', color: '#2563ef', glow: 'rgba(37,99,239,0.45)', tag: 'Brand' },
  { n: '02', icon: Users, title: 'Creators apply', desc: 'Eligible creators browse and submit applications with their portfolio.', color: '#1a4eda', glow: 'rgba(26,78,218,0.45)', tag: 'Creators' },
  { n: '03', icon: UserCheck, title: 'Brand selects a creator', desc: 'Review reputation, socials, and apply notes. Pick your perfect partner.', color: '#3a81f6', glow: 'rgba(58,129,246,0.45)', tag: 'Brand' },
  { n: '04', icon: Upload, title: 'Creator submits deliverables', desc: 'Upload the content link per milestone. AI reviews it instantly.', color: '#1f3fad', glow: 'rgba(31,63,173,0.45)', tag: 'Creator' },
  { n: '05', icon: Zap, title: 'Funds release automatically', desc: 'On AI approval, USDC flows to the creator. Reputation scores update on-chain.', color: '#91c5ff', glow: 'rgba(145,197,255,0.5)', tag: 'Auto' },
];

// ─── Deal flow section ────────────────────────────────────────────────────────
function DealFlowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(-1);   // -1 = nothing revealed yet
  const [travelPos, setTravelPos] = useState(0);       // 0..1 across the line
  const [isVisible, setIsVisible] = useState(false);
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which steps have been visited (so they stay revealed)
  const [revealed, setRevealed] = useState<boolean[]>(new Array(STEPS.length).fill(false));

  // Start loop when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-advance ball through steps
  useEffect(() => {
    if (!isVisible) return;
    let cur = 0;
    const advance = () => {
      setActiveStep(cur);
      setTravelPos(cur / (STEPS.length - 1));
      // Mark this step as revealed (permanently)
      setRevealed(prev => { const next = [...prev]; next[cur] = true; return next; });
      loopRef.current = setTimeout(() => {
        cur = (cur + 1) % STEPS.length;
        // On wrap-around reset reveals so the loop re-reveals each step
        if (cur === 0) setRevealed(new Array(STEPS.length).fill(false));
        advance();
      }, 2200);
    };
    advance();
    return () => { if (loopRef.current) clearTimeout(loopRef.current); };
  }, [isVisible]);

  const handleStepClick = (i: number) => {
    if (loopRef.current) clearTimeout(loopRef.current);
    setActiveStep(i);
    setTravelPos(i / (STEPS.length - 1));
    setRevealed(prev => { const next = [...prev]; next[i] = true; return next; });
    let cur = i;
    const resume = () => {
      cur = (cur + 1) % STEPS.length;
      if (cur === 0) setRevealed(new Array(STEPS.length).fill(false));
      setActiveStep(cur);
      setTravelPos(cur / (STEPS.length - 1));
      setRevealed(prev => { const next = [...prev]; next[cur] = true; return next; });
      loopRef.current = setTimeout(resume, 2200);
    };
    loopRef.current = setTimeout(resume, 3200);
  };

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden profile-theme"
      style={{ background: 'var(--background)', borderTop: '1px solid var(--border)' }}
    >
      {/* Subtle blue glow behind section */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(58,129,246,0.06) 0%, transparent 70%)'
      }} />

      <div className="container-custom relative">
        <FadeInView className="text-center mb-16">
          <span
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full"
            style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
          >
            Deal Workflow
          </span>
          <h2 className="text-3xl md:text-4xl font-black mt-3" style={{ color: 'var(--foreground)' }}>
            Deal flow in{' '}
            <span style={{ color: 'var(--chart-2)' }}>5 steps</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-sm" style={{ color: 'var(--muted-foreground)' }}>
            From posting to payout — fully automated, on-chain, and transparent.
          </p>
        </FadeInView>

        {/* ── Desktop horizontal timeline ── */}
        <div className="hidden lg:block">
          {/* Outer wrapper: needs overflow-visible so orb glow isn't clipped */}
          <div className="relative flex items-start justify-between" style={{ paddingTop: '28px' }}>

            {/* Ghost track */}
            <div
              className="absolute left-[4%] right-[4%] h-[2px] rounded-full"
              style={{ top: 28, background: 'var(--border)' }}
            />

            {/* Filled progress */}
            <motion.div
              className="absolute left-[4%] h-[2px] rounded-full origin-left"
              style={{
                top: 28,
                width: '92%',
                background: 'linear-gradient(90deg, #2563ef, #91c5ff)',
                boxShadow: '0 0 10px rgba(37,99,239,0.4)',
              }}
              animate={{ scaleX: activeStep >= 0 ? travelPos : 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* ── Travelling orb  (z-5 → goes BEHIND node icons which are z-10) ── */}
            {isVisible && (
              <motion.div
                className="absolute pointer-events-none"
                style={{ top: 28, left: '4%', width: '92%', zIndex: 5 }}
                animate={{ x: `${travelPos * 100}%` }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Pulsing glow halo */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 48, height: 48,
                    top: -24, left: -24,
                    background: `radial-gradient(circle, ${STEPS[Math.max(activeStep, 0)]?.glow} 0%, transparent 70%)`,
                  }}
                  animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Core ball */}
                <div
                  style={{
                    width: 16, height: 16,
                    borderRadius: '50%',
                    marginTop: -8, marginLeft: -8,
                    background: `linear-gradient(135deg, #fff 0%, ${STEPS[Math.max(activeStep, 0)]?.color} 100%)`,
                    boxShadow: `0 0 20px 5px ${STEPS[Math.max(activeStep, 0)]?.glow}`,
                  }}
                />
              </motion.div>
            )}

            {/* Step nodes */}
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isRevealed = revealed[i];
              const isCurrent = i === activeStep;

              return (
                <div
                  key={step.n}
                  className="flex flex-col items-center flex-1 relative cursor-pointer"
                  onClick={() => handleStepClick(i)}
                >
                  {/* Node circle — z-10 so ball (z-5) passes behind */}
                  <motion.div
                    className="rounded-full flex items-center justify-center relative"
                    style={{
                      width: 56, height: 56,
                      zIndex: 10,
                      background: isRevealed
                        ? `linear-gradient(135deg, ${step.color}, #91c5ff)`
                        : 'var(--muted)',
                      border: isRevealed ? `2px solid ${step.color}60` : '2px solid var(--border)',
                      boxShadow: isCurrent
                        ? `0 0 28px ${step.glow}, 0 0 6px ${step.glow}`
                        : isRevealed ? `0 0 12px ${step.glow}` : 'none',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isRevealed
                      ? { scale: isCurrent ? 1.15 : 1, opacity: 1 }
                      : { scale: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Icon size={22} style={{ color: isRevealed ? '#fff' : 'var(--muted-foreground)' }} />
                    {/* Pulse ring on current */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.3, repeat: Infinity }}
                        style={{ background: `radial-gradient(circle, ${step.glow} 0%, transparent 70%)` }}
                      />
                    )}
                  </motion.div>

                  {/* Step badge (appears with the node) */}
                  <motion.div
                    className="absolute -top-2 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ zIndex: 11, background: step.color, color: '#fff' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isRevealed ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    {step.n}
                  </motion.div>

                  {/* Card — hidden until revealed, then slides up */}
                  <motion.div
                    className="mt-5 rounded-2xl p-4 text-center max-w-[165px]"
                    style={{
                      background: isCurrent ? `${step.color}10` : 'var(--card)',
                      border: isCurrent ? `1px solid ${step.color}40` : '1px solid var(--border)',
                      boxShadow: isCurrent ? `0 4px 20px ${step.glow}` : '0 1px 6px rgba(0,0,0,0.04)',
                    }}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={isRevealed
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 20, scale: 0.9 }
                    }
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: step.color }}
                    >
                      {step.tag}
                    </span>
                    <h4 className="text-sm font-black mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>
                      {step.title}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {step.desc}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile vertical timeline ── */}
        <div className="lg:hidden relative">
          {/* Ghost track */}
          <div className="absolute left-6 top-0 bottom-0 w-[2px] rounded-full" style={{ background: 'var(--border)' }} />
          {/* Fill */}
          <motion.div
            className="absolute left-6 top-0 w-[2px] rounded-full origin-top"
            style={{ background: 'linear-gradient(180deg, #2563ef, #91c5ff)', boxShadow: '0 0 8px rgba(37,99,239,0.5)' }}
            animate={{ scaleY: activeStep >= 0 ? travelPos : 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Mobile orb — z-5 passes behind node z-10 */}
          {isVisible && (
            <motion.div
              className="absolute pointer-events-none"
              style={{ left: 24, top: 0, zIndex: 5 }}
              animate={{ top: `${travelPos * 100}%` }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 28, height: 28, top: -14, left: -14,
                  background: `radial-gradient(circle, ${STEPS[Math.max(activeStep, 0)]?.glow} 0%, transparent 70%)`
                }}
                animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                marginTop: -6, marginLeft: -6,
                background: `linear-gradient(135deg, #fff, ${STEPS[Math.max(activeStep, 0)]?.color})`,
                boxShadow: `0 0 14px 4px ${STEPS[Math.max(activeStep, 0)]?.glow}`,
              }} />
            </motion.div>
          )}

          <div className="space-y-5 pl-16">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isRevealed = revealed[i];
              const isCurrent = i === activeStep;

              return (
                <div
                  key={step.n}
                  className="relative cursor-pointer"
                  onClick={() => handleStepClick(i)}
                >
                  {/* Node — z-10 */}
                  <motion.div
                    className="absolute -left-10 rounded-full flex items-center justify-center"
                    style={{
                      width: 40, height: 40, zIndex: 10,
                      background: isRevealed
                        ? `linear-gradient(135deg, ${step.color}, #91c5ff)`
                        : 'var(--muted)',
                      border: isRevealed ? `2px solid ${step.color}60` : '2px solid var(--border)',
                      boxShadow: isCurrent ? `0 0 20px ${step.glow}` : isRevealed ? `0 0 10px ${step.glow}` : 'none',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isRevealed ? { scale: isCurrent ? 1.1 : 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Icon size={16} style={{ color: isRevealed ? '#fff' : 'var(--muted-foreground)' }} />
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ background: `radial-gradient(circle, ${step.glow} 0%, transparent 70%)` }}
                      />
                    )}
                  </motion.div>

                  {/* Card */}
                  <motion.div
                    className="rounded-2xl p-4"
                    style={{
                      background: isCurrent ? `${step.color}10` : 'var(--card)',
                      border: isCurrent ? `1px solid ${step.color}40` : '1px solid var(--border)',
                      boxShadow: isCurrent ? `0 4px 20px ${step.glow}` : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    initial={{ opacity: 0, x: 24 }}
                    animate={isRevealed ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: `${step.color}18`, color: step.color }}
                      >
                        {step.tag}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--muted-foreground)' }}>{step.n}</span>
                    </div>
                    <h4 className="font-black text-sm mb-0.5" style={{ color: 'var(--foreground)' }}>{step.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{step.desc}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress dots */}
        <div className="hidden lg:flex items-center justify-center gap-3 mt-12">
          {STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => handleStepClick(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeStep ? 28 : 8,
                height: 8,
                background: i === activeStep
                  ? `linear-gradient(90deg, ${step.color}, #91c5ff)`
                  : revealed[i]
                    ? `${step.color}80`
                    : 'var(--border)',
                boxShadow: i === activeStep ? `0 0 10px ${step.glow}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const features = [
  { icon: Bot, title: 'AI Milestone Verification', desc: 'Every deliverable is reviewed by AI against the original brief — no manual approvals needed.', color: 'from-brand-600 to-brand-500', glow: 'shadow-glow-sm' },
  { icon: Lock, title: 'On-Chain Escrow', desc: 'USDC locked in smart contracts per milestone. Funds release automatically on approval.', color: 'from-accent-600 to-accent-500', glow: 'shadow-glow-cyan' },
  { icon: Star, title: 'Reputation System', desc: 'Every deal updates on-chain scores for both creators and brands — building trust over time.', color: 'from-yellow-600 to-amber-500', glow: '' },
  { icon: TrendingUp, title: 'Milestone Payouts', desc: 'Split big deals into milestones. Get paid progressively as you deliver results.', color: 'from-emerald-600 to-green-500', glow: '' },
];

const stats = [
  { value: '$2.4M+', label: 'Escrowed to date' },
  { value: '1,200+', label: 'Deals completed' },
  { value: '98%', label: 'AI approval rate' },
  { value: '< 24h', label: 'Avg. verification time' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useUserStore();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push(user?.profileType === 'organization' ? '/organization/dashboard' : '/creator/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const backgrounds = [
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop', // Data/Analytics Dashboard
    'https://images.unsplash.com/photo-1516280440502-614749323df5?q=80&w=2069&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?q=80&w=2070&auto=format&fit=crop'
  ];
  const [bgIndex, setBgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'brand' | 'creator'>('brand');
  const [searchQuery, setSearchQuery] = useState('');

  const animatedPhrases = [
    "Secured On-Chain.",
    "Verified by AI.",
    "Trusted globally."
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % animatedPhrases.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const brandChips = ["Fashion", "Tech Startup", "E-commerce", "SaaS"];
  const creatorChips = ["Content Writing", "Video Editing", "UGC Creator", "Brand Ambassador"];
  const activeChips = activeTab === 'brand' ? brandChips : creatorChips;

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [backgrounds.length]);

  if (isAuthenticated) return null; // Prevent flash of landing page while redirecting

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* ── Hero (FluxPay style dark) ── */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden flex flex-col items-start justify-center">
        {/* Background Image Slider with Dark Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence>
            <motion.div 
              key={bgIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.4, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${backgrounds[bgIndex]}')` }}
            />
          </AnimatePresence>
          {/* Gradient to blend with the dark page background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/20 to-[#0a0a0f]" />
        </div>

        <div className="container-custom relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
          
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-[5rem] font-bold tracking-tight text-white mb-6 leading-[1.05] flex flex-col">
              <span>Creator-Brand Deals,</span>
              <span className="h-[1.2em] relative overflow-hidden block">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={phraseIndex}
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="block absolute whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
                  >
                    {animatedPhrases[phraseIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-xl leading-relaxed font-light">
              FluxPay escrows every deal in a smart contract. Milestones are verified by AI. Payments release automatically. No trust required.
            </p>

            {/* Toggle Buttons */}
            <div className="flex items-center gap-0 mb-6 w-fit rounded-full overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md p-1">
              <button 
                onClick={() => setActiveTab('brand')}
                className={`px-8 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95 ${activeTab === 'brand' ? 'bg-white/20 border border-white/30 text-white shadow-sm' : 'text-slate-300 hover:text-white border border-transparent'}`}>
                I am a Brand
              </button>
              <button 
                onClick={() => setActiveTab('creator')}
                className={`px-8 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95 ${activeTab === 'creator' ? 'bg-white/20 border border-white/30 text-white shadow-sm' : 'text-slate-300 hover:text-white border border-transparent'}`}>
                I am a Creator
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-2xl mb-8 group">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-md transition-all duration-300"></div>
              <div className="relative flex items-center bg-white rounded-full p-2 shadow-xl border border-white/20">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}&role=${activeTab}`);
                    }
                  }}
                  placeholder="What type of deal are you looking for?" 
                  className="flex-1 bg-transparent border-none outline-none px-6 text-slate-900 placeholder:text-slate-500 text-base font-medium"
                />
                <button 
                  onClick={() => {
                    if (searchQuery.trim()) {
                      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}&role=${activeTab}`);
                    }
                  }}
                  className="bg-[#141414] hover:bg-black text-white px-6 py-2.5 rounded-full font-medium transition-all active:scale-95 flex items-center gap-2"
                >
                  <Search size={16} className="text-[#a3e635]" />
                  Search
                </button>
              </div>
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-3">
              {activeChips.map((chip) => (
                <button 
                  key={chip} 
                  onClick={() => router.push(`/explore?q=${encodeURIComponent(chip)}&role=${activeTab}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-transparent hover:bg-white/10 text-slate-300 text-sm transition-all hover:text-white active:scale-95"
                >
                  {chip}
                  <ArrowRight size={14} className="opacity-70" />
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Content sections (profile theme = white/neutral) ── */}
      <div className="profile-theme relative z-10">

        {/* Stats bar */}
        <section className="py-12" style={{ background: '#0a0a0a', borderTop: '1px solid #1f1f1f', borderBottom: '1px solid #1f1f1f' }}>
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((s, idx) => (
                <motion.div
                  key={s.label}
                  className="text-center py-4 px-6"
                  style={idx < 3 ? { borderRight: '1px solid #1f1f1f' } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-3xl font-black tracking-tight" style={{ color: '#fafafa', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                    <Counter value={s.value} />
                  </p>
                  <p className="text-xs mt-1.5 font-medium uppercase tracking-widest" style={{ color: '#525252' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24" style={{ background: 'var(--background)' }}>
          <div className="container-custom">
            <FadeInView className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--foreground)' }}>
                How <span style={{ color: 'var(--chart-2)' }}>FluxPay</span> works
              </h2>
              <p className="max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                A complete deal infrastructure — from posting to payment — without middlemen.
              </p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {features.map(({ icon: Icon, title, desc, color, glow }, idx) => (
                <FadeInView key={title} delay={idx * 0.1} direction={idx % 2 === 0 ? 'left' : 'right'}>
                  <div
                    className="group rounded-2xl p-6 h-full transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,239,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.3)')}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 ${glow} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* Deal Flow */}
        <DealFlowSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Final CTA */}
        <section className="py-28" style={{ background: '#0a0a0a' }}>
          <div className="container-custom">
            <FadeInView>
              <div className="max-w-3xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(37,99,239,0.12)', border: '1px solid rgba(37,99,239,0.25)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#91c5ff' }}>Get Started</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight"
                  style={{ color: '#fafafa', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                  Start your first deal{' '}
                  <span style={{ color: '#3a81f6' }}>today</span>
                </h2>
                <p className="mb-10 max-w-lg mx-auto text-base" style={{ color: '#525252' }}>
                  Join thousands of creators and brands already using FluxPay to close deals faster, safer, on-chain.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                  <Link
                    href="/auth/signup?type=creator"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#fafafa', color: '#0a0a0a', boxShadow: '0 4px 20px rgba(250,250,250,0.1)' }}
                  >
                    <UserRound size={16} />
                    Join as Creator
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/auth/signup?type=organization"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'transparent', color: '#fafafa', border: '1px solid #262626' }}
                  >
                    <Building2 size={16} />
                    Join as Brand
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {/* Divider stats row */}
                <div className="grid grid-cols-3 gap-0 max-w-sm mx-auto" style={{ borderTop: '1px solid #1f1f1f', paddingTop: '2rem' }}>
                  {[['$2.4M+', 'Escrowed'], ['1,200+', 'Deals done'], ['98%', 'AI approval']].map(([val, lbl], i) => (
                    <div key={lbl} className="text-center px-4"
                      style={i < 2 ? { borderRight: '1px solid #1f1f1f' } : {}}>
                      <p className="text-xl font-black" style={{ color: '#3a81f6' }}>{val}</p>
                      <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#525252' }}>{lbl}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInView>
          </div>
        </section>

      </div>
      <Footer4Col />
    </main>
  );
}