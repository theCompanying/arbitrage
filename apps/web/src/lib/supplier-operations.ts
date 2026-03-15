export interface Supplier {
  id: string
  name: string
  aliexpressUrl: string | null
  contactEmail: string | null
  contactName: string | null
  rating: number | null
  yearsInBusiness: number | null
  responseRate: number | null
  responseTime: string | null
  moq: number | null
  leadTimeDays: number | null
  customLogo: boolean
  customPackaging: boolean
  notes: string | null
  rating_internal: number | null
  createdAt: string
  updatedAt: string
}

export interface SupplierWithProducts extends Supplier {
  products: Array<{
    id: string
    title: string
    status: string
  }>
  _count: {
    products: number
    orders: number
  }
}

export async function fetchSuppliers(): Promise<SupplierWithProducts[]> {
  const response = await fetch('/api/suppliers')
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch suppliers')
  }
  
  return data.suppliers
}

export async function fetchSupplier(id: string) {
  const response = await fetch(`/api/suppliers/${id}`)
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch supplier')
  }
  
  return data.supplier
}

export async function createSupplier(data: Partial<Supplier>) {
  const response = await fetch('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create supplier')
  }
  
  return result.supplier
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to update supplier')
  }
  
  return result.supplier
}

export async function deleteSupplier(id: string) {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete supplier')
  }
  
  return true
}

export function calculateSupplierScore(supplier: Supplier): number {
  let score = 0
  
  if (supplier.rating && supplier.rating >= 4.5) score += 25
  else if (supplier.rating && supplier.rating >= 4.0) score += 15
  else if (supplier.rating && supplier.rating >= 3.5) score += 5
  
  if (supplier.yearsInBusiness && supplier.yearsInBusiness >= 5) score += 20
  else if (supplier.yearsInBusiness && supplier.yearsInBusiness >= 3) score += 10
  else if (supplier.yearsInBusiness && supplier.yearsInBusiness >= 1) score += 5
  
  if (supplier.responseRate && supplier.responseRate >= 95) score += 20
  else if (supplier.responseRate && supplier.responseRate >= 80) score += 10
  else if (supplier.responseRate && supplier.responseRate >= 60) score += 5
  
  if (supplier.leadTimeDays && supplier.leadTimeDays <= 7) score += 15
  else if (supplier.leadTimeDays && supplier.leadTimeDays <= 14) score += 10
  else if (supplier.leadTimeDays && supplier.leadTimeDays <= 30) score += 5
  
  if (supplier.customLogo) score += 10
  if (supplier.customPackaging) score += 10
  
  if (supplier.rating_internal && supplier.rating_internal >= 4) score += 10
  else if (supplier.rating_internal && supplier.rating_internal >= 3) score += 5
  
  return Math.min(100, score)
}

export function getSupplierRatingLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}
