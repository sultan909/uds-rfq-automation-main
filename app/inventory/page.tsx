"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, Package } from "lucide-react"
import { useEffect, useState } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface InventoryTableRowProps {
  id: string
  sku: string
  name: string
  brand: string
  stock: number
  unitPrice: number
  warehouse_location: string
  status: string
  onView: (id: string) => void
  onEdit: (id: string) => void
}

export default function InventoryManagement() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0
  })

  useEffect(() => {
    fetchInventory()
  }, [selectedTab])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const params = selectedTab === "all" ? {} : { status: selectedTab.toUpperCase() }
      const response = await inventoryApi.list(params)
      
      if (response.success && response.data) {
        const inventoryData = response.data as any[]
        setItems(inventoryData)
        
        // Calculate statistics
        setStats({
          total: inventoryData.length,
          lowStock: inventoryData.filter(item => item.quantity <= item.minStockLevel).length,
          outOfStock: inventoryData.filter(item => item.quantity === 0).length
        })
      } else {
        setError("Failed to load inventory")
        toast.error("Failed to load inventory")
      }
    } catch (err) {
      setError("An error occurred while loading inventory")
      toast.error("An error occurred while loading inventory")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchInventory()
      return
    }

    try {
      setLoading(true)
      const response = await inventoryApi.search(searchQuery, { status: selectedTab === "all" ? undefined : selectedTab.toUpperCase() })
      if (response.success && response.data) {
        setItems(response.data as any[])
      } else {
        setError("Failed to search inventory")
        toast.error("Failed to search inventory")
      }
    } catch (err) {
      setError("An error occurred while searching inventory")
      toast.error("An error occurred while searching inventory")
    } finally {
      setLoading(false)
    }
  }

  const handleView = (id: string) => {
    router.push(`/inventory/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/inventory/${id}/edit`)
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Inventory Management" subtitle="Manage and track inventory items" showNewInventory />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Items</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
                <div className="text-2xl font-bold">{stats.lowStock}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Out of Stock</div>
                <div className="text-2xl font-bold">{stats.outOfStock}</div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Inventory List</h2>
              <div className="flex gap-2">
                <Input 
                  type="search" 
                  placeholder="Search inventory..." 
                  className="w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
                <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="m-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            SKU
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Name
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Brand
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Stock
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Unit Price
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Location
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">Loading...</td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-red-500">{error}</td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">No items found</td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <InventoryTableRow
                            key={item.id}
                            id={item.id}
                            sku={item.sku}
                            name={item.name}
                            brand={item.brand}
                            stock={item.quantity}
                            unitPrice={item.unitPrice}
                            warehouse_location={item.warehouseLocation}
                            status={item.status}
                            onView={handleView}
                            onEdit={handleEdit}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InventoryTableRow({ 
  id, 
  sku, 
  name, 
  brand, 
  stock, 
  unitPrice, 
  warehouse_location, 
  status,
  onView,
  onEdit 
}: InventoryTableRowProps) {
  const getStatusClass = (stock: number, minStockLevel: number) => {
    if (stock === 0) return "status-declined"
    if (stock <= minStockLevel) return "status-pending"
    return "status-processed"
  }

  return (
    <tr className="border-b">
      <td className="py-3">{sku}</td>
      <td className="py-3">{name}</td>
      <td className="py-3">{brand}</td>
      <td className="py-3">
        <span className={getStatusClass(stock, 5)}>
          {stock}
        </span>
      </td>
      <td className="py-3">${unitPrice ? unitPrice.toFixed(2) : '0.00'}</td>
      <td className="py-3">{warehouse_location}</td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onView(id)}
          >
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(id)}
          >
            Edit
          </Button>
        </div>
      </td>
    </tr>
  )
}
