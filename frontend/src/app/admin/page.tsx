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
    <div className="fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage disputes, flags, and data sources</p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged Jobs</p>
              <p className="text-3xl font-bold text-red-600 mt-2">3</p>
            </div>
            <AlertTriangle className="text-red-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Disputes</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">2</p>
            </div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Sources</p>
              <p className="text-3xl font-bold text-green-600 mt-2">2</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked Sources</p>
              <p className="text-3xl font-bold text-red-600 mt-2">1</p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Flagged Jobs */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Flagged Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {flaggedJobs.map((job) => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{job.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'flagged'
                        ? 'bg-red-100 text-red-800'
                        : job.status === 'under_review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{job.reason}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                        <Eye size={16} /> Review
                      </button>
                      <button className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
                        <Trash2 size={16} /> Delete
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
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Disputes</h2>
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Requester</p>
                  <p className="font-semibold text-gray-900">{dispute.requester}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Worker</p>
                  <p className="font-semibold text-gray-900">{dispute.worker}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">${dispute.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Filed</p>
                  <p className="font-semibold text-gray-900">{dispute.filed}</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">{dispute.reason}</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                  Resolve for Requester
                </button>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
                  Resolve for Worker
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Split 50/50
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources Management */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Data Sources</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Source Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rate Limit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Checked</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{source.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      source.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {source.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-900">{source.rateLimit}</td>
                  <td className="py-3 px-4 text-gray-600">{source.lastChecked}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                        Settings
                      </button>
                      <button className={`font-medium text-xs ${
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

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">API Status</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">Operational</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Database</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Redis Streams</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">Operational</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Smart Contracts</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">Live</span>
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
              Pause All Jobs
            </button>
            <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm">
              Emergency Shutdown
            </button>
            <button className="w-full px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 font-medium text-sm">
              Clear Cache
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
              View Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
