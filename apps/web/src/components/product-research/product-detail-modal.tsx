'use client'

import { useState } from 'react'

interface Product {
  id: string
  title: string
  category?: string
  aliexpressPrice?: number
  amazonPrice?: number
  estimatedMargin?: number
  estimatedProfit?: number
  bsr?: number
  reviewCount?: number
  avgRating?: number
  status: 'RESEARCH' | 'EVALUATING' | 'APPROVED' | 'LAUNCHED' | 'PAUSED' | 'DISCONTINUED'
  createdAt: string
  aliexpressUrl?: string
  asin?: string
  weight?: number
  length?: number
  width?: number
  height?: number
}

interface ProductDetailModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onStatusChange?: (productId: string, newStatus: Product['status']) => void
}

export default function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose,
  onStatusChange 
}: ProductDetailModalProps) {
  const [newStatus, setNewStatus] = useState<Product['status'] | null>(null)

  if (!isOpen) return null

  const handleStatusChange = () => {
    if (newStatus && onStatusChange) {
      onStatusChange(product.id, newStatus)
      setNewStatus(null)
    }
  }

  const calculateFees = () => {
    const amazonPrice = product.amazonPrice || 0
    const aliexpressPrice = product.aliexpressPrice || 0
    
    const referralRate = 0.15
    const referralFee = amazonPrice * referralRate
    
    const weight = product.weight || 1
    const fbaFee = 3.50 + (weight * 0.80)
    
    const totalFees = referralFee + fbaFee
    const netProfit = amazonPrice - aliexpressPrice - totalFees
    const marginPercent = amazonPrice > 0 ? (netProfit / amazonPrice) * 100 : 0
    
    return {
      referralFee,
      fbaFee,
      totalFees,
      netProfit,
      marginPercent,
    }
  }

  const fees = calculateFees()
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecommendation = () => {
    if (fees.marginPercent >= 30 && (product.bsr || 999999) < 50000) {
      return { verdict: 'GO', reason: 'Strong margin and demand' }
    }
    if (fees.marginPercent >= 25 && (product.bsr || 999999) < 100000) {
      return { verdict: 'MAYBE', reason: 'Decent opportunity with some risks' }
    }
    return { verdict: 'NO_GO', reason: 'Insufficient margin or demand' }
  }

  const recommendation = getRecommendation()
  const score = Math.min(100, Math.max(0, 
    (fees.marginPercent * 2) + 
    (100 - Math.min((product.bsr || 50000) / 500, 100)) +
    ((product.avgRating || 0) * 10)
  ))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{product.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Profitability Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}/100
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Recommendation</div>
              <div className={`text-2xl font-bold ${
                recommendation.verdict === 'GO' ? 'text-green-600' :
                recommendation.verdict === 'MAYBE' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {recommendation.verdict}
              </div>
              <div className="text-xs text-gray-600 mt-1">{recommendation.reason}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Status</div>
              <div className="flex items-center gap-2">
                <StatusBadge status={product.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Price Comparison</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">AliExpress Price</span>
                  <span className="font-medium">${product.aliexpressPrice?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Amazon Price</span>
                  <span className="font-medium">${product.amazonPrice?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Gross Spread</span>
                  <span className="font-medium">
                    ${((product.amazonPrice || 0) - (product.aliexpressPrice || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {product.aliexpressUrl && (
                <a
                  href={product.aliexpressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                >
                  View on AliExpress →
                </a>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Market Data</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">BSR</span>
                  <span className={`font-medium ${
                    (product.bsr || 999999) < 10000 ? 'text-green-600' :
                    (product.bsr || 999999) < 50000 ? 'text-yellow-600' : ''
                  }`}>
                    {product.bsr?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Reviews</span>
                  <span className="font-medium">{product.reviewCount?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-medium">
                    {product.avgRating ? `${product.avgRating} / 5.0` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium capitalize">
                    {product.category?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Fee Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Referral Fee (15%)</span>
                <span className="font-medium text-red-600">-${fees.referralFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">FBA Fulfillment Fee</span>
                <span className="font-medium text-red-600">-${fees.fbaFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Fees</span>
                <span className="font-medium text-red-600">-${fees.totalFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Net Profit</span>
                <span className={`font-bold text-lg ${fees.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${fees.netProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 pt-3 border-t-2">
                <span className="text-gray-600 font-semibold">Net Margin</span>
                <span className={`font-bold text-xl ${
                  fees.marginPercent >= 30 ? 'text-green-600' :
                  fees.marginPercent >= 25 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {fees.marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Update Status</h3>
            <div className="flex items-center gap-3">
              <select
                value={newStatus || product.status}
                onChange={(e) => setNewStatus(e.target.value as Product['status'])}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="RESEARCH">Research</option>
                <option value="EVALUATING">Evaluating</option>
                <option value="APPROVED">Approved</option>
                <option value="LAUNCHED">Launched</option>
                <option value="PAUSED">Paused</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
              <button
                onClick={handleStatusChange}
                disabled={!newStatus}
                className={`px-4 py-2 rounded-md font-medium ${
                  newStatus
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RESEARCH: 'bg-gray-100 text-gray-800',
    EVALUATING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    LAUNCHED: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    DISCONTINUED: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
