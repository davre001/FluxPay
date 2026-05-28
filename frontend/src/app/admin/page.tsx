'use client';

import { AlertTriangle, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react'

export default function AdminPage() {
  const flaggedJobs = [
    {
      id: 1,
      name: 'Suspicious Price Scraping',
      status: 'flagged',
      reason: 'Potential ToS violation',
      createdAt: '2024-05-20T08:00:00Z',
      action: 'review',
    },
    {
      id: 2,
      name: 'High Failure Rate Job',
      status: 'under_review',
      reason: '30% task failure rate',
      createdAt: '2024-05-19T14:00:00Z',
      action: 'investigate',
    },
    {
      id: 3,
      name: 'Personal Data Collection',
      status: 'blocked',
      reason: 'Privacy policy violation',
      createdAt: '2024-05-18T10:00:00Z',
      action: 'refund',
    },
  ]

  const disputes = [
    {
      id: 1,
      jobId: 5,
      requester: 'User-123',
      worker: 'Worker-001',
      amount: 50.00,
      reason: 'Data quality dispute',
      filed: '2 days ago',
      status: 'pending',
    },
    {
      id: 2,
      jobId: 8,
      requester: 'User-456',
      worker: 'Worker-003',
      amount: 25.00,
      reason: 'Payment not received',
      filed: '1 day ago',
      status: 'pending',
    },
  ]

  const sources = [
    { id: 1, name: 'Lazada', status: 'approved', rateLimit: '100/min', lastChecked: '2024-05-20' },
    { id: 2, name: 'Shopee', status: 'approved', rateLimit: '50/min', lastChecked: '2024-05-20' },
    { id: 3, name: 'Alibaba', status: 'blocked', rateLimit: 'N/A', lastChecked: '2024-05-15' },
  ]

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden pb-16 pt-24 font-sans">
      
      {/* Background Motion Graphics (Glowing Orbs) */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>

      <div className="relative z-10 fade-in space-y-8 p-6 max-w-7xl mx-auto mt-4">
        
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage disputes, flags, and data sources</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-red-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-red-600 transition-colors">Flagged Jobs</p>
                <p className="text-3xl font-bold text-red-600 mt-2">3</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                <AlertTriangle className="text-red-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" size={32} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">Pending Disputes</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">2</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <AlertTriangle className="text-orange-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">Approved Sources</p>
                <p className="text-3xl font-bold text-green-600 mt-2">2</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                <CheckCircle className="text-green-600 transition-transform duration-300 group-hover:scale-110" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-red-200 cursor-default group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-red-600 transition-colors">Blocked Sources</p>
                <p className="text-3xl font-bold text-red-600 mt-2">1</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                <XCircle className="text-red-600 transition-transform duration-300 group-hover:scale-110" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Flagged Jobs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-emerald-50 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emerald-200 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="p-6 border-b border-emerald-50">
            <h2 className="text-xl font-bold text-gray-900">Flagged Jobs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50/50">
                <tr className="border-b border-emerald-100/50">
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Job Name</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Reason</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Created</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {flaggedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-emerald-50/30 transition-colors duration-200">
                    <td className="py-4 px-6 font-bold text-gray-900">{job.name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        job.status === 'flagged'
                          ? 'bg-red-100/80 text-red-800'
                          : job.status === 'under_review'
                          ? 'bg-yellow-100/80 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-600">{job.reason}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-4">
                        <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold transition-all group">
                          <Eye size={16} className="transition-transform group-hover:scale-110" /> Review
                        </button>
                        <button className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-bold transition-all group">
                          <Trash2 size={16} className="transition-transform group-hover:scale-110" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disputes */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:shadow-md hover:border-emerald-200 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Disputes</h2>
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="border border-gray-100 rounded-xl p-5 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all duration-300 group">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requester</p>
                    <p className="font-bold text-gray-900 mt-1">{dispute.requester}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Worker</p>
                    <p className="font-bold text-gray-900 mt-1">{dispute.worker}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</p>
                    <p className="font-bold text-emerald-600 mt-1">${dispute.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filed</p>
                    <p className="font-bold text-gray-900 mt-1">{dispute.filed}</p>
                  </div>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-lg mb-5 border border-gray-100">
                  <p className="text-sm font-medium text-gray-700"><span className="font-bold">Reason:</span> {dispute.reason}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-md transition-all text-sm font-bold">
                    Resolve for Requester
                  </button>
                  <button className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 hover:-translate-y-0.5 hover:shadow-md transition-all text-sm font-bold">
                    Resolve for Worker
                  </button>
                  <button className="px-5 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:-translate-y-0.5 hover:border-gray-300 transition-all text-sm font-bold">
                    Split 50/50
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources Management */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-emerald-50 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emerald-200 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="p-6 border-b border-emerald-50">
            <h2 className="text-xl font-bold text-gray-900">Data Sources</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50/50">
                <tr className="border-b border-emerald-100/50">
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Source Name</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Rate Limit</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Last Checked</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-xs tracking-wider uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-emerald-50/30 transition-colors duration-200">
                    <td className="py-4 px-6 font-bold text-gray-900">{source.name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        source.status === 'approved'
                          ? 'bg-green-100/80 text-green-800'
                          : 'bg-red-100/80 text-red-800'
                      }`}>
                        {source.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-gray-600">{source.rateLimit}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">{source.lastChecked}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-4">
                        <button className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors">
                          Settings
                        </button>
                        <button className={`font-bold text-sm transition-colors ${
                          source.status === 'approved'
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}>
                          {source.status === 'approved' ? 'Block' : 'Approve'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Health & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          
          {/* System Health */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:shadow-md hover:border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">System Health</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-700">API Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-sm font-bold text-green-600">Operational</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-700">Database</span>
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" style={{ animationDelay: '200ms' }} />
                  <span className="text-sm font-bold text-green-600">Healthy</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-700">Redis Streams</span>
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" style={{ animationDelay: '400ms' }} />
                  <span className="text-sm font-bold text-green-600">Operational</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">Smart Contracts</span>
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" style={{ animationDelay: '600ms' }} />
                  <span className="text-sm font-bold text-green-600">Live</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:shadow-md hover:border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="col-span-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md transition-all font-bold text-sm">
                Pause All Jobs
              </button>
              <button className="px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 hover:-translate-y-0.5 transition-all font-bold text-sm">
                Emergency Shutdown
              </button>
              <button className="px-4 py-3 border-2 border-orange-600 text-orange-600 rounded-xl hover:bg-orange-50 hover:-translate-y-0.5 transition-all font-bold text-sm">
                Clear Cache
              </button>
              <button className="col-span-2 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 transition-all font-bold text-sm">
                View Logs
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
