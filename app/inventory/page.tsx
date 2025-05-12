"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, ArrowUpDown, Package } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"

export default function Inventory() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Inventory Management" subtitle="Track and manage your product inventory" showDateFilter />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total SKUs</div>
                <div className="text-2xl font-bold">1,248</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">In Stock</div>
                <div className="text-2xl font-bold">876</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
                <div className="text-2xl font-bold">14</div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Inventory Items</h2>
              <div className="flex gap-2">
                <Input type="search" placeholder="Search SKUs..." className="w-64" />
                <Button>Add SKU</Button>
              </div>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="in-stock">In Stock</TabsTrigger>
                <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
                <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="m-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            SKU ID
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Description
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            In Stock
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Avg. Cost
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Last Sale
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <InventoryRow
                        sku="CF226X"
                        description="HP 26X High Yield Black Toner"
                        stock={24}
                        costCAD={89.5}
                        lastSale="4/15/2025"
                      />
                      <InventoryRow
                        sku="CE255X"
                        description="HP 55X High Yield Black Toner"
                        stock={12}
                        costCAD={78.25}
                        lastSale="4/18/2025"
                      />
                      <InventoryRow
                        sku="CE505X"
                        description="HP 05X High Yield Black Toner"
                        stock={3}
                        costCAD={65.75}
                        lastSale="4/20/2025"
                        lowStock
                      />
                      <InventoryRow
                        sku="Q2612A"
                        description="HP 12A Black Toner"
                        stock={0}
                        costCAD={45.99}
                        lastSale="4/10/2025"
                        outOfStock
                      />
                      <InventoryRow
                        sku="CC364X"
                        description="HP 64X High Yield Black Toner"
                        stock={18}
                        costCAD={112.5}
                        lastSale="4/22/2025"
                      />
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="in-stock" className="m-0">
                {/* Similar table structure for in-stock items */}
              </TabsContent>

              <TabsContent value="low-stock" className="m-0">
                {/* Similar table structure for low-stock items */}
              </TabsContent>

              <TabsContent value="out-of-stock" className="m-0">
                {/* Similar table structure for out-of-stock items */}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface InventoryRowProps {
  sku: string
  description: string
  stock: number
  costCAD: number
  lastSale: string
  lowStock?: boolean
  outOfStock?: boolean
}

function InventoryRow({ sku, description, stock, costCAD, lastSale, lowStock, outOfStock }: InventoryRowProps) {
  const { currency, formatCurrency, convertCurrency } = useCurrency()

  // Format the cost based on the selected currency
  const formattedCost = formatCurrency(currency === "CAD" ? costCAD : convertCurrency(costCAD, "CAD"))

  return (
    <tr className="border-b">
      <td className="py-3">{sku}</td>
      <td className="py-3">{description}</td>
      <td className="py-3">
        {outOfStock ? (
          <span className="status-rejected">Out of Stock</span>
        ) : lowStock ? (
          <span className="status-pending">{stock} (Low)</span>
        ) : (
          <span>{stock}</span>
        )}
      </td>
      <td className="py-3">{formattedCost}</td>
      <td className="py-3">{lastSale}</td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </div>
      </td>
    </tr>
  )
}
