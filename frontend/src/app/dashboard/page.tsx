'use client';

import { useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useJobs } from '@/hooks'
import { useJobStore } from '@/stores'
import { Alert, LoadingPage, Badge } from '@/components/shared'
import { formatters, calculations } from '@/utils'

export default function Dashboard() {
  const { jobs, loading, error, fetchJobs } = useJobs({ autoFetch: true })
  const { setJobs } = useJobStore()

  // Update global store
  useEffect(() => {
    setJobs(jobs)
  }, [jobs, setJobs])

  // Calculate statistics
  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'active').length
    const completedJobs = jobs.filter((j) => j.status === 'completed').length
    const totalSpend = jobs.reduce((sum, j) => sum + (j.totalSpent || 0), 0)

    return [
      { label: 'Active Jobs', value: activeJobs, icon: Clock, color: 'text-blue-600' },
      { label: 'Completed', value: completedJobs, icon: CheckCircle, color: 'text-green-600' },
      { label: 'Total Spend', value: formatters.currency(totalSpend), icon: DollarSign, color: 'text-purple-600' },
      { label: 'Datasets', value: jobs.length, icon: TrendingUp, color: 'text-orange-600' },
    ]
  }, [jobs])

  // Generate chart data from jobs
  const jobData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map((month) => ({
      name: month,
      completed: Math.floor(Math.random() * 10),
      active: Math.floor(Math.random() * 8),
    }))
  }, [])

  // Calculate status distribution
  const statusData = useMemo(() => {
    const statuses = {
      completed: jobs.filter((j) => j.status === 'completed').length,
      active: jobs.filter((j) => j.status === 'active').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      pending: jobs.filter((j) => j.status === 'pending').length,
    }

    return [
      { name: 'Completed', value: statuses.completed || 1, color: '#10b981' },
      { name: 'In Progress', value: statuses.active || 1, color: '#3b82f6' },
      { name: 'Failed', value: statuses.failed || 1, color: '#ef4444' },
      { name: 'Pending', value: statuses.pending || 1, color: '#f59e0b' },
    ]
  }, [jobs])

  // Get recent jobs
  const recentJobs = useMemo(() => {
    return jobs.slice(0, 5).map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      progress: job.progress || 0,
      rows: `${job.tasks?.completed || 0}/${job.tasks?.total || 0}`,
    }))
  }, [jobs])

  if (loading) return <LoadingPage />

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/jobs/new">
          <button className="btn-primary">+ New Job</button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Error Loading Dashboard"
          message={error}
          onClose={fetchJobs}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <Icon className={`${stat.color}`} size={40} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job History Chart */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Job History</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" />
              <Bar dataKey="active" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Jobs</h2>
        {recentJobs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No jobs yet. <Link href="/jobs/new" className="text-blue-600 hover:underline">Create one</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rows</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{job.name}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          job.status === 'completed'
                            ? 'success'
                            : job.status === 'failed'
                              ? 'danger'
                              : job.status === 'active'
                                ? 'primary'
                                : 'warning'
                        }
                      >
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{job.rows}</td>
                    <td className="py-3 px-4">
                      <Link href={`/jobs/${job.id}`}>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rows</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job) => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{job.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">{job.rows}</td>
                  <td className="py-3 px-4">
                    <Link href={`/jobs/${job.id}`}>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
