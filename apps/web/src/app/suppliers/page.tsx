'use client'

import { useState } from 'react'
import SupplierList from '@/components/suppliers/supplier-list'
import SupplierModal from '@/components/suppliers/supplier-modal'
import { SupplierWithProducts } from '@/lib/supplier-operations'

export default function SuppliersPage() {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithProducts | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleSupplierSelect = (supplier: SupplierWithProducts) => {
    setSelectedSupplier(supplier)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">
              Manage supplier relationships and track sample orders
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
          >
            Add Supplier
          </button>
        </div>

        <SupplierList onSupplierSelect={handleSupplierSelect} />

        <SupplierModal
          supplier={selectedSupplier}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedSupplier(null)
          }}
          onUpdate={() => {
            setModalOpen(false)
            setSelectedSupplier(null)
            window.location.reload()
          }}
        />

        {showAddModal && (
          <AddSupplierModal
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

interface AddSupplierModalProps {
  onClose: () => void
  onAdded: () => void
}

function AddSupplierModal({ onClose, onAdded }: AddSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    aliexpressUrl: '',
    contactEmail: '',
    contactName: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supplier')
      }

      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Add New Supplier</h2>
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
              Supplier Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Shenzhen Electronics Co., Ltd."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AliExpress Store URL
            </label>
            <input
              type="url"
              value={formData.aliexpressUrl}
              onChange={(e) => setFormData({ ...formData, aliexpressUrl: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="https://www.aliexpress.com/store/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Add initial notes about this supplier..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Creating...' : 'Create Supplier'}
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
