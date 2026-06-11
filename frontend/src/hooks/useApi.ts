'use client';

import { useState, useCallback, useEffect } from 'react'
import { jobAPI as originalJobAPI } from '@/lib/api-client'

const jobAPI = {
  ...originalJobAPI,
  quote: (data: any) => Promise.resolve({ data: {} }),
  results: (jobId: string) => Promise.resolve({ data: [] }),
};

const workerAPI = {
  list: () => Promise.resolve({ data: [] }),
};

const adminAPI = {
  flaggedJobs: () => Promise.resolve({ data: [] }),
  disputes: () => Promise.resolve({ data: [] }),
};

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  autoFetch?: boolean
}

export function useJobs(options?: UseApiOptions) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.list()
      setJobs(response.data as any[])
      options?.onSuccess?.(response.data)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch jobs'
      setError(message)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchJobs()
    }
  }, [])

  return { jobs, loading, error, fetchJobs, setJobs }
}

export function useJob(jobId: string, options?: UseApiOptions) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = useCallback(async () => {
    if (!jobId) return

    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.detail(jobId)
      setJob(response.data)
      options?.onSuccess?.(response.data)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch job'
      setError(message)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [jobId, options])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchJob()
    }
  }, [jobId])

  return { job, loading, error, fetchJob, setJob }
}

export function useJobQuote() {
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getQuote = useCallback(async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.quote(data)
      setQuote(response.data)
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to get quote'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { quote, loading, error, getQuote }
}

export function useCreateJob() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createJob = useCallback(async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.create(data)
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to create job'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, createJob }
}

export function useJobResults(jobId: string, options?: UseApiOptions) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    if (!jobId) return

    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.results(jobId)
      setResults(response.data)
      options?.onSuccess?.(response.data)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch results'
      setError(message)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [jobId, options])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchResults()
    }
  }, [jobId])

  return { results, loading, error, fetchResults, setResults }
}

export function useWorkers(options?: UseApiOptions) {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await workerAPI.list()
      setWorkers(response.data)
      options?.onSuccess?.(response.data)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch workers'
      setError(message)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchWorkers()
    }
  }, [])

  return { workers, loading, error, fetchWorkers, setWorkers }
}

export function useAdminFlags(options?: UseApiOptions) {
  const [flaggedJobs, setFlaggedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminAPI.flaggedJobs()
      setFlaggedJobs(response.data)
      options?.onSuccess?.(response.data)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch flagged jobs'
      setError(message)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchFlags()
    }
  }, [])

  return { flaggedJobs, loading, error, fetchFlags, setFlaggedJobs }
}

export function useAdminDisputes(options?: UseApiOptions) {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminAPI.disputes()
      setDisputes(response.data)
      options?.onSuccess?.(response.data)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch disputes'
      setError(message)
      options?.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchDisputes()
    }
  }, [])

  return { disputes, loading, error, fetchDisputes, setDisputes }
}
