import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@arbitrage/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            amazonPrice: true,
            aliexpressPrice: true,
            bsr: true,
          },
        },
      },
    })

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      quantity,
      reservedQuantity,
      sellableQuantity,
      warehouseId,
      warehouseName,
      unitCost,
      totalCost,
      shippingCost,
      receivedAt,
    } = body

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        quantity,
        reservedQuantity,
        sellableQuantity,
        warehouseId,
        warehouseName,
        unitCost,
        totalCost,
        shippingCost,
        receivedAt: receivedAt ? new Date(receivedAt) : undefined,
      },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Failed to update inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}
