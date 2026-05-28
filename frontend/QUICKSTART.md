# FluxPay Frontend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_CHAIN_ID=2710
NEXT_PUBLIC_RPC_URL=https://hoodi-sandbox.morphl2.io
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## 📍 Navigate the App

| Route | Purpose |
|-------|---------|
| `/` | Home/Landing page |
| `/dashboard` | View active jobs & stats |
| `/jobs/new` | Create a new data job |
| `/jobs/1` | View job details & progress |
| `/datasets/1` | View & export data results |
| `/wallet` | Manage wallet & escrow |
| `/workers` | View worker leaderboard |
| `/admin` | Admin panel |

---

## 🎯 Key Features By Page

### 📊 Dashboard
- Job overview cards
- Charts and statistics
- Recent jobs table

### ➕ Create Job
- 3-step form wizard
- Cost estimation
- Budget configuration

### 📈 Job Detail
- Real-time progress
- Task tracking
- Escrow information
- Results preview

### 📥 Dataset View
- Search & filter results
- Export to CSV/JSON
- Worker attribution
- Confidence scores

### 💳 Wallet
- Connect wallet
- View balance
- Escrow history
- Recent transactions

### 👷 Workers
- Performance rankings
- Accuracy metrics
- Earnings tracking

### ⚙️ Admin
- Flag management
- Dispute resolution
- Source approval

---

## 🔗 API Integration

All API calls are in `src/lib/api-client.ts`:

```typescript
import { jobAPI, workerAPI, adminAPI } from '@/lib/api-client'

// Create a job
await jobAPI.create(jobData)

// Get job details
await jobAPI.detail(jobId)

// List workers
await workerAPI.list()
```

---

## 🔌 WebSocket Usage

For real-time updates in `src/lib/websocket.ts`:

```typescript
import WebSocketClient from '@/lib/websocket'

const ws = new WebSocketClient()
await ws.connect(jobId)

ws.on('task.completed', (data) => {
  console.log('Task completed:', data)
})
```

---

## 📝 Project Structure

```
src/
├── app/              # Pages & layouts
├── components/       # Reusable UI components
├── lib/             # Utilities (API, WebSocket)
├── context/         # React context (Wallet)
├── types/           # TypeScript types
└── styles/          # Global styles
```

---

## 🛠️ Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `npm run dev -- -p 3001` |
| WebSocket error | Check backend running & `NEXT_PUBLIC_WS_URL` |
| Wallet not connecting | Clear cache, try different wallet |
| API calls failing | Verify backend URL in `.env.local` |

---

## 📚 Documentation

- **Architecture**: See [README.md](./README.md)
- **Types**: See [src/types/index.ts](./src/types/index.ts)
- **API**: See [src/lib/api-client.ts](./src/lib/api-client.ts)

---

## ✨ Next: Connect to Backend

1. Start your backend API: `python -m uvicorn app.main:app --reload`
2. Update `.env.local` with backend URL
3. Replace mock data in pages with real API calls
4. Test WebSocket connections
5. Add authentication if needed

---

**Happy Coding! 🎉**
