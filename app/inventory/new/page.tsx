"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"

export default function NewInventory() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sku: "",
    mpn: "",
    brand: "",
    category: "",
    description: "",
    quantityOnHand: "0",
    costCad: "",
    costUsd: "",
    warehouseLocation: "",
    lowStockThreshold: "5",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await inventoryApi.create({
        ...formData,
        quantityOnHand: parseInt(formData.quantityOnHand),
        costCad: formData.costCad ? parseFloat(formData.costCad) : null,
        costUsd: formData.costUsd ? parseFloat(formData.costUsd) : null,
        lowStockThreshold: parseInt(formData.lowStockThreshold),
      })

      if (response.success) {
        toast.success("Inventory item created successfully")
        router.push("/inventory")
      } else {
        toast.error(response.message || "Failed to create inventory item")
      }
    } catch (error) {
      toast.error("An error occurred while creating the inventory item")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="New Inventory Item" subtitle="Add a new item to your inventory" />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    placeholder="Enter SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mpn">MPN</Label>
                  <Input
                    id="mpn"
                    name="mpn"
                    value={formData.mpn}
                    onChange={handleChange}
                    required
                    placeholder="Enter Manufacturer Part Number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="Enter brand name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TONER">Toner</SelectItem>
                      <SelectItem value="DRUM">Drum</SelectItem>
                      <SelectItem value="INK">Ink</SelectItem>
                      <SelectItem value="PARTS">Parts</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Enter item description"
                  />
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="costCad">Cost (CAD)</Label>
                  <Input
                    id="costCad"
                    name="costCad"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costCad}
                    onChange={handleChange}
                    required
                    placeholder="Enter cost in CAD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costUsd">Cost (USD)</Label>
                  <Input
                    id="costUsd"
                    name="costUsd"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costUsd}
                    onChange={handleChange}
                    placeholder="Enter cost in USD (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouseLocation">Warehouse Location</Label>
                  <Input
                    id="warehouseLocation"
                    name="warehouseLocation"
                    value={formData.warehouseLocation}
                    onChange={handleChange}
                    placeholder="Enter warehouse location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
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

                <div className="md:col-span-2 flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Item"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
} 