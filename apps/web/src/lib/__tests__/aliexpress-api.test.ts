import { AliExpressApiService, type AliExpressApiConfig, type SearchParams } from '../aliexpress-api';

const mockConfig: AliExpressApiConfig = {
  apiKey: 'test_api_key',
  appSignature: 'test_app_signature',
  partnerId: 'test_partner_id',
};

describe('AliExpressApiService', () => {
  describe('constructor', () => {
    it('should create service with valid config', () => {
      const service = new AliExpressApiService(mockConfig);
      expect(service).toBeInstanceOf(AliExpressApiService);
    });
  });

  describe('fromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should create service from environment variables', () => {
      process.env.ALIEXPRESS_API_KEY = 'env_api_key';
      process.env.ALIEXPRESS_APP_SIGNATURE = 'env_signature';
      process.env.ALIEXPRESS_PARTNER_ID = 'env_partner_id';

      const service = AliExpressApiService.fromEnv();
      expect(service).toBeInstanceOf(AliExpressApiService);
    });

    it('should throw error if ALIEXPRESS_API_KEY is missing', () => {
      process.env.ALIEXPRESS_API_KEY = undefined;
      process.env.ALIEXPRESS_APP_SIGNATURE = 'signature';
      process.env.ALIEXPRESS_PARTNER_ID = 'partner_id';

      expect(() => AliExpressApiService.fromEnv()).toThrow(
        'Missing required AliExpress API environment variables'
      );
    });

    it('should throw error if ALIEXPRESS_APP_SIGNATURE is missing', () => {
      process.env.ALIEXPRESS_API_KEY = 'key';
      process.env.ALIEXPRESS_APP_SIGNATURE = undefined;
      process.env.ALIEXPRESS_PARTNER_ID = 'partner_id';

      expect(() => AliExpressApiService.fromEnv()).toThrow(
        'Missing required AliExpress API environment variables'
      );
    });

    it('should throw error if ALIEXPRESS_PARTNER_ID is missing', () => {
      process.env.ALIEXPRESS_API_KEY = 'key';
      process.env.ALIEXPRESS_APP_SIGNATURE = 'signature';
      process.env.ALIEXPRESS_PARTNER_ID = undefined;

      expect(() => AliExpressApiService.fromEnv()).toThrow(
        'Missing required AliExpress API environment variables'
      );
    });
  });

  describe('extractProductIdFromUrl', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should extract product ID from item URL format', () => {
      const url = 'https://www.aliexpress.com/item/1005004123456789.html';
      const privateMethod = (service as any).extractProductIdFromUrl.bind(service);
      expect(privateMethod(url)).toBe(1005004123456789);
    });

    it('should extract product ID from product URL format', () => {
      const url = 'https://www.aliexpress.com/product/1005004123456789.html';
      const privateMethod = (service as any).extractProductIdFromUrl.bind(service);
      expect(privateMethod(url)).toBe(1005004123456789);
    });

    it('should extract product ID from URL with query params (first ID found)', () => {
      const url = 'https://www.aliexpress.com/item/4000123456789.html?productId=1005004123456789';
      const privateMethod = (service as any).extractProductIdFromUrl.bind(service);
      expect(privateMethod(url)).toBe(4000123456789);
    });

    it('should extract product ID from short format', () => {
      const url = 'https://www.aliexpress.com/1005004123456789.html';
      const privateMethod = (service as any).extractProductIdFromUrl.bind(service);
      expect(privateMethod(url)).toBe(1005004123456789);
    });

    it('should return null for invalid URL', () => {
      const url = 'https://www.aliexpress.com/invalid-url';
      const privateMethod = (service as any).extractProductIdFromUrl.bind(service);
      expect(privateMethod(url)).toBeNull();
    });

    it('should return null for non-AliExpress URL', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const privateMethod = (service as any).extractProductIdFromUrl.bind(service);
      expect(privateMethod(url)).toBeNull();
    });
  });

  describe('mapSortParam', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should map relevance to default', () => {
      const privateMethod = (service as any).mapSortParam.bind(service);
      expect(privateMethod('relevance')).toBe('default');
    });

    it('should map price_asc correctly', () => {
      const privateMethod = (service as any).mapSortParam.bind(service);
      expect(privateMethod('price_asc')).toBe('price_asc');
    });

    it('should map price_desc correctly', () => {
      const privateMethod = (service as any).mapSortParam.bind(service);
      expect(privateMethod('price_desc')).toBe('price_desc');
    });

    it('should map orders correctly', () => {
      const privateMethod = (service as any).mapSortParam.bind(service);
      expect(privateMethod('orders')).toBe('orders');
    });

    it('should map newest correctly', () => {
      const privateMethod = (service as any).mapSortParam.bind(service);
      expect(privateMethod('newest')).toBe('newest');
    });

    it('should default to unknown sort types', () => {
      const privateMethod = (service as any).mapSortParam.bind(service);
      expect(privateMethod('unknown')).toBe('default');
    });
  });

  describe('generateSignature', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should generate MD5 signature', () => {
      const privateMethod = (service as any).generateSignature.bind(service);
      const params = {
        app_key: 'test_key',
        method: 'test.method',
        timestamp: '2026-08-07T00:00:00Z',
      };
      const signature = privateMethod(params);
      expect(signature).toBeDefined();
      expect(signature).toHaveLength(32);
      expect(signature).toMatch(/^[A-F0-9]+$/);
    });

    it('should generate consistent signatures for same input', () => {
      const privateMethod = (service as any).generateSignature.bind(service);
      const params = {
        app_key: 'test_key',
        method: 'test.method',
      };
      const sig1 = privateMethod(params);
      const sig2 = privateMethod(params);
      expect(sig1).toBe(sig2);
    });
  });

  describe('rateLimit', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should track last request time', async () => {
      const privateMethod = (service as any).rateLimit.bind(service);
      
      expect((service as any).lastRequestTime).toBe(0);
      
      await privateMethod();
      
      expect((service as any).lastRequestTime).toBeGreaterThan(0);
    });
  });

  describe('parseSearchResponse', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should parse valid search response', () => {
      const mockResponse = {
        aliexpress_solution_product_search_response: {
          products: [
            {
              product_id: 1005004123456789,
              title: 'Test Product',
              price: { min: 10.00, max: 20.00, currency: 'USD' },
            },
          ],
          total_results: 100,
          current_page: 1,
        },
      };

      const privateMethod = (service as any).parseSearchResponse.bind(service);
      const result = privateMethod(mockResponse);

      expect(result.products).toHaveLength(1);
      expect(result.totalResults).toBe(100);
      expect(result.currentPage).toBe(1);
    });

    it('should handle empty product list', () => {
      const mockResponse = {
        aliexpress_solution_product_search_response: {
          products: [],
          total_results: 0,
          current_page: 1,
        },
      };

      const privateMethod = (service as any).parseSearchResponse.bind(service);
      const result = privateMethod(mockResponse);

      expect(result.products).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    it('should handle missing response data', () => {
      const mockResponse = {};

      const privateMethod = (service as any).parseSearchResponse.bind(service);
      const result = privateMethod(mockResponse);

      expect(result.products).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('searchProducts', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should search with basic params', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          aliexpress_solution_product_search_response: {
            products: [],
            total_results: 0,
            current_page: 1,
          },
        }),
      });

      global.fetch = mockFetch as any;

      const params: SearchParams = {
        query: 'wireless earbuds',
        page: 1,
        pageSize: 20,
      };

      await service.searchProducts(params);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('router/rest'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error on API failure', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      global.fetch = mockFetch as any;

      await expect(
        service.searchProducts({ query: 'test' })
      ).rejects.toThrow('AliExpress API request failed: 500');
    });
  });

  describe('getProductById', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should fetch product by ID', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          aliexpress_solution_product_detail_get_response: {
            product_id: 1005004123456789,
            product_title: 'Test Product',
            min_price: '10.00',
            max_price: '20.00',
            currency: 'USD',
          },
        }),
      });

      global.fetch = mockFetch as any;

      const product = await service.getProductById(1005004123456789);

      expect(mockFetch).toHaveBeenCalled();
      expect(product.productId).toBe(1005004123456789);
      expect(product.title).toBe('Test Product');
    });

    it('should throw error on API failure', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Product Not Found',
      });

      global.fetch = mockFetch as any;

      await expect(
        service.getProductById(999999999)
      ).rejects.toThrow('AliExpress API request failed: 404');
    });
  });

  describe('getProductByUrl', () => {
    let service: AliExpressApiService;

    beforeEach(() => {
      service = new AliExpressApiService(mockConfig);
    });

    it('should fetch product by URL', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          aliexpress_solution_product_detail_get_response: {
            product: {
              product_id: 1005004123456789,
              title: 'Test Product',
            },
          },
        }),
      });

      global.fetch = mockFetch as any;

      const url = 'https://www.aliexpress.com/item/1005004123456789.html';
      await service.getProductByUrl(url);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw error on invalid URL', async () => {
      const url = 'https://www.aliexpress.com/invalid';
      
      await expect(
        service.getProductByUrl(url)
      ).rejects.toThrow('Invalid AliExpress product URL');
    });
  });
});
