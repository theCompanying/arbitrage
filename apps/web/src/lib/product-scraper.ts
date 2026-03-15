import { AmazonPaApiService, ProductData as AmazonProductData } from './amazon-pa-api'
import { AliExpressApiService, AliExpressProduct } from './aliexpress-api'
import { calculateMargin, calculateProfitabilityScore, getRecommendation, MarginCalculationResult, getFbaSizeTier } from './margin-calculator'

export interface ScrapedAliExpressData extends AliExpressProduct {
  scrapedAt: string
  source: 'aliexpress_api' | 'url_scrape' | 'manual'
}

export interface ScrapedAmazonData extends AmazonProductData {
  scrapedAt: string
  source: 'amazon_api' | 'manual'
}

export interface ProductAnalysis {
  aliexpress: ScrapedAliExpressData
  amazon: ScrapedAmazonData
  marginCalculation: MarginCalculationResult
  profitabilityScore: number
  recommendation: {
    verdict: 'GO' | 'MAYBE' | 'NO_GO'
    reason: string
  }
  sizeTier: string
  estimatedWeight: number
}

export interface ImportResult {
  success: boolean
  data?: ProductAnalysis
  error?: string
  warning?: string
}

export class ProductScraperService {
  private amazonService?: AmazonPaApiService
  private aliexpressService?: AliExpressApiService
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.initializeServices()
  }

  private initializeServices() {
    try {
      this.amazonService = AmazonPaApiService.fromEnv()
    } catch (error) {
      console.warn('Amazon PA-API not configured - will use fallback mode')
    }

    try {
      this.aliexpressService = AliExpressApiService.fromEnv()
    } catch (error) {
      console.warn('AliExpress API not configured - will use fallback mode')
    }
  }

  /**
   * Scrape AliExpress product data from URL
   */
  async scrapeAliExpressProduct(url: string): Promise<ScrapedAliExpressData> {
    const cacheKey = `ali:${url}`
    const cached = this.getFromCache<ScrapedAliExpressData>(cacheKey)
    if (cached) {
      return cached
    }

    // Try API first if available
    if (this.aliexpressService) {
      try {
        const product = await this.aliexpressService.getProductByUrl(url)
        const result: ScrapedAliExpressData = {
          ...product,
          scrapedAt: new Date().toISOString(),
          source: 'aliexpress_api',
        }
        this.addToCache(cacheKey, result)
        return result
      } catch (error) {
        console.warn('AliExpress API failed, falling back to manual extraction:', error)
      }
    }

    // Fallback: Extract what we can from the URL/page structure
    const fallbackData = await this.extractAliExpressDataFallback(url)
    this.addToCache(cacheKey, fallbackData)
    return fallbackData
  }

  /**
   * Find matching Amazon product by ASIN or search terms
   */
  async findMatchingAmazonProduct(identifier: string): Promise<ScrapedAmazonData> {
    const cacheKey = `amz:${identifier}`
    const cached = this.getFromCache<ScrapedAmazonData>(cacheKey)
    if (cached) {
      return cached
    }

    // Try API first if available
    if (this.amazonService) {
      try {
        // Check if identifier is an ASIN
        if (this.amazonService.validateAsin(identifier)) {
          const product = await this.amazonService.getProductByAsin(identifier)
          const result: ScrapedAmazonData = {
            ...product,
            scrapedAt: new Date().toISOString(),
            source: 'amazon_api',
          }
          this.addToCache(cacheKey, result)
          return result
        }
      } catch (error) {
        console.warn('Amazon API failed, falling back to manual extraction:', error)
      }
    }

    // Fallback: Return minimal data structure
    const fallbackData: ScrapedAmazonData = {
      asin: identifier,
      title: 'Product (API not configured)',
      scrapedAt: new Date().toISOString(),
      source: 'manual',
    }
    this.addToCache(cacheKey, fallbackData)
    return fallbackData
  }

  /**
   * Analyze product for arbitrage opportunity
   */
  async analyzeProduct(
    aliexpress: ScrapedAliExpressData,
    amazon: ScrapedAmazonData
  ): Promise<ProductAnalysis> {
    // Estimate shipping to Amazon (per unit)
    const estimatedShipping = aliexpress.shipping?.freeShipping ? 0 : (aliexpress.shipping?.cost || 2.00)
    
    // Use aliexpress price as product cost
    const productCost = aliexpress.price?.min || 0
    
    // Amazon selling price
    const amazonPrice = amazon.price?.amount ? amazon.price.amount / 100 : 0 // PA-API returns cents
    
    // Estimate dimensions (small standard tier by default)
    const estimatedDimensions = this.estimateDimensions(aliexpress)
    
    // Calculate margin
    const marginInput = {
      productCost,
      shippingToAmazon: estimatedShipping,
      amazonPrice,
      length: estimatedDimensions.length,
      width: estimatedDimensions.width,
      height: estimatedDimensions.height,
      weight: estimatedDimensions.weight,
      category: 'other' as const,
    }

    const marginCalculation = calculateMargin(marginInput)
    const profitabilityScore = calculateProfitabilityScore(marginCalculation)
    const recommendation = getRecommendation(marginCalculation)
    const sizeTier = getFbaSizeTier(
      estimatedDimensions.length,
      estimatedDimensions.width,
      estimatedDimensions.height,
      estimatedDimensions.weight
    )

    return {
      aliexpress,
      amazon,
      marginCalculation,
      profitabilityScore,
      recommendation,
      sizeTier,
      estimatedWeight: estimatedDimensions.weight,
    }
  }

  /**
   * Import product from AliExpress URL with full analysis
   */
  async importFromAliExpressUrl(
    aliexpressUrl: string,
    amazonAsin?: string
  ): Promise<ImportResult> {
    try {
      // Scrape AliExpress data
      const aliexpressData = await this.scrapeAliExpressProduct(aliexpressUrl)
      
      // Find or use provided Amazon product
      const amazonData = amazonAsin 
        ? await this.findMatchingAmazonProduct(amazonAsin)
        : await this.searchMatchingAmazonProduct(aliexpressData.title)

      // Analyze for arbitrage
      const analysis = await this.analyzeProduct(aliexpressData, amazonData)

      return {
        success: true,
        data: analysis,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import product',
      }
    }
  }

  /**
   * Search for matching Amazon product by title
   */
  private async searchMatchingAmazonProduct(title: string): Promise<ScrapedAmazonData> {
    // For now, return a placeholder
    // In production, this would use Amazon search API
    return {
      asin: 'PENDING',
      title: title,
      scrapedAt: new Date().toISOString(),
      source: 'manual',
    }
  }

  /**
   * Fallback AliExpress data extraction when API unavailable
   */
  private async extractAliExpressDataFallback(url: string): Promise<ScrapedAliExpressData> {
    // Extract product ID from URL
    const productId = this.extractProductIdFromUrl(url)
    
    return {
      productId: productId || 0,
      title: 'Product (API not configured)',
      categoryId: 0,
      categoryName: 'Unknown',
      productUrl: url,
      imageUrl: '',
      price: {
        min: 0,
        max: 0,
        currency: 'USD',
      },
      shipping: {
        cost: 0,
        freeShipping: false,
      },
      supplier: {
        sellerId: 0,
        sellerName: 'Unknown',
        storeUrl: '',
      },
      moq: 1,
      scrapedAt: new Date().toISOString(),
      source: 'url_scrape',
    }
  }

  private extractProductIdFromUrl(url: string): number | null {
    const patterns = [
      /item\/(\d+)\.html/,
      /product\/(\d+)\.html/,
      /\?productId=(\d+)/,
      /\/(\d{8,})\.html/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        const id = parseInt(match[1], 10)
        if (!isNaN(id)) {
          return id
        }
      }
    }

    return null
  }

  /**
   * Estimate package dimensions based on product info
   */
  private estimateDimensions(product: AliExpressProduct): {
    length: number
    width: number
    height: number
    weight: number
  } {
    // Default small standard tier dimensions
    // Most arbitrage products are small items
    return {
      length: 8,
      width: 6,
      height: 2,
      weight: 0.5, // 8 oz
    }
  }

  /**
   * Cache helpers
   */
  private getFromCache<T extends ScrapedAliExpressData | ScrapedAmazonData>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clearCache(): void {
    this.cache.clear()
  }
}

// Singleton instance
let scraperInstance: ProductScraperService | null = null

export function getProductScraper(): ProductScraperService {
  if (!scraperInstance) {
    scraperInstance = new ProductScraperService()
  }
  return scraperInstance
}

// Convenience function for direct imports
export async function importProduct(
  aliexpressUrl: string,
  amazonAsin?: string
): Promise<ImportResult> {
  const scraper = getProductScraper()
  return scraper.importFromAliExpressUrl(aliexpressUrl, amazonAsin)
}
