# Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All `console.log()` statements removed from production code
- [ ] Frontend `.env.local` is NOT committed (check .gitignore)
- [ ] Backend `.env` is NOT committed (check .gitignore)
- [ ] No hardcoded API URLs in code
- [ ] Run `npm run build` (frontend) - builds successfully
- [ ] Run tests locally if available

### Environment Variables Prepared
- [ ] Frontend: 7 vars from `frontend/.env.example`
- [ ] Backend: 14 vars from `backend/.env.example`
- [ ] RainbowKit Project ID obtained from https://dashboard.reown.com
- [ ] Coordinator wallet private key secured (never share!)

---

## Frontend Deployment (Vercel)

### Setup
- [ ] GitHub account connected to Vercel
- [ ] Repository access granted to Vercel
- [ ] Vercel account created

### Configuration
- [ ] Project name set: `fluxpay-frontend` or similar
- [ ] Root directory: `frontend`
- [ ] Build command auto-detected: `npm run build`
- [ ] Output directory auto-detected: `.next`

### Environment Variables in Vercel Dashboard
- [ ] `NEXT_PUBLIC_API_URL` = Render backend URL
- [ ] `NEXT_PUBLIC_WS_URL` = Render backend URL (wss://)
- [ ] `NEXT_PUBLIC_WALLET_PROJECT_ID` = Your project ID
- [ ] `NEXT_PUBLIC_CHAIN_ID` = 2910
- [ ] `NEXT_PUBLIC_RPC_URL` = https://rpc-hoodi.morphl2.io
- [ ] `NEXT_PUBLIC_USDC_ADDRESS` = 0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1
- [ ] `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` = 0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856

### Post-Deploy
- [ ] Visit deployed URL
- [ ] Connect wallet
- [ ] Verify navigation works
- [ ] Check browser console (F12) for errors
- [ ] Verify `NEXT_PUBLIC_API_URL` is being used (Network tab)

---

## Backend Deployment (Render)

### Setup
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Repository access granted

### Database Setup
- [ ] PostgreSQL instance created on Render
- [ ] Wait for database to be ready (2-3 min)
- [ ] Copy connection string to `DATABASE_URL` env var
- [ ] Test connection string format: `postgresql://user:pass@host:5432/dbname`

### Redis Setup
- [ ] Redis instance created on Render
- [ ] Wait for Redis to be ready (1-2 min)
- [ ] Copy connection string to `REDIS_URL` env var
- [ ] Test connection string format: `redis://username:password@host:port`

### Web Service Configuration
- [ ] Service name: `fluxpay-backend` or similar
- [ ] Environment: Python 3.11
- [ ] Root directory: leave blank (uses root)
- [ ] Build command: `pip install -r backend/requirements.txt`
- [ ] Start command: AUTO-DETECTED from Procfile ✓
- [ ] Plan: Starter (or Pro if needed)

### Environment Variables in Render Dashboard
**Database & Cache**
- [ ] `DATABASE_URL` = Render PostgreSQL connection string
- [ ] `REDIS_URL` = Render Redis connection string

**Auth**
- [ ] `SECRET_KEY` = Generate random 32+ char string
- [ ] `ALGORITHM` = HS256
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` = 1440

**CORS**
- [ ] `FRONTEND_URL` = Your Vercel frontend URL (https://...)
- [ ] `CORS_ORIGINS` = ["https://your-vercel-url.vercel.app"]

**Blockchain**
- [ ] `CHAIN_ID` = 2910
- [ ] `RPC_URL` = https://rpc-hoodi.morphl2.io
- [ ] `COORDINATOR_PRIVATE_KEY` = Your wallet private key

**Contracts**
- [ ] `USDC_ADDRESS` = 0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1
- [ ] `ESCROW_FACTORY_ADDRESS` = 0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856

**Logging**
- [ ] `LOG_LEVEL` = INFO (or DEBUG for troubleshooting)
- [ ] `API_TITLE` = FluxPay API
- [ ] `API_VERSION` = 0.1.0

### Deployment
- [ ] Click "Create Web Service"
- [ ] Render starts building
- [ ] Logs show: Installing dependencies ✓
- [ ] Logs show: Alembic upgrade head ✓ (database migrations)
- [ ] Logs show: Uvicorn server started ✓
- [ ] Deployment shows "Live" status

### Post-Deploy
- [ ] Visit `/docs` endpoint: `https://fluxpay-backend.onrender.com/docs`
- [ ] Should show FastAPI interactive documentation
- [ ] Test health endpoint: `/api/health`
- [ ] Check logs for any warnings/errors

---

## Integration Testing

### Frontend to Backend
- [ ] Frontend loads without console errors
- [ ] Network tab shows API calls to correct backend URL
- [ ] Wallet connection works
- [ ] Can view templates page
- [ ] Can view jobs page
- [ ] Can view dashboard page

### API Testing
```bash
# Test health
curl https://fluxpay-backend.onrender.com/api/health

# Test docs
curl https://fluxpay-backend.onrender.com/docs

# You can also visit in browser:
# https://fluxpay-backend.onrender.com/docs
```

### Full Flow Testing
- [ ] User registers account
- [ ] User logs in
- [ ] User connects wallet
- [ ] User views available templates
- [ ] User creates a job (executes full funding flow)
  - [ ] Quotes
  - [ ] Creates escrow
  - [ ] Approves USDC
  - [ ] Funds escrow
  - [ ] Confirms funding
- [ ] Job appears in dashboard
- [ ] Can view job details
- [ ] Can export results (when job completes)

---

## Monitoring & Support

### Keep Track Of
- [ ] Frontend deployment URL: `https://`
- [ ] Backend deployment URL: `https://`
- [ ] Render service name: `fluxpay-backend`
- [ ] Render database host: Stored in DATABASE_URL
- [ ] Render Redis host: Stored in REDIS_URL

### If Something Breaks

**Frontend not loading:**
1. Check Vercel dashboard → Deployments
2. Look at build logs
3. Verify environment variables are set
4. Check browser console (F12)

**Backend returning errors:**
1. Check Render dashboard → Logs
2. Look for error messages
3. Verify database is running
4. Verify Redis is running
5. Check env vars are set correctly

**Database connection fails:**
1. Verify DATABASE_URL format
2. Check database is "Available" status in Render
3. Try copying fresh connection string
4. Check firewall (Render auto-allows)

**CORS errors:**
1. Check FRONTEND_URL env var is set
2. Check CORS_ORIGINS includes your Vercel URL
3. Restart backend service after changing env vars

---

## Performance Tips

### Frontend
- [ ] Enable ISR (Incremental Static Regeneration)
- [ ] Monitor Vercel Analytics
- [ ] Keep bundle size under 100KB gzipped

### Backend
- [ ] Monitor CPU/Memory on Render
- [ ] Set up error alerts
- [ ] Monitor database connection pool
- [ ] Monitor Redis memory usage

---

## Security

- [ ] `SECRET_KEY` is strong (32+ characters, random)
- [ ] `COORDINATOR_PRIVATE_KEY` never appears in logs
- [ ] Environment variables not logged
- [ ] CORS restricted to frontend domain only
- [ ] No sensitive data in git history
- [ ] `.env` files in .gitignore
- [ ] Use HTTPS for all connections

---

## Rollback Procedure

If deployment fails or you need to go back:

**Vercel:**
1. Go to Dashboard → Deployments
2. Find previous successful deployment
3. Click three dots → "Redeploy"

**Render:**
1. Go to Dashboard → Settings
2. Scroll to "Danger Zone"
3. "Clear Build Cache" and redeploy
4. Or SSH in and check logs for the issue

---

## When Ready to Go Live

- [ ] Test in browser on actual Morph Hoodi testnet
- [ ] Verify wallet connection works
- [ ] Test full job creation flow (quote to funding)
- [ ] Have test USDC in wallet (get from faucet if needed)
- [ ] All console errors resolved
- [ ] Load testing passed
- [ ] Team reviews and approves
- [ ] Announce to users

---

**Need Help?**
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
