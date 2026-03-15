# Deployment Guide

## Quick Deploy (5 minutes)

### Step 1: Deploy Database (Railway)

1. Go to https://railway.app and sign in
2. Click "New Project" → "New Database" → "PostgreSQL"
3. Wait for provisioning (~30 seconds)
4. Click on the PostgreSQL service → "Connect" tab
5. Copy the **Pooled Connection String** (starts with `postgresql://`)
6. Save this for Vercel environment variables

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 3: Deploy Frontend (Vercel)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm --filter @arbitrage/web build`
   - **Install Command**: `pnpm install`
5. Add Environment Variables:
   - `DATABASE_URL`: Paste Railway connection string
6. Click "Deploy"

### Step 4: Run Database Migration

After first deployment completes:

```bash
# Set DATABASE_URL in packages/database/.env
echo 'DATABASE_URL="your-railway-url"' > packages/database/.env

# Run migration
cd packages/database
pnpm db:migrate
```

Or via Railway SQL editor:
- Go to Railway → PostgreSQL → "SQL" tab
- Prisma auto-creates tables on first connection

## Environment Variables

### Required
| Variable | Source | Example |
|----------|--------|---------|
| `DATABASE_URL` | Railway PostgreSQL | `postgresql://user:pass@host.railway.app:5432/db` |

### Optional (API Integrations)
| Variable | Source | Purpose |
|----------|--------|---------|
| `AMAZON_ACCESS_KEY` | Amazon PA-API | Product data lookup |
| `AMAZON_SECRET_KEY` | Amazon PA-API | Product data lookup |
| `AMAZON_PARTNER_TAG` | Amazon Associates | Affiliate tracking |
| `ALIEXPRESS_API_KEY` | AliExpress Partners | Product import |
| `ALIEXPRESS_SECRET` | AliExpress Partners | Product import |

## Local Development

### Using Production Database (Recommended)

1. Copy Railway `DATABASE_URL` to `packages/database/.env`
2. Run `pnpm dev`
3. Access at http://localhost:3000

### Using Local PostgreSQL

1. Install PostgreSQL: `brew install postgresql` (macOS) or use Docker
2. Create database: `createdb arbitrage`
3. Update `packages/database/.env`:
   ```
   DATABASE_URL="postgresql://localhost:5432/arbitrage"
   ```
4. Run migration: `pnpm --filter @arbitrage/database db:migrate`
5. Run dev server: `pnpm dev`

## Post-Deployment Checklist

- [ ] Database tables created (check Railway SQL editor)
- [ ] Vercel deployment successful
- [ ] Product import endpoint works (`/api/products/import`)
- [ ] Margin calculator functional
- [ ] Status workflow (Research → Evaluating → Approved → Launched)
- [ ] Listing generator creates CSV exports
- [ ] CEO completes API applications (Amazon PA-API, AliExpress)

## Troubleshooting

### Build fails on Vercel
- Ensure Root Directory is set to `apps/web`
- Check build logs for Prisma generation errors
- Add `pnpm --filter @arbitrage/database db:generate` to build command

### Database connection errors
- Verify Railway connection string includes SSL: `?sslmode=require`
- Check Railway project is not paused (free tier sleeps after inactivity)

### API endpoints return 500
- Check environment variables are set in Vercel
- Verify database tables exist (run migration)

## URLs

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Railway Dashboard | https://railway.app/dashboard |
| Amazon PA-API | https://affiliate-program.amazon.com/associates/api |
| AliExpress API | https://partners.aliexpress.com/ |
| Amazon Seller Central | https://sell.amazon.com/ |
