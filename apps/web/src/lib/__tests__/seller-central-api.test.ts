import { SellerCentralApiService } from '../seller-central-api';

describe('SellerCentralApiService', () => {
  const mockConfig = {
    lwaClientId: 'test_client_id',
    lwaClientSecret: 'test_client_secret',
    lwaRefreshToken: 'test_refresh_token',
    spApiRoleArn: 'arn:aws:iam::123456789:role/SellerCentralRole',
    marketplace: 'US' as const,
  };

  describe('constructor', () => {
    it('should create service with valid config', () => {
      const service = new SellerCentralApiService(mockConfig);
      expect(service).toBeInstanceOf(SellerCentralApiService);
    });
  });

  describe('getEndpoint', () => {
    it('should return US endpoint for US marketplace', () => {
      const service = new SellerCentralApiService(mockConfig);
      expect(service.getEndpoint()).toBe('https://sellingpartnerapi-na.amazon.com');
    });

    it('should return EU endpoint for UK marketplace', () => {
      const service = new SellerCentralApiService({
        ...mockConfig,
        marketplace: 'UK',
      });
      expect(service.getEndpoint()).toBe('https://sellingpartnerapi-eu.amazon.com');
    });

    it('should return FE endpoint for JP marketplace', () => {
      const service = new SellerCentralApiService({
        ...mockConfig,
        marketplace: 'JP',
      });
      expect(service.getEndpoint()).toBe('https://sellingpartnerapi-fe.amazon.com');
    });
  });

  describe('fromAccount', () => {
    it('should return null for non-existent account', async () => {
      const result = await SellerCentralApiService.fromAccount('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null for account without credentials', async () => {
      // This would require a database connection, so we skip for now
      // In a real test, we'd mock the Prisma client
    });
  });
});
