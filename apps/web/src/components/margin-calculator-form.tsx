'use client'

import { useState } from 'react'
import { calculateMargin, calculateProfitabilityScore, getRecommendation } from '@/lib/margin-calculator'

interface MarginCalculatorFormProps {
  onCalculated?: (result: any) => void
}

export default function MarginCalculatorForm({ onCalculated }: MarginCalculatorFormProps) {
  const [formData, setFormData] = useState({
    productCost: '',
    shippingToAmazon: '',
    amazonPrice: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    category: 'home_kitchen',
  })
  
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const input = {
        productCost: parseFloat(formData.productCost),
        shippingToAmazon: parseFloat(formData.shippingToAmazon),
        amazonPrice: parseFloat(formData.amazonPrice),
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        category: formData.category as any,
      }
      
      // Validate
      if (Object.values(input).some(v => isNaN(v as number) || v < 0)) {
        setError('All values must be non-negative numbers')
        return
      }
      
      const calculation = calculateMargin(input)
      const score = calculateProfitabilityScore(calculation)
      const recommendation = getRecommendation(calculation)
      
      const calculationResult = {
        input,
        calculation,
        profitabilityScore: score,
        recommendation,
      }
      
      setResult(calculationResult)
      onCalculated?.(calculationResult)
    } catch (err) {
      setError('Failed to calculate margin')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Margin Calculator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Cost ($)</label>
            <input
              type="number"
              step="0.01"
              name="productCost"
              value={formData.productCost}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="5.99"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Shipping to FBA ($)</label>
            <input
              type="number"
              step="0.01"
              name="shippingToAmazon"
              value={formData.shippingToAmazon}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="2.50"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Amazon Price ($)</label>
            <input
              type="number"
              step="0.01"
              name="amazonPrice"
              value={formData.amazonPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="24.99"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="home_kitchen">Home & Kitchen (15%)</option>
              <option value="electronics">Electronics (8%)</option>
              <option value="beauty">Beauty (20%)</option>
              <option value="toys">Toys (15%)</option>
              <option value="sports">Sports (15%)</option>
              <option value="clothing">Clothing (17%)</option>
              <option value="books">Books (15%)</option>
              <option value="other">Other (15%)</option>
            </select>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Product Dimensions</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Length (in)</label>
              <input
                type="number"
                step="0.1"
                name="length"
                value={formData.length}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="10"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Width (in)</label>
              <input
                type="number"
                step="0.1"
                name="width"
                value={formData.width}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="8"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (in)</label>
              <input
                type="number"
                step="0.1"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="4"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (lb)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="1.5"
                required
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Calculate Margin
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Results</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Net Margin</div>
              <div className={`text-2xl font-bold ${result.calculation.netMarginPercent >= 25 ? 'text-green-600' : result.calculation.netMarginPercent >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                {result.calculation.netMarginPercent.toFixed(1)}%
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Net Profit</div>
              <div className="text-2xl font-bold text-gray-900">
                ${result.calculation.netProfit.toFixed(2)}
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Profitability Score</div>
              <div className={`text-2xl font-bold ${result.profitabilityScore >= 70 ? 'text-green-600' : result.profitabilityScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {result.profitabilityScore}/100
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded mb-4">
            <div className="text-sm text-gray-600 mb-1">Recommendation</div>
            <div className={`font-semibold ${result.recommendation.verdict === 'GO' ? 'text-green-600' : result.recommendation.verdict === 'MAYBE' ? 'text-yellow-600' : 'text-red-600'}`}>
              {result.recommendation.verdict}
            </div>
            <div className="text-sm text-gray-600 mt-1">{result.recommendation.reason}</div>
          </div>
          
          <div className="text-sm text-gray-600">
            <div className="flex justify-between py-1 border-b">
              <span>FBA Fulfillment Fee</span>
              <span>${result.calculation.fbaFulfillmentFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span>Referral Fee</span>
              <span>${result.calculation.referralFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span>Break-even Price</span>
              <span>${result.calculation.breakEvenPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>ROI</span>
              <span>{result.calculation.roi.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
