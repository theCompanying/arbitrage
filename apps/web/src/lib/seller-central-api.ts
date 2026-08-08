import { prisma } from '@arbitrage/database';

export interface SellerCentralConfig {
  lwaClientId: string;
  lwaClientSecret: string;
  lwaRefreshToken: string;
  spApiRoleArn: string;
  marketplace: Marketplace;
}

export type Marketplace = 'US' | 'CA' | 'UK' | 'DE' | 'FR' | 'IT' | 'ES' | 'JP' | 'AU';

export interface OrderSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface ReportSyncResult {
  reportId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  data?: any;
}

const MARKETPLACE_ENDPOINTS: Record<Marketplace, string> = {
  US: 'https://sellingpartnerapi-na.amazon.com',
  CA: 'https://sellingpartnerapi-na.amazon.com',
  UK: 'https://sellingpartnerapi-eu.amazon.com',
  DE: 'https://sellingpartnerapi-eu.amazon.com',
  FR: 'https://sellingpartnerapi-eu.amazon.com',
  IT: 'https://sellingpartnerapi-eu.amazon.com',
  ES: 'https://sellingpartnerapi-eu.amazon.com',
  JP: 'https://sellingpartnerapi-fe.amazon.com',
  AU: 'https://sellingpartnerapi-fe.amazon.com',
};

export class SellerCentralApiService {
  private config: SellerCentralConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(config: SellerCentralConfig) {
    this.config = config;
  }

  static async fromAccount(accountId: string): Promise<SellerCentralApiService | null> {
    const account = await prisma.sellerCentralAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.lwaClientId || !account.lwaClientSecret || !account.lwaRefreshToken) {
      return null;
    }

    return new SellerCentralApiService({
      lwaClientId: account.lwaClientId,
      lwaClientSecret: account.lwaClientSecret,
      lwaRefreshToken: account.lwaRefreshToken,
      spApiRoleArn: account.spApiRoleArn || '',
      marketplace: account.marketplace as Marketplace,
    });
  }

  getEndpoint(): string {
    return MARKETPLACE_ENDPOINTS[this.config.marketplace];
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.lwaRefreshToken,
        client_id: this.config.lwaClientId,
        client_secret: this.config.lwaClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LWA token exchange failed: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 300) * 1000);

    await prisma.sellerCentralAccount.updateMany({
      where: {
        lwaClientId: this.config.lwaClientId,
      },
      data: {
        accessToken: data.access_token,
        tokenExpiresAt: this.tokenExpiresAt,
        status: 'CONNECTED',
      },
    });

    return this.accessToken!;
  }

  async makeRequest<T>(options: {
    resource: string;
    method?: 'GET' | 'POST' | 'DELETE';
    query?: Record<string, string>;
    body?: any;
  }): Promise<T> {
    const accessToken = await this.getAccessToken();
    const endpoint = this.getEndpoint();
    const url = new URL(`${endpoint}${options.resource}`);

    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SP-API request failed (${response.status}): ${error}`);
    }

    return response.json();
  }

  async syncOrders(dateRange: { start: Date; end: Date }): Promise<OrderSyncResult> {
    const result: OrderSyncResult = { synced: 0, failed: 0, errors: [] };

    try {
      const ordersData = await this.makeRequest<{
        orders: any[];
        nextToken?: string;
      }>({
        resource: '/orders/v0/orders',
        query: {
          CreatedAfter: dateRange.start.toISOString(),
          CreatedBefore: dateRange.end.toISOString(),
          MarketplaceIds: this.config.marketplace,
          OrderStatuses: 'Pending,Unshipped,Shipped,PartiallyShipped',
        },
      });

      let orders = ordersData.orders || [];

      while (ordersData.nextToken) {
        const nextData = await this.makeRequest<{ orders: any[]; nextToken?: string }>({
          resource: '/orders/v0/orders',
          query: { NextToken: ordersData.nextToken },
        });
        orders = [...orders, ...(nextData.orders || [])];
        ordersData.nextToken = nextData.nextToken;
      }

      for (const order of orders) {
        try {
          await prisma.amazonOrder.upsert({
            where: { amazonOrderId: order.AmazonOrderId },
            create: {
              amazonOrderId: order.AmazonOrderId,
              accountId: (await prisma.sellerCentralAccount.findFirst({
                where: { lwaClientId: this.config.lwaClientId },
              }))!.id,
              purchaseDate: new Date(order.PurchaseDate),
              lastUpdateDate: order.LastUpdateDate ? new Date(order.LastUpdateDate) : null,
              orderStatus: order.OrderStatus.toUpperCase(),
              fulfillmentChannel: order.FulfillmentChannel,
              salesChannel: order.SalesChannel,
              shipServiceLevel: order.ShipServiceLevel,
              shipCity: order.ShipCity,
              shipState: order.ShipState,
              shipCountry: order.ShipCountry,
              shipPostalCode: order.ShipPostalCode,
              marketplaceId: order.MarketplaceId,
              currency: order.CurrencyCode || 'USD',
              totalAmount: parseFloat(order.OrderTotal?.Amount || '0'),
              itemsJson: JSON.stringify(order.OrderItems || []),
            },
            update: {
              lastUpdateDate: order.LastUpdateDate ? new Date(order.LastUpdateDate) : null,
              orderStatus: order.OrderStatus.toUpperCase(),
              totalAmount: parseFloat(order.OrderTotal?.Amount || '0'),
            },
          });
          result.synced++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to sync order ${order.AmazonOrderId}: ${(error as Error).message}`);
        }
      }

      await prisma.sellerCentralAccount.updateMany({
        where: { lwaClientId: this.config.lwaClientId },
        data: { lastSyncAt: new Date(), syncError: null },
      });
    } catch (error) {
      result.errors.push(`Order sync failed: ${(error as Error).message}`);
      await prisma.sellerCentralAccount.updateMany({
        where: { lwaClientId: this.config.lwaClientId },
        data: { syncError: (error as Error).message, status: 'ERROR' },
      });
    }

    return result;
  }

  async requestReport(reportType: string, dateRange: { start: Date; end: Date }): Promise<ReportSyncResult> {
    try {
      const response = await this.makeRequest<{
        reportId: string;
      }>({
        resource: '/reports/2021-06-30/reports',
        method: 'POST',
        body: {
          reportType,
          dataStartTime: dateRange.start.toISOString(),
          dataEndTime: dateRange.end.toISOString(),
          marketplaceIds: [this.config.marketplace],
        },
      });

      const report = await prisma.amazonReport.create({
        data: {
          reportId: response.reportId,
          reportType,
          accountId: (await prisma.sellerCentralAccount.findFirst({
            where: { lwaClientId: this.config.lwaClientId },
          }))!.id,
          startDate: dateRange.start,
          endDate: dateRange.end,
          status: 'PENDING',
        },
      });

      return {
        reportId: response.reportId,
        status: 'PENDING',
      };
    } catch (error) {
      return {
        reportId: '',
        status: 'FAILED',
      };
    }
  }

  async getReportStatus(reportId: string): Promise<ReportSyncResult> {
    try {
      const response = await this.makeRequest<{
        processingStatus: string;
        reportDocumentId?: string;
      }>({
        resource: `/reports/2021-06-30/reports/${reportId}`,
      });

      const status = response.processingStatus as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

      await prisma.amazonReport.updateMany({
        where: { reportId },
        data: {
          status,
          documentId: response.reportDocumentId || null,
          generatedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });

      return { reportId, status };
    } catch (error) {
      return { reportId, status: 'FAILED' };
    }
  }

  async downloadReport(reportId: string): Promise<any> {
    try {
      const report = await prisma.amazonReport.findUnique({
        where: { id: reportId },
      });

      if (!report?.documentId) {
        throw new Error('Report document not available');
      }

      const docResponse = await this.makeRequest<{
        url: string;
      }>({
        resource: `/reports/2021-06-30/documents/${report.documentId}`,
      });

      const csvResponse = await fetch(docResponse.url);
      const csvText = await csvResponse.text();

      await prisma.amazonReport.update({
        where: { id: report.id },
        data: {
          downloadedAt: new Date(),
          status: 'COMPLETED',
        },
      });

      return { csvText, reportId };
    } catch (error) {
      await prisma.amazonReport.update({
        where: { id: reportId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}
