'use client'

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
}

interface ProductTableProps {
  products: Product[]
  onSelect?: (product: Product) => void
}

export default function ProductTable({ products, onSelect }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No products found. Add your first product to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              AE Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              AMZ Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Margin
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profit
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              BSR
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reviews
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr
              key={product.id}
              onClick={() => onSelect?.(product)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-4 py-4">
                <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={product.title}>
                  {product.title}
                </div>
                {product.asin && (
                  <div className="text-xs text-gray-500">ASIN: {product.asin}</div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 capitalize">
                  {product.category?.replace('_', ' ') || '-'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  ${product.aliexpressPrice?.toFixed(2) || '-'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  ${product.amazonPrice?.toFixed(2) || '-'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`text-sm font-semibold ${
                  (product.estimatedMargin || 0) >= 30 ? 'text-green-600' :
                  (product.estimatedMargin || 0) >= 25 ? 'text-green-600' :
                  (product.estimatedMargin || 0) >= 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {product.estimatedMargin?.toFixed(1) || '-'}%
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  ${product.estimatedProfit?.toFixed(2) || '-'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`text-sm ${
                  (product.bsr || 999999) < 10000 ? 'text-green-600 font-medium' :
                  (product.bsr || 999999) < 50000 ? 'text-yellow-600' : 'text-gray-900'
                }`}>
                  {product.bsr?.toLocaleString() || '-'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {product.reviewCount !== undefined && product.avgRating !== undefined ? (
                  <div className="text-sm text-gray-900">
                    {product.reviewCount.toLocaleString()} ({product.avgRating}★)
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <StatusBadge status={product.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
