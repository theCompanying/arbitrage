'use client'

import { useEffect, useState } from 'react'
import { calculateSupplierScore, getSupplierRatingLabel, SupplierWithProducts } from '@/lib/supplier-operations'

interface SupplierListProps {
  onSupplierSelect?: (supplier: SupplierWithProducts) => void
}

export default function SupplierList({ onSupplierSelect }: SupplierListProps) {
  const [suppliers, setSuppliers] = useState<SupplierWithProducts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suppliers')
      }
      
      setSuppliers(data.suppliers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading suppliers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MOQ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No suppliers yet. Add your first supplier to track sample orders and communications.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => {
                const score = calculateSupplierScore(supplier)
                const ratingLabel = getSupplierRatingLabel(score)
                
                return (
                  <tr
                    key={supplier.id}
                    onClick={() => onSupplierSelect?.(supplier)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          {supplier.contactName && (
                            <div className="text-sm text-gray-500">
                              {supplier.contactName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {supplier.rating ? (
                          <>
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="text-sm text-gray-900">
                              {supplier.rating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        score >= 80 ? 'bg-green-100 text-green-800' :
                        score >= 60 ? 'bg-blue-100 text-blue-800' :
                        score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {score}/100 - {ratingLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier._count.products} products
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.moq ? supplier.moq : '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
