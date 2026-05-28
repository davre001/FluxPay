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
