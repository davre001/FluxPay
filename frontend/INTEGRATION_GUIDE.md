# FluxPay Frontend Integration Guide

This guide shows how to integrate and use the enhanced utilities, components, and hooks throughout the FluxPay frontend.

## Quick Start

### 1. Using Form Components with Validation

```typescript
'use client';
import { useForm } from '@/hooks/useForm'
import { Form, FormGroup, FormLabel, FormInput, FormButton } from '@/components/shared/Form'
import { validators } from '@/utils/helpers'
import { Alert } from '@/components/shared/Alert'

export function JobForm() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: { budget: '', maxRows: '', description: '' },
    validate: (values) => {
      const errors = {}
      const budgetError = validators.budget(values.budget)
      const maxRowsError = validators.maxRows(values.maxRows)
      const descriptionError = validators.description(values.description)
      if (budgetError) errors['budget'] = budgetError.message
      if (maxRowsError) errors['maxRows'] = maxRowsError.message
      if (descriptionError) errors['description'] = descriptionError.message
      return errors
    },
    onSubmit: async (values) => {
      console.log('Form submitted:', values)
    },
  })

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <FormLabel htmlFor="budget" required>
          Budget
        </FormLabel>
        <FormInput
          id="budget"
          name="budget"
          type="number"
          value={values.budget}
          onChange={handleChange}
          error={errors.budget}
          placeholder="Enter budget in USD"
        />
      </FormGroup>

      <FormButton type="submit" fullWidth>
        Create Job
      </FormButton>
    </Form>
  )
}
```

### 2. Using Data Fetching Hooks

```typescript
'use client';
import { useJobs } from '@/hooks/useApi'
import { DataTable } from '@/components/shared/DataTable'
import { LoadingPage } from '@/components/shared/Loading'
import { Alert } from '@/components/shared/Alert'

export function JobsPage() {
  const { jobs, loading, error, fetchJobs } = useJobs()

  if (loading) return <LoadingPage />

  return (
    <>
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => fetchJobs()}
        />
      )}

      <DataTable
        data={jobs}
        columns={[
          { key: 'name', label: 'Job Name', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'budget', label: 'Budget', render: (v) => formatters.currency(v) },
        ]}
        pagination
        itemsPerPage={10}
      />
    </>
  )
}
```

### 3. Using Modal Components

```typescript
'use client';
import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/Modal'
import { FormButton } from '@/components/shared/Form'

export function JobDetailsModal({ isOpen, onClose, job }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
      <ModalBody>
        <p className="text-gray-700">{job.description}</p>
        <div className="mt-4 space-y-2">
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Budget:</strong> ${job.budget}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <FormButton variant="secondary" onClick={onClose}>
          Close
        </FormButton>
        <FormButton onClick={onClose}>
          Take Action
        </FormButton>
      </ModalFooter>
    </Modal>
  )
}
```

### 4. Using State Management with Zustand

```typescript
'use client';
import { useJobStore, useUserStore } from '@/stores'

export function MyComponent() {
  const { jobs, selectedJob, setJobs, selectJob } = useJobStore()
  const { userId, preferences, setTheme } = useUserStore()

  return (
    <div>
      <p>Jobs: {jobs.length}</p>
      {selectedJob && <p>Selected: {selectedJob.name}</p>}
      <button onClick={() => setTheme('dark')}>Toggle Theme</button>
    </div>
  )
}
```

### 5. Using Format & Calculation Helpers

```typescript
import { formatters, calculations } from '@/utils/helpers'

// Formatting
formatters.currency(1234.56)        // "$1,234.56"
formatters.date(new Date())          // "Jan 15, 2024"
formatters.timeAgo(pastDate)         // "2h ago"
formatters.truncateAddress(address)  // "0x1234...5678"

// Calculations
const { total, platformFee } = calculations.jobCost(
  60,    // worker reward
  15,    // verification cost
  20     // platform fee percent
)
// Returns: { total: 100, platformFee: 15 }
```

### 6. Using Transaction Status Display

```typescript
import { TransactionStatus, PaymentBreakdown } from '@/components/shared/TransactionStatus'

export function PaymentFlow() {
  const [status, setStatus] = useState('pending')

  return (
    <>
      <TransactionStatus
        status={status}
        amount={100}
        message="Processing your payment..."
        txHash="0x123abc..."
      />

      <PaymentBreakdown
        workerReward={60}
        verificationCost={15}
        platformFee={15}
        total={100}
      />
    </>
  )
}
```

### 7. Using Error Handling

```typescript
import { handleApiError, FluxPayError } from '@/utils/errors'

try {
  const result = await apiClient.post('/jobs', jobData)
} catch (error) {
  const message = handleApiError(error, 'CreateJob')
  // Shows user-friendly error message
}
```

### 8. Using Alert Components

```typescript
import { Alert, ValidationAlert, ConfirmAlert } from '@/components/shared/Alert'
import { useState } from 'react'

export function AlertDemo() {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <Alert
        type="success"
        title="Success!"
        message="Your job has been created."
        dismissible
      />

      <ValidationAlert
        errors={[
          { field: 'budget', message: 'Budget must be greater than 0' }
        ]}
      />

      {showConfirm && (
        <ConfirmAlert
          title="Delete Job?"
          message="This action cannot be undone."
          onConfirm={() => { /* delete */ }}
          onCancel={() => setShowConfirm(false)}
          type="danger"
        />
      )}
    </>
  )
}
```

### 9. Using Local Storage Hook

```typescript
import { useLocalStorage } from '@/hooks/useForm'

export function MyComponent() {
  const [user, setUser, removeUser] = useLocalStorage('user', {
    initialValue: { name: '', email: '' }
  })

  return (
    <>
      <p>Stored user: {user?.name}</p>
      <button onClick={() => setUser({ name: 'John', email: 'john@example.com' })}>
        Save User
      </button>
      <button onClick={removeUser}>Clear</button>
    </>
  )
}
```

### 10. Using DataTable with Actions

```typescript
import { DataTable, Badge } from '@/components/shared/DataTable'
import { Edit, Trash2 } from 'lucide-react'

export function JobsList({ jobs }) {
  return (
    <DataTable
      data={jobs}
      columns={[
        { key: 'name', label: 'Name', sortable: true },
        {
          key: 'status',
          label: 'Status',
          render: (status) => (
            <Badge variant={status === 'completed' ? 'success' : 'primary'}>
              {status}
            </Badge>
          ),
        },
        { key: 'budget', label: 'Budget', render: (v) => `$${v}` },
      ]}
      actions={(row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)}><Edit className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(row)}><Trash2 className="h-4 w-4" /></button>
        </div>
      )}
      pagination
      itemsPerPage={10}
    />
  )
}
```

## Common Patterns

### Pattern 1: Loading + Error + Data Display

```typescript
export function DataComponent() {
  const { data, loading, error, refetch } = useSomeData()

  if (loading) return <LoadingPage />
  if (error) return <Alert type="error" message={error} onClose={refetch} />
  if (!data) return <Alert type="info" message="No data available" />

  return <DisplayData data={data} />
}
```

### Pattern 2: Form with API Integration

```typescript
export function CreateJobForm() {
  const { createJob, loading, error } = useCreateJob()
  const { values, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', budget: '' },
    onSubmit: async (values) => {
      await createJob(values)
    },
  })

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert type="error" message={error} />}
      <FormInput name="name" value={values.name} onChange={handleChange} />
      <FormButton loading={loading} type="submit">
        Create
      </FormButton>
    </Form>
  )
}
```

### Pattern 3: Global State + Local State

```typescript
export function JobsList() {
  const { jobs: globalJobs, setJobs } = useJobStore()
  const { jobs: apiJobs, loading } = useJobs()

  useEffect(() => {
    setJobs(apiJobs)
  }, [apiJobs])

  return <DataTable data={globalJobs} /* ... */ />
}
```

## File Organization

```
src/
├── components/shared/
│   ├── Alert.tsx              # Alert components
│   ├── DataTable.tsx          # Table & badge components
│   ├── Form.tsx               # Form input components
│   ├── Modal.tsx              # Modal & drawer components
│   ├── TransactionStatus.tsx  # Payment flow components
│   ├── Navbar.tsx
│   ├── ErrorBoundary.tsx
│   └── Loading.tsx
├── hooks/
│   ├── useApi.ts              # Data fetching hooks
│   └── useForm.ts             # Form & storage hooks
├── stores/
│   ├── jobStore.ts            # Job state
│   ├── userStore.ts           # User state
│   └── index.ts
├── utils/
│   ├── helpers.ts             # Format, validate, calculate
│   └── errors.ts              # Error handling
├── constants/
│   └── index.ts               # App constants
├── config/
│   └── settings.ts            # Configuration
└── types/
    └── index.ts               # TypeScript types
```

## Next Steps

1. **Update Pages** - Replace mock data with useApi hooks
2. **Add Wallet Integration** - Implement WalletContext with wagmi
3. **Payment Flow** - Use TransactionStatus components
4. **Add Notifications** - Consider react-hot-toast integration
5. **Real API Connection** - Connect to backend endpoints
6. **Testing** - Add unit tests for hooks and utilities

## TypeScript Support

All components and hooks are fully typed with TypeScript. Generic types are used where appropriate:

```typescript
// DataTable is generic
<DataTable<Job> data={jobs} columns={jobColumns} />

// useForm is type-safe
const form = useForm<CreateJobInput>({
  initialValues: { name: '', budget: 0 },
})
```

## Performance Optimization

- Use `useMemo` for expensive calculations in DataTable
- Debounce search inputs with `useDebounce`
- Lazy load modals and drawers
- Memoize callback functions in form handlers

---

For more examples, check individual component files and hooks documentation.

---

## Backend API + On-Chain Integration (NEW)

Complete reference for wiring the backend API and on-chain smart contract calls.

### Setting Up Wallet & Chain

```tsx
'use client';
import { useWalletInfo, useUSDCBalance } from '@/hooks'
import { morphHoodi, CONTRACTS } from '@/config/wagmi'

export function WalletStatus() {
  const { address, ethBalance, isConnected } = useWalletInfo()
  const { balance: usdcBalance, refetch } = useUSDCBalance()

  if (!isConnected) return <p>Connect wallet to continue</p>

  return (
    <div className="space-y-2">
      <p>Address: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
      <p>ETH Balance: {ethBalance}</p>
      <p>USDC Balance: {usdcBalance}</p>
      <p>Chain: {morphHoodi.name} ({morphHoodi.id})</p>
      <button onClick={refetch} className="text-sm text-blue-600">Refresh Balance</button>
    </div>
  )
}
```

### Fetching Jobs with Backend API

```tsx
import { jobAPI } from '@/lib/api-client'
import { useEffect, useState } from 'react'

export function JobsList() {
  const [jobs, setJobs] = useState([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    jobAPI.list(page, 10)
      .then(res => setJobs(res.data))
      .catch(err => console.error('Failed to fetch jobs:', err))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
      <button onClick={() => setPage(p => p + 1)} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  )
}
```

### Complete Job Funding Flow

```tsx
'use client';
import { useState } from 'react'
import { useWalletInfo } from '@/hooks'
import { executeJobFundingFlow, getFundingProgress, getFundingStepLabel } from '@/utils/jobFunding'

export function FundJobForm({ templateId }: { templateId: string }) {
  const { address, isConnected } = useWalletInfo()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    setLoading(true)
    setError('')
    setStatus('')

    const result = await executeJobFundingFlow(
      {
        category: 'ecommerce',
        location: 'sg',
        source: 'approved',
        budget: 100,
        description: 'Fund job',
      },
      address,
      authToken,
      (step) => {
        setProgress(getFundingProgress(step.step))
        setStatus(`${getFundingStepLabel(step.step)}: ${step.message}`)
        if (step.hash) console.log('Transaction:', step.hash)
      }
    )

    setLoading(false)
    if (result.success) {
      setStatus(`✅ Job funded! ID: ${result.jobId}`)
    } else {
      setError(result.error || 'Funding failed')
    }
  }

  return (
    <form onSubmit={handleFund} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      {status && <div className="text-blue-600">{status}</div>}
      
      {loading && (
        <div className="w-full bg-gray-200 rounded">
          <div
            className="bg-blue-600 text-white h-8 flex items-center justify-center rounded transition-all"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!isConnected || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Fund Job'}
      </button>
    </form>
  )
}
```

### Export Job Results

```tsx
import { resultsAPI } from '@/lib/api-client'

export function ExportResults({ jobId }: { jobId: string }) {
  const handleExportJSON = async () => {
    const response = await resultsAPI.exportJSON(jobId)
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    downloadFile(blob, `job-${jobId}.json`)
  }

  const handleExportCSV = async () => {
    const response = await resultsAPI.exportCSV(jobId)
    const blob = new Blob([response.data], { type: 'text/csv' })
    downloadFile(blob, `job-${jobId}.csv`)
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

  return (
    <div className="flex gap-2">
      <button onClick={handleExportJSON} className="px-3 py-1 bg-green-600 text-white rounded">
        Export JSON
      </button>
      <button onClick={handleExportCSV} className="px-3 py-1 bg-green-600 text-white rounded">
        Export CSV
      </button>
    </div>
  )
}
```

### Get Templates and Launch

```tsx
import { templateAPI } from '@/lib/api-client'
import { useEffect, useState } from 'react'

export function TemplateSelector() {
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    templateAPI.list('ecommerce', true)
      .then(res => setTemplates(res.data))
  }, [])

  const handleLaunch = async (templateId: string) => {
    const job = await templateAPI.launch(templateId, {
      requester_wallet: '0x...', // Use wallet address from useWalletInfo
      budget_usdc: 100,
      freshness: 'daily'
    })
    console.log('Job created:', job)
  }

  return (
    <div className="grid gap-4">
      {templates.map(t => (
        <div key={t.id} className="border p-4 rounded">
          <h3>{t.name}</h3>
          <button onClick={() => handleLaunch(t.id)}>Launch</button>
        </div>
      ))}
    </div>
  )
}
```

### Live Job Updates with WebSocket

```tsx
import { createJobWebSocket } from '@/services/api'
import { useEffect, useState } from 'react'

export function LiveJobStatus({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<string>('')
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''

  useEffect(() => {
    const ws = createJobWebSocket(jobId, authToken || undefined)

    ws.onopen = () => console.log('Connected to job updates')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStatus(`${data.type}: ${JSON.stringify(data)}`)
    }
    ws.onerror = (error) => console.error('WebSocket error:', error)
    ws.onclose = () => console.log('Disconnected from job updates')

    return () => ws.close()
  }, [jobId, authToken])

  return <p className="text-sm text-gray-600">{status}</p>
}
```

### Admin Controls

```tsx
import { adminAPI } from '@/lib/api-client'

export function AdminPanel() {
  const [jobs, setJobs] = useState([])

  const loadAdminJobs = async () => {
    const response = await adminAPI.jobs()
    setJobs(response.data)
  }

  const cancelJob = async (jobId: string) => {
    await adminAPI.cancelJob(jobId)
    loadAdminJobs()
  }

  const retryTask = async (taskId: string) => {
    await adminAPI.retryTask(taskId)
  }

  return (
    <div className="space-y-4">
      <button onClick={loadAdminJobs}>Load Admin Jobs</button>
      {jobs.map(job => (
        <div key={job.id} className="border p-4">
          <p>{job.name}</p>
          <button onClick={() => cancelJob(job.id)} className="text-red-600">Cancel</button>
        </div>
      ))}
    </div>
  )
}
```

### Recurring Schedules

```tsx
import { scheduleAPI } from '@/lib/api-client'

export function ScheduleManager() {
  const createDailySchedule = async () => {
    const schedule = await scheduleAPI.create({
      job_config: {
        category: 'ecommerce',
        location: 'sg',
        source: 'approved',
        budget: 50,
      },
      freshness: 'daily',
      template_id: 'template-123'
    })
    console.log('Schedule created:', schedule)
  }

  const pauseSchedule = async (scheduleId: string) => {
    await scheduleAPI.pause(scheduleId)
  }

  const resumeSchedule = async (scheduleId: string) => {
    await scheduleAPI.resume(scheduleId)
  }

  return (
    <div className="space-y-2">
      <button onClick={createDailySchedule}>Create Daily Schedule</button>
      {/* Display schedules and add pause/resume buttons */}
    </div>
  )
}
```

### Authentication Flow

```tsx
import { authAPI } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await authAPI.login({ email, password })
      localStorage.setItem('auth_token', response.data.access_token)
      router.push('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  )
}
```

### Environment Variables

Create `.env.local` in the frontend root:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WALLET_PROJECT_ID=your_rainbowkit_project_id
```

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/config/wagmi.ts` | Wagmi config with Morph Hoodi chain |
| `src/config/settings.ts` | Centralized config (API, chain, contracts) |
| `src/lib/api-client.ts` | Axios instance with all API endpoints |
| `src/utils/contracts.ts` | Wagmi wrappers for smart contract calls |
| `src/utils/jobFunding.ts` | Complete job funding flow handler |
| `src/hooks/useWallet.ts` | Wallet hooks (balance, escrow, approve, fund) |
| `src/services/api.ts` | Alternative fetch-based API calls |
