import { NextRequest, NextResponse } from 'next/server';
import { SellerCentralApiService } from '@/lib/seller-central-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, reportType, daysBack = 7 } = body;

    if (!accountId || !reportType) {
      return NextResponse.json(
        { error: 'accountId and reportType are required' },
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

    const result = await service.requestReport(reportType, dateRange);

    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      status: result.status,
      message: 'Report requested. Poll /api/seller-central/reports/:id for status.',
    });
  } catch (error) {
    console.error('Report request failed:', error);
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
    const reportId = searchParams.get('reportId');

    if (reportId) {
      const report = await prisma.amazonReport.findUnique({
        where: { id: reportId },
      });
      return NextResponse.json({ report });
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const reports = await prisma.amazonReport.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
