'use client';

import { TrendingUp, Award, Zap } from 'lucide-react'

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
    <div className="fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workers Leaderboard</h1>
        <p className="text-gray-600 mt-1">Top performing agents and manual workers</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Workers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
            </div>
            <Zap className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">819</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Accuracy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">97.9%</p>
            </div>
            <Award className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Worker</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Tasks</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Accuracy</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Reputation</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Earnings</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, idx) => (
              <tr key={worker.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx < 3 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-semibold text-gray-900">{worker.name}</p>
                    <p className="text-xs text-gray-500">{worker.specialty}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    worker.type === 'Automated Agent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {worker.type}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">{worker.tasksCompleted}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${worker.accuracy}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{worker.accuracy}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold text-gray-900">{worker.reputation}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-gray-900">${worker.earnings}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    worker.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {worker.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Worker Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Automated Agents (10)</h2>
          <p className="text-gray-600 mb-4">Distributed worker agents handling high-volume tasks</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total Tasks Completed</span>
              <span className="font-semibold text-gray-900">745</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Avg Accuracy</span>
              <span className="font-semibold text-gray-900">97.6%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total Earnings</span>
              <span className="font-semibold text-green-600">$4,851.50</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Manual Workers (2)</h2>
          <p className="text-gray-600 mb-4">Human workers for verification and complex tasks</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total Tasks Completed</span>
              <span className="font-semibold text-gray-900">73</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Avg Accuracy</span>
              <span className="font-semibold text-gray-900">98.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total Earnings</span>
              <span className="font-semibold text-green-600">$705.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
