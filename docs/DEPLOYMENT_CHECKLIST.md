# Production Deployment Checklist

## Pre-Deployment

- [ ] All tests passing locally
- [ ] Environment variables documented in `.env.example`
- [ ] Database schema finalized
- [ ] Deployment guide reviewed

## Step 1: GitHub Repository

```bash
# Create new repository on GitHub (do not initialize with README)
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/arbitrage.git
git branch -M main
git push -u origin main
```

## Step 2: Railway Database

1. Go to https://railway.app and sign in
2. Click "New Project" → "New Database" → "PostgreSQL"
3. Wait for provisioning (~30 seconds)
4. Click on PostgreSQL service → "Connect" tab
5. Copy the **Pooled Connection String**
6. Save for Vercel environment variables

**Connection String Format:**
```
postgresql://postgres:[password]@[host].railway.app:5432/railway?sslmode=require
```

## Step 3: Vercel Deployment

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @arbitrage/web build`
   - **Install Command**: `pnpm install`
5. Add Environment Variables:
   - `DATABASE_URL`: Paste Railway connection string
6. Click "Deploy"

## Step 4: Database Migration

After Vercel deployment completes:

**Option A: Run migration via Railway SQL**
1. Go to Railway → PostgreSQL → "SQL" tab
2. Prisma will auto-create tables on first connection

**Option B: Run migration locally**
```bash
# Set Railway DATABASE_URL in packages/database/.env
echo 'DATABASE_URL="your-railway-url"' > packages/database/.env

# Run migration
cd packages/database
pnpm db:migrate
```

## Step 5: Verify Deployment

- [ ] Visit production URL
- [ ] Test product import endpoint
- [ ] Test margin calculator
- [ ] Test supplier management
- [ ] Test inventory tracking
- [ ] Verify database connection

## Environment Variables

**Required:**
| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Railway | PostgreSQL connection string |

**Optional (API Integrations):**
| Variable | Source | Description |
|----------|--------|-------------|
| `AMAZON_ACCESS_KEY` | Amazon PA-API | Product data lookup |
| `AMAZON_SECRET_KEY` | Amazon PA-API | Product data lookup |
| `AMAZON_PARTNER_TAG` | Amazon Associates | Affiliate tracking |
| `ALIEXPRESS_API_KEY` | AliExpress Partners | Product import |
| `ALIEXPRESS_SECRET` | AliExpress Partners | Product import |

## Post-Deployment

- [ ] CEO completes API applications (Amazon PA-API, AliExpress)
- [ ] CEO opens Seller Central account
- [ ] CEO orders samples from top 5 suppliers
- [ ] Team evaluates samples
- [ ] Create Amazon listings using listing generator
- [ ] Place first inventory order (300-500 units)

## Troubleshooting

### Build fails on Vercel
- Ensure Root Directory is set to `apps/web`
- Check build logs for Prisma generation errors
- Verify pnpm-lock.yaml is committed

### Database connection errors
- Verify DATABASE_URL includes `?sslmode=require`
- Check Railway project is not paused
- Ensure Railway PostgreSQL is in same region as Vercel

### API endpoints return 500
- Check environment variables are set in Vercel
- Verify database tables exist
- Check Vercel function logs for errors

## Rollback Plan

If deployment fails:
1. Revert to previous git commit
2. Push to GitHub (triggers Vercel redeploy)
3. Or use Vercel dashboard to rollback to previous deployment

## URLs

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Railway Dashboard | https://railway.app/dashboard |
| Amazon PA-API | https://affiliate-program.amazon.com/associates/api |
| AliExpress API | https://partners.aliexpress.com/ |
| Amazon Seller Central | https://sell.amazon.com/ |
