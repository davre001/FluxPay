'use client';

import { useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Clock, CheckCircle, DollarSign, Zap, Plus } from 'lucide-react'
import Link from 'next/link'
import { jobAPI } from '@/lib/api-client'
import { useJobs } from '@/hooks'
import { useJobStore } from '@/stores'
import { Alert, LoadingPage, Badge } from '@/components/shared'
import { formatters } from '@/utils'

export default function Dashboard() {
  const { jobs, loading, error, fetchJobs } = useJobs({ autoFetch: true })
  const { setJobs } = useJobStore()

  useEffect(() => {
    setJobs(jobs)
  }, [jobs, setJobs])

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'active' || j.status === 'in_progress').length
    const completedJobs = jobs.filter((j) => j.status === 'completed').length
    const totalSpend = jobs.reduce((sum, j) => sum + (j.totalSpent || j.budget || 0), 0)

    return [
      { label: 'Active Jobs', value: activeJobs, icon: Clock, color: 'text-emerald-500' },
      { label: 'Completed', value: completedJobs, icon: CheckCircle, color: 'text-green-500' },
      { label: 'Total Spend', value: formatters.currency(totalSpend), icon: DollarSign, color: 'text-teal-500' },
      { label: 'Datasets', value: jobs.length, icon: TrendingUp, color: 'text-lime-500' },
    ]
  }, [jobs])

  const jobData = useMemo(() => {
    // Real data: bucket the last 6 months by job created date + status
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const labels: string[] = []
    const buckets: Record<string, { completed: number; active: number }> = {}

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      labels.push(key)
      buckets[key] = { completed: 0, active: 0 }
    }

    jobs.forEach((j: any) => {
      const raw = j.createdAt || j.created_at
      if (!raw) return
      const d = new Date(raw)
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      if (!buckets[key]) return
      if (j.status === 'completed') buckets[key].completed += 1
      else buckets[key].active += 1
    })

    return labels.map((key) => ({
      name: key.split(' ')[0],
      completed: buckets[key].completed,
      active: buckets[key].active,
    }))
  }, [jobs])

  const statusData = useMemo(() => {
    const statuses = {
      completed: jobs.filter((j) => j.status === 'completed').length,
      active: jobs.filter((j) => j.status === 'active' || j.status === 'in_progress').length,
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
    <div className="relative min-h-screen bg-slate-50 overflow-x-hidden pb-16 font-sans">
      
      {/* Background Motion Graphics (Glowing Orbs) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

      <div className="relative z-10 fade-in space-y-8 p-6 max-w-7xl mx-auto mt-4">
        
        {/* Header with solid text and animated button */}
        <div className="flex justify-between items-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <Link href="/jobs/new">
            <button className="group flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
               <Plus size={18} /> New Job
            </button>
          </Link>
        </div>

        {error && <Alert type="error" title="Error Loading Dashboard" message={error} onClose={fetchJobs} />}

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200 cursor-default group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium group-hover:text-emerald-600 transition-colors">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-emerald-50 bg-opacity-50 group-hover:bg-emerald-100 transition-colors`}>
                    <Icon className={`${stat.color} transition-transform duration-300 group-hover:scale-110`} size={32} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          {/* Job History Chart */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:shadow-md hover:border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} />
              Job History
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} /> {/* Green */}
                <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} /> {/* Blue */}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-50 transition-all duration-300 hover:shadow-md hover:border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-300 hover:opacity-80 outline-none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Jobs Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-emerald-50 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emerald-200 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Recent Jobs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50/50">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Job Name</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Progress</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Rows</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:emerald-50/30 transition-colors duration-200">
                    <td className="py-4 px-6 font-bold text-gray-900">{job.name}</td>
                    <td className="py-4 px-6">
                      <Badge variant={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : 'primary'}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-32 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${job.progress}%` }}>
                          <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-600">{job.rows}</td>
                    <td className="py-4 px-6">
                      <Link href={`/jobs/${job.id}`}>
                        <button className="text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors duration-200 flex items-center gap-1 group">
                          View
                          <span className="transform transition-transform duration-200 group-hover:translate-x-1">→</span>
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
    </div>
  )
}