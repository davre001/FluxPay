'use client';

import { useState, useEffect } from 'react'
import { TrendingUp, Award, Zap } from 'lucide-react'

// Custom hook-based component for the number counting animation
const AnimatedCounter = ({ value, duration = 2000, prefix = '', suffix = '', decimals = 0 }: { value: number, duration?: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      
      setCount(value * easeOut);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formattedCount = count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return <>{prefix}{formattedCount}{suffix}</>;
};

export default function WorkersPage() {
  const workers = [
    {
      id: 1,
      name: 'Worker-001',
      type: 'Automated Agent',
      tasksCompleted: 245,
      accuracy: 98.5,
      earnings: 1250.50,
      status: 'active',
      reputation: 4.9,
      specialty: 'E-commerce',
    },
    {
      id: 2,
      name: 'Worker-002',
      type: 'Automated Agent',
      tasksCompleted: 189,
      accuracy: 96.2,
      earnings: 950.75,
      status: 'active',
      reputation: 4.7,
      specialty: 'Web Scraping',
    },
    {
      id: 3,
      name: 'Worker-003',
      type: 'Manual Worker',
      tasksCompleted: 45,
      accuracy: 99.1,
      earnings: 425.00,
      status: 'active',
      reputation: 5.0,
      specialty: 'Verification',
    },
    {
      id: 4,
      name: 'Worker-004',
      type: 'Automated Agent',
      tasksCompleted: 312,
      accuracy: 97.8,
      earnings: 1650.25,
      status: 'active',
      reputation: 4.8,
      specialty: 'Data Collection',
    },
    {
      id: 5,
      name: 'Worker-005',
      type: 'Manual Worker',
      tasksCompleted: 28,
      accuracy: 98.0,
      earnings: 280.00,
      status: 'inactive',
      reputation: 4.6,
      specialty: 'Quality Check',
    },
  ]

  return (
    // Added pt-24 here to clear the fixed navbar
    <div className="relative min-h-screen bg-slate-50 overflow-hidden pb-16 pt-24 font-sans">
      
      {/* Background Motion Graphics (Glowing Orbs) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '5s' }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>

      <div className="relative z-10 fade-in space-y-8 p-6 max-w-7xl mx-auto mt-4">
        
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Workers Leaderboard</h1>
          <p className="text-gray-600 mt-2 text-lg">Top performing agents and manual workers</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Active Workers</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  <AnimatedCounter value={12} />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Zap className="text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" size={32} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-emerald-600 transition-colors">Total Tasks Completed</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  <AnimatedCounter value={819} />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                <TrendingUp className="text-emerald-600 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1" size={32} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-purple-600 transition-colors">Avg Accuracy</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  <AnimatedCounter value={97.9} decimals={1} suffix="%" />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <Award className="text-purple-600 transition-transform duration-300 group-hover:scale-110" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table (Scaled down text sizes) */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-emerald-50 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emerald-200 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50/50">
                <tr className="border-b border-emerald-100/50">
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Rank</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Worker</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Type</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Tasks</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Accuracy</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Reputation</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Earnings</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workers.map((worker, idx) => (
                  <tr key={worker.id} className="hover:bg-emerald-50/30 transition-colors duration-200 group">
                    <td className="py-3 px-4">
                      <span className={`w-7 h-7 text-xs rounded-full flex items-center justify-center font-bold text-white transition-transform duration-300 group-hover:scale-110 ${
                        idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm' : 'bg-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{worker.name}</p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">{worker.specialty}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide ${
                        worker.type === 'Automated Agent'
                          ? 'bg-blue-100/80 text-blue-800'
                          : 'bg-emerald-100/80 text-emerald-800'
                      }`}>
                        {worker.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 text-sm">{worker.tasksCompleted}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${worker.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-900">{worker.accuracy}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-sm">★</span>
                        <span className="font-bold text-gray-900 text-sm">{worker.reputation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 text-sm">${worker.earnings.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        worker.status === 'active'
                          ? 'bg-emerald-100/80 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {worker.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worker Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Automated Agents (10)</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">Distributed worker agents handling high-volume tasks</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-600 font-medium">Total Tasks Completed</span>
                <span className="font-bold text-gray-900 text-base">745</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-600 font-medium">Avg Accuracy</span>
                <span className="font-bold text-gray-900 text-base">97.6%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Total Earnings</span>
                <span className="font-bold text-emerald-600 text-base">$4,851.50</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Manual Workers (2)</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">Human workers for verification and complex tasks</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-600 font-medium">Total Tasks Completed</span>
                <span className="font-bold text-gray-900 text-base">73</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-600 font-medium">Avg Accuracy</span>
                <span className="font-bold text-gray-900 text-base">98.5%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Total Earnings</span>
                <span className="font-bold text-emerald-600 text-base">$705.00</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
