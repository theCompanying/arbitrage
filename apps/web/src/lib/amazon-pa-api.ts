import { createHash, createHmac } from 'crypto'

export interface AmazonPaApiConfig {
  accessKey: string
  secretKey: string
  tag: string
  region: string
}

export interface ProductData {
  asin: string
  title: string
  brand?: string
  mainImage?: string
  images?: string[]
  price?: {
    amount: number
    currency: string
    displayAmount: string
  }
  listPrice?: {
    amount: number
    currency: string
    displayAmount: string
  }
  availability?: string
  isPrimeEligible?: boolean
  rating?: number
  ratingsTotal?: number
  reviewsTotal?: number
  featureBullets?: string[]
  description?: string
  category?: string
  salesRank?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    weight?: number
    unit: string
  }
}

interface PaApiRequestParams {
  Operation: string
  AWSAccessKeyId: string
  AssociateTag: string
  SignatureMethod: string
  SignatureVersion: string
  Timestamp: string
  Version: string
  [key: string]: string
}

export class AmazonPaApiService {
  private config: AmazonPaApiConfig
  private lastRequestTime: number = 0
  private readonly REQUEST_INTERVAL_MS = 1000

  private readonly HOST_MAP: Record<string, string> = {
    'us-east-1': 'webservices.amazon.com',
    'us-west-2': 'webservices.amazon.com',
    'eu-west-1': 'webservices.amazon.co.uk',
    'eu-west-2': 'webservices.amazon.co.uk',
    'ap-northeast-1': 'webservices.amazon.co.jp',
    'ap-south-1': 'webservices.amazon.in',
  }

  constructor(config: AmazonPaApiConfig) {
    this.config = config
  }

  static fromEnv(): AmazonPaApiService {
    const accessKey = process.env.AMAZON_PA_API_ACCESS_KEY
    const secretKey = process.env.AMAZON_PA_API_SECRET_KEY
    const tag = process.env.AMAZON_PA_API_TAG
    const region = process.env.AMAZON_PA_API_REGION || 'us-east-1'

    if (!accessKey || !secretKey || !tag) {
      throw new Error(
        'Missing required Amazon PA-API environment variables. ' +
        'Required: AMAZON_PA_API_ACCESS_KEY, AMAZON_PA_API_SECRET_KEY, AMAZON_PA_API_TAG'
      )
    }

    return new AmazonPaApiService({
      accessKey,
      secretKey,
      tag,
      region,
    })
  }

  validateAsin(asin: string): boolean {
    if (!asin || typeof asin !== 'string') {
      return false
    }

    const normalized = asin.trim().toUpperCase()

    if (normalized.length !== 10) {
      return false
    }

    const asinRegex = /^[A-Z0-9]{10}$/
    if (!asinRegex.test(normalized)) {
      return false
    }

    return this.validateAsinCheckDigit(normalized)
  }

  private validateAsinCheckDigit(asin: string): boolean {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let sum = 0
    let multiplier = 10

    for (let i = 0; i < 9; i++) {
      const char = asin[i]
      const value = chars.indexOf(char)
      if (value === -1) {
        return false
      }
      sum += value * multiplier
      multiplier--
    }

    const remainder = sum % 11
    const expectedCheckDigit = remainder === 0 ? '0' : (11 - remainder).toString()
    
    if (expectedCheckDigit === '10') {
      return asin[9] === 'X'
    }

    return asin[9] === expectedCheckDigit
  }

  async getProductByAsin(asin: string): Promise<ProductData> {
    if (!this.validateAsin(asin)) {
      throw new Error(`Invalid ASIN format: ${asin}`)
    }

    await this.rateLimit()

    const normalizedAsin = asin.trim().toUpperCase()
    const params: PaApiRequestParams = {
      Operation: 'GetItems',
      AWSAccessKeyId: this.config.accessKey,
      AssociateTag: this.config.tag,
      SignatureMethod: 'HmacSHA256',
      SignatureVersion: '2',
      Timestamp: new Date().toISOString(),
      Version: '2013-08-01',
      ItemId: normalizedAsin,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Brand',
        'ItemInfo.Classifications',
        'Images.Primary.Medium',
        'Images.Variants.Medium',
        'Offers.Listings.Price',
        'Offers.Listings.ListPrice',
        'Offers.Listings.Availability.Message',
        'Offers.Listings.PrimeInformation.IsPrime',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count',
        'FeatureBullets',
        'ItemInfo.Description',
        'ItemInfo.ProductInfo.Dimensions',
        'Ranks.SalesRank',
      ].join(','),
      Marketplace: 'www.amazon.com',
      Condition: 'New',
    }

    const host = this.HOST_MAP[this.config.region] || 'webservices.amazon.com'
    const endpoint = '/paapi5/searchitems'

    const signature = this.generateSignature(params, host)
    const requestBody = JSON.stringify({
      Keywords: normalizedAsin,
      SearchIndex: 'All',
      ItemCount: 1,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Brand',
        'ItemInfo.Classifications',
        'Images.Primary.Medium',
        'Images.Variants.Medium',
        'Offers.Listings.Price',
        'Offers.Listings.ListPrice',
        'Offers.Listings.Availability.Message',
        'Offers.Listings.PrimeInformation.IsPrime',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count',
        'FeatureBullets',
        'ItemInfo.Description',
        'ItemInfo.ProductInfo.Dimensions',
        'Ranks.SalesRank',
      ],
      Marketplace: 'www.amazon.com',
      Condition: 'New',
    })

    const response = await fetch(`https://${host}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': host,
        'x-amz-target': 'com.amazon.paapi5.v1.SearchItemsService.SearchItems',
      },
      body: requestBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Amazon PA-API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return this.parseProductResponse(data, normalizedAsin)
  }

  private generateSignature(params: PaApiRequestParams, host: string): string {
    const sortedKeys = Object.keys(params).sort()
    
    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')

    const stringToSign = [
      'POST',
      host,
      '/paapi5/searchitems',
      queryString,
    ].join('\n')

    const hmac = createHmac('sha256', this.config.secretKey)
    hmac.update(stringToSign)
    return hmac.digest('base64')
  }

  private parseProductResponse(data: any, asin: string): ProductData {
    const itemsResult = data.ItemsResult?.Items || []
    const item = itemsResult[0] || {}

    const priceInfo = item.Offers?.Summary?.LowestPrice || item.Offers?.Listings?.[0]?.Price
    const listPriceInfo = item.Offers?.Listings?.[0]?.ListPrice

    const dimensions = item.ItemInfo?.ProductInfo?.Dimensions
    let parsedDimensions: ProductData['dimensions']

    if (dimensions) {
      parsedDimensions = {
        unit: dimensions.Unit || 'inches',
      }
      
      if (dimensions.Length) {
        parsedDimensions.length = dimensions.Length.DisplayUnits?.Value || dimensions.Length.Value
      }
      if (dimensions.Width) {
        parsedDimensions.width = dimensions.Width.DisplayUnits?.Value || dimensions.Width.Value
      }
      if (dimensions.Height) {
        parsedDimensions.height = dimensions.Height.DisplayUnits?.Value || dimensions.Height.Value
      }
      if (dimensions.Weight) {
        parsedDimensions.weight = dimensions.Weight.DisplayUnits?.Value || dimensions.Weight.Value
      }
    }

    return {
      asin,
      title: item.ItemInfo?.Title?.DisplayValue || item.ItemInfo?.Title?.Label || '',
      brand: item.ItemInfo?.Brand?.DisplayValue,
      mainImage: item.Images?.Primary?.Medium?.URL,
      images: item.Images?.Variants?.Medium?.map((img: any) => img.URL),
      price: priceInfo ? {
        amount: priceInfo.Amount || 0,
        currency: priceInfo.Currency || 'USD',
        displayAmount: priceInfo.DisplayAmount || `$${(priceInfo.Amount || 0) / 100}`,
      } : undefined,
      listPrice: listPriceInfo ? {
        amount: listPriceInfo.Amount || 0,
        currency: listPriceInfo.Currency || 'USD',
        displayAmount: listPriceInfo.DisplayAmount || `$${(listPriceInfo.Amount || 0) / 100}`,
      } : undefined,
      availability: item.Offers?.Listings?.[0]?.Availability?.Message,
      isPrimeEligible: item.Offers?.Listings?.[0]?.PrimeInformation?.IsPrime,
      rating: item.CustomerReviews?.StarRating,
      ratingsTotal: item.CustomerReviews?.Count,
      reviewsTotal: item.CustomerReviews?.Count,
      featureBullets: item.FeatureBullets?.map((bullet: any) => bullet.DisplayValue),
      description: item.ItemInfo?.Description?.DisplayValue,
      category: item.ItemInfo?.Classifications?.Binding?.DisplayValue,
      salesRank: item.Ranks?.SalesRank?.[0]?.Rank,
      dimensions: parsedDimensions,
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.REQUEST_INTERVAL_MS) {
      const waitTime = this.REQUEST_INTERVAL_MS - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }

  async getProductsByAsins(asins: string[]): Promise<ProductData[]> {
    const results: ProductData[] = []

    for (const asin of asins) {
      try {
        const product = await this.getProductByAsin(asin)
        results.push(product)
      } catch (error) {
        console.error(`Failed to fetch product ${asin}:`, error)
        results.push({
          asin,
          title: '',
          error: (error as Error).message,
        } as any)
      }
    }

    return results
  }
}
