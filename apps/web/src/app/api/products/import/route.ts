import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@arbitrage/database'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

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

    const productData = await fetchAliExpressProduct(url)

    const product = await prisma.product.create({
      data: {
        title: productData?.title || 'Imported Product',
        aliexpressUrl: url,
        aliexpressPrice: productData?.price || 0,
        status: 'RESEARCH',
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
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import product' },
      { status: 500 }
    )
  }
}

async function fetchAliExpressProduct(url: string): Promise<Partial<Product> | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].replace(/- AliExpress$/, '').trim() : null

    const priceMatch = html.match(/["']price["']:\s*["']?([\d.]+)["']?/i)
    const price = priceMatch ? parseFloat(priceMatch[1]) : null

    return {
      title: title || undefined,
      price: price || undefined,
    }
  } catch (error) {
    console.error('Error fetching AliExpress product:', error)
    return null
  }
}

interface Product {
  title?: string
  price?: number
}
