"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"

interface InventoryItem {
  id: string
  sku: string
  name: string
  brand: string
  stock: number
  unitPrice: number
  warehouse_location: string
  status: string
  description?: string
  minStockLevel: number
  maxStockLevel?: number
  supplier?: string
}

export default function InventoryItemView({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)

  useEffect(() => {
    fetchItem()
  }, [resolvedParams.id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.get(resolvedParams.id)
      if (response.success && response.data) {
        setItem(response.data as InventoryItem)
      } else {
        toast.error("Failed to load inventory item")
      }
    } catch (error) {
      toast.error("An error occurred while loading the item")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/inventory/${resolvedParams.id}/edit`)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Inventory Item" subtitle="View inventory item details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="text-center">Loading...</div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Inventory Item" subtitle="View inventory item details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="text-center text-red-500">Item not found</div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Inventory Item" subtitle="View inventory item details" />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{item.name}</h2>
              <Button onClick={handleEdit}>Edit Item</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">SKU</label>
                    <div className="font-medium">{item.sku}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Brand</label>
                    <div className="font-medium">{item.brand}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <div className="font-medium">{item.description || "No description"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Stock Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Current Stock</label>
                    <div className="font-medium">{item.stock}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Unit Price</label>
                    <div className="font-medium">${item.unitPrice?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Warehouse Location</label>
                    <div className="font-medium">{item.warehouse_location}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Minimum Stock Level</label>
                    <div className="font-medium">{item.minStockLevel}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Maximum Stock Level</label>
                    <div className="font-medium">{item.maxStockLevel || "Not set"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Supplier</label>
                    <div className="font-medium">{item.supplier || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className="font-medium">{item.status}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 