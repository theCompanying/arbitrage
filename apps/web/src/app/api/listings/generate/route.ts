import { NextRequest, NextResponse } from 'next/server'
import { generateListing, exportListingAsCsv, validateListing, type ListingInput } from '@/lib/listing-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const {
      productName,
      features,
      description,
      category,
      productCost,
      shippingToAmazon,
      dimensions,
    } = body as ListingInput
    
    if (!productName || !features || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, features, description, category' },
        { status: 400 }
      )
    }
    
    if (typeof productCost !== 'number' || typeof shippingToAmazon !== 'number') {
      return NextResponse.json(
        { error: 'productCost and shippingToAmazon must be numbers' },
        { status: 400 }
      )
    }
    
    if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight) {
      return NextResponse.json(
        { error: 'Invalid dimensions: length, width, height, weight required' },
        { status: 400 }
      )
    }
    
    // Build listing input
    const input: ListingInput = {
      productName,
      features,
      description,
      category,
      productCost,
      shippingToAmazon,
      dimensions,
      targetKeywords: body.targetKeywords || [],
      targetMarginPercent: body.targetMarginPercent || 25,
      competitorPrices: body.competitorPrices || [],
      competitorTitles: body.competitorTitles || [],
    }
    
    // Generate listing
    const listing = generateListing(input)
    
    // Validate
    const validation = validateListing(listing)
    
    // Generate CSV
    const sku = body.sku || `SKU-${Date.now()}`
    const csv = exportListingAsCsv(listing, sku)
    
    return NextResponse.json({
      success: true,
      listing,
      validation,
      csv,
      sku,
    })
  } catch (error) {
    console.error('Error generating listing:', error)
    return NextResponse.json(
      { error: 'Failed to generate listing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Listing Generator API',
    endpoints: {
      generate: 'POST /api/listings/generate - Generate Amazon listing from product data',
    },
    requiredFields: [
      'productName',
      'features',
      'description',
      'category',
      'productCost',
      'shippingToAmazon',
      'dimensions.length',
      'dimensions.width',
      'dimensions.height',
      'dimensions.weight',
    ],
    optionalFields: [
      'targetKeywords',
      'targetMarginPercent',
      'competitorPrices',
      'competitorTitles',
      'sku',
    ],
  })
}
