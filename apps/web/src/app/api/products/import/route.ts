import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@arbitrage/database'
import { getProductScraper } from '@/lib/product-scraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, amazonAsin } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      )
    }

    if (!url.includes('aliexpress.com')) {
      return NextResponse.json(
        { error: 'URL must be from AliExpress' },
        { status: 400 }
      )
    }

    const scraper = getProductScraper()
    const importResult = await scraper.importFromAliExpressUrl(url, amazonAsin)

    if (!importResult.success || !importResult.data) {
      return NextResponse.json(
        { error: importResult.error || 'Failed to import product' },
        { status: 500 }
      )
    }

    const { data } = importResult
    const { aliexpress, amazon, marginCalculation, profitabilityScore, recommendation } = data

    let supplierId: string | null = null

    if (aliexpress.supplier?.sellerId) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          name: aliexpress.supplier.sellerName || 'Unknown Supplier',
        },
      })

      if (existingSupplier) {
        supplierId = existingSupplier.id
      } else {
        const newSupplier = await prisma.supplier.create({
          data: {
            name: aliexpress.supplier.sellerName || 'Unknown Supplier',
            aliexpressUrl: aliexpress.supplier.storeUrl || aliexpress.productUrl,
            rating: aliexpress.supplier.positiveRating
              ? aliexpress.supplier.positiveRating / 100
              : null,
            moq: aliexpress.moq,
          },
        })
        supplierId = newSupplier.id
      }
    }

    const product = await prisma.product.create({
      data: {
        title: aliexpress.title || 'Imported Product',
        description: aliexpress.description || null,
        category: aliexpress.categoryName || null,
        aliexpressUrl: aliexpress.productUrl,
        aliexpressPrice: aliexpress.price?.min || 0,
        aliexpressShipping: aliexpress.shipping?.cost || 0,
        moq: aliexpress.moq || 1,
        supplierId: supplierId || null,
        amazonAsin: amazon.asin !== 'PENDING' ? amazon.asin : null,
        amazonUrl: null,
        amazonPrice: amazon.price?.amount ? amazon.price.amount / 100 : null,
        bsr: amazon.salesRank || null,
        reviewCount: amazon.reviewsTotal || null,
        avgRating: amazon.rating || null,
        estimatedMargin: marginCalculation.netMarginPercent,
        estimatedProfit: marginCalculation.netProfit,
        fbaFees: marginCalculation.fbaFulfillmentFee,
        referralFee: marginCalculation.referralFee,
        status: 'RESEARCH',
        notes: `${recommendation.verdict}: ${recommendation.reason} (Score: ${profitabilityScore}/100)`,
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
        profitabilityScore,
        recommendation: recommendation.verdict,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      analysis: {
        aliexpress: {
          title: aliexpress.title,
          price: aliexpress.price,
          shipping: aliexpress.shipping,
          supplier: aliexpress.supplier,
          rating: aliexpress.rating,
          orders: aliexpress.orders,
        },
        amazon: {
          title: amazon.title,
          price: amazon.price,
          rating: amazon.rating,
          salesRank: amazon.salesRank,
        },
        margin: marginCalculation,
        sizeTier: data.sizeTier,
      },
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
