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
import { useCurrency } from "@/contexts/currency-context"
import { Spinner } from "@/components/spinner"

interface InventoryTableRowProps {
  id: string
  sku: string
  name: string
  brand: string
  stock: number
  unitPrice: number
  warehouse_location: string
  status: string
  category: string
  onView: (id: string) => void
  onEdit: (id: string) => void
}

interface InventoryItem {
  id: number
  sku: string
  description: string
  brand: string
  category: string
  quantityOnHand: number
  quantityReserved: number
  lowStockThreshold: number
  costCad: number | null
  warehouseLocation: string | null
}

interface CategoryCount {
  category: string
  count: number
}

interface InventoryApiResponse {
  items: InventoryItem[]
  categories: CategoryCount[]
}

export default function InventoryManagement() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    active: 0
  })
  const { currency, formatCurrency, convertCurrency } = useCurrency();

  useEffect(() => {
    fetchInventory()
  }, [selectedTab])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      let params = {};

      switch (selectedTab) {
        case "low_stock":
          params = { lowStock: true };
          break;
        case "out_of_stock":
          params = { outOfStock: true };
          break;
        case "active":
          params = { status: "ACTIVE" };
          break;
      }

      const response = await inventoryApi.list(params)

      if (response.success && response.data) {
        const { items: inventoryData, categories } =
          response.data as InventoryApiResponse
        setItems(inventoryData)

        // Calculate statistics
        setStats({
          total: inventoryData.length,
          lowStock: inventoryData.filter(
            (item: InventoryItem) =>
              item.quantityOnHand <= item.lowStockThreshold &&
              item.quantityOnHand > 0
          ).length,
          outOfStock: inventoryData.filter(
            (item: InventoryItem) => item.quantityOnHand === 0
          ).length,
          active: inventoryData.filter(
            (item: InventoryItem) =>
              item.quantityOnHand > item.lowStockThreshold
          ).length,
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
      const response = await inventoryApi.search(searchQuery, {
        status: selectedTab === "all" ? undefined : selectedTab.toUpperCase(),
      })
      if (response.success && response.data) {
        const searchData = response.data as InventoryItem[]
        setItems(searchData)
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
        <Header
          title="Inventory Management"
          subtitle="Manage and track inventory items"
          showNewInventory
        />
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
                <div className="text-sm text-muted-foreground">
                  Out of Stock
                </div>
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
                <Button asChild>
                  <a href="/inventory/new">New Item</a>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="relative">
                  All
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {stats.total}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="active" className="relative">
                  Active
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {stats.active}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="low_stock" className="relative">
                  Low Stock
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    {stats.lowStock}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="out_of_stock" className="relative">
                  Out of Stock
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    {stats.outOfStock}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="m-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            SKU
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            Description
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            Brand
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            Category
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            Stock
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            Price ({currency})
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Location
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8">
                            <div className="flex justify-center items-center">
                              <Spinner size={32} />
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-8 text-red-500"
                          >
                            {error}
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No items found
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-4 px-4">{item.sku}</td>
                            <td className="py-4 px-4">
                              <div className="max-w-xs truncate">
                                {item.description}
                              </div>
                            </td>
                            <td className="py-4 px-4">{item.brand}</td>
                            <td className="py-4 px-4">
                              <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 inline-block">
                                {item.category}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${
                                  item.quantityOnHand === 0
                                    ? "bg-red-100 text-red-800"
                                    : item.quantityOnHand <=
                                      item.lowStockThreshold
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {item.quantityOnHand}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {formatCurrency(
                                currency === "CAD"
                                  ? item.costCad || 0
                                  : convertCurrency(item.costCad || 0, "CAD")
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="max-w-xs truncate">
                                {item.warehouseLocation || "N/A"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleView(item.id.toString())}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleEdit(item.id.toString())}
                                >
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
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
  category,
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
        <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 inline-block">
          {category}
        </div>
      </td>
      <td className="py-3">
        <span className={getStatusClass(stock, 5)}>{stock}</span>
      </td>
      <td className="py-3">${unitPrice ? unitPrice.toFixed(2) : '0.00'}</td>
      <td className="py-3">{warehouse_location}</td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(id)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(id)}>
            Edit
          </Button>
        </div>
      </td>
    </tr>
  )
}
