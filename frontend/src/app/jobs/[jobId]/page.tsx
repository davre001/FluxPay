'use client';

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle, Download, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { jobAPI } from '@/lib/api-client'
import { createJobWebSocket } from '@/services/api'

const resultsAPI = {
  exportJSON: (jobId: string) => Promise.resolve({ data: {} }),
  exportCSV: (jobId: string) => Promise.resolve({ data: '' }),
};

export default function JobDetail({ params }: { params: { jobId: string } }) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''

  useEffect(() => {
    // Fetch initial job data
    jobAPI.detail(params.jobId)
      .then((res: { data: unknown }) => {
        setJob(res.data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        console.error('Failed to load job:', err)
        setError('Failed to load job details')
        setLoading(false)
      })
  }, [params.jobId])

  useEffect(() => {
    if (!job) return

    // Connect to WebSocket for live updates
    const ws = createJobWebSocket(params.jobId, authToken || undefined)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Job update:', data)
        
        // Update job state based on WebSocket message
        setJob((prev: any) => ({
          ...prev,
          status: data.status || prev.status,
          progress: data.progress !== undefined ? data.progress : prev.progress,
          tasks: data.tasks || prev.tasks,
        }))
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    ws.onerror = () => {
      console.error('WebSocket error')
    }

    return () => {
      ws.close()
    }
  }, [job, params.jobId, authToken])

  const handleExportJSON = async () => {
    try {
      const response = await resultsAPI.exportJSON(params.jobId)
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      downloadFile(blob, `job-${params.jobId}.json`)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await resultsAPI.exportCSV(params.jobId)
      const blob = new Blob([response.data], { type: 'text/csv' })
      downloadFile(blob, `job-${params.jobId}.csv`)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-8 text-center">Loading job details...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>
  if (!job) return <div className="p-8 text-center">Job not found</div>

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
          <p className="text-gray-600 mt-1">Job #{job.id}</p>
        </div>
        <span className={`px-4 py-2 rounded-full font-medium ${
          job.status === 'in_progress'
            ? 'bg-blue-100 text-blue-800'
            : job.status === 'completed'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {job.status === 'in_progress' ? 'In Progress' : 'Completed'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
          <span className="text-2xl font-bold text-blue-600">{job.progress}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Tasks Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {job.tasks.completed}/{job.tasks.total}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Active Workers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{job.workers.active}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Verified Results</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{job.verification.verified}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Budget Used</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${job.totalSpent}/${job.budget}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Job Timeline</h2>
            <div className="space-y-4">
              {job.timeline.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <Clock className="text-gray-600" size={20} />
                      )}
                    </div>
                    {idx < job.timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${step.completed ? 'bg-green-200' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-gray-900">{step.label}</p>
                    <p className="text-sm text-gray-600">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Escrow Info */}
        <div>
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Escrow Details</h2>
            
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Contract Address</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {job.escrow.address.slice(0, 10)}...{job.escrow.address.slice(-8)}
              </p>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Funded</span>
                <span className="font-medium text-gray-900">${job.escrow.fundedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Out</span>
                <span className="font-medium text-green-600">${job.escrow.paidOut}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-900">Remaining</span>
                <span className="font-bold text-lg text-blue-600">${job.escrow.remaining}</span>
              </div>
            </div>

            <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
              View on Explorer
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Results Preview</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              <Download size={18} /> JSON
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download size={18} /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Store</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Confidence</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Verified</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">iPhone 15 Pro Max</td>
                  <td className="py-3 px-4">$1,299.00</td>
                  <td className="py-3 px-4">Lazada</td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 font-medium">98%</span>
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="text-green-600" size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-gray-600 text-sm">
          Showing 5 of 225 verified results · <Link href={`/datasets/${job.id}`} className="text-blue-600 hover:underline">View full dataset</Link>
        </div>
      </div>
    </div>
  )
}
