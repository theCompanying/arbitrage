import { NextRequest, NextResponse } from 'next/server';
import { executeDiscoveryScan } from '@/lib/product-discovery';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'ruleId is required' },
        { status: 400 }
      );
    }

    const result = await executeDiscoveryScan(ruleId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error executing discovery scan:', error);
    return NextResponse.json(
      { error: 'Failed to execute discovery scan' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { prisma } = await import('@arbitrage/database');

    const enabledRules = await prisma.discoveryRule.findMany({
      where: { enabled: true },
      orderBy: { nextScanAt: 'asc' },
    });

    const overdueRules = enabledRules.filter(rule => {
      if (!rule.nextScanAt) return false;
      return new Date(rule.nextScanAt) < new Date();
    });

    return NextResponse.json({
      enabledRules: enabledRules.length,
      overdueRules: overdueRules.length,
      nextScan: overdueRules[0]?.nextScanAt || enabledRules[0]?.nextScanAt,
    });
  } catch (error) {
    console.error('Error fetching scan status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan status' },
      { status: 500 }
    );
  }
}
