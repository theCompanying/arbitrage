'use client'

import { useState } from 'react'
import MarginCalculatorForm from './margin-calculator-form'

interface Product {
  id: string
  title: string
  aliexpressPrice: number
  amazonPrice: number
  bsr: number
  reviewCount: number
  avgRating: number
  estimatedMargin: number
  status: string
  category?: string
}

const sampleProducts: Product[] = [
  {
    id: '1',
    title: 'Bamboo Drawer Organizer Set',
    aliexpressPrice: 8.50,
    amazonPrice: 29.99,
    bsr: 12500,
    reviewCount: 342,
    avgRating: 4.3,
    estimatedMargin: 32,
    status: 'RESEARCH',
    category: 'home_kitchen',
  },
  {
    id: '2',
    title: 'Resistance Bands Set with Handles',
    aliexpressPrice: 5.99,
    amazonPrice: 24.99,
    bsr: 8200,
    reviewCount: 1250,
    avgRating: 4.5,
    estimatedMargin: 28,
    status: 'EVALUATING',
    category: 'sports',
  },
  {
    id: '3',
    title: 'LED Desk Lamp with USB Charging',
    aliexpressPrice: 12.00,
    amazonPrice: 39.99,
    bsr: 45000,
    reviewCount: 89,
    avgRating: 4.1,
    estimatedMargin: 22,
    status: 'RESEARCH',
    category: 'electronics',
  },
  {
    id: '4',
    title: 'Silicone Baking Mat Set',
    aliexpressPrice: 4.50,
    amazonPrice: 19.99,
    bsr: 5600,
    reviewCount: 2100,
    avgRating: 4.6,
    estimatedMargin: 35,
    status: 'APPROVED',
    category: 'home_kitchen',
  },
  {
    id: '5',
    title: 'Pet Hair Remover Roller',
    aliexpressPrice: 3.99,
    amazonPrice: 16.99,
    bsr: 3200,
    reviewCount: 4500,
    avgRating: 4.4,
    estimatedMargin: 30,
    status: 'LAUNCHED',
    category: 'other',
  },
]

export default function ProductDashboard() {
  const [products] = useState<Product[]>(sampleProducts)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('margin')
  const [showCalculator, setShowCalculator] = useState(false)

  const filteredProducts = products
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      switch (sort) {
        case 'margin':
          return b.estimatedMargin - a.estimatedMargin
        case 'bsr':
          return a.bsr - b.bsr
        case 'price':
          return b.amazonPrice - a.amazonPrice
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RESEARCH: 'bg-gray-100 text-gray-800',
      EVALUATING: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      LAUNCHED: 'bg-purple-100 text-purple-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      DISCONTINUED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Product Research Dashboard</h1>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showCalculator ? 'Hide Calculator' : 'Add Product'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Calculator Panel */}
        {showCalculator && (
          <div className="mb-6">
            <MarginCalculatorForm />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-2xl font-bold">{products.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Avg Margin</div>
            <div className="text-2xl font-bold text-green-600">
              {(products.reduce((acc, p) => acc + p.estimatedMargin, 0) / products.length).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-2xl font-bold text-blue-600">
              {products.filter(p => p.status === 'APPROVED').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Launched</div>
            <div className="text-2xl font-bold text-purple-600">
              {products.filter(p => p.status === 'LAUNCHED').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="RESEARCH">Research</option>
                <option value="EVALUATING">Evaluating</option>
                <option value="APPROVED">Approved</option>
                <option value="LAUNCHED">Launched</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="margin">Margin %</option>
                <option value="bsr">BSR (Best first)</option>
                <option value="price">Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AliExpress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amazon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BSR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 capitalize">
                      {product.category?.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">${product.aliexpressPrice.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">${product.amazonPrice.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.bsr.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {product.reviewCount.toLocaleString()} ({product.avgRating})
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-semibold ${product.estimatedMargin >= 30 ? 'text-green-600' : product.estimatedMargin >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {product.estimatedMargin}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found matching your filters.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
