'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GridPattern } from '@/components/ui/grid-pattern';

type Testimonial = {
  name: string;
  role: string;
  image: string;
  company: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      'FluxPay transformed the way we manage our sponsorships. The platform is reliable, automated, and truly easy to use.',
    name: 'Alex Rivera',
    role: 'Marketing Director',
    company: 'Peak Athletic',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    quote:
      'The milestone-based escrow streamlined our creator collaborations. What impressed me most is their dedication to secure, trustless payouts.',
    name: 'Sarah Chen',
    role: 'Founder',
    company: 'Glow Cosmetics',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    quote:
      'They took time to understand the creator economy\'s unique requirements and delivered a system that fits seamlessly into daily operations.',
    name: 'Marcus Johnson',
    role: 'Creator Operations',
    company: 'NextGen Media',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
  {
    quote:
      'From onboarding to ongoing support, the FluxPay team has been responsive, professional, and incredibly easy to work with.',
    name: 'Elena Rodriguez',
    role: 'Head of Partnerships',
    company: 'Vanguard Gaming',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  },
  {
    quote:
      'Their collaborative approach makes us feel like partners, not just users. Every strategy session brings new value to our influencer campaigns.',
    name: 'David Kim',
    role: 'CTO',
    company: 'Creative Catalyst',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  },
  {
    quote:
      'We rely on FluxPay to manage critical sponsorship funds. The platform is intuitive, and the automated AI approvals save us hours every week.',
    name: 'Aisha Patel',
    role: 'Campaign Manager',
    company: 'Bright Future Tech',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative w-full pt-16 pb-24 px-4 overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div aria-hidden className="absolute inset-0 isolate z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 h-[600px] w-[300px] -translate-y-1/2 -rotate-45 rounded-full" 
             style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,239,0.15) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-0 h-[600px] w-[300px] -translate-y-1/2 rotate-45 rounded-full" 
             style={{ background: 'radial-gradient(ellipse at center, rgba(147,51,234,0.1) 0%, transparent 70%)' }} />
      </div>
      <div className="mx-auto max-w-6xl space-y-12 relative z-10">
        <div className="flex flex-col gap-3 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-[#262626] bg-[#111111] text-brand-400">
              Trusted by Top Brands
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-balance text-white">
            Real Results, Real Voices
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            See how businesses and creators are thriving with our platform — real stories, real impact, real growth.
          </p>
        </div>
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(({ name, role, company, quote, image }, index) => (
            <motion.div
              initial={{ filter: 'blur(4px)', y: 20, opacity: 0 }}
              whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: 0.1 * index, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              key={index}
              className="relative grid grid-cols-1 gap-y-4 overflow-hidden rounded-2xl p-6 transition-colors hover:border-[#333333]"
              style={{ background: '#111111', border: '1px solid #1a1a1a' }}
            >
              <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,white,transparent)]">
                <GridPattern
                  width={25}
                  height={25}
                  x={-12}
                  y={4}
                  strokeDasharray="3"
                  className="absolute inset-0 h-full w-full opacity-10"
                />
              </div>
              <div className="relative flex items-center gap-4 z-10">
                <img
                  alt={name}
                  src={image}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border border-[#2a2a2a]"
                />
                <div>
                  <p className="text-sm font-bold text-white">{name}</p>
                  <span className="text-xs font-semibold text-slate-500">
                    {role} <span className="text-brand-400">@ {company}</span>
                  </span>
                </div>
              </div>
              <blockquote className="relative z-10">
                <p className="text-slate-300 text-sm leading-relaxed">
                  "{quote}"
                </p>
              </blockquote>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
