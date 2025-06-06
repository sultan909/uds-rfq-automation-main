"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useCurrency } from "@/contexts/currency-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InventoryItem {
  id: number
  sku: string
  mpn: string
  brand: string
  description: string
  quantityOnHand: number
  quantityReserved: number
  cost: number | null
  costCurrency: string
  warehouseLocation: string | null
  lowStockThreshold: number
  lastSaleDate: string | null
  quickbooksItemId: string | null
  createdAt: string
  updatedAt: string
  category: string
}

export default function InventoryItemEdit({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { currency } = useCurrency()
  const [formData, setFormData] = useState({
    sku: "",
    mpn: "",
    brand: "",
    category: "OTHER",
    description: "",
    quantityOnHand: "",
    quantityReserved: "",
    cost: "",
    costCurrency: "CAD",
    warehouseLocation: "",
    lowStockThreshold: "",
    quickbooksItemId: "",
  })

  useEffect(() => {
    fetchItem()
  }, [params.id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.getById(parseInt(params.id))
      if (response.success && response.data) {
        const item = response.data
        setFormData({
          sku: item.sku || "",
          mpn: item.mpn || "",
          brand: item.brand || "",
          category: item.category || "OTHER",
          description: item.description || "",
          quantityOnHand: item.quantityOnHand?.toString() || "0",
          quantityReserved: item.quantityReserved?.toString() || "0",
          cost: item.cost?.toString() || "",
          costCurrency: item.costCurrency || "CAD",
          warehouseLocation: item.warehouseLocation || "",
          lowStockThreshold: item.lowStockThreshold?.toString() || "5",
          quickbooksItemId: item.quickbooksItemId || "",
        })
      } else {
        toast.error("Failed to fetch inventory item")
      }
    } catch (error) {
      toast.error("Failed to fetch inventory item")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await inventoryApi.update(parseInt(params.id), {
        ...formData,
        quantityOnHand: parseInt(formData.quantityOnHand),
        quantityReserved: parseInt(formData.quantityReserved),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        lowStockThreshold: parseInt(formData.lowStockThreshold),
      })

      if (response.success) {
        toast.success("Inventory item updated successfully")
        router.push(`/inventory/${params.id}`)
      } else {
        toast.error("Failed to update inventory item")
      }
    } catch (error) {
      toast.error("An error occurred while updating the inventory item")
    } finally {
      setLoading(false)
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
      [name]: value,
    }));
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Edit Inventory Item</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <div className="space-y-2">
                        <Label htmlFor="cost">Cost</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cost"
                            name="cost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.cost}
                            onChange={handleChange}
                            className="flex-1"
                          />
                          <Select 
                            value={formData.costCurrency} 
                            onValueChange={(value) => handleSelectChange("costCurrency", value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                          value={formData.warehouseLocation}
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
                          value={formData.quickbooksItemId}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/inventory/${params.id}`)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update Item"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
