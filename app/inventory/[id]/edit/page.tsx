"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"

interface InventoryItem {
  id: number
  sku: string
  mpn: string
  brand: string
  description: string
  quantityOnHand: number
  quantityReserved: number
  costCad: number | null
  costUsd: number | null
  warehouseLocation: string | null
  lowStockThreshold: number
  lastSaleDate: string | null
  quickbooksItemId: string | null
  createdAt: string
  updatedAt: string
}

export default function InventoryItemEdit({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    sku: "",
    mpn: "",
    brand: "",
    description: "",
    quantityOnHand: 0,
    quantityReserved: 0,
    costCad: null,
    costUsd: null,
    warehouseLocation: null,
    lowStockThreshold: 5
  })

  useEffect(() => {
    fetchItem()
  }, [params.id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.get(params.id)
      if (response.success && response.data) {
        setFormData(response.data)
      } else {
        toast.error("Failed to load inventory item")
      }
    } catch (error) {
      toast.error("An error occurred while loading the item")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await inventoryApi.update(params.id, formData)
      if (response.success) {
        toast.success("Inventory item updated successfully")
        router.push(`/inventory/${params.id}`)
      } else {
        toast.error("Failed to update inventory item")
      }
    } catch (error) {
      toast.error("An error occurred while updating the item")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantityOnHand" ||
        name === "quantityReserved" ||
        name === "costCad" ||
        name === "costUsd" ||
        name === "lowStockThreshold"
          ? parseFloat(value) || 0
          : value,
    }));
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Edit Inventory Item"
            subtitle="Update inventory item details"
          />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="flex justify-center items-center">
                <Spinner size={32} />
              </div>
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
        <Header
          title="Edit Inventory Item"
          subtitle="Update inventory item details"
        />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpn">MPN</Label>
                    <Input
                      id="mpn"
                      name="mpn"
                      value={formData.mpn}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Stock Information</h3>
                  <div>
                    <Label htmlFor="quantityOnHand">Quantity On Hand</Label>
                    <Input
                      id="quantityOnHand"
                      name="quantityOnHand"
                      type="number"
                      min="0"
                      value={formData.quantityOnHand}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantityReserved">Reserved Quantity</Label>
                    <Input
                      id="quantityReserved"
                      name="quantityReserved"
                      type="number"
                      min="0"
                      value={formData.quantityReserved}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="costCad">Cost (CAD)</Label>
                    <Input
                      id="costCad"
                      name="costCad"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costCad || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="costUsd">Cost (USD)</Label>
                    <Input
                      id="costUsd"
                      name="costUsd"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costUsd || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Additional Information
                  </h3>
                  <div>
                    <Label htmlFor="warehouseLocation">
                      Warehouse Location
                    </Label>
                    <Input
                      id="warehouseLocation"
                      name="warehouseLocation"
                      value={formData.warehouseLocation || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      name="lowStockThreshold"
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quickbooksItemId">QuickBooks Item ID</Label>
                    <Input
                      id="quickbooksItemId"
                      name="quickbooksItemId"
                      value={formData.quickbooksItemId || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
