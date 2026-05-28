import { create } from 'zustand'
import { Job } from '@/types'

interface JobStore {
  jobs: Job[]
  selectedJob: Job | null
  filters: {
    status?: string
    category?: string
    sortBy?: string
  }
  setJobs: (jobs: Job[]) => void
  selectJob: (job: Job | null) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  deleteJob: (id: string) => void
  setFilters: (filters: Partial<JobStore['filters']>) => void
  getFilteredJobs: () => Job[]
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  selectedJob: null,
  filters: {},

  setJobs: (jobs) => set({ jobs }),

  selectJob: (job) => set({ selectedJob: job }),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)),
      selectedJob:
        state.selectedJob?.id === id
          ? { ...state.selectedJob, ...updates }
          : state.selectedJob,
    })),

  deleteJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
      selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  getFilteredJobs: () => {
    const { jobs, filters } = get()
    return jobs.filter((job) => {
      if (filters.status && job.status !== filters.status) return false
      if (filters.category && job.category !== filters.category) return false
      return true
    })
  },
}))
