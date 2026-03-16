import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@arbitrage/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const where: { status?: string } = {}
    if (status) {
      where.status = status
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        products: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      aliexpressUrl,
      contactEmail,
      contactName,
      rating,
      yearsInBusiness,
      responseRate,
      responseTime,
      moq,
      leadTimeDays,
      customLogo,
      customPackaging,
      notes,
      rating_internal,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        aliexpressUrl,
        contactEmail,
        contactName,
        rating: rating ? new Decimal(rating) : null,
        yearsInBusiness,
        responseRate: responseRate ? new Decimal(responseRate) : null,
        responseTime,
        moq,
        leadTimeDays,
        customLogo: customLogo || false,
        customPackaging: customPackaging || false,
        notes,
        rating_internal,
      },
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Failed to create supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
