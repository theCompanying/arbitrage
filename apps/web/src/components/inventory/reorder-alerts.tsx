'use client'

import { useEffect, useState } from 'react'
import { InventoryWithAlert, fetchLowStockInventory, getAlertColor } from '@/lib/inventory-planner'

export default function ReorderAlerts() {
  const [alerts, setAlerts] = useState<InventoryWithAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const data = await fetchLowStockInventory()
      setAlerts(data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading alerts...</div>
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
        <div className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>All inventory levels are healthy. No reorders needed.</span>
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical')
  const lowAlerts = alerts.filter(a => a.alertLevel === 'low')

  return (
    <div className="space-y-4">
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">
            ⚠️ Critical Stock ({criticalAlerts.length})
          </h3>
          <div className="space-y-2">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-red-900">
                    {alert.product?.title || 'Unknown Product'}
                  </div>
                  <div className="text-sm text-red-700">
                    {alert.sellableQuantity} units left • Reorder point: {alert.reorderPoint}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-red-900">
                    Order: {alert.reorderPoint * 2 - alert.sellableQuantity} units
                  </div>
                  <div className="text-xs text-red-700">
                    Est. cost: ${(alert.reorderPoint * 2 - alert.sellableQuantity) * alert.unitCost}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            ⚡ Low Stock ({lowAlerts.length})
          </h3>
          <div className="space-y-2">
            {lowAlerts.map(alert => (
              <div key={alert.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-yellow-900">
                    {alert.product?.title || 'Unknown Product'}
                  </div>
                  <div className="text-sm text-yellow-700">
                    {alert.daysOfStock} days of stock remaining
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-yellow-900">
                    Plan reorder soon
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
