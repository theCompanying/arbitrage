import { NextRequest, NextResponse } from 'next/server'
import {
  calculateMargin,
  calculateProfitabilityScore,
  getRecommendation,
  type MarginCalculationInput,
} from '@/lib/margin-calculator'

interface BatchItem {
  id?: string
  input: MarginCalculationInput
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Request body must include an "items" array' },
        { status: 400 }
      )
    }
    
    const results = body.items.map((item: BatchItem) => {
      try {
        const calculation = calculateMargin(item.input)
        const score = calculateProfitabilityScore(calculation)
        const recommendation = getRecommendation(calculation)
        
        return {
          id: item.id,
          input: item.input,
          calculation,
          profitabilityScore: score,
          recommendation,
          error: null,
        }
      } catch (error) {
        return {
          id: item.id,
          input: item.input,
          calculation: null,
          profitabilityScore: 0,
          recommendation: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
    
    // Calculate summary statistics
    const validResults = results.filter((r: any) => r.calculation !== null)
    const summary = {
      totalItems: body.items.length,
      validItems: validResults.length,
      errorItems: results.length - validResults.length,
      averageMargin: validResults.length > 0
        ? validResults.reduce((acc: number, r: any) => acc + r.calculation.netMarginPercent, 0) / validResults.length
        : 0,
      averageScore: validResults.length > 0
        ? validResults.reduce((acc: number, r: any) => acc + r.profitabilityScore, 0) / validResults.length
        : 0,
      goCount: validResults.filter((r: any) => r.recommendation?.verdict === 'GO').length,
      maybeCount: validResults.filter((r: any) => r.recommendation?.verdict === 'MAYBE').length,
      noGoCount: validResults.filter((r: any) => r.recommendation?.verdict === 'NO_GO').length,
    }
    
    return NextResponse.json({
      results,
      summary,
    })
  } catch (error) {
    console.error('Batch margin calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch calculation' },
      { status: 500 }
    )
  }
}
