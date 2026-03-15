'use client'

import { useState } from 'react'

interface Product {
  id: string
  title: string
  category?: string
  aliexpressPrice?: number
  amazonPrice?: number
  weight?: number
  length?: number
  width?: number
  height?: number
  features?: string[]
  description?: string
}

interface ListingGeneratorModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

interface GeneratedListing {
  title: string
  bulletPoints: string[]
  description: string
  searchKeywords: string[]
  recommendedPrice: number
  minPrice: number
  maxPrice: number
  seoScore: number
  complianceScore: number
}

export default function ListingGeneratorModal({
  product,
  isOpen,
  onClose,
}: ListingGeneratorModalProps) {
  const [loading, setLoading] = useState(false)
  const [listing, setListing] = useState<GeneratedListing | null>(null)
  const [csv, setCsv] = useState<string | null>(null)
  const [sku, setSku] = useState('')
  const [targetMargin, setTargetMargin] = useState(25)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.title,
          category: product.category || 'home_kitchen',
          features: product.features || [
            'High-quality materials for durability',
            'Easy to use and clean',
            'Compact design saves space',
            'Safe for everyday use',
          ],
          description: product.description || `Premium ${product.title} for daily use`,
          productCost: product.aliexpressPrice || 5,
          shippingToAmazon: 2,
          dimensions: {
            length: product.length || 6,
            width: product.width || 4,
            height: product.height || 2,
            weight: product.weight || 0.5,
          },
          targetMarginPercent: targetMargin,
          competitorPrices: product.amazonPrice ? [product.amazonPrice] : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate listing')
      }

      setListing(data.listing)
      setCsv(data.csv)
      setSku(data.sku)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate listing')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCsv = () => {
    if (!csv) return

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sku || 'listing'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Generate Amazon Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6">
          {!listing ? (
            // Generation form
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Product: {product.title}</h3>
                <p className="text-sm text-blue-700">
                  Generate an SEO-optimized Amazon listing with title, bullet points, description, and search keywords.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Margin (%)
                </label>
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="10"
                  max="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 25-30% for FBA products
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Generating...' : 'Generate Listing'}
              </button>
            </div>
          ) : (
            // Generated listing preview
            <div className="space-y-6">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">SEO Score</div>
                  <div className={`text-3xl font-bold ${
                    listing.seoScore >= 70 ? 'text-green-600' :
                    listing.seoScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {listing.seoScore}/100
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Compliance Score</div>
                  <div className={`text-3xl font-bold ${
                    listing.complianceScore >= 90 ? 'text-green-600' :
                    listing.complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {listing.complianceScore}/100
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Pricing Recommendation</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-blue-700">Minimum Price</div>
                    <div className="text-lg font-bold text-blue-900">${listing.minPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700">Recommended</div>
                    <div className="text-2xl font-bold text-blue-900">${listing.recommendedPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700">Maximum Price</div>
                    <div className="text-lg font-bold text-blue-900">${listing.maxPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Title ({listing.title.length}/200 chars)
                  </label>
                  <button
                    onClick={() => handleCopyToClipboard(listing.title)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <div className="border rounded-md p-3 bg-gray-50 text-sm">
                  {listing.title}
                </div>
              </div>

              {/* Bullet Points */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bullet Points
                  </label>
                  <button
                    onClick={() => handleCopyToClipboard(listing.bulletPoints.join('\n'))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy All
                  </button>
                </div>
                <div className="space-y-2">
                  {listing.bulletPoints.map((bullet, i) => (
                    <div key={i} className="border rounded-md p-3 bg-gray-50 text-sm">
                      <div className="text-xs text-gray-500 mb-1">Bullet {i + 1} ({bullet.length} chars)</div>
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Description
                  </label>
                  <button
                    onClick={() => handleCopyToClipboard(listing.description.replace(/<[^>]*>/g, ''))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy Plain Text
                  </button>
                </div>
                <div className="border rounded-md p-3 bg-gray-50 text-sm prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: listing.description }} />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Search Keywords ({listing.searchKeywords.length} terms)
                  </label>
                  <button
                    onClick={() => handleCopyToClipboard(listing.searchKeywords.join(' '))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.searchKeywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleDownloadCsv}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700"
                >
                  Download CSV for Seller Central
                </button>
                <button
                  onClick={() => {
                    setListing(null)
                    setCsv(null)
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
