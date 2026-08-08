import { NextRequest, NextResponse } from 'next/server';
import { prisma, DiscoveryStatus } from '@arbitrage/database';
import { importDiscoveryResult, getDiscoveryStats } from '@/lib/product-discovery';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const status = searchParams.get('status') as DiscoveryStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (ruleId) where.ruleId = ruleId;
    if (status) where.status = status;

    const [results, total] = await Promise.all([
      prisma.discoveryResult.findMany({
        where,
        orderBy: { discoveredAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          rule: {
            select: { name: true },
          },
          product: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.discoveryResult.count({ where }),
    ]);

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching discovery results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery results' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, resultId } = body;

    if (action === 'import' && resultId) {
      const product = await importDiscoveryResult(resultId);
      
      if (!product) {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        product,
      });
    }

    if (action === 'reject' && resultId) {
      const result = await prisma.discoveryResult.update({
        where: { id: resultId },
        data: {
          status: DiscoveryStatus.REJECTED,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing discovery result:', error);
    return NextResponse.json(
      { error: 'Failed to process discovery result' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('resultId');

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId is required' },
        { status: 400 }
      );
    }

    await prisma.discoveryResult.delete({
      where: { id: resultId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discovery result:', error);
    return NextResponse.json(
      { error: 'Failed to delete discovery result' },
      { status: 500 }
    );
  }
}
