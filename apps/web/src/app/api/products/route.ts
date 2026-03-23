import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma, ProductStatus } from '@arbitrage/database'

function isValidProductStatus(value: string): value is ProductStatus {
  return Object.values(ProductStatus).includes(value as ProductStatus)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Prisma.ProductWhereInput = {}

    if (status && status !== 'all' && isValidProductStatus(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        supplier: true,
        researchNotes: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        aliexpressPrice: p.aliexpressPrice?.toNumber() || 0,
        aliexpressShipping: p.aliexpressShipping?.toNumber() || 0,
        aliexpressUrl: p.aliexpressUrl,
        amazonPrice: p.amazonPrice?.toNumber() || 0,
        amazonAsin: p.amazonAsin,
        amazonUrl: p.amazonUrl,
        bsr: p.bsr,
        reviewCount: p.reviewCount,
        avgRating: p.avgRating?.toNumber() || 0,
        estimatedMargin: p.estimatedMargin?.toNumber() || 0,
        estimatedProfit: p.estimatedProfit?.toNumber() || 0,
        fbaFees: p.fbaFees?.toNumber() || 0,
        referralFee: p.referralFee?.toNumber() || 0,
        status: p.status,
        notes: p.notes,
        moq: p.moq,
        supplierId: p.supplierId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        aliexpressUrl: body.aliexpressUrl,
        aliexpressPrice: body.aliexpressPrice,
        aliexpressShipping: body.aliexpressShipping,
        moq: body.moq,
        supplierId: body.supplierId,
        amazonAsin: body.amazonAsin,
        amazonUrl: body.amazonUrl,
        amazonPrice: body.amazonPrice,
        bsr: body.bsr,
        reviewCount: body.reviewCount,
        avgRating: body.avgRating,
        estimatedMargin: body.estimatedMargin,
        estimatedProfit: body.estimatedProfit,
        fbaFees: body.fbaFees,
        referralFee: body.referralFee,
        status: body.status || 'RESEARCH',
        notes: body.notes,
      },
      include: {
        supplier: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          title: product.title,
          description: product.description,
          category: product.category,
          aliexpressPrice: product.aliexpressPrice?.toNumber() || 0,
          aliexpressShipping: product.aliexpressShipping?.toNumber() || 0,
          aliexpressUrl: product.aliexpressUrl,
          amazonPrice: product.amazonPrice?.toNumber() || 0,
          amazonAsin: product.amazonAsin,
          amazonUrl: product.amazonUrl,
          bsr: product.bsr,
          reviewCount: product.reviewCount,
          avgRating: product.avgRating?.toNumber() || 0,
          estimatedMargin: product.estimatedMargin?.toNumber() || 0,
          estimatedProfit: product.estimatedProfit?.toNumber() || 0,
          fbaFees: product.fbaFees?.toNumber() || 0,
          referralFee: product.referralFee?.toNumber() || 0,
          status: product.status,
          notes: product.notes,
          moq: product.moq,
          supplierId: product.supplierId,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        aliexpressUrl: data.aliexpressUrl,
        aliexpressPrice: data.aliexpressPrice,
        aliexpressShipping: data.aliexpressShipping,
        moq: data.moq,
        supplierId: data.supplierId,
        amazonAsin: data.amazonAsin,
        amazonUrl: data.amazonUrl,
        amazonPrice: data.amazonPrice,
        bsr: data.bsr,
        reviewCount: data.reviewCount,
        avgRating: data.avgRating,
        estimatedMargin: data.estimatedMargin,
        estimatedProfit: data.estimatedProfit,
        fbaFees: data.fbaFees,
        referralFee: data.referralFee,
        status: data.status,
        notes: data.notes,
      },
      include: {
        supplier: true,
      },
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        aliexpressPrice: product.aliexpressPrice?.toNumber() || 0,
        aliexpressShipping: product.aliexpressShipping?.toNumber() || 0,
        aliexpressUrl: product.aliexpressUrl,
        amazonPrice: product.amazonPrice?.toNumber() || 0,
        amazonAsin: product.amazonAsin,
        amazonUrl: product.amazonUrl,
        bsr: product.bsr,
        reviewCount: product.reviewCount,
        avgRating: product.avgRating?.toNumber() || 0,
        estimatedMargin: product.estimatedMargin?.toNumber() || 0,
        estimatedProfit: product.estimatedProfit?.toNumber() || 0,
        fbaFees: product.fbaFees?.toNumber() || 0,
        referralFee: product.referralFee?.toNumber() || 0,
        status: product.status,
        notes: product.notes,
        moq: product.moq,
        supplierId: product.supplierId,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
