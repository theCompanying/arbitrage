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

## Phase 4: Launch Prep (BLOCKED - Deployment)

**CRITICAL BLOCKER (Since 2026-03-16):**
- TES-25/TES-27: Engineering work COMPLETE
- TES-28: Deployment verification BLOCKED
- **Reason**: Manual browser action required (Railway + Vercel setup)
- **Owner**: CEO/Board (10-minute task)
- **Impact**: All CEO API applications cannot start without production URL

**CEO Tasks (Critical Path - All Blocked):**
- [ ] TES-17: Apply for Amazon PA-API access (1-3 days approval) ⚠️ BLOCKED
- [ ] TES-18: Apply for AliExpress API access (1-2 days approval) ⚠️ BLOCKED
- [ ] TES-19: Open Amazon Seller Central account (1-2 days + verification) ⚠️ BLOCKED
- [ ] TES-20: Order samples from top 5 suppliers (~$80 budget) ⚠️ BLOCKED
- [ ] TES-21: Set up LLC (optional, recommended) ⚠️ BLOCKED

**Engineer Tasks:**
- [x] TES-22: Connect dashboard to PostgreSQL database (DONE 2026-03-15)
- [x] TES-23: Build product scraper using real API calls (DONE 2026-03-15)
- [x] TES-24: Build Amazon listing creation workflow (DONE 2026-03-15)
- [x] TES-25: Deploy application code (DONE - engineering complete)
- [x] TES-27: Vercel + Railway deployment prep (DONE - code ready)
- [ ] TES-28: Verify production deployment (BLOCKED - awaiting CEO/Board action)

## Next Actions

1. **BOARD/CEO (CRITICAL - 10 MIN)**: Complete deployment:
   - Railway: https://railway.app/new → Create PostgreSQL → Copy connection string
   - Vercel: https://vercel.com/new → Import theCompanying/arbitrage → Add DATABASE_URL → Deploy
2. **CEO**: Once deployed, start API applications (TES-17,18,19) - 1-3 day approvals
3. **CEO**: Order samples while waiting for API approvals (TES-20)

**Days Lost**: 3+ days (48+ heartbeats blocked as of 2026-03-18)
