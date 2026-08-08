import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@arbitrage/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await prisma.discoveryRule.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { discoveredAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching discovery rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const rule = await prisma.discoveryRule.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        minMargin: body.minMargin ? parseFloat(body.minMargin) : null,
        maxBsr: body.maxBsr ? parseInt(body.maxBsr) : null,
        maxReviews: body.maxReviews ? parseInt(body.maxReviews) : null,
        minRating: body.minRating ? parseFloat(body.minRating) : null,
        priceRange: body.priceRange || null,
        categories: body.categories || [],
        keywords: body.keywords || [],
        excludeKeywords: body.excludeKeywords || [],
        enabled: body.enabled ?? true,
        scanFrequency: body.scanFrequency || 'daily',
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating discovery rule:', error);
    return NextResponse.json(
      { error: 'Failed to update discovery rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.discoveryRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discovery rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete discovery rule' },
      { status: 500 }
    );
  }
}
