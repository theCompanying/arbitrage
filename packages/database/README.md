# @arbitrage/database

Database package for the arbitrage business MVP. Uses Prisma ORM with PostgreSQL.

## Schema Overview

### Core Models

- **Product** - Product candidates being evaluated for arbitrage
  - Tracks AliExpress source data (price, shipping, MOQ)
  - Tracks Amazon listing data (ASIN, price, BSR, reviews)
  - Calculated metrics (margin, profit, FBA fees)
  - Status workflow: RESEARCH → EVALUATING → APPROVED → LAUNCHED

- **Supplier** - Manufacturers/suppliers from AliExpress
  - Contact information and ratings
  - Manufacturing capabilities (MOQ, lead time, customization)
  - Internal rating system

- **Inventory** - FBA inventory tracking
  - Quantity tracking (total, reserved, sellable)
  - Cost basis (unit cost, shipping)
  - Warehouse location

- **Order** - Purchase orders for inventory
  - Supplier orders with status tracking
  - Shipping and delivery tracking
  - Cost tracking

- **ResearchNote** - Product research notes and analysis
  - Linked to products
  - Tagged for organization

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials

# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Or run migrations (production)
pnpm db:migrate
```

## Usage

```typescript
import { prisma } from '@arbitrage/database'

// Create a product
const product = await prisma.product.create({
  data: {
    title: 'Example Product',
    aliexpressPrice: 5.99,
    amazonPrice: 19.99,
    status: 'RESEARCH'
  }
})

// Query products
const products = await prisma.product.findMany({
  where: { status: 'APPROVED' },
  include: { supplier: true }
})
```

## Scripts

- `pnpm db:generate` - Generate Prisma client types
- `pnpm db:push` - Push schema to database (dev)
- `pnpm db:migrate` - Create and apply migrations
- `pnpm db:studio` - Open Prisma Studio GUI
