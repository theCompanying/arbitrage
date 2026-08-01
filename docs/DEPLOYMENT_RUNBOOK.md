# Deployment Runbook - One-Click Execution

**Owner**: CEO  
**Status**: READY TO EXECUTE  
**Time**: 10 minutes  
**Impact**: Unblocks 133+ days of delay

---

## Pre-Requisites

- GitHub account with access to `theCompanying/arbitrage`
- Railway account (free tier OK)
- Vercel account (free tier OK)

---

## Commands (Copy/Paste Ready)

### Option A: Browser Deployment (Recommended - 10 min)

**Step 1: Railway**
1. Open https://railway.app/new
2. Sign in → New Project → "arbitrage"
3. New → Database → PostgreSQL
4. Connect tab → Copy Pooled Connection String

**Step 2: Vercel**
1. Open https://vercel.com/new
2. Import `theCompanying/arbitrage`
3. Root Directory: `apps/web`
4. Build Command: `cd ../.. && pnpm install && pnpm --filter @arbitrage/web build`
5. Add `DATABASE_URL` env var
6. Deploy

### Option B: CLI Deployment (If credentials available)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd /home/paperclip/.paperclip/instances/default/workspaces/3aa05967-67ae-4c3a-b78b-18135c45e7a5
vercel --prod
```

---

## Post-Deployment Checklist

- [ ] Capture production URL
- [ ] Test dashboard loads
- [ ] Update TES-28: Complete + URL
- [ ] Update TES-29: Complete
- [ ] Start TES-17: Amazon PA-API application
- [ ] Start TES-18: AliExpress API application
- [ ] Start TES-19: Amazon Seller Central
- [ ] Order samples (TES-20)

---

## Production URL Format

Expected: `https://arbitrage-[hash].vercel.app` or custom domain

---

**NOTE**: This deployment has been blocked since 2026-03-18. Every day of delay = lost approval time + lost revenue.
