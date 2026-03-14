export interface MarginCalculationInput {
  // Product costs
  productCost: number      // Cost per unit from supplier
  shippingToAmazon: number // Shipping cost per unit to FBA warehouse
  
  // Amazon pricing
  amazonPrice: number      // Selling price on Amazon
  
  // Product dimensions (for FBA fees)
  length: number           // inches
  width: number            // inches
  height: number           // inches
  weight: number           // pounds
  
  // Category (for referral fee)
  category: Category
}

export interface MarginCalculationResult {
  // Revenue
  revenue: number
  
  // Costs
  productCost: number
  shippingCost: number
  fbaFulfillmentFee: number
  referralFee: number
  monthlyStorageFee?: number
  totalCosts: number
  
  // Margins
  grossProfit: number
  grossMarginPercent: number
  netProfit: number
  netMarginPercent: number
  
  // Break-even analysis
  breakEvenPrice: number
  minimumViablePrice: number
  
  // ROI
  roi: number
}

export type Category = 
  | 'electronics'
  | 'home_kitchen'
  | 'beauty'
  | 'toys'
  | 'sports'
  | 'clothing'
  | 'books'
  | 'other'

// Amazon referral fee percentages by category
const REFERRAL_FEE_RATES: Record<Category, number> = {
  electronics: 0.08,      // 8% for electronics
  home_kitchen: 0.15,     // 15% for home & kitchen
  beauty: 0.20,           // 20% for beauty
  toys: 0.15,             // 15% for toys
  sports: 0.15,           // 15% for sports
  clothing: 0.17,         // 17% for clothing
  books: 0.15,            // 15% for books
  other: 0.15,            // 15% default
}

// Minimum referral fee
const MIN_REFERRAL_FEE = 0.30

/**
 * Calculate FBA fulfillment fee based on size tier
 * Updated for 2024 FBA fee structure
 */
function calculateFbaFulfillmentFee(size: FbaSizeTier): number {
  const fees: Record<FbaSizeTier, number> = {
    small_standard: 3.22,
    large_standard: 4.75,
    small_oversize: 9.73,
    medium_oversize: 11.37,
    large_oversize: 16.15,
  }
  return fees[size]
}

export type FbaSizeTier = 
  | 'small_standard'
  | 'large_standard'
  | 'small_oversize'
  | 'medium_oversize'
  | 'large_oversize'

/**
 * Determine FBA size tier based on dimensions and weight
 */
export function getFbaSizeTier(
  length: number,
  width: number,
  height: number,
  weight: number
): FbaSizeTier {
  // Sort dimensions to get longest, median, shortest
  const dims = [length, width, height].sort((a, b) => b - a)
  const [longest, median, shortest] = dims
  
  // Small standard: <= 15" x 12" x 0.75" and <= 12 oz
  if (longest <= 15 && median <= 12 && shortest <= 0.75 && weight <= 0.75) {
    return 'small_standard'
  }
  
  // Large standard: <= 18" x 14" x 8" and <= 20 lb
  if (longest <= 18 && median <= 14 && shortest <= 8 && weight <= 20) {
    return 'large_standard'
  }
  
  // Small oversize: <= 60" and <= 70 lb (and not large standard)
  if (longest <= 60 && weight <= 70) {
    return 'small_oversize'
  }
  
  // Medium oversize: <= 108" and <= 150 lb
  if (longest <= 108 && weight <= 150) {
    return 'medium_oversize'
  }
  
  // Large oversize: anything bigger
  return 'large_oversize'
}

/**
 * Calculate monthly storage fee (per cubic foot)
 */
export function calculateMonthlyStorageFee(
  length: number,
  width: number,
  height: number,
  month: number // 0-11, Jan-Dec
): number {
  // Volume in cubic feet
  const volumeCf = (length * width * height) / 1728
  
  // Rates vary by season (higher Oct-Dec)
  const isPeakSeason = month >= 9 && month <= 11
  const standardRate = isPeakSeason ? 2.40 : 0.87 // per cubic foot
  
  return volumeCf * standardRate
}

/**
 * Main margin calculation function
 */
export function calculateMargin(input: MarginCalculationInput): MarginCalculationResult {
  const {
    productCost,
    shippingToAmazon,
    amazonPrice,
    length,
    width,
    height,
    weight,
    category
  } = input
  
  // Calculate FBA fees
  const sizeTier = getFbaSizeTier(length, width, height, weight)
  const fbaFulfillmentFee = calculateFbaFulfillmentFee(sizeTier)
  
  // Calculate referral fee (percentage with minimum)
  const referralRate = REFERRAL_FEE_RATES[category]
  const referralFee = Math.max(amazonPrice * referralRate, MIN_REFERRAL_FEE)
  
  // Total costs
  const totalCosts = productCost + shippingToAmazon + fbaFulfillmentFee + referralFee
  
  // Profit calculations
  const grossProfit = amazonPrice - totalCosts
  const grossMarginPercent = (grossProfit / amazonPrice) * 100
  
  // Break-even price (where profit = 0)
  // price = costs / (1 - referralRate)
  const variableCosts = productCost + shippingToAmazon + fbaFulfillmentFee
  const breakEvenPrice = variableCosts / (1 - referralRate)
  
  // Minimum viable price (break-even + $2 buffer)
  const minimumViablePrice = breakEvenPrice + 2
  
  // ROI calculation
  const roi = (grossProfit / (productCost + shippingToAmazon)) * 100
  
  return {
    revenue: amazonPrice,
    productCost,
    shippingCost: shippingToAmazon,
    fbaFulfillmentFee,
    referralFee,
    totalCosts,
    grossProfit,
    grossMarginPercent,
    netProfit: grossProfit, // Could subtract storage/ads later
    netMarginPercent: grossMarginPercent,
    breakEvenPrice,
    minimumViablePrice,
    roi,
  }
}

/**
 * Calculate profitability score (0-100)
 * Higher is better
 */
export function calculateProfitabilityScore(result: MarginCalculationResult): number {
  let score = 0
  
  // Margin score (0-40 points)
  if (result.netMarginPercent >= 30) score += 40
  else if (result.netMarginPercent >= 25) score += 30
  else if (result.netMarginPercent >= 20) score += 20
  else if (result.netMarginPercent >= 15) score += 10
  else if (result.netMarginPercent >= 10) score += 5
  
  // ROI score (0-30 points)
  if (result.roi >= 100) score += 30
  else if (result.roi >= 75) score += 25
  else if (result.roi >= 50) score += 20
  else if (result.roi >= 30) score += 10
  else if (result.roi >= 15) score += 5
  
  // Absolute profit score (0-30 points)
  if (result.netProfit >= 10) score += 30
  else if (result.netProfit >= 7) score += 25
  else if (result.netProfit >= 5) score += 20
  else if (result.netProfit >= 3) score += 15
  else if (result.netProfit >= 2) score += 10
  else if (result.netProfit > 0) score += 5
  
  return Math.min(100, Math.max(0, score))
}

/**
 * Get recommendation based on margin calculation
 */
export function getRecommendation(result: MarginCalculationResult): {
  verdict: 'GO' | 'MAYBE' | 'NO_GO'
  reason: string
} {
  const score = calculateProfitabilityScore(result)
  
  if (score >= 70 && result.netMarginPercent >= 25) {
    return {
      verdict: 'GO',
      reason: `Strong margins (${result.netMarginPercent.toFixed(1)}%) and ROI (${result.roi.toFixed(0)}%). Recommended for launch.`
    }
  }
  
  if (score >= 40 && result.netMarginPercent >= 15) {
    return {
      verdict: 'MAYBE',
      reason: `Decent margins (${result.netMarginPercent.toFixed(1)}%) but consider negotiating supplier costs or optimizing listing.`
    }
  }
  
  return {
    verdict: 'NO_GO',
    reason: `Margins too low (${result.netMarginPercent.toFixed(1)}%). Need ${result.breakEvenPrice.toFixed(2)} to break even.`
  }
}
