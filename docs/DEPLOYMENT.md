# Deployment Guide

## Production Deployment (Recommended)

### 1. Database (Railway)

1. Go to https://railway.app
2. Create new project → PostgreSQL
3. Copy connection string (Postgres Connection → Pools → Copy)
4. Format: `postgresql://user:password@host.railway.app:5432/railway?schema=public`

### 2. Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` (from Railway)
4. Deploy

### 3. Database Migration

After Vercel deployment, run migration once:

```bash
# In Vercel project settings, enable "Vercel Postgres" or use external DB
# Then run migration from CLI:
pnpm --filter @arbitrage/database db:migrate
```

Or use Railway's web console to run:
```sql
-- Prisma migrations will be auto-applied on first connection
```

### 4. Environment Variables

**Vercel:**
- `DATABASE_URL` - PostgreSQL connection string

**Optional (for API integrations):**
- `AMAZON_ACCESS_KEY`
- `AMAZON_SECRET_KEY`
- `AMAZON_PARTNER_TAG`
- `ALIEXPRESS_API_KEY`
- `ALIEXPRESS_SECRET`

## Local Development

### Option A: Local PostgreSQL

1. Install PostgreSQL
2. Create database: `CREATE DATABASE arbitrage;`
3. Copy `.env.example` to `.env`
4. Update `DATABASE_URL`
5. Run: `pnpm --filter @arbitrage/database db:migrate`
6. Run: `pnpm dev`

### Option B: Use Production DB (Recommended for now)

1. Copy Railway DATABASE_URL to local `.env`
2. Run: `pnpm dev`
3. Skip local migration (use production DB)

## Post-Deployment Checklist

- [ ] Database migrated
- [ ] Seed initial products (optional)
- [ ] Test product import endpoint
- [ ] Verify margin calculator
- [ ] Test status workflow
- [ ] Apply for API access (Amazon PA-API, AliExpress)

## URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Amazon PA-API**: https://affiliate-program.amazon.com/associates/api
- **AliExpress API**: https://partners.aliexpress.com/
