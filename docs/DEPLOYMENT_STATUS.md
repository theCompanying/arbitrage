# Production Deployment Status

## Completed

- ✅ GitHub repository created: https://github.com/theCompanying/arbitrage
- ✅ Code pushed to main branch
- ✅ vercel.json configured

## Remaining Steps (Manual)

### Step 1: Deploy to Vercel

1. Go to https://vercel.com/new
2. Sign in / Create account
3. Click "Import Git Repository"
4. Select `theCompanying/arbitrage` repository
5. Configure deployment:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @arbitrage/web build`
   - **Install Command**: `pnpm install`
6. **Do not deploy yet** - complete Step 2 first to get DATABASE_URL

### Step 2: Create Railway Database

1. Go to https://railway.app/new
2. Sign in with GitHub
3. Click "New Project" → Give it a name (e.g., "arbitrage")
4. Click "New" → "Database" → "PostgreSQL"
5. Wait for provisioning (~30 seconds)
6. Click on PostgreSQL service → "Connect" tab
7. Copy the **Pooled Connection String** (format: `postgresql://postgres:[password]@[host].railway.app:5432/railway?sslmode=require`)

### Step 3: Configure Vercel Environment Variables

1. Go back to Vercel deployment page
2. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste Railway connection string from Step 2
3. Click "Deploy"

### Step 4: Run Database Migration

After Vercel deployment completes:

**Option A: Via Railway (Recommended)**
1. Go to Railway → PostgreSQL → "SQL" tab
2. Prisma auto-creates tables on first connection from the app

**Option B: Locally**
```bash
# Add Railway URL to packages/database/.env
echo 'DATABASE_URL="your-railway-url"' > packages/database/.env

# Run migration
cd packages/database
pnpm db:migrate
```

### Step 5: Verify Deployment

Visit your Vercel production URL and test:
- [ ] Dashboard loads
- [ ] Product import works
- [ ] Margin calculator functions
- [ ] Database persistence (add product, refresh page)

## Environment Variables

**Required:**
| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Railway PostgreSQL |

**Optional (for CEO API integrations):**
| Variable | Source |
|----------|--------|
| `AMAZON_ACCESS_KEY` | Amazon PA-API application |
| `AMAZON_SECRET_KEY` | Amazon PA-API application |
| `AMAZON_PARTNER_TAG` | Amazon Associates |
| `ALIEXPRESS_API_KEY` | AliExpress Partners |
| `ALIEXPRESS_SECRET` | AliExpress Partners |

## Post-Deployment

After successful deployment:
1. Update README with production URL
2. CEO completes Amazon PA-API application (TES-17)
3. CEO completes AliExpress API application (TES-18)
4. CEO opens Amazon Seller Central account (TES-19)

## Support

If deployment fails:
- Check Vercel deployment logs
- Verify DATABASE_URL format includes `?sslmode=require`
- Ensure Railway project is not paused (free tier)
- Check Vercel Root Directory is set to `apps/web`
