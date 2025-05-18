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
import { useState, useEffect } from "react"
import { inventoryApi, vendorApi } from "@/lib/api-client"
import { toast } from "sonner"

interface Vendor {
  id: number
  name: string
  email: string | null
  phone: string | null
  contactPerson: string | null
  isActive: boolean
}

export default function NewInventory() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [vendorsError, setVendorsError] = useState<string | null>(null)
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
    vendorId: "",
    poNumber: ""  // Purchase Order number
  })

  const fetchVendors = async () => {
    if (vendors.length > 0) {
      console.log("Using cached vendors:", vendors);
      return;
    }
    
    console.log("Starting to fetch vendors...");
    setVendorsLoading(true)
    setVendorsError(null)
    try {
      const response = await vendorApi.list()
      console.log("Vendor API response:", response);
      
      if (response?.success && Array.isArray(response?.data)) {
        console.log("Setting vendors with data:", response.data);
        setVendors(response.data)
        if (response.data.length === 0) {
          setVendorsError('No vendors found. Please add vendors first.')
        }
      } else {
        console.log("Invalid vendor response format:", response);
        setVendorsError(response?.message || 'Failed to fetch vendors')
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
      setVendorsError('Failed to fetch vendors. Please try again.')
    } finally {
      setVendorsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First create the inventory item
      const response = await inventoryApi.create({
        ...formData,
        quantityOnHand: parseInt(formData.quantityOnHand),
        costCad: formData.costCad ? parseFloat(formData.costCad) : null,
        costUsd: formData.costUsd ? parseFloat(formData.costUsd) : null,
        lowStockThreshold: parseInt(formData.lowStockThreshold),
      })

      if (response.success) {
        // If vendor and PO number are provided, create a purchase record
        if (formData.vendorId && formData.poNumber && response.data && typeof response.data === 'object' && 'id' in response.data) {
          const purchaseResponse = await fetch('/api/purchase-orders/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vendorId: parseInt(formData.vendorId),
              poNumber: formData.poNumber,
              items: [{
                productId: response.data.id,
                quantity: parseInt(formData.quantityOnHand),
                unitCost: formData.costCad ? parseFloat(formData.costCad) : 0,
                extendedCost: formData.costCad ? parseFloat(formData.costCad) * parseInt(formData.quantityOnHand) : 0
              }]
            })
          })

          if (!purchaseResponse.ok) {
            toast.error("Item created but failed to record purchase information")
          }
        }

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

  const handleOpenChange = (open: boolean) => {
    console.log("Dropdown open state changed:", open);
    if (open) {
      console.log("Triggering vendor fetch...");
      fetchVendors();
    }
  };

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
                  <Label htmlFor="vendorId">Vendor</Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => handleSelectChange("vendorId", value)}
                    disabled={vendorsLoading}
                    onOpenChange={handleOpenChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading vendors...
                        </SelectItem>
                      ) : vendorsError ? (
                        <SelectItem value="error" disabled>
                          {vendorsError}
                        </SelectItem>
                      ) : vendors.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No vendors available. Please add vendors first.
                        </SelectItem>
                      ) : (
                        vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name} {vendor.contactPerson ? `(${vendor.contactPerson})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {vendorsError && (
                    <p className="text-sm text-red-500 mt-1">{vendorsError}</p>
                  )}
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

                <div className="space-y-2">
                  <Label htmlFor="poNumber">Purchase Order Number</Label>
                  <Input
                    id="poNumber"
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleChange}
                    placeholder="Enter PO number"
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