'use client'

import { useEffect, useState } from 'react'
import { Inventory, enhanceInventoryWithAlerts, getAlertColor, calculateInventoryValue } from '@/lib/inventory-planner'

interface InventoryDashboardProps {
  onInventorySelect?: (inventory: Inventory) => void
}

export default function InventoryDashboard({ onInventorySelect }: InventoryDashboardProps) {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'low' | 'critical'>('all')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory')
      }
      
      setInventory(data.inventory)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const enhancedInventory = inventory.map(inv => enhanceInventoryWithAlerts(inv))
  
  const filteredInventory = enhancedInventory.filter(inv => {
    if (filter === 'all') return true
    if (filter === 'low') return inv.alertLevel === 'low' || inv.alertLevel === 'critical'
    if (filter === 'critical') return inv.alertLevel === 'critical'
    return true
  })

  const totalValue = calculateInventoryValue(inventory)
  const criticalCount = enhancedInventory.filter(inv => inv.alertLevel === 'critical').length
  const lowCount = enhancedInventory.filter(inv => inv.alertLevel === 'low').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading inventory...</div>
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Total SKUs</div>
          <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Inventory Value</div>
          <div className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Critical Stock</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-600">{lowCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
        >
          All ({inventory.length})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-md font-medium ${
            filter === 'low'
              ? 'bg-yellow-600 text-white'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
        >
          Low Stock ({lowCount + criticalCount})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded-md font-medium ${
            filter === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
        >
          Critical ({criticalCount})
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days of Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {filter === 'all'
                      ? 'No inventory yet. Add your first inventory item to track stock levels.'
                      : `No ${filter} stock items.`}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onInventorySelect?.(inv)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {inv.product?.title || 'Unknown Product'}
                      </div>
                      {inv.warehouseName && (
                        <div className="text-sm text-gray-500">
                          {inv.warehouseName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAlertColor(inv.alertLevel)}`}>
                        {inv.alertLevel === 'critical' && '⚠️ '}
                        {inv.alertLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {inv.sellableQuantity} sellable
                      </div>
                      {inv.reservedQuantity > 0 && (
                        <div className="text-xs text-gray-500">
                          {inv.reservedQuantity} reserved
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {inv.daysOfStock === 999 ? '∞' : inv.daysOfStock} days
                      </div>
                      <div className="text-xs text-gray-500">
                        Reorder at: {inv.reorderPoint}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${inv.unitCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(inv.unitCost * inv.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
