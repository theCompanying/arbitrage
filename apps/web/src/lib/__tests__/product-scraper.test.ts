import { ProductScraperService, type ImportResult, type ProductAnalysis } from '../product-scraper';

describe('ProductScraperService', () => {
  let scraper: ProductScraperService;

  beforeEach(() => {
    scraper = new ProductScraperService();
  });

  describe('constructor', () => {
    it('should initialize without errors when APIs not configured', () => {
      expect(scraper).toBeInstanceOf(ProductScraperService);
    });
  });

  describe('cache management', () => {
    it('should have cache TTL of 5 minutes', () => {
      const scraper = new ProductScraperService();
      const cacheTtl = (scraper as any).CACHE_TTL_MS;
      expect(cacheTtl).toBe(5 * 60 * 1000);
    });
  });

  describe('analyzeProduct', () => {
    const mockAliExpressData = {
      productId: 1005004123456789,
      title: 'Test Product',
      categoryId: 1,
      categoryName: 'Electronics',
      productUrl: 'https://aliexpress.com/item/123.html',
      imageUrl: 'https://example.com/image.jpg',
      price: {
        min: 5.00,
        max: 10.00,
        currency: 'USD',
      },
      shipping: {
        cost: 2.00,
        freeShipping: false,
      },
      supplier: {
        sellerId: 123,
        sellerName: 'Test Seller',
        storeUrl: 'https://store.aliexpress.com/123',
      },
      moq: 1,
      scrapedAt: '2026-08-07T00:00:00Z',
      source: 'aliexpress_api' as const,
    };

    const mockAmazonData = {
      asin: 'B08N5WRWNW',
      title: 'Test Product on Amazon',
      price: {
        amount: 2500, // $25.00 in cents
        currency: 'USD',
      },
      scrapedAt: '2026-08-07T00:00:00Z',
      source: 'amazon_api' as const,
    };

    it('should analyze product for arbitrage opportunity', async () => {
      const analysis = await scraper.analyzeProduct(
        mockAliExpressData as any,
        mockAmazonData as any
      );

      expect(analysis).toBeDefined();
      expect(analysis.aliexpress).toEqual(mockAliExpressData);
      expect(analysis.amazon).toEqual(mockAmazonData);
      expect(analysis.marginCalculation).toBeDefined();
      expect(analysis.profitabilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.recommendation).toBeDefined();
      expect(['GO', 'MAYBE', 'NO_GO']).toContain(analysis.recommendation.verdict);
    });

    it('should handle free shipping correctly', async () => {
      const freeShippingData = {
        ...mockAliExpressData,
        shipping: {
          cost: 0,
          freeShipping: true,
        },
      };

      const analysis = await scraper.analyzeProduct(
        freeShippingData as any,
        mockAmazonData as any
      );

      expect(analysis.marginCalculation.netMarginPercent).toBeGreaterThan(
        mockAliExpressData.shipping.freeShipping 
          ? mockAliExpressData.shipping.cost 
          : 0
      );
    });

    it('should calculate size tier', async () => {
      const analysis = await scraper.analyzeProduct(
        mockAliExpressData as any,
        mockAmazonData as any
      );

      expect(analysis.sizeTier).toBeDefined();
      expect(typeof analysis.sizeTier).toBe('string');
    });
  });

  describe('importFromAliExpressUrl', () => {
    it('should handle invalid URL with fallback data', async () => {
      const result = await scraper.importFromAliExpressUrl('invalid-url');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return success with data for valid import', async () => {
      const url = 'https://www.aliexpress.com/item/1005004123456789.html';
      const asin = 'B08N5WRWNW';

      const result = await scraper.importFromAliExpressUrl(url, asin);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.aliexpress).toBeDefined();
      expect(result.data?.amazon).toBeDefined();
    });

    it('should search for matching Amazon product if ASIN not provided', async () => {
      const url = 'https://www.aliexpress.com/item/1005004123456789.html';

      const result = await scraper.importFromAliExpressUrl(url);

      expect(result.success).toBe(true);
      expect(result.data?.amazon.asin).toBe('PENDING');
    });
  });

  describe('searchMatchingAmazonProduct', () => {
    it('should return placeholder data when API not configured', async () => {
      const title = 'Wireless Earbuds';
      const privateMethod = (scraper as any).searchMatchingAmazonProduct.bind(scraper);
      
      const result = await privateMethod(title);

      expect(result.asin).toBe('PENDING');
      expect(result.title).toBe(title);
      expect(result.source).toBe('manual');
    });
  });

  describe('extractAliExpressDataFallback', () => {
    it('should extract product ID from URL', async () => {
      const url = 'https://www.aliexpress.com/item/1005004123456789.html';
      const privateMethod = (scraper as any).extractAliExpressDataFallback.bind(scraper);
      
      const result = await privateMethod(url);

      expect(result.productId).toBe(1005004123456789);
      expect(['manual', 'url_scrape']).toContain(result.source);
      expect(result.scrapedAt).toBeDefined();
    });

    it('should handle URLs without product ID', async () => {
      const url = 'https://www.aliexpress.com/invalid';
      const privateMethod = (scraper as any).extractAliExpressDataFallback.bind(scraper);
      
      const result = await privateMethod(url);

      expect(result.productId).toBe(0);
    });

    it('should set default values for missing data', async () => {
      const url = 'https://www.aliexpress.com/item/1005004123456789.html';
      const privateMethod = (scraper as any).extractAliExpressDataFallback.bind(scraper);
      
      const result = await privateMethod(url);

      expect(result.title).toBe('Product (API not configured)');
      expect(result.price.min).toBe(0);
      expect(result.price.max).toBe(0);
      expect(result.shipping.cost).toBe(0);
    });
  });

  describe('extractProductIdFromUrl', () => {
    it('should extract ID from item URL format', () => {
      const url = 'https://www.aliexpress.com/item/1005004123456789.html';
      const privateMethod = (scraper as any).extractProductIdFromUrl.bind(scraper);
      
      expect(privateMethod(url)).toBe(1005004123456789);
    });

    it('should extract ID from product URL format', () => {
      const url = 'https://www.aliexpress.com/product/1005004123456789.html';
      const privateMethod = (scraper as any).extractProductIdFromUrl.bind(scraper);
      
      expect(privateMethod(url)).toBe(1005004123456789);
    });

    it('should return null for invalid URL', () => {
      const url = 'https://www.aliexpress.com/invalid';
      const privateMethod = (scraper as any).extractProductIdFromUrl.bind(scraper);
      
      expect(privateMethod(url)).toBeNull();
    });
  });

  describe('estimateDimensions', () => {
    it('should estimate dimensions based on product data', () => {
      const product = {
        title: 'Small Wireless Earbuds',
        price: { min: 5 },
      };
      const privateMethod = (scraper as any).estimateDimensions.bind(scraper);
      
      const result = privateMethod(product);

      expect(result.length).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.weight).toBeGreaterThan(0);
    });
  });

  describe('getFromCache and addToCache', () => {
    it('should cache and retrieve data', () => {
      const key = 'test:key';
      const data = { test: 'data' };
      
      (scraper as any).addToCache(key, data);
      const retrieved = (scraper as any).getFromCache(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for expired cache', () => {
      const key = 'test:expired';
      const data = { test: 'data' };
      
      (scraper as any).addToCache(key, data);
      
      // Manually expire the cache
      const cache = (scraper as any).cache;
      const cached = cache.get(key);
      if (cached) {
        cached.timestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      }
      
      const retrieved = (scraper as any).getFromCache(key);
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent key', () => {
      const retrieved = (scraper as any).getFromCache('nonexistent:key');
      expect(retrieved).toBeNull();
    });
  });
});

describe('ImportResult type', () => {
  it('should support success result with data', () => {
    const result: ImportResult = {
      success: true,
      data: {
        aliexpress: {} as any,
        amazon: {} as any,
        marginCalculation: {} as any,
        profitabilityScore: 75,
        recommendation: {
          verdict: 'GO',
          reason: 'Good margin',
        },
        sizeTier: 'small_standard',
        estimatedWeight: 0.5,
      },
    };

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should support error result', () => {
    const result: ImportResult = {
      success: false,
      error: 'Failed to fetch product',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch product');
  });

  it('should support warning result', () => {
    const result: ImportResult = {
      success: true,
      data: {} as any,
      warning: 'Low margin product',
    };

    expect(result.success).toBe(true);
    expect(result.warning).toBe('Low margin product');
  });
});
