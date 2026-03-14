import MarginCalculatorForm from '@/components/margin-calculator-form'
import ProductTable from '@/components/product-research/product-table'

// Sample products for demo
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    title: 'Silicone Kitchen Utensil Set',
    category: 'home_kitchen',
    aliexpressPrice: 8.50,
    amazonPrice: 29.99,
    estimatedMargin: 32.5,
    estimatedProfit: 9.75,
    bsr: 15420,
    reviewCount: 0,
    status: 'RESEARCH' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Resistance Bands Set',
    category: 'sports',
    aliexpressPrice: 4.20,
    amazonPrice: 19.99,
    estimatedMargin: 28.3,
    estimatedProfit: 5.66,
    bsr: 8230,
    reviewCount: 0,
    status: 'EVALUATING' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'LED Desk Lamp',
    category: 'home_kitchen',
    aliexpressPrice: 12.00,
    amazonPrice: 39.99,
    estimatedMargin: 22.1,
    estimatedProfit: 8.84,
    bsr: 25100,
    reviewCount: 0,
    status: 'APPROVED' as const,
    createdAt: new Date().toISOString(),
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Product Research Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Find and evaluate profitable AliExpress to Amazon arbitrage opportunities
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Margin Calculator */}
          <MarginCalculatorForm />

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="text-2xl font-bold text-gray-900">{SAMPLE_PRODUCTS.length}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Approved</div>
                <div className="text-2xl font-bold text-green-600">
                  {SAMPLE_PRODUCTS.filter(p => p.status === 'APPROVED').length}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Avg Margin</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(SAMPLE_PRODUCTS.reduce((acc, p) => acc + (p.estimatedMargin || 0), 0) / SAMPLE_PRODUCTS.length).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Avg Profit</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${(SAMPLE_PRODUCTS.reduce((acc, p) => acc + (p.estimatedProfit || 0), 0) / SAMPLE_PRODUCTS.length).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</h3>
              <div className="space-y-2">
                {['RESEARCH', 'EVALUATING', 'APPROVED', 'LAUNCHED'].map(status => {
                  const count = SAMPLE_PRODUCTS.filter(p => p.status === status).length
                  const percentage = (count / SAMPLE_PRODUCTS.length) * 100
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24">{status}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Product Candidates</h2>
          </div>
          <ProductTable products={SAMPLE_PRODUCTS} />
        </div>
      </main>
    </div>
  )
}
