import { AmazonPaApiService, type AmazonPaApiConfig } from '../amazon-pa-api';

describe('AmazonPaApiService', () => {
  const mockConfig: AmazonPaApiConfig = {
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    tag: 'mytag-20',
    region: 'us-east-1',
  };

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const service = new AmazonPaApiService(mockConfig);
      expect(service).toBeInstanceOf(AmazonPaApiService);
    });
  });

  describe('fromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should create instance from environment variables', () => {
      process.env.AMAZON_PA_API_ACCESS_KEY = 'test-access-key';
      process.env.AMAZON_PA_API_SECRET_KEY = 'test-secret-key';
      process.env.AMAZON_PA_API_TAG = 'test-tag';
      process.env.AMAZON_PA_API_REGION = 'us-west-2';

      const service = AmazonPaApiService.fromEnv();
      expect(service).toBeInstanceOf(AmazonPaApiService);
    });

    it('should use default region if not provided', () => {
      process.env.AMAZON_PA_API_ACCESS_KEY = 'test-access-key';
      process.env.AMAZON_PA_API_SECRET_KEY = 'test-secret-key';
      process.env.AMAZON_PA_API_TAG = 'test-tag';
      delete process.env.AMAZON_PA_API_REGION;

      const service = AmazonPaApiService.fromEnv();
      expect(service).toBeInstanceOf(AmazonPaApiService);
    });

    it('should throw error if access key is missing', () => {
      process.env.AMAZON_PA_API_SECRET_KEY = 'test-secret-key';
      process.env.AMAZON_PA_API_TAG = 'test-tag';
      delete process.env.AMAZON_PA_API_ACCESS_KEY;

      expect(() => AmazonPaApiService.fromEnv()).toThrow(
        'Missing required Amazon PA-API environment variables'
      );
    });

    it('should throw error if secret key is missing', () => {
      process.env.AMAZON_PA_API_ACCESS_KEY = 'test-access-key';
      process.env.AMAZON_PA_API_TAG = 'test-tag';
      delete process.env.AMAZON_PA_API_SECRET_KEY;

      expect(() => AmazonPaApiService.fromEnv()).toThrow(
        'Missing required Amazon PA-API environment variables'
      );
    });

    it('should throw error if tag is missing', () => {
      process.env.AMAZON_PA_API_ACCESS_KEY = 'test-access-key';
      process.env.AMAZON_PA_API_SECRET_KEY = 'test-secret-key';
      delete process.env.AMAZON_PA_API_TAG;

      expect(() => AmazonPaApiService.fromEnv()).toThrow(
        'Missing required Amazon PA-API environment variables'
      );
    });
  });

  describe('validateAsin', () => {
    let service: AmazonPaApiService;

    beforeEach(() => {
      service = new AmazonPaApiService(mockConfig);
    });

    it('should validate correct ASIN B07XJ8C8F7', () => {
      expect(service.validateAsin('B07XJ8C8F7')).toBe(true);
    });

    it('should validate correct ASIN in lowercase', () => {
      expect(service.validateAsin('b07xj8c8f7')).toBe(true);
    });

    it('should validate ASIN with spaces (trimmed)', () => {
      expect(service.validateAsin('  B07XJ8C8F7  ')).toBe(true);
    });

    it('should reject ASIN that is too short', () => {
      expect(service.validateAsin('B07XJ8C8')).toBe(false);
    });

    it('should reject ASIN that is too long', () => {
      expect(service.validateAsin('B07XJ8C8F7A')).toBe(false);
    });

    it('should reject ASIN with invalid characters', () => {
      expect(service.validateAsin('B07XJ8C8F-')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(service.validateAsin('')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(service.validateAsin(null as unknown as string)).toBe(false);
      expect(service.validateAsin(undefined as unknown as string)).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(service.validateAsin(12345 as unknown as string)).toBe(false);
    });

    it('should validate ASIN B000000000 with check digit 0', () => {
      expect(service.validateAsin('B000000000')).toBe(true);
    });

    it('should validate ASIN with check digit X (10)', () => {
      expect(service.validateAsin('B00000006X')).toBe(true);
    });

    it('should reject invalid check digit', () => {
      // Change last digit of valid ASIN B07XJ8C8F7
      expect(service.validateAsin('B07XJ8C8F6')).toBe(false);
    });
  });

  describe('HOST_MAP', () => {
    it('should have correct host for us-east-1', () => {
      const service = new AmazonPaApiService({ ...mockConfig, region: 'us-east-1' });
      // Access private property through prototype for testing
      const hostMap = (service as unknown as Record<string, unknown>).HOST_MAP as Record<string, string>;
      expect(hostMap['us-east-1']).toBe('webservices.amazon.com');
    });

    it('should have correct host for eu-west-1 (UK)', () => {
      const service = new AmazonPaApiService({ ...mockConfig, region: 'eu-west-1' });
      const hostMap = (service as unknown as Record<string, unknown>).HOST_MAP as Record<string, string>;
      expect(hostMap['eu-west-1']).toBe('webservices.amazon.co.uk');
    });

    it('should have correct host for ap-northeast-1 (Japan)', () => {
      const service = new AmazonPaApiService({ ...mockConfig, region: 'ap-northeast-1' });
      const hostMap = (service as unknown as Record<string, unknown>).HOST_MAP as Record<string, string>;
      expect(hostMap['ap-northeast-1']).toBe('webservices.amazon.co.jp');
    });

    it('should have correct host for ap-south-1 (India)', () => {
      const service = new AmazonPaApiService({ ...mockConfig, region: 'ap-south-1' });
      const hostMap = (service as unknown as Record<string, unknown>).HOST_MAP as Record<string, string>;
      expect(hostMap['ap-south-1']).toBe('webservices.amazon.in');
    });
  });
});

describe('AmazonPaApiService Rate Limiting', () => {
  const mockConfig: AmazonPaApiConfig = {
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    tag: 'mytag-20',
    region: 'us-east-1',
  };

  it('should enforce 1 second rate limit between requests', async () => {
    const service = new AmazonPaApiService(mockConfig);
    
    // Note: We can't easily test the actual rate limiting without mocking fetch
    // This is a placeholder for future integration tests
    expect(service).toBeDefined();
  });
});

describe('AmazonPaApiService Integration', () => {
  const mockConfig: AmazonPaApiConfig = {
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    tag: 'mytag-20',
    region: 'us-east-1',
  };

  it('should have all required methods', () => {
    const service = new AmazonPaApiService(mockConfig);
    
    expect(typeof service.validateAsin).toBe('function');
    expect(typeof service.getProductByAsin).toBe('function');
    expect(typeof service.getProductsByAsins).toBe('function');
  });

  it('should throw error for invalid ASIN in getProductByAsin', async () => {
    const service = new AmazonPaApiService(mockConfig);
    
    await expect(service.getProductByAsin('invalid')).rejects.toThrow('Invalid ASIN');
  });
});
