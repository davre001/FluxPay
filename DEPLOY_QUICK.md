# 🚀 Deployment Quick Start

## TL;DR - Deploy in 5 Minutes

### Frontend → Vercel
```
1. Go to vercel.com/new
2. Import GitHub repo
3. Select 'frontend' root directory
4. Add env vars (see DEPLOYMENT.md)
5. Click Deploy
```

**Your frontend:** `https://yourproject.vercel.app`

### Backend → Render
```
1. Go to render.com/new → Web Service
2. Connect GitHub
3. Build: pip install -r backend/requirements.txt
4. Start: Use Procfile (auto-detected)
5. Add Postgres & Redis
6. Add env vars (see DEPLOYMENT.md)
7. Deploy
```

**Your backend:** `https://fluxpay-backend.onrender.com`

---

## File Reference

| File | Purpose | Platform |
|------|---------|----------|
| `.vercelignore` | Exclude files from Vercel build | Vercel |
| `.env.example` (frontend) | Frontend env vars template | Vercel |
| `.env.example` (backend) | Backend env vars template | Render |
| `Procfile` | Backend startup command | Render |
| `requirements.txt` | Python dependencies | Render |
| `.gitignore` (backend) | Git ignore for backend | Both |
| `DEPLOYMENT.md` | Full deployment guide | Reference |

---

## Critical Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://fluxpay-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://fluxpay-backend.onrender.com
```

### Render (Backend)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=(random 32+ char string)
FRONTEND_URL=https://yourproject.vercel.app
```

---

## Testing After Deploy

### Frontend is working
```bash
# Visit in browser
https://yourproject.vercel.app
```

### Backend is working
```bash
# View API docs
https://fluxpay-backend.onrender.com/docs

# Or curl health check
curl https://fluxpay-backend.onrender.com/health
```

---

## Next: Full Guide
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions, troubleshooting, and monitoring.
