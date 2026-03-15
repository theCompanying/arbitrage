import { MarginCalculationInput, calculateMargin, getRecommendation } from './margin-calculator'

export interface ListingInput {
  productName: string
  features: string[]
  description: string
  category: string
  targetKeywords?: string[]
  
  // Pricing inputs
  productCost: number
  shippingToAmazon: number
  targetMarginPercent?: number // Default 25%
  
  // Product specs for FBA fees
  dimensions: {
    length: number
    width: number
    height: number
    weight: number
  }
  
  // Competition data (optional)
  competitorPrices?: number[]
  competitorTitles?: string[]
}

export interface GeneratedListing {
  // SEO-optimized content
  title: string
  bulletPoints: string[]
  description: string
  searchKeywords: string[]
  
  // Pricing
  recommendedPrice: number
  minPrice: number
  maxPrice: number
  
  // Compliance
  characterCounts: {
    title: number
    bullets: number[]
    description: number
  }
  
  // Quality scores
  seoScore: number
  complianceScore: number
}

/**
 * Generate SEO-optimized Amazon product title
 * Format: Brand + Main Keyword + Product Type + Key Features + Size/Color
 */
export function generateTitle(input: ListingInput): string {
  const { productName, features, targetKeywords } = input
  
  // Extract primary keyword (first target keyword or product name)
  const primaryKeyword = targetKeywords?.[0] || productName.split(' ')[0]
  
  // Extract key feature (first feature usually contains main benefit)
  const keyFeature = features[0]?.split(' ')[0] || ''
  
  // Build title components
  const parts: string[] = []
  
  // Brand placeholder (seller should customize)
  parts.push('[Brand]')
  
  // Primary keyword + product type
  parts.push(`${primaryKeyword} ${productName}`)
  
  // Key features (2-3 most important)
  if (keyFeature) {
    parts.push(`- ${keyFeature}`)
  }
  
  // Add quantity/pack size if mentioned
  if (productName.toLowerCase().includes('pack') || productName.toLowerCase().includes('set')) {
    const match = productName.match(/(\d+)-pack|(\d+) pieces|set of (\d+)/i)
    if (match) {
      const count = match[1] || match[2] || match[3]
      parts.push(`(${count}-Pack)`)
    }
  }
  
  // Join with separators
  const title = parts.filter(Boolean).join(' | ')
  
  // Amazon title limits: 200 chars max, 50-80 optimal
  if (title.length > 200) {
    return title.substring(0, 197) + '...'
  }
  
  return title
}

/**
 * Generate compelling bullet points (5 key features/benefits)
 */
export function generateBulletPoints(input: ListingInput): string[] {
  const { features, productName, category } = input
  
  // Map features to benefit-driven bullets
  const bullets: string[] = []
  
  // Feature bullets (top 3-4 features)
  for (let i = 0; i < Math.min(4, features.length); i++) {
    const feature = features[i]
    
    // Convert feature to benefit format
    const benefit = convertFeatureToBenefit(feature, productName)
    bullets.push(benefit)
  }
  
  // Add category-specific bullet if needed
  if (bullets.length < 5) {
    const categoryBullet = getCategoryBullet(category)
    if (categoryBullet) {
      bullets.push(categoryBullet)
    }
  }
  
  // Ensure exactly 5 bullets (Amazon standard)
  while (bullets.length < 5) {
    bullets.push('✅ QUALITY GUARANTEE - Backed by our 30-day money-back guarantee and responsive customer support')
  }
  
  // Format bullets with emoji and caps header
  return bullets.slice(0, 5).map((bullet, i) => {
    const emojis = ['🎯', '✨', '💪', '🏆', '✅']
    return `${emojis[i]} ${bullet.toUpperCase()}`
  })
}

/**
 * Convert a feature statement into a customer benefit
 */
function convertFeatureToBenefit(feature: string, productName: string): string {
  const lower = feature.toLowerCase()
  
  // Pattern match common features to benefits
  if (lower.includes('durable') || lower.includes('sturdy') || lower.includes('strong')) {
    return `BUILT TO LAST - Premium ${productName} designed for daily use without wear or breakage`
  }
  
  if (lower.includes('easy') || lower.includes('simple') || lower.includes('quick')) {
    return `EFFORTLESS TO USE - Save time with intuitive design that works right out of the box`
  }
  
  if (lower.includes('safe') || lower.includes('non-toxic') || lower.includes('bpa')) {
    return `SAFE FOR YOUR FAMILY - Made with non-toxic, BPA-free materials safe for all ages`
  }
  
  if (lower.includes('space') || lower.includes('compact') || lower.includes('storage')) {
    return `SPACE-SAVING DESIGN - Compact footprint maximizes your space while delivering full functionality`
  }
  
  if (lower.includes('versatile') || lower.includes('multi') || lower.includes('adjustable')) {
    return `VERSATILE SOLUTION - Adapts to multiple uses, replacing several single-purpose items`
  }
  
  // Default: rephrase as benefit
  return `${feature} - Enhanced design delivers better results for your ${productName.toLowerCase()}`
}

/**
 * Get category-specific bullet point
 */
function getCategoryBullet(category: string): string | null {
  const bullets: Record<string, string> = {
    'home_kitchen': '🏠 KITCHEN ESSENTIAL - Perfect addition to any modern kitchen, combines style with practical functionality',
    'beauty': '💄 BEAUTY APPROVED - Dermatologist-tested formula safe for sensitive skin, cruelty-free',
    'electronics': '⚡ TECH READY - Compatible with latest devices, includes all necessary adapters and cables',
    'toys': '🎮 KID APPROVED - Engaging design keeps children entertained for hours while developing skills',
    'sports': '💪 PERFORMANCE GRADE - Professional-quality equipment for serious athletes and fitness enthusiasts',
    'clothing': '👕 COMFORT FIT - Premium fabric blend provides all-day comfort with easy-care machine wash',
  }
  
  return bullets[category] || null
}

/**
 * Generate product description (200-400 words)
 */
export function generateDescription(input: ListingInput): string {
  const { productName, features, description: inputDesc, category } = input
  
  // Build description sections
  const sections: string[] = []
  
  // Opening hook
  sections.push(`<h3>Introducing the ${productName}</h3>`)
  sections.push(`<p>Discover the perfect solution for your needs. Our ${productName.toLowerCase()} combines quality craftsmanship with thoughtful design to deliver exceptional value.</p>`)
  
  // Why choose us
  sections.push(`<h3>Why Choose Our ${productName}?</h3>`)
  sections.push('<ul>')
  
  features.slice(0, 5).forEach(feature => {
    sections.push(`<li>${capitalizeFirst(feature)}</li>`)
  })
  
  sections.push('</ul>')
  
  // Use cases
  sections.push(`<h3>Perfect For:</h3>`)
  sections.push(`<p>${getUseCases(category, productName)}</p>`)
  
  // Quality promise
  sections.push(`<h3>Quality You Can Trust</h3>`)
  sections.push(`<p>We stand behind every purchase with our satisfaction guarantee. If you're not completely happy, simply contact us for a full refund within 30 days.</p>`)
  
  // Package contents
  sections.push(`<h3>What's Included:</h3>`)
  sections.push(`<p>1x ${productName}${getPackageContents(category)}</p>`)
  
  return sections.join('\n')
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getUseCases(category: string, productName: string): string {
  const useCases: Record<string, string> = {
    'home_kitchen': `Everyday cooking, meal prep, entertaining guests, or as a thoughtful housewarming gift. The ${productName.toLowerCase()} fits seamlessly into any kitchen setup.`,
    'beauty': `Daily skincare routine, special occasion prep, salon-quality results at home. Suitable for all skin types.`,
    'electronics': `Home office setup, gaming, streaming, or professional work. Compatible with all major devices.`,
    'toys': `Independent play, family game night, educational activities, or as a birthday gift. Encourages creativity and learning.`,
    'sports': `Home workouts, gym sessions, outdoor training, or physical therapy. Suitable for all fitness levels.`,
    'clothing': `Cas wear, work attire, exercise, or lounging. Versatile style transitions from day to night.`,
  }
  
  return useCases[category] || `Multiple applications in daily life. The ${productName.toLowerCase()} adapts to your lifestyle needs.`
}

function getPackageContents(category: string): string {
  const contents: Record<string, string> = {
    'electronics': ', USB cable, user manual, 2-year warranty card',
    'toys': ', instruction guide, activity booklet',
    'clothing': ', care instructions, garment bag',
    'beauty': ', application guide, travel pouch',
  }
  
  return contents[category] || ', user guide, warranty information'
}

/**
 * Generate search keywords (backend search terms)
 */
export function generateSearchKeywords(input: ListingInput): string[] {
  const { productName, targetKeywords, category, features } = input
  
  const keywords = new Set<string>()
  
  // Add target keywords
  targetKeywords?.forEach(kw => {
    keywords.add(kw.toLowerCase())
    // Add variations
    kw.split(' ').forEach(word => {
      if (word.length > 3) keywords.add(word.toLowerCase())
    })
  })
  
  // Extract keywords from product name
  productName.split(' ').forEach(word => {
    const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
    if (clean.length > 3) keywords.add(clean)
  })
  
  // Category keywords
  const categoryKeywords: Record<string, string[]> = {
    'home_kitchen': ['kitchen', 'home', 'cooking', 'storage', 'organizer'],
    'beauty': ['skincare', 'beauty', 'cosmetic', 'makeup', 'face'],
    'electronics': ['electronic', 'device', 'gadget', 'tech', 'accessory'],
    'toys': ['toy', 'game', 'fun', 'kids', 'children'],
    'sports': ['fitness', 'exercise', 'workout', 'sports', 'training'],
    'clothing': ['clothing', 'apparel', 'fashion', 'wear', 'outfit'],
  }
  
  categoryKeywords[category]?.forEach(kw => keywords.add(kw))
  
  // Feature keywords
  features.forEach(feature => {
    const words = feature.toLowerCase().split(' ')
    words.filter(w => w.length > 4).forEach(w => keywords.add(w))
  })
  
  // Remove product name itself (already in title)
  const nameWords = productName.toLowerCase().split(' ')
  nameWords.forEach(w => keywords.delete(w.replace(/[^a-z]/g, '')))
  
  return Array.from(keywords).slice(0, 20) // Amazon limit: 249 bytes total
}

/**
 * Calculate recommended price based on margin target and competition
 */
export function calculateRecommendedPrice(input: ListingInput): {
  recommendedPrice: number
  minPrice: number
  maxPrice: number
} {
  const { productCost, shippingToAmazon, targetMarginPercent = 25, competitorPrices } = input
  
  // Calculate minimum price for target margin
  // price = costs / (1 - margin%)
  const targetMargin = targetMarginPercent / 100
  const basePrice = (productCost + shippingToAmazon) / (1 - targetMargin)
  
  // Add buffer for FBA fees (estimate based on typical small standard size)
  const estimatedFbaFee = 4.75 // large_standard tier
  const estimatedReferralFee = basePrice * 0.15 // 15% average
  
  const minViablePrice = productCost + shippingToAmazon + estimatedFbaFee + estimatedReferralFee
  
  // Competitive positioning
  if (competitorPrices && competitorPrices.length > 0) {
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
    const minCompetitorPrice = Math.min(...competitorPrices)
    const maxCompetitorPrice = Math.max(...competitorPrices)
    
    // Position slightly below average for launch
    const competitivePrice = avgCompetitorPrice * 0.95
    
    // Ensure we maintain minimum margin
    const recommendedPrice = Math.max(minViablePrice * 1.1, competitivePrice)
    
    return {
      recommendedPrice: roundPrice(recommendedPrice),
      minPrice: roundPrice(minViablePrice * 1.05),
      maxPrice: roundPrice(maxCompetitorPrice * 0.95),
    }
  }
  
  // No competition data: use cost-plus with healthy margin
  return {
    recommendedPrice: roundPrice(basePrice * 1.1), // 10% buffer
    minPrice: roundPrice(minViablePrice * 1.05),
    maxPrice: roundPrice(basePrice * 1.3),
  }
}

function roundPrice(price: number): number {
  // Round to .99 or .97 for psychological pricing
  const rounded = Math.round(price)
  const remainder = price - rounded
  
  if (remainder < 0.5) {
    return rounded - 0.01
  } else {
    return rounded + 0.99
  }
}

/**
 * Calculate SEO quality score (0-100)
 */
export function calculateSeoScore(listing: GeneratedListing): number {
  let score = 0
  
  // Title optimization (0-30 points)
  const titleLen = listing.characterCounts.title
  if (titleLen >= 50 && titleLen <= 200) score += 20
  if (titleLen >= 80 && titleLen <= 150) score += 10
  
  // Bullet points (0-30 points)
  const validBullets = listing.characterCounts.bullets.filter(len => len >= 100 && len <= 250).length
  score += validBullets * 6 // 5 bullets max
  
  // Keywords (0-20 points)
  if (listing.searchKeywords.length >= 10) score += 20
  else if (listing.searchKeywords.length >= 5) score += 10
  
  // Description (0-20 points)
  const descLen = listing.characterCounts.description
  if (descLen >= 200 && descLen <= 2000) score += 20
  
  return Math.min(100, score)
}

/**
 * Calculate compliance score (0-100)
 */
export function calculateComplianceScore(listing: GeneratedListing): number {
  let score = 100
  
  // Title length violations
  if (listing.characterCounts.title > 200) score -= 20
  if (listing.characterCounts.title < 50) score -= 10
  
  // Bullet point violations
  listing.characterCounts.bullets.forEach(len => {
    if (len > 250) score -= 5
    if (len < 50) score -= 5
  })
  
  // Ensure exactly 5 bullets
  if (listing.bulletPoints.length !== 5) score -= 10
  
  // Keyword violations
  if (listing.searchKeywords.length > 20) score -= 10
  
  return Math.max(0, score)
}

/**
 * Main function: Generate complete Amazon listing
 */
export function generateListing(input: ListingInput): GeneratedListing {
  const title = generateTitle(input)
  const bulletPoints = generateBulletPoints(input)
  const description = generateDescription(input)
  const searchKeywords = generateSearchKeywords(input)
  const pricing = calculateRecommendedPrice(input)
  
  const listing: GeneratedListing = {
    title,
    bulletPoints,
    description,
    searchKeywords,
    ...pricing,
    characterCounts: {
      title: title.length,
      bullets: bulletPoints.map(b => b.length),
      description: description.replace(/<[^>]*>/g, '').length, // Plain text length
    },
    seoScore: 0,
    complianceScore: 0,
  }
  
  // Calculate scores
  listing.seoScore = calculateSeoScore(listing)
  listing.complianceScore = calculateComplianceScore(listing)
  
  return listing
}

/**
 * Export listing as CSV for Amazon Seller Central upload
 */
export function exportListingAsCsv(listing: GeneratedListing, sku: string): string {
  const headers = [
    'sku',
    'product_name',
    'product_description',
    'bullet_point1',
    'bullet_point2',
    'bullet_point3',
    'bullet_point4',
    'bullet_point5',
    'price',
    'quantity',
    'add_delete',
    'item_sku',
    'external_product_id',
    'external_product_id_type',
    'brand',
    'manufacturer',
    'part_number',
    'search_terms1',
    'search_terms2',
    'search_terms3',
  ]
  
  // Escape CSV fields
  const escape = (str: string) => {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  const rows = [
    sku,
    escape(listing.title),
    escape(listing.description.replace(/<[^>]*>/g, '')), // Plain text
    escape(listing.bulletPoints[0]),
    escape(listing.bulletPoints[1]),
    escape(listing.bulletPoints[2]),
    escape(listing.bulletPoints[3]),
    escape(listing.bulletPoints[4]),
    listing.recommendedPrice.toFixed(2),
    '100', // Default quantity
    'Update',
    sku,
    '', // ASIN (leave blank for new products)
    '',
    escape('[Brand Name]'),
    escape('[Manufacturer]'),
    sku,
    escape(listing.searchKeywords.slice(0, 7).join(' ')),
    escape(listing.searchKeywords.slice(7, 14).join(' ')),
    escape(listing.searchKeywords.slice(14, 20).join(' ')),
  ]
  
  return headers.join(',') + '\n' + rows.join(',')
}

/**
 * Validate listing before submission
 */
export function validateListing(listing: GeneratedListing): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Title validation
  if (listing.characterCounts.title > 200) {
    errors.push('Title exceeds 200 character limit')
  }
  if (listing.characterCounts.title < 50) {
    warnings.push('Title is shorter than recommended (50+ chars)')
  }
  
  // Bullet point validation
  listing.characterCounts.bullets.forEach((len, i) => {
    if (len > 250) {
      errors.push(`Bullet point ${i + 1} exceeds 250 character limit`)
    }
    if (len < 50) {
      warnings.push(`Bullet point ${i + 1} is very short (${len} chars)`)
    }
  })
  
  if (listing.bulletPoints.length !== 5) {
    warnings.push(`Expected 5 bullet points, got ${listing.bulletPoints.length}`)
  }
  
  // Price validation
  if (listing.recommendedPrice < 0.99) {
    errors.push('Price must be at least $0.99')
  }
  
  // Keyword validation
  const keywordBytes = new TextEncoder().encode(listing.searchKeywords.join(' ')).length
  if (keywordBytes > 249) {
    errors.push('Search terms exceed 249 byte limit')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
