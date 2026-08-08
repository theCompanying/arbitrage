import { NextRequest, NextResponse } from 'next/server';
import { SellerCentralApiService } from '@/lib/seller-central-api';
import { prisma } from '@arbitrage/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, daysBack = 30 } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const service = await SellerCentralApiService.fromAccount(accountId);
    if (!service) {
      return NextResponse.json(
        { error: 'Account not found or not configured' },
        { status: 404 }
      );
    }

    const dateRange = {
      start: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const result = await service.syncOrders(dateRange);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors,
      dateRange,
    });
  } catch (error) {
    console.error('Order sync failed:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const orders = await prisma.amazonOrder.findMany({
      where: { accountId },
      orderBy: { purchaseDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
