import { NextRequest, NextResponse } from 'next/server'
import {
  calculateMargin,
  calculateProfitabilityScore,
  getRecommendation,
  type MarginCalculationInput,
} from '@/lib/margin-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields: (keyof MarginCalculationInput)[] = [
      'productCost',
      'shippingToAmazon',
      'amazonPrice',
      'length',
      'width',
      'height',
      'weight',
      'category',
    ]
    
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    const input: MarginCalculationInput = {
      productCost: Number(body.productCost),
      shippingToAmazon: Number(body.shippingToAmazon),
      amazonPrice: Number(body.amazonPrice),
      length: Number(body.length),
      width: Number(body.width),
      height: Number(body.height),
      weight: Number(body.weight),
      category: body.category,
    }
    
    // Validate numeric values
    if (Object.values(input).some(v => typeof v === 'number' && (isNaN(v) || v < 0))) {
      return NextResponse.json(
        { error: 'All numeric values must be non-negative numbers' },
        { status: 400 }
      )
    }
    
    // Calculate margin
    const result = calculateMargin(input)
    const score = calculateProfitabilityScore(result)
    const recommendation = getRecommendation(result)
    
    return NextResponse.json({
      input,
      calculation: result,
      profitabilityScore: score,
      recommendation,
    })
  } catch (error) {
    console.error('Margin calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate margin' },
      { status: 500 }
    )
  }
}
