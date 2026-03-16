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

  private parseProductResponse(data: unknown, asin: string): ProductData {
    const responseData = data as Record<string, unknown>
    const itemsResult = (responseData.ItemsResult as Record<string, unknown>)?.Items as unknown[] || []
    const item = (itemsResult[0] as Record<string, unknown>) || {}

    const offers = item.Offers as Record<string, unknown> | undefined
    const itemInfo = item.ItemInfo as Record<string, unknown> | undefined
    const images = item.Images as Record<string, unknown> | undefined
    const customerReviews = item.CustomerReviews as Record<string, unknown> | undefined
    const featureBullets = item.FeatureBullets as unknown[] | undefined
    const ranks = item.Ranks as unknown[] | undefined

    const summary = offers?.Summary as Record<string, unknown> | undefined
    const listings = (offers?.Listings as unknown[])?.[0] as Record<string, unknown> | undefined
    
    const priceInfo = summary?.LowestPrice as Record<string, unknown> | undefined || listings?.Price as Record<string, unknown> | undefined
    const listPriceInfo = listings?.ListPrice as Record<string, unknown> | undefined

    const productInfo = itemInfo?.ProductInfo as Record<string, unknown> | undefined
    const dimensions = productInfo?.Dimensions as Record<string, unknown> | undefined
    let parsedDimensions: ProductData['dimensions']

    if (dimensions) {
      parsedDimensions = {
        unit: (dimensions.Unit as string) || 'inches',
      }
      
      if (dimensions.Length) {
        const length = dimensions.Length as Record<string, unknown>
        parsedDimensions.length = (length.DisplayUnits as Record<string, unknown>)?.Value as string || length.Value as string
      }
      if (dimensions.Width) {
        const width = dimensions.Width as Record<string, unknown>
        parsedDimensions.width = (width.DisplayUnits as Record<string, unknown>)?.Value as string || width.Value as string
      }
      if (dimensions.Height) {
        const height = dimensions.Height as Record<string, unknown>
        parsedDimensions.height = (height.DisplayUnits as Record<string, unknown>)?.Value as string || height.Value as string
      }
      if (dimensions.Weight) {
        const weight = dimensions.Weight as Record<string, unknown>
        parsedDimensions.weight = (weight.DisplayUnits as Record<string, unknown>)?.Value as string || weight.Value as string
      }
    }

    const variants = (images?.Variants as Record<string, unknown>)?.Medium as unknown[] | undefined
    const bullets = featureBullets || []

    return {
      asin,
      title: (itemInfo?.Title as Record<string, unknown>)?.DisplayValue as string || (itemInfo?.Title as Record<string, unknown>)?.Label as string || '',
      brand: (itemInfo?.Brand as Record<string, unknown>)?.DisplayValue as string,
      mainImage: ((images?.Primary as Record<string, unknown>)?.Medium as Record<string, unknown>)?.URL as string,
      images: variants?.map((img: unknown) => (img as Record<string, unknown>).URL as string),
      price: priceInfo ? {
        amount: (priceInfo.Amount as number) || 0,
        currency: (priceInfo.Currency as string) || 'USD',
        displayAmount: (priceInfo.DisplayAmount as string) || `$${(priceInfo.Amount as number || 0) / 100}`,
      } : undefined,
      listPrice: listPriceInfo ? {
        amount: (listPriceInfo.Amount as number) || 0,
        currency: (listPriceInfo.Currency as string) || 'USD',
        displayAmount: (listPriceInfo.DisplayAmount as string) || `$${(listPriceInfo.Amount as number || 0) / 100}`,
      } : undefined,
      availability: (listings?.Availability as Record<string, unknown>)?.Message as string,
      isPrimeEligible: (listings?.PrimeInformation as Record<string, unknown>)?.IsPrime as boolean,
      rating: (customerReviews?.StarRating as number | undefined),
      ratingsTotal: (customerReviews?.Count as number | undefined),
      reviewsTotal: (customerReviews?.Count as number | undefined),
      featureBullets: bullets.map((bullet: unknown) => (bullet as Record<string, unknown>).DisplayValue as string),
      description: (itemInfo?.Description as Record<string, unknown>)?.DisplayValue as string,
      category: ((itemInfo?.Classifications as Record<string, unknown>)?.Binding as Record<string, unknown>)?.DisplayValue as string,
      salesRank: ((ranks?.[0] as Record<string, unknown>)?.Rank as number | undefined),
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
        } as ProductResult)
      }
    }

    return results
  }
}
