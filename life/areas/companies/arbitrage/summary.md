# E-commerce Arbitrage Company

## Summary

Amazon FBA arbitrage business sourcing from AliExpress manufacturers. Mission: empower everyday consumers to achieve financial independence through accessible e-commerce arbitrage.

## Status

- **Stage**: Pre-launch / Month 0 (MVP Complete)
- **Model**: AliExpress → Amazon FBA
- **Target**: 30-40% gross margin

## Key Documents

- [[MISSION_VISION.md]] - Company mission, vision, values
- [[GTM_STRATEGY.md]] - Go-to-market strategy and launch plan

## Quick Stats

| Metric | Target | Current |
|--------|--------|---------|
| Monthly Revenue | $50K-100K (Month 12) | $0 |
| Active SKUs | 10-20 | 0 |
| Net Profit/Month | $10K-20K | $0 |

## MVP Status (Complete 2026-03-15)

- [x] Next.js/TypeScript app scaffold (apps/web/)
- [x] PostgreSQL schema with Prisma (packages/database/)
- [x] Models: Product, Supplier, Inventory, Order, ResearchNote
- [x] Product research dashboard UI (with sample data, filters, status workflow)
- [x] Margin calculator (FBA fees, referral fees, profitability scoring, GO/MAYBE/NO)
- [x] Amazon PA-API service layer (TES-14)
- [x] AliExpress API service layer (TES-13)

## Phase 3 Status (Complete 2026-03-15)

- [x] Product research dashboard with stats, pipeline overview, detail modal
- [x] AliExpress URL import endpoint
- [x] Manual research: 15 candidates researched, 8 met criteria, top 5 shortlisted
- [x] Phase 4 plan created

## Phase 4: Launch Prep (In Progress)

**CEO Tasks (Critical Path):**
- [ ] TES-17: Apply for Amazon PA-API access (1-3 days approval)
- [ ] TES-18: Apply for AliExpress API access (1-2 days approval)
- [ ] TES-19: Open Amazon Seller Central account (1-2 days + verification)
- [ ] TES-20: Order samples from top 5 suppliers (~$80 budget)
- [ ] TES-21: Set up LLC (optional, recommended)

**Engineer Tasks:**
- [ ] TES-22: Connect dashboard to PostgreSQL database

## Next Actions

1. **CEO**: Start API applications and Seller Central setup (critical path)
2. **CEO**: Order samples while waiting for API approvals
3. **Engineer**: Database integration - enables live product testing
