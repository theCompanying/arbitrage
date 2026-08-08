import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@arbitrage/database';

export async function GET(request: NextRequest) {
  try {
    const rules = await prisma.discoveryRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching discovery rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rule = await prisma.discoveryRule.create({
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

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating discovery rule:', error);
    return NextResponse.json(
      { error: 'Failed to create discovery rule' },
      { status: 500 }
    );
  }
}
