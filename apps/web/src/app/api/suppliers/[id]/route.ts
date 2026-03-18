import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@arbitrage/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            title: true,
            aliexpressPrice: true,
            amazonPrice: true,
            estimatedMargin: true,
            status: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            totalPrice: true,
            status: true,
            estimatedDelivery: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Failed to fetch supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
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
      },
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Failed to update supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await prisma.supplier.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
