# API Application Readiness Pack

**Prepared**: 2026-08-11  
**Status**: READY TO EXECUTE (awaiting deployment)  
**Owner**: CEO  

---

## Overview

All API application materials are prepared. Once deployment is fixed, these three applications can be submitted immediately:

| Application | URL | Time | Approval Wait |
|-------------|-----|------|---------------|
| TES-17: Amazon PA-API | affiliate-program.amazon.com | 15 min | 1-3 days |
| TES-18: AliExpress API | partners.aliexpress.com | 10 min | 1-2 days |
| TES-19: Seller Central | sell.amazon.com | 30 min | 1-2 days |

**Total time**: ~55 minutes  
**Critical path**: 1-3 days (Amazon PA-API)

---

## TES-17: Amazon Product Advertising API

### Prerequisites ✅
- [x] Amazon account (create at amazon.com if needed)
- [x] Website URL: https://github.com/theCompanying/arbitrage

### Application Steps

1. **Join Amazon Associates** (5 min)
   - Go to https://affiliate-program.amazon.com/
   - Click "Join now for free"
   - Complete profile (Individual or Business)
   - Phone verification required

2. **Add Website** (5 min)
   - Account Settings → Website List → Add your website
   - URL: https://github.com/theCompanying/arbitrage
   - Description: "Product research tool for arbitrage opportunities between AliExpress and Amazon"
   - Category: Shopping/Research

3. **Apply for PA-API** (5 min)
   - Go to https://webservices.amazon.com/paapi5/documentation/
   - Click "Get Started" / "Apply for API Access"
   - Use case: "Automated product research and price comparison for arbitrage analysis"
   - Expected monthly requests: 10,000-50,000 (free tier: 288K/month)

4. **Wait for approval** (1-3 business days)
   - Check email for approval notification
   - May require additional website verification

### Post-Approval: Save Credentials
- Access Key ID
- Secret Access Key
- Associate Tag (e.g., "thecompanying-20")

### Required For
- Automated BSR lookup
- Review count tracking
- Pricing data for margin calculations

---

## TES-18: AliExpress Partner API

### Prerequisites ✅
- [x] AliExpress account (create at aliexpress.com if needed)
- [x] Website/app for promotion

### Application Steps

1. **Join AliExpress Partners** (5 min)
   - Go to https://partners.aliexpress.com/
   - Click "Join Now" or "Sign Up"
   - Complete registration form
   - Verify email/phone

2. **Add Promotion Channel** (3 min)
   - Dashboard → My Profile → Promotion Channels
   - Add website/app:
     - Type: Website or App
     - URL: https://github.com/theCompanying/arbitrage
     - Description: "Product research and price comparison tool"
     - Category: Shopping/Tools

3. **Apply for API Access** (2 min)
   - Dashboard → API Access or Developer Center
   - Submit application:
     - Use case: "Automated product data retrieval for arbitrage analysis"
     - Expected API calls: 10,000-50,000/month
     - Traffic source: Direct/product research tool

4. **Wait for approval** (1-2 business days)
   - Check email for approval
   - Usually faster than Amazon

### Post-Approval: Save Credentials
- App Key
- App Secret
- Partner ID

### Required For
- Automated AliExpress product import
- Real-time pricing updates
- Shipping cost calculation
- Supplier information

---

## TES-19: Amazon Seller Central

### Prerequisites ✅
- [x] Government-issued ID (driver's license or passport)
- [x] Credit card (for seller fees)
- [x] Bank account (for disbursements)
- [x] Phone number (for verification)

### Account Type Decision

**Recommendation**: Start with **Individual** plan
- $0.99 per item sold (vs. $39.99/month Professional)
- No monthly commitment
- Upgrade after first successful launch
- All essential features included

### Application Steps

1. **Start Registration** (5 min)
   - Go to https://sell.amazon.com/
   - Click "Sign up" / "Start selling"
   - Choose: Individual plan

2. **Account Setup** (5 min)
   - Use existing Amazon account or create new
   - Enable two-factor authentication (recommended)

3. **Business Information** (10 min)
   - Legal name (matches ID)
   - Address
   - Phone number
   - Business type: Individual

4. **Identity Verification** (10 min)
   - Upload government ID (front and back)
   - Upload credit card photo (hide middle digits)
   - Upload bank statement or utility bill (address proof)

5. **Billing & Disbursement** (10 min)
   - Credit card for seller fees
   - Bank account for disbursements (routing + account number)

6. **Store Setup** (5 min)
   - Seller display name
   - Return address
   - Shipping settings (FBA recommended)
   - Product categories

7. **Submit & Wait** (1-2 days)
   - Review all information
   - Submit application
   - Basic approval: 1-2 days
   - Full verification: up to 2 weeks

### Post-Approval Actions

1. **Complete FBA Settings**
   - Inbound shipping preferences
   - Return address
   - Prep requirements

2. **List First Product**
   - Create product listing
   - Set pricing
   - Choose FBA fulfillment

3. **Send Inventory to Amazon**
   - Create shipment plan
   - Print FBA labels
   - Ship to Amazon warehouse

### Required For
- Creating Amazon listings (TES-24)
- Ordering samples with business account (TES-20)
- Launching first product
- FBA inventory management

---

## Execution Sequence

**Day 0** (deployment day):
1. ✅ Deployment verified
2. 📝 Submit Amazon PA-API application (TES-17) - 15 min
3. 📝 Submit AliExpress API application (TES-18) - 10 min
4. 📝 Submit Seller Central application (TES-19) - 30 min
5. 📝 Order samples from top 5 suppliers (TES-20) - 30 min

**Day 1-3** (approval wait):
- ⏳ Amazon PA-API approval (1-3 days)
- ⏳ AliExpress API approval (1-2 days)
- ⏳ Seller Central approval (1-2 days)
- 📦 Samples in transit (~1 week)
- 🏢 LLC formation evaluation (TES-21)

**Day 4+** (post-approval):
- ✅ API credentials configured
- ✅ Seller Central active
- 🚀 Begin Phase 6 development
- 🚀 Prepare first product launch

---

## Credentials Storage

**DO NOT commit credentials to git.**

Store in secure location:
- Password manager (1Password, LastPass, etc.)
- Environment variables in Vercel/Railway
- Local `.env` file (gitignored)

Required environment variables:
```
# Amazon PA-API
AMAZON_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AMAZON_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AMAZON_PARTNER_TAG=thecompanying-20

# AliExpress API
ALIEXPRESS_APP_KEY=12345678
ALIEXPRESS_APP_SECRET=abcdef1234567890
ALIEXPRESS_PARTNER_ID=123456

# Amazon Seller Central (if using SP-API)
AMAZON_SELLER_ID=A2EXAMPLE123
```

---

## Tracking

| Task | Status | Submitted | Approved | Credentials Saved |
|------|--------|-----------|----------|-------------------|
| TES-17: PA-API | ⏳ Pending | - | - | - |
| TES-18: AliExpress API | ⏳ Pending | - | - | - |
| TES-19: Seller Central | ⏳ Pending | - | - | - |
| TES-20: Order Samples | ⏳ Pending | - | - | - |
| TES-21: LLC Formation | ⏳ Evaluation | - | - | - |

---

## Links

- Amazon Associates: https://affiliate-program.amazon.com/
- Amazon PA-API Docs: https://webservices.amazon.com/paapi5/documentation/
- AliExpress Partners: https://partners.aliexpress.com/
- Amazon Seller Central: https://sell.amazon.com/
- FBA Revenue Calculator: https://sellercentral.amazon.com/fba/profitabilitycalculator/index

---

**Ready to execute immediately upon deployment confirmation.**
