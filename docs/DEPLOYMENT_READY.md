# Deployment Ready - Action Required

## Status: Ready for CEO/Board Deployment

**Date:** March 16, 2026  
**Issue:** TES-25  
**Prepared by:** Founding Engineer

---

## What's Complete

✅ **GitHub Repository**
- URL: https://github.com/theCompanying/arbitrage
- Branch: main
- Last push: Recent

✅ **Deployment Configuration**
- `vercel.json` configured for Next.js
- Root directory: `apps/web`
- Build command: `pnpm --filter @arbitrage/web build`

✅ **Database Schema**
- Prisma schema ready
- Models: Product, Supplier, Inventory, Order, ResearchNote

---

## Required Actions (10 minutes total)

### Step 1: Create Railway Database (2 minutes)

1. Visit https://railway.app/new
2. Sign in with GitHub account
3. Click **"New Project"** → Name it "arbitrage"
4. Click **"New"** → **"Database"** → **"PostgreSQL"**
5. Wait ~30 seconds for provisioning
6. Click on PostgreSQL service → **"Connect"** tab
7. **Copy the Pooled Connection String** (looks like: `postgresql://postgres:password@host.railway.app:5432/railway?sslmode=require`)

### Step 2: Deploy to Vercel (5 minutes)

1. Visit https://vercel.com/new
2. Sign in with GitHub account
3. Click **"Import Git Repository"**
4. Find and select: **`theCompanying/arbitrage`**
5. Click **"Import"**
6. Configure deployment settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @arbitrage/web build`
   - **Install Command**: `pnpm install`
7. **Add Environment Variables:**
   - Click **"Environment Variables"**
   - Add: `DATABASE_URL` = (paste Railway connection string from Step 1)
8. Click **"Deploy"**
9. Wait for deployment to complete (~2-3 minutes)
10. **Copy the production URL** (e.g., `https://arbitrage.vercel.app`)

### Step 3: Verify Deployment (3 minutes)

Visit your production URL and test:
- [ ] Dashboard page loads
- [ ] Product import form appears
- [ ] No database connection errors

---

## After Deployment

Once production URL is live, the following CEO tasks can proceed:

- **TES-17**: Amazon PA-API application (needs production URL)
- **TES-18**: AliExpress API application (needs production URL)
- **TES-19**: Amazon Seller Central account (needs production URL)

---

## Support / Troubleshooting

**If Vercel build fails:**
- Check deployment logs in Vercel dashboard
- Verify Root Directory is `apps/web`
- Ensure pnpm-lock.yaml is committed

**If database connection fails:**
- Verify DATABASE_URL includes `?sslmode=require`
- Check Railway project is not paused

**Full deployment guide:** See `docs/DEPLOYMENT_CHECKLIST.md`

---

**Contact:** Founding Engineer (via Paperclip)
