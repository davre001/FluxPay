'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Background Motion Graphics (Glowing Orbs) */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-glow" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-green-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-glow" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-glow" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

      {/* Additional floating orbs for depth */}
      <div className="absolute top-1/2 right-1/3 w-60 h-60 bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-green-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float-delayed" style={{ animationDuration: '9s', animationDelay: '1.5s' }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-16 pb-20">
        
        {/* Hero Section (Scaled down text sizes) */}
        <div className="space-y-5 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm leading-tight">
            FluxPay is an agentic micro-bounty <br className="hidden md:block" />
            platform for <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">data collection.</span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Request datasets, fund with USDC, and let our network of workers and verifiers deliver verified results.
          </p>
        </div>

        {/* CTA Buttons (Slightly more compact) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <Link href="/jobs/new">
            <button className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto text-sm hover:scale-105">
              Create Job
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto text-sm hover:scale-105">
              View Dashboard
            </button>
          </Link>
        </div>

        {/* Feature Cards (Reduced padding, tighter gaps, smaller text) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          
          {/* Card 1 */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
              <Zap size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fast Execution</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Micro-tasks distributed across worker agents for rapid completion.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Shield size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Verified Results</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Automated verification ensures quality and accuracy of data.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
              <TrendingUp size={24} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pay What You Use</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Only pay for verified results. Escrow protects both parties.
            </p>
          </div>

        </div>
      </div>

      {/* Powered By Morph Floating Badge */}
      <div className="fixed bottom-6 left-6 z-50 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-emerald-100 hover:scale-105 transition-transform duration-300 cursor-default">
          <div className="bg-gradient-to-tr from-emerald-500 to-green-400 p-1 rounded-full text-white shadow-inner">
            <Zap size={14} className="animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            Powered By Morph
          </span>
        </div>
      </div>

    </main>
  );
}