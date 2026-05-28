# FluxPay Frontend

A modern Next.js 14 frontend for the FluxPay agentic micro-bounty platform for data collection.

## Overview

FluxPay is a platform where customers request datasets, fund escrows with USDC, and the system distributes micro-tasks to worker agents. The frontend provides an intuitive interface for job creation, real-time monitoring, and data management.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3
- **Language**: TypeScript
- **State Management**: Zustand
- **Wallet Integration**: wagmi + viem + RainbowKit
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Wallet browser extension (MetaMask, etc.)

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Configure:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=2710  # Morph Hoodi Testnet
NEXT_PUBLIC_RPC_URL=https://hoodi-sandbox.morphl2.io
```

### 3. Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Navbar & WalletProvider
│   ├── globals.css             # Global styles (Tailwind)
│   ├── page.tsx                # Home/landing page
│   ├── dashboard/              # Dashboard page
│   ├── jobs/
│   │   ├── new/                # Create new job
│   │   └── [jobId]/            # Job detail & execution tracking
│   ├── datasets/
│   │   └── [datasetId]/        # Dataset view & export
│   ├── wallet/                 # Wallet management
│   ├── workers/                # Workers leaderboard
│   └── admin/                  # Admin panel
├── components/
│   ├── shared/                 # Shared components (Navbar, etc)
│   ├── jobs/                   # Job-related components
│   └── wallet/                 # Wallet components
├── context/
│   └── WalletContext.tsx       # Wallet state context
├── hooks/
│   └── usePayment.ts           # Payment-related hooks
├── lib/
│   ├── api-client.ts           # Axios API client
│   └── websocket.ts            # WebSocket client
├── services/
│   └── api.ts                  # API service layer
├── types/
│   └── index.ts                # TypeScript interfaces
└── utils/
    └── helpers.ts              # Utility functions
```

## Pages & Features

### 1. Dashboard (`/dashboard`)
- Overview of active and completed jobs
- Total spend and dataset count
- Job history charts
- Status distribution pie chart
- Recent jobs table with progress tracking

### 2. Create Job (`/jobs/new`)
- 3-step form wizard
- Step 1: Category & location selection
- Step 2: Source selection & description
- Step 3: Budget configuration & cost estimation
- Displays estimated worker rewards, verification cost, and platform fee

### 3. Job Detail (`/jobs/[jobId]`)
- Overall progress tracking
- Task statistics (completed, failed, pending)
- Job status timeline with timestamps
- Worker progress monitoring
- Verification progress
- Escrow contract information and payout transactions
- Results preview table with export functionality

### 4. Dataset View (`/datasets/[datasetId]`)
- Filterable data table with search
- Confidence score filtering
- CSV/JSON export functionality
- Data provenance and audit trail
- Worker and verifier attribution
- Collection timestamps

### 5. Wallet (`/wallet`)
- Wallet connection status
- Network and chain information
- ETH and USDC balance display
- In-escrow funds tracking
- USDC approval and bridge actions
- Escrow history table
- Recent transaction log

### 6. Workers (`/workers`)
- Worker leaderboard with rankings
- Performance metrics (accuracy, earnings)
- Reputation scores
- Worker categorization (Automated vs Manual)
- Category-wise statistics

### 7. Admin (`/admin`)
- Flagged jobs management
- Dispute resolution interface
- Data source management and approval
- System health monitoring
- Quick admin actions (pause, shutdown, etc)

## Key Components

### Navbar (`src/components/shared/Navbar.tsx`)
- Navigation links
- Mobile-responsive menu
- Wallet connect button

### WalletContext (`src/context/WalletContext.tsx`)
- Wallet connection state management
- To be enhanced with wagmi integration

## API Integration

The frontend uses `axios` with a configured client in `src/lib/api-client.ts`.

### Available API Methods

```typescript
// Jobs
jobAPI.quote(data)
jobAPI.create(data)
jobAPI.list()
jobAPI.detail(jobId)
jobAPI.results(jobId)
jobAPI.events(jobId)
jobAPI.confirmFunding(jobId, data)

// Workers
workerAPI.list()
workerAPI.register(data)

// Admin
adminAPI.flaggedJobs()
adminAPI.disputes()
adminAPI.sources()
```

## WebSocket Integration

Real-time job status updates via WebSocket:

```typescript
import WebSocketClient from '@/lib/websocket'

const ws = new WebSocketClient()
await ws.connect(jobId)

ws.on('task.completed', (data) => {
  console.log('Task completed:', data)
})

ws.on('result.verified', (data) => {
  console.log('Result verified:', data)
})
```

## Environment Setup for Local Development

### Backend API Server
Ensure the backend is running on `http://localhost:8000`:
```bash
cd ../src  # Go to backend directory
python -m uvicorn app.main:app --reload
```

### Smart Contracts
Deploy on Morph Hoodi Testnet or local hardhat:
```bash
cd ../contracts
npx hardhat run scripts/deploy.js --network morph-hoodi
```

## Advanced Features & Utilities

### Reusable Components

**Form Components** (`src/components/shared/Form.tsx`)
- `Form`: Main form wrapper
- `FormInput`, `FormTextarea`, `FormSelect`: Input fields with validation
- `FormCheckbox`, `FormRadioGroup`: Selection inputs
- `FormButton`: Buttons with loading states
- `FormLabel`, `FormGroup`, `FormSection`: Structural components

Example:
```typescript
import { Form, FormInput, FormButton } from '@/components/shared/Form'

<Form onSubmit={handleSubmit}>
  <FormInput
    name="budget"
    type="number"
    error={errors.budget}
    placeholder="Enter budget"
    onChange={handleChange}
  />
  <FormButton type="submit">Submit</FormButton>
</Form>
```

**Alert Components** (`src/components/shared/Alert.tsx`)
- `Alert`: Dismissible alert with type variants (success, error, warning, info)
- `AlertContainer`: Stack multiple alerts
- `ValidationAlert`: Display form validation errors
- `ConfirmAlert`: Confirmation dialog

**Data Table Components** (`src/components/shared/DataTable.tsx`)
- `DataTable<T>`: Sortable, paginated table with actions
- `StatCard`: Statistics display card
- `Badge`: Status badge with variants

Example:
```typescript
<DataTable
  data={jobs}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', render: (v) => <Badge>{v}</Badge> },
  ]}
  pagination
  itemsPerPage={10}
/>
```

**Modal Components** (`src/components/shared/Modal.tsx`)
- `Modal`: Customizable modal dialog with backdrop
- `Drawer`: Side drawer navigation
- Composable: `ModalHeader`, `ModalBody`, `ModalFooter`

**Transaction Components** (`src/components/shared/TransactionStatus.tsx`)
- `TransactionStatus`: Payment status display (pending/success/error/waiting)
- `ApprovalStep`: Multi-step approval tracking
- `PaymentBreakdown`: Cost breakdown visualization
- `EscrowStatus`: Escrow contract status

### Custom Hooks

**API Hooks** (`src/hooks/useApi.ts`)
```typescript
const { jobs, loading, error, fetchJobs } = useJobs()
const { job, loading, error } = useJob(jobId)
const { createJob, loading, error } = useCreateJob()
const { results, loading } = useJobResults(jobId)
const { workers, loading } = useWorkers()
```

**Form & State Hooks** (`src/hooks/useForm.ts`)
```typescript
const form = useForm({
  initialValues: { name: '', email: '' },
  validate: (values) => { /* validation logic */ },
  onSubmit: async (values) => { /* submit logic */ },
})

const [value, setValue, removeValue] = useLocalStorage('key', { initialValue: null })
const debouncedValue = useDebounce(searchTerm, { delay: 500 })
const { data, loading, error, execute } = useAsync(fetchFunction)
```

### Utility Functions

**Validators** (`src/utils/helpers.ts`)
```typescript
validators.budget(value)           // Validate budget
validators.maxRows(value)          // Validate row count
validators.description(value)      // Validate description
validators.email(value)            // Validate email
validators.walletAddress(value)    // Validate wallet address
validators.validateForm(data, schema) // Validate entire form
```

**Formatters** (`src/utils/helpers.ts`)
```typescript
formatters.currency(1234.56)       // "$1,234.56"
formatters.date(new Date())        // "Jan 15, 2024"
formatters.timeAgo(date)           // "2h ago"
formatters.truncateAddress(addr)   // "0x1234...5678"
formatters.truncateText(text, 100) // Truncate long text
formatters.toCSV(data)             // Export to CSV
formatters.toJSON(data)            // Export to JSON
```

**Calculations** (`src/utils/helpers.ts`)
```typescript
calculations.jobCost(workerReward, verificationCost, platformFeePercent)
calculations.workerPayout(baseReward, difficultyMultiplier, qualityScore)
calculations.taskSplit(totalBudget, taskCount)
calculations.progressPercentage(completed, total)
calculations.averageAccuracy(accuracyScores)
```

### State Management

**Job Store** (`src/stores/jobStore.ts`)
```typescript
import { useJobStore } from '@/stores'

const { jobs, selectedJob, setJobs, selectJob, updateJob } = useJobStore()
```

**User Store** (`src/stores/userStore.ts`)
```typescript
import { useUserStore } from '@/stores'

const { userId, preferences, setTheme, updatePreferences } = useUserStore()
```

Both stores use Zustand with optional persistence.

### Error Handling

**Error Utilities** (`src/utils/errors.ts`)
```typescript
import { handleApiError, parseApiError, FluxPayError } from '@/utils/errors'

try {
  const result = await apiClient.post('/jobs', data)
} catch (error) {
  const userMessage = handleApiError(error, 'CreateJob')
  console.error(userMessage)
}
```

### Configuration & Constants

**Settings** (`src/config/settings.ts`)
- API URLs and timeouts
- Blockchain configuration
- Feature flags
- UI settings

**Constants** (`src/constants/index.ts`)
- Job status options with labels and colors
- Job categories
- Worker types
- Transaction types
- API endpoint mappings

## Integration Guide

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for comprehensive examples and patterns for using all utilities, components, and hooks together.

## Build for Production

```bash
npm run build
npm run start
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

### WebSocket Connection Issues
- Ensure backend is running
- Check `NEXT_PUBLIC_WS_URL` in `.env.local`
- Verify WebSocket support in your network

### Wallet Connection Issues
- Clear browser cache and local storage
- Try a different wallet provider
- Ensure you're on the correct chain (Morph Hoodi Testnet)

## Next Steps

1. **Integrate wagmi**: Connect wallet integration components
2. **Add websocket listeners**: Wire up real-time updates
3. **Connect to backend API**: Replace mock data with actual API calls
4. **Add error handling**: Implement toast notifications and error boundaries
5. **Add authentication**: Implement user authentication flow
6. **Optimize performance**: Add image optimization and code splitting

## Contributing

Follow the existing code structure and style. Use TypeScript types for all components.

## License

MIT
