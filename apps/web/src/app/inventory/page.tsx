'use client'

import { useState } from 'react'
import InventoryDashboard from '@/components/inventory/inventory-dashboard'
import ReorderAlerts from '@/components/inventory/reorder-alerts'
import { Inventory } from '@/lib/inventory-planner'

export default function InventoryPage() {
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Planner</h1>
            <p className="text-gray-600 mt-1">
              Track FBA stock levels, reorder points, and cash flow
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
          >
            Add Inventory
          </button>
        </div>

        {/* Reorder Alerts */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Stock Alerts</h2>
          <ReorderAlerts />
        </div>

        {/* Inventory Dashboard */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Inventory Overview</h2>
          <InventoryDashboard onInventorySelect={setSelectedInventory} />
        </div>

        {showAddModal && (
          <AddInventoryModal
            onClose={() => setShowAddModal(false)}
            onAdded={() => {
              setShowAddModal(false)
              window.location.reload()
            }}
          />
        )}
      </div>
    </div>
  )
}

interface AddInventoryModalProps {
  onClose: () => void
  onAdded: () => void
}

function AddInventoryModal({ onClose, onAdded }: AddInventoryModalProps) {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    sellableQuantity: 0,
    reservedQuantity: 0,
    unitCost: 0,
    totalCost: 0,
    shippingCost: 0,
    warehouseName: '',
  })
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create inventory')
      }

      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Add Inventory</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select a product</option>
              {/* Would populate from API in real app */}
              <option value="demo">Demo Product</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sellable
              </label>
              <input
                type="number"
                min="0"
                value={formData.sellableQuantity}
                onChange={(e) => setFormData({ ...formData, sellableQuantity: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reserved
              </label>
              <input
                type="number"
                min="0"
                value={formData.reservedQuantity}
                onChange={(e) => setFormData({ ...formData, reservedQuantity: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cost ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Name
            </label>
            <input
              type="text"
              value={formData.warehouseName}
              onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., FBA Warehouse ONT2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Add Inventory'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
