import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountName,
      marketplace,
      lwaClientId,
      lwaClientSecret,
      lwaRefreshToken,
      spApiRoleArn,
    } = body;

    if (!accountName || !marketplace || !lwaClientId || !lwaClientSecret || !lwaRefreshToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const account = await prisma.sellerCentralAccount.create({
      data: {
        accountName,
        marketplace: marketplace as any,
        lwaClientId,
        lwaClientSecret,
        lwaRefreshToken,
        spApiRoleArn: spApiRoleArn || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      id: account.id,
      accountName: account.accountName,
      marketplace: account.marketplace,
      status: account.status,
      message: 'Account created. Call /api/seller-central/authenticate to complete OAuth flow.',
    });
  } catch (error) {
    console.error('Failed to create Seller Central account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const accounts = await prisma.sellerCentralAccount.findMany({
      select: {
        id: true,
        accountName: true,
        marketplace: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
