import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@arbitrage/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const lowStock = searchParams.get('lowStock')

    const where: any = {}
    if (productId) {
      where.productId = productId
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            amazonPrice: true,
            aliexpressPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let result = inventory

    if (lowStock === 'true') {
      result = inventory.filter(inv => {
        const reorderPoint = calculateReorderPoint(inv)
        return inv.sellableQuantity <= reorderPoint
      })
    }

    return NextResponse.json({ inventory: result })
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
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

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (unitCost === undefined || totalCost === undefined) {
      return NextResponse.json(
        { error: 'Unit cost and total cost are required' },
        { status: 400 }
      )
    }

    const inventory = await prisma.inventory.create({
      data: {
        productId,
        quantity: quantity || 0,
        reservedQuantity: reservedQuantity || 0,
        sellableQuantity: sellableQuantity || 0,
        warehouseId,
        warehouseName,
        unitCost: new Decimal(unitCost),
        totalCost: new Decimal(totalCost),
        shippingCost: shippingCost ? new Decimal(shippingCost) : null,
        receivedAt: receivedAt ? new Date(receivedAt) : null,
      },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Failed to create inventory:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    )
  }
}

function calculateReorderPoint(inv: any): number {
  const avgDailySales = 5
  const leadTimeDays = 14
  const safetyStock = 10
  return (avgDailySales * leadTimeDays) + safetyStock
}
