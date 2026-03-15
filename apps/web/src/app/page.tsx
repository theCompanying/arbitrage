'use client'

import { useState, useEffect } from 'react'
import MarginCalculatorForm from '@/components/margin-calculator-form'
import ProductTable from '@/components/product-research/product-table'
import ProductDetailModal from '@/components/product-research/product-detail-modal'

interface Product {
  id: string
  title: string
  description?: string
  category?: string
  aliexpressPrice?: number
  aliexpressShipping?: number
  aliexpressUrl?: string
  amazonPrice?: number
  amazonAsin?: string
  amazonUrl?: string
  bsr?: number
  reviewCount?: number
  avgRating?: number
  estimatedMargin?: number
  estimatedProfit?: number
  fbaFees?: number
  referralFee?: number
  status: 'RESEARCH' | 'EVALUATING' | 'APPROVED' | 'LAUNCHED' | 'PAUSED' | 'DISCONTINUED'
  createdAt: string
  moq?: number
  supplierId?: string
  notes?: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('margin')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [aliexpressUrl, setAliexpressUrl] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (productId: string, newStatus: Product['status']) => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          status: newStatus,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, status: newStatus } : p
        ))
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct({ ...selectedProduct, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredProducts = products
    .filter(p => {
      const matchesFilter = filter === 'all' || p.status === filter
      const matchesSearch = searchQuery === '' || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      switch (sort) {
        case 'margin':
          return (b.estimatedMargin || 0) - (a.estimatedMargin || 0)
        case 'bsr':
          return (a.bsr || 999999) - (b.bsr || 999999)
        case 'price':
          return (b.amazonPrice || 0) - (a.amazonPrice || 0)
        case 'profit':
          return (b.estimatedProfit || 0) - (a.estimatedProfit || 0)
        default:
          return 0
      }
    })

  const handleImportFromUrl = async () => {
    if (!aliexpressUrl.trim()) return

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aliexpressUrl }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setProducts(prev => [data.product, ...prev])
        setAliexpressUrl('')
        loadProducts()
      } else {
        alert(data.error || 'Failed to import product')
      }
    } catch (error) {
      alert('Failed to import product. Please try again.')
      console.error('Import error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Research Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Find and evaluate profitable AliExpress to Amazon arbitrage opportunities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste AliExpress URL..."
                  value={aliexpressUrl}
                  onChange={(e) => setAliexpressUrl(e.target.value)}
                  className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={handleImportFromUrl}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Import Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-3xl font-bold text-gray-900">{products.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Avg Margin</div>
            <div className="text-3xl font-bold text-green-600">
              {products.length > 0 ? (products.reduce((acc, p) => acc + (p.estimatedMargin || 0), 0) / products.length).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Approved / Launched</div>
            <div className="text-3xl font-bold text-blue-600">
              {products.filter(p => p.status === 'APPROVED' || p.status === 'LAUNCHED').length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <MarginCalculatorForm />

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Pipeline Overview</h2>
            <div className="space-y-3">
              {['RESEARCH', 'EVALUATING', 'APPROVED', 'LAUNCHED'].map(status => {
                const count = products.filter(p => p.status === status).length
                const percentage = products.length > 0 ? (count / products.length) * 100 : 0
                const colors: Record<string, string> = {
                  RESEARCH: 'bg-gray-500',
                  EVALUATING: 'bg-yellow-500',
                  APPROVED: 'bg-green-500',
                  LAUNCHED: 'bg-blue-500',
                }
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-24">{status}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${colors[status]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Product Criteria Targets</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Margin</span>
                  <span className="font-medium text-green-600">≥25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target BSR</span>
                  <span className="font-medium text-blue-600">&lt;50K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span className="font-medium text-gray-900">$20-50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Reviews</span>
                  <span className="font-medium text-gray-900">&lt;500</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Product Candidates</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm w-48"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="RESEARCH">Research</option>
                  <option value="EVALUATING">Evaluating</option>
                  <option value="APPROVED">Approved</option>
                  <option value="LAUNCHED">Launched</option>
                  <option value="PAUSED">Paused</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="margin">Sort by Margin %</option>
                  <option value="profit">Sort by Profit $</option>
                  <option value="bsr">Sort by BSR</option>
                  <option value="price">Sort by Price</option>
                </select>
              </div>
            </div>
          </div>
          <ProductTable products={filteredProducts} onSelect={handleSelectProduct} />
        </div>
      </main>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
