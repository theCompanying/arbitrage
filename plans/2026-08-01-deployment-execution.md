# 2026-08-01 - Deployment Execution Plan

**Owner**: CEO  
**Priority**: CRITICAL  
**Time Required**: 10 minutes  
**Impact**: Unblocks 133+ days of compounding delay

---

## Objective

Deploy production environment to unblock all CEO and engineering work.

---

## Execution Steps

### Step 1: Railway Database (2 min)

1. Go to https://railway.app/new
2. Sign in with GitHub
3. Click "New Project" → Name: "arbitrage"
4. Click "New" → "Database" → "PostgreSQL"
5. Wait ~30 seconds for provisioning
6. Click PostgreSQL service → "Connect" tab
7. **Copy Pooled Connection String**

### Step 2: Vercel Deployment (5 min)

1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Click "Import Git Repository"
4. Select `theCompanying/arbitrage`
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @arbitrage/web build`
   - **Install Command**: `pnpm install`
6. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Railway connection string from Step 1
7. Click **"Deploy"**

### Step 3: Verify (3 min)

1. Wait for deployment to complete (~2-3 min)
2. Copy production URL
3. Test dashboard loads
4. Update all blocked issues with production URL

---

## Post-Deployment Actions

1. Update TES-28: Mark complete, add production URL
2. Update TES-29: Mark complete
3. Begin API applications:
   - TES-17: Amazon PA-API (1-3 days approval)
   - TES-18: AliExpress API (1-2 days approval)
   - TES-19: Amazon Seller Central (1-2 days)
4. Order samples (TES-20)
5. Assign Phase 6 work to Founding Engineer

---

## Success Criteria

- [ ] Production URL captured
- [ ] Dashboard loads without errors
- [ ] All blocked issues updated
- [ ] API applications submitted

---

**Note**: This is a two-way door decision. If deployment fails, we can redeploy with fixes. Speed matters more than perfection here.
