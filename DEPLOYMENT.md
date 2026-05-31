# FluxPay Deployment Guide

Deploy **Frontend** to **Vercel** and **Backend** to **Render**.

---

## Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

1. Ensure all environment variables are set in Vercel
2. Frontend is a Next.js app - Vercel auto-detects and builds it

### Step 2: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select your FluxPay repository
5. Select `frontend` as the root directory

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com
NEXT_PUBLIC_WALLET_PROJECT_ID=your_rainbowkit_id
NEXT_PUBLIC_CHAIN_ID=2910
NEXT_PUBLIC_RPC_URL=https://rpc-hoodi.morphl2.io
NEXT_PUBLIC_USDC_ADDRESS=0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856
```

### Step 4: Deploy

- Click "Deploy" in Vercel
- It will automatically build and deploy
- Your frontend URL: `https://your-project.vercel.app`

### Build Settings (Usually Auto-Detected)
- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

---

## Backend Deployment (Render)

### Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up/login
3. Click "New" → "Web Service"

### Step 2: Connect GitHub Repository

1. Click "Connect account" to authorize GitHub
2. Select your FluxPay repository
3. Click "Connect"

### Step 3: Configure Web Service

**Name:** `fluxpay-backend`

**Environment:** Python 3.11

**Build Command:** `pip install -r backend/requirements.txt`

**Start Command:** See Procfile (will auto-detect)

**Root Directory:** `.` (leave blank or use default)

### Step 4: Add Environment Variables

In Render Dashboard → Environment, add all from `backend/.env.example`:

**Critical ones:**
```
DATABASE_URL=postgresql://...  # Use Render PostgreSQL
REDIS_URL=redis://...          # Use Render Redis
SECRET_KEY=your-secret-key
COORDINATOR_PRIVATE_KEY=your_wallet_key
FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 5: Create PostgreSQL Database

1. In Render Dashboard → "PostgreSQL"
2. Create new PostgreSQL instance
3. Copy connection string to `DATABASE_URL` env var
4. Wait 2-3 minutes for database to be ready

### Step 6: Create Redis Database

1. In Render Dashboard → "Redis"
2. Create new Redis instance
3. Copy connection string to `REDIS_URL` env var

### Step 7: Deploy

- Click "Create Web Service"
- Render will automatically:
  - Install dependencies
  - Run alembic migrations (via Procfile)
  - Start uvicorn server

- Your backend URL: `https://fluxpay-backend.onrender.com`

---

## Verify Deployments

### Frontend
```bash
curl https://your-frontend.vercel.app
```

### Backend
```bash
curl https://your-backend.onrender.com/docs
```

Should show FastAPI interactive docs.

---

## Environment Variables Checklist

### Vercel (Frontend)

- [ ] `NEXT_PUBLIC_API_URL` → Backend Render URL
- [ ] `NEXT_PUBLIC_WS_URL` → Backend Render URL (wss://)
- [ ] `NEXT_PUBLIC_WALLET_PROJECT_ID` → Your RainbowKit ID
- [ ] `NEXT_PUBLIC_CHAIN_ID` → 2910
- [ ] `NEXT_PUBLIC_RPC_URL` → https://rpc-hoodi.morphl2.io
- [ ] Contract addresses (USDC, EscrowFactory)

### Render (Backend)

- [ ] `DATABASE_URL` → Render PostgreSQL connection string
- [ ] `REDIS_URL` → Render Redis connection string
- [ ] `SECRET_KEY` → Random 32+ char string
- [ ] `ALGORITHM` → HS256
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` → 1440
- [ ] `FRONTEND_URL` → Your Vercel frontend URL
- [ ] `CORS_ORIGINS` → `["https://your-frontend.vercel.app"]`
- [ ] `CHAIN_ID` → 2910
- [ ] `RPC_URL` → https://rpc-hoodi.morphl2.io
- [ ] `COORDINATOR_PRIVATE_KEY` → Your coordinator wallet key
- [ ] Contract addresses (USDC, EscrowFactory)

---

## Troubleshooting

### Frontend not connecting to backend
- Check `NEXT_PUBLIC_API_URL` is correct in Vercel
- Ensure backend is running and accessible
- Check CORS settings in backend `.env`

### Backend won't start
- Check logs: Render Dashboard → Logs
- Verify `DATABASE_URL` is correct and database is ready
- Check `REDIS_URL` is correct and Redis is ready

### WebSocket connection fails
- Ensure `NEXT_PUBLIC_WS_URL` uses `wss://` (secure WebSocket)
- Verify backend supports WebSocket (it does)
- Check CORS includes your frontend URL

### Database migrations fail
- SSH into Render container: `render-cli exec fluxpay-backend`
- Run: `alembic upgrade head`
- Check migration files in `backend/alembic/versions/`

---

## Monitoring

### Vercel
- Dashboard shows deployment history
- Real-time logs during deploy
- Performance metrics

### Render
- View logs in Dashboard
- CPU/Memory usage graphs
- Database health status

---

## Rollback

### Vercel
1. Dashboard → Deployments
2. Click previous deployment
3. Click "Redeploy"

### Render
1. Dashboard → Settings
2. Scroll to "Danger Zone"
3. Select previous deployment and restart

---

## Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Render
3. Test API endpoints at `https://backend.onrender.com/docs`
4. Connect wallet and create a test job
5. Monitor logs for any issues

---

## Support URLs

- **Frontend:** https://vercel.com/docs/frameworks/nextjs
- **Backend:** https://render.com/docs
- **PostgreSQL on Render:** https://render.com/docs/postgres
- **Redis on Render:** https://render.com/docs/redis
