import { NextResponse } from 'next/server';
import { getDiscoveryStats } from '@/lib/product-discovery';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId') || undefined;

    const stats = await getDiscoveryStats(ruleId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching discovery stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery stats' },
      { status: 500 }
    );
  }
}
