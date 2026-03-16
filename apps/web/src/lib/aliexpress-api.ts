import { createHmac } from 'crypto'

export interface AliExpressApiConfig {
  apiKey: string
  appSignature: string
  partnerId: string
}

export interface AliExpressProduct {
  productId: number
  title: string
  categoryId: number
  categoryName: string
  productUrl: string
  imageUrl: string
  images?: string[]
  price: {
    min: number
    max: number
    currency: string
    originalPrice?: number
    discountPercent?: number
  }
  shipping: {
    cost: number
    freeShipping: boolean
    estimatedDeliveryDays?: {
      min: number
      max: number
    }
    shippingFrom?: string
  }
  supplier: {
    sellerId: number
    sellerName: string
    storeUrl: string
    positiveRating?: number
    totalTransactions?: number
    yearsInBusiness?: number
  }
  orders?: number
  rating?: number
  reviews?: number
  moq: number // Minimum order quantity
  availableStock?: number
  variants?: ProductVariant[]
  description?: string
  specifications?: Record<string, string>
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  imageUrl?: string
}

export interface SearchParams {
  query?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  freeShipping?: boolean
  minOrder?: number
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'orders' | 'newest'
  page?: number
  pageSize?: number
}

export interface SearchResult {
  products: AliExpressProduct[]
  totalResults: number
  currentPage: number
  totalPages: number
}

export class AliExpressApiService {
  private config: AliExpressApiConfig
  private readonly BASE_URL = 'https://api-sg.aliexpress.com/sync'
  private lastRequestTime: number = 0
  private readonly REQUEST_INTERVAL_MS = 100

  constructor(config: AliExpressApiConfig) {
    this.config = config
  }

  static fromEnv(): AliExpressApiService {
    const apiKey = process.env.ALIEXPRESS_API_KEY
    const appSignature = process.env.ALIEXPRESS_APP_SIGNATURE
    const partnerId = process.env.ALIEXPRESS_PARTNER_ID

    if (!apiKey || !appSignature || !partnerId) {
      throw new Error(
        'Missing required AliExpress API environment variables. ' +
        'Required: ALIEXPRESS_API_KEY, ALIEXPRESS_APP_SIGNATURE, ALIEXPRESS_PARTNER_ID'
      )
    }

    return new AliExpressApiService({
      apiKey,
      appSignature,
      partnerId,
    })
  }

  async searchProducts(params: SearchParams): Promise<SearchResult> {
    await this.rateLimit()

    const {
      query = '',
      categoryId,
      minPrice,
      maxPrice,
      freeShipping,
      minOrder,
      sortBy = 'relevance',
      page = 1,
      pageSize = 20,
    } = params

    const appParams: Record<string, string> = {
      app_key: this.config.apiKey,
      method: 'aliexpress.solution.product.search',
      partner_id: this.config.partnerId,
      access_token: this.config.appSignature,
      _aop_params: JSON.stringify({
        keywords: query,
        category_id: categoryId,
        min_price: minPrice?.toString(),
        max_price: maxPrice?.toString(),
        free_shipping: freeShipping?.toString(),
        min_order: minOrder?.toString(),
        sort: this.mapSortParam(sortBy),
        page: page.toString(),
        page_size: pageSize.toString(),
      }),
      timestamp: new Date().toISOString(),
      sign_method: 'MD5',
    }

    appParams.sign = this.generateSignature(appParams)

    const response = await fetch(`${this.BASE_URL}/router/rest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(appParams),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AliExpress API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return this.parseSearchResponse(data)
  }

  async getProductById(productId: number): Promise<AliExpressProduct> {
    await this.rateLimit()

    const appParams: Record<string, string> = {
      app_key: this.config.apiKey,
      method: 'aliexpress.solution.product.detail.get',
      partner_id: this.config.partnerId,
      access_token: this.config.appSignature,
      _aop_params: JSON.stringify({
        product_id: productId.toString(),
      }),
      timestamp: new Date().toISOString(),
      sign_method: 'MD5',
    }

    appParams.sign = this.generateSignature(appParams)

    const response = await fetch(`${this.BASE_URL}/router/rest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(appParams),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AliExpress API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return this.parseProductResponse(data)
  }

  async getProductByUrl(productUrl: string): Promise<AliExpressProduct> {
    const productId = this.extractProductIdFromUrl(productUrl)
    if (!productId) {
      throw new Error(`Invalid AliExpress product URL: ${productUrl}`)
    }
    return this.getProductById(productId)
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

  private mapSortParam(sortBy: string): string {
    const sortMap: Record<string, string> = {
      relevance: 'default',
      price_asc: 'price_asc',
      price_desc: 'price_desc',
      orders: 'orders',
      newest: 'newest',
    }
    return sortMap[sortBy] || 'default'
  }

  private generateSignature(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort()
    const queryString = sortedKeys.map(key => `${key}${params[key]}`).join('')
    const signature = this.config.appSignature + queryString + this.config.appSignature

    const hmac = createHmac('md5', this.config.appSignature)
    hmac.update(signature)
    return hmac.digest('hex').toUpperCase()
  }

  private parseSearchResponse(data: unknown): SearchResult {
    const responseData = data as Record<string, unknown>
    const searchResponse = responseData?.aliexpress_solution_product_search_response as Record<string, unknown> || {}
    const productList = (searchResponse?.products as unknown[]) || []

    return {
      products: productList.map((item) => this.parseProductItem(item as Record<string, unknown>)),
      totalResults: (searchResponse?.total_results as number) || 0,
      currentPage: (searchResponse?.current_page as number) || 1,
      totalPages: (searchResponse?.total_pages as number) || 1,
    }
  }

  private parseProductResponse(data: unknown): AliExpressProduct {
    const responseData = data as Record<string, unknown>
    const product = (responseData?.aliexpress_solution_product_detail_get_response as Record<string, unknown>) || {}
    return this.parseProductItem(product)
  }

  private parseProductItem(item: Record<string, unknown>): AliExpressProduct {
    return {
      productId: item.product_id || 0,
      title: item.product_title || '',
      categoryId: item.category_id || 0,
      categoryName: item.category_name || '',
      productUrl: item.product_url || '',
      imageUrl: item.image_url || '',
      images: item.image_urls || [],
      price: {
        min: parseFloat(item.min_price) || 0,
        max: parseFloat(item.max_price) || 0,
        currency: item.currency || 'USD',
        originalPrice: parseFloat(item.original_price),
        discountPercent: parseFloat(item.discount_percent),
      },
      shipping: {
        cost: parseFloat(item.shipping_cost) || 0,
        freeShipping: item.free_shipping === true || item.free_shipping === 'true',
        estimatedDeliveryDays: item.delivery_time ? {
          min: item.delivery_time_min || 0,
          max: item.delivery_time_max || 0,
        } : undefined,
        shippingFrom: item.shipping_from,
      },
      supplier: {
        sellerId: item.seller_id || 0,
        sellerName: item.seller_name || '',
        storeUrl: item.store_url || '',
        positiveRating: parseFloat(item.positive_rating),
        totalTransactions: item.total_transactions,
        yearsInBusiness: item.years_in_business,
      },
      orders: item.orders || 0,
      rating: parseFloat(item.rating),
      reviews: item.reviews || 0,
      moq: item.moq || 1,
      availableStock: item.available_stock,
      variants: (item.variants as unknown[])?.map((v: Record<string, unknown>) => ({
        id: v.variant_id as string,
        name: v.variant_name as string,
        price: parseFloat(v.price as string),
        stock: v.stock as number,
        imageUrl: v.image_url as string,
      })),
      description: item.description,
      specifications: item.specifications,
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

  async searchByImage(imageUrl: string, params?: Omit<SearchParams, 'query'>): Promise<SearchResult> {
    await this.rateLimit()

    const appParams: Record<string, string> = {
      app_key: this.config.apiKey,
      method: 'aliexpress.solution.product.search.by.image',
      partner_id: this.config.partnerId,
      access_token: this.config.appSignature,
      _aop_params: JSON.stringify({
        image_url: imageUrl,
        ...params,
      }),
      timestamp: new Date().toISOString(),
      sign_method: 'MD5',
    }

    appParams.sign = this.generateSignature(appParams)

    const response = await fetch(`${this.BASE_URL}/router/rest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(appParams),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AliExpress image search failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return this.parseSearchResponse(data)
  }

  async getSupplierInfo(sellerId: number): Promise<{
    sellerId: number
    sellerName: string
    storeUrl: string
    positiveRating: number
    totalTransactions: number
    yearsInBusiness: number
    topProducts: AliExpressProduct[]
  }> {
    await this.rateLimit()

    const appParams: Record<string, string> = {
      app_key: this.config.apiKey,
      method: 'aliexpress.solution.seller.info.get',
      partner_id: this.config.partnerId,
      access_token: this.config.appSignature,
      _aop_params: JSON.stringify({
        seller_id: sellerId.toString(),
      }),
      timestamp: new Date().toISOString(),
      sign_method: 'MD5',
    }

    appParams.sign = this.generateSignature(appParams)

    const response = await fetch(`${this.BASE_URL}/router/rest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(appParams),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AliExpress supplier info request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const sellerInfo = data?.aliexpress_solution_seller_info_get_response || {}

    return {
      sellerId: sellerInfo.seller_id || sellerId,
      sellerName: sellerInfo.seller_name || '',
      storeUrl: sellerInfo.store_url || '',
      positiveRating: parseFloat(sellerInfo.positive_rating) || 0,
      totalTransactions: sellerInfo.total_transactions || 0,
      yearsInBusiness: sellerInfo.years_in_business || 0,
      topProducts: sellerInfo.top_products?.map((p: unknown) => this.parseProductItem(p as Record<string, unknown>)) || [],
    }
  }
}
