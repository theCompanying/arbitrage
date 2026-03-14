# MVP Feature Plan

## MVP Goal

Build a minimum viable system to identify, validate, and track profitable AliExpress-to-Amazon arbitrage products.

---

## Core Features (Phase 1)

### 1. Product Research Dashboard

**Purpose**: Central hub for discovering and evaluating product opportunities.

**Features**:
- Product candidate list with key metrics
- Filter by category, margin, BSR, price range
- Sort by profit margin, demand score, competition level
- Quick add from AliExpress/Amazon URLs

**Data Points**:
- AliExpress cost, shipping cost, MOQ
- Amazon sale price, BSR, review count
- Estimated margin %, profit per unit
- Competition score (based on review counts/ratings)

---

### 2. Product Analyzer

**Purpose**: Deep-dive analysis on individual products.

**Features**:
- Product comparison ( AliExpress vs Amazon)
- Fee calculator (FBA fees, referral fees, shipping)
- Margin calculator with break-even analysis
- Competition analysis (top 5 ASINs)
- Keyword difficulty score

**Outputs**:
- Go/No-Go recommendation
- Required sales velocity for profitability
- Suggested launch price and budget

---

### 3. Supplier Tracker

**Purpose**: Manage supplier relationships and orders.

**Features**:
- Supplier database with ratings
- Order history and tracking
- Sample request tracking
- Price negotiation notes
- Lead time tracking

---

### 4. Inventory Planner

**Purpose**: Plan initial inventory orders and shipments.

**Features**:
- Inventory quantity calculator (based on sales velocity)
- FBA shipment planner
- Reorder point alerts
- Cash flow projection

---

## Technical Requirements

### Data Sources

1. **Amazon Product Advertising API** - Product data, BSR, prices
2. **AliExpress API** - Product data, pricing, shipping
3. **Keepa API** - Historical price/sales rank data
4. **Helium 10 API** (optional) - Keyword research, competition data

### Tech Stack

- **Frontend**: React/Next.js dashboard
- **Backend**: Node.js/TypeScript
- **Database**: PostgreSQL (structured product data)
- **Cache**: Redis (API rate limiting, session data)
- **Queue**: Bull/Redis (background jobs for data fetching)

### MVP Scope Constraints

- Manual product entry (no automated scraping initially)
- Single marketplace (Amazon.com only)
- Basic margin calculations (exclude PPC initially)
- CSV export for reports (no fancy dashboards)

---

## Success Criteria

### Functional

- [ ] Can add 10+ product candidates manually
- [ ] Calculates accurate margins including all fees
- [ ] Ranks products by profitability score
- [ ] Exports data to CSV for decision making

### Business

- [ ] Identify 3-5 viable products in 2 weeks
- [ ] Launch first product within 30 days
- [ ] Achieve 30%+ gross margin on first sales

---

## Out of Scope (Phase 2+)

- Automated product discovery/scraping
- PPC campaign management
- Multi-marketplace support
- Private label tracking
- Integration with Amazon Seller Central API
- Automated repricing
- Review monitoring

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Setup | Week 1 | Project scaffolding, API integrations |
| Core | Week 2-3 | Product database, margin calculator |
| Dashboard | Week 4 | UI for research and analysis |
| Launch | Week 5 | First product analysis complete |

---

*Document created: 2026-03-14*
*Owner: Founding Engineer*
