'use client';

import Link from 'next/link'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Pay for Verified Data Outcomes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            FluxPay is an agentic micro-bounty platform for data collection. 
            Request datasets, fund with USDC, and let our network of workers and verifiers deliver verified results.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link href="/jobs/new">
              <button className="btn-primary flex items-center gap-2">
                Create Job <ArrowRight size={20} />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-secondary">View Dashboard</button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="card">
              <Zap className="mx-auto mb-4 text-blue-600" size={32} />
              <h3 className="text-lg font-semibold mb-2">Fast Execution</h3>
              <p className="text-gray-600">
                Micro-tasks distributed across worker agents for rapid completion
              </p>
            </div>
            <div className="card">
              <Shield className="mx-auto mb-4 text-green-600" size={32} />
              <h3 className="text-lg font-semibold mb-2">Verified Results</h3>
              <p className="text-gray-600">
                Automated verification ensures quality and accuracy of data
              </p>
            </div>
            <div className="card">
              <TrendingUp className="mx-auto mb-4 text-purple-600" size={32} />
              <h3 className="text-lg font-semibold mb-2">Pay What You Use</h3>
              <p className="text-gray-600">
                Only pay for verified results. Escrow protects both parties
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
