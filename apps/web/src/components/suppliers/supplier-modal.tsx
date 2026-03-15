'use client'

import { useState, useEffect } from 'react'
import { Supplier, updateSupplier } from '@/lib/supplier-operations'

interface SupplierModalProps {
  supplier: Supplier | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export default function SupplierModal({
  supplier,
  isOpen,
  onClose,
  onUpdate,
}: SupplierModalProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Supplier>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (supplier) {
      setFormData(supplier)
    }
    setEditing(false)
    setError(null)
  }, [supplier])

  const handleSave = async () => {
    if (!supplier) return
    
    setSaving(true)
    setError(null)
    
    try {
      await updateSupplier(supplier.id, formData)
      setEditing(false)
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Supplier, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen || !supplier) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{supplier.name}</h2>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData(supplier)
                  }}
                  className="text-gray-600 hover:underline text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Contact Information */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.contactName || ''}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <div className="text-gray-900">{supplier.contactName || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <div className="text-gray-900">{supplier.contactEmail || '-'}</div>
                )}
              </div>
            </div>
          </section>

          {/* Ratings */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Ratings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AliExpress Rating
                </label>
                {editing ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating || ''}
                    onChange={(e) => handleChange('rating', parseFloat(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="0.0 - 5.0"
                  />
                ) : (
                  <div className="text-gray-900">
                    {supplier.rating ? `${supplier.rating.toFixed(1)} ★` : '-'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Rating
                </label>
                {editing ? (
                  <select
                    value={formData.rating_internal || ''}
                    onChange={(e) => handleChange('rating_internal', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Not rated</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                ) : (
                  <div className="text-gray-900">
                    {supplier.rating_internal ? `${supplier.rating_internal}/5` : 'Not rated'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Business Info */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years in Business
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.yearsInBusiness || ''}
                    onChange={(e) => handleChange('yearsInBusiness', parseInt(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <div className="text-gray-900">{supplier.yearsInBusiness || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Rate
                </label>
                {editing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.responseRate || ''}
                    onChange={(e) => handleChange('responseRate', parseFloat(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="0-100%"
                  />
                ) : (
                  <div className="text-gray-900">
                    {supplier.responseRate ? `${supplier.responseRate}%` : '-'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Time
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.responseTime || ''}
                    onChange={(e) => handleChange('responseTime', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="e.g., < 24 hours"
                  />
                ) : (
                  <div className="text-gray-900">{supplier.responseTime || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Time (days)
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.leadTimeDays || ''}
                    onChange={(e) => handleChange('leadTimeDays', parseInt(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <div className="text-gray-900">{supplier.leadTimeDays || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MOQ
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.moq || ''}
                    onChange={(e) => handleChange('moq', parseInt(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <div className="text-gray-900">{supplier.moq || '-'}</div>
                )}
              </div>
            </div>
          </section>

          {/* Capabilities */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.customLogo || false}
                  onChange={(e) => handleChange('customLogo', e.target.checked)}
                  disabled={!editing}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-gray-700">Custom Logo Available</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.customPackaging || false}
                  onChange={(e) => handleChange('customPackaging', e.target.checked)}
                  disabled={!editing}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-gray-700">Custom Packaging Available</span>
              </label>
            </div>
          </section>

          {/* Links */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Links</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AliExpress Store URL
              </label>
              {editing ? (
                <input
                  type="url"
                  value={formData.aliexpressUrl || ''}
                  onChange={(e) => handleChange('aliexpressUrl', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              ) : supplier.aliexpressUrl ? (
                <a
                  href={supplier.aliexpressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {supplier.aliexpressUrl}
                </a>
              ) : (
                <div className="text-gray-900">-</div>
              )}
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Notes</h3>
            {editing ? (
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Add notes about this supplier..."
              />
            ) : (
              <div className="text-gray-900 whitespace-pre-wrap">
                {supplier.notes || 'No notes'}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
