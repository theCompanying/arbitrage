export interface Inventory {
  id: string
  productId: string
  quantity: number
  reservedQuantity: number
  sellableQuantity: number
  warehouseId: string | null
  warehouseName: string | null
  unitCost: number
  totalCost: number
  shippingCost: number | null
  receivedAt: string | null
  createdAt: string
  product?: {
    id: string
    title: string
    amazonPrice: number | null
    aliexpressPrice: number | null
    bsr: number | null
  }
}

export interface InventoryWithAlert extends Inventory {
  reorderPoint: number
  daysOfStock: number
  alertLevel: 'critical' | 'low' | 'ok' | 'overstock'
}

export async function fetchInventory(productId?: string): Promise<Inventory[]> {
  const url = productId ? `/api/inventory?productId=${productId}` : '/api/inventory'
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch inventory')
  }
  
  return data.inventory
}

export async function fetchLowStockInventory(): Promise<InventoryWithAlert[]> {
  const response = await fetch('/api/inventory?lowStock=true')
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch low stock inventory')
  }
  
  return data.inventory.map(enhanceInventoryWithAlerts)
}

export async function createInventory(data: Partial<Inventory>) {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create inventory')
  }
  
  return result.inventory
}

export async function updateInventory(id: string, data: Partial<Inventory>) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to update inventory')
  }
  
  return result.inventory
}

export function calculateReorderPoint(
  avgDailySales: number = 5,
  leadTimeDays: number = 14,
  safetyStock: number = 10
): number {
  return (avgDailySales * leadTimeDays) + safetyStock
}

export function calculateDaysOfStock(sellableQuantity: number, avgDailySales: number): number {
  if (avgDailySales <= 0) return 999
  return Math.round(sellableQuantity / avgDailySales)
}

export function getAlertLevel(daysOfStock: number, reorderPoint: number, currentStock: number): 'critical' | 'low' | 'ok' | 'overstock' {
  if (currentStock <= 0) return 'critical'
  if (currentStock <= reorderPoint * 0.5) return 'critical'
  if (currentStock <= reorderPoint) return 'low'
  if (daysOfStock > 90) return 'overstock'
  return 'ok'
}

export function enhanceInventoryWithAlerts(inv: Inventory, avgDailySales: number = 5): InventoryWithAlert {
  const reorderPoint = calculateReorderPoint(avgDailySales)
  const daysOfStock = calculateDaysOfStock(inv.sellableQuantity, avgDailySales)
  const alertLevel = getAlertLevel(daysOfStock, reorderPoint, inv.sellableQuantity)
  
  return {
    ...inv,
    reorderPoint,
    daysOfStock,
    alertLevel,
  }
}

export function calculateInventoryValue(inventory: Inventory[]): number {
  return inventory.reduce((sum, inv) => sum + (inv.unitCost * inv.quantity), 0)
}

export function calculateCashFlowProjection(
  inventory: Inventory[],
  avgDailySales: number = 5,
  unitCost: number = 5
): {
  currentStock: number
  daysUntilReorder: number
  reorderQuantity: number
  estimatedReorderCost: number
} {
  const totalStock = inventory.reduce((sum, inv) => sum + inv.sellableQuantity, 0)
  const reorderPoint = calculateReorderPoint(avgDailySales)
  const daysUntilReorder = Math.max(0, Math.round((totalStock - reorderPoint) / avgDailySales))
  
  const targetStock = reorderPoint * 2
  const reorderQuantity = Math.max(0, targetStock - totalStock)
  const estimatedReorderCost = reorderQuantity * unitCost
  
  return {
    currentStock: totalStock,
    daysUntilReorder,
    reorderQuantity,
    estimatedReorderCost,
  }
}

export function getAlertColor(alertLevel: string): string {
  switch (alertLevel) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'low':
      return 'bg-yellow-100 text-yellow-800'
    case 'overstock':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-green-100 text-green-800'
  }
}
