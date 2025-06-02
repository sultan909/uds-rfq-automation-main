"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package } from "lucide-react"
import { useEffect, useState } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/currency-context"
import { Spinner } from "@/components/spinner"

// PrimeReact imports
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { FilterMatchMode } from 'primereact/api'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { Calendar } from 'primereact/calendar'

// PrimeReact CSS imports
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

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

interface InventoryApiResponse extends Array<InventoryItem> {}

export default function InventoryManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    active: 0
  })
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    sku: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    brand: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.CONTAINS },
    warehouseLocation: { value: null, matchMode: FilterMatchMode.CONTAINS }
  })

  const stockStatusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' }
  ]

  const sortOptions = [
    { label: 'SKU A-Z', value: 'sku_asc' },
    { label: 'SKU Z-A', value: 'sku_desc' },
    { label: 'Quantity High-Low', value: 'quantity_desc' },
    { label: 'Quantity Low-High', value: 'quantity_asc' },
    { label: 'Brand A-Z', value: 'brand_asc' },
    { label: 'Brand Z-A', value: 'brand_desc' }
  ]

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
      console.log("response", response)

      if (response.success && response.data) {
        console.log("hello");
        
        const inventoryData = response.data as InventoryApiResponse
        console.log("inventoryData", inventoryData);
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

  // Handle row click to navigate to inventory details
  const onRowClick = (event: any) => {
    const itemData = event.data as InventoryItem
    router.push(`/inventory/${itemData.id}`)
  }

  // Handle row selection for visual feedback
  const onSelectionChange = (event: any) => {
    setSelectedItem(event.value)
  }

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    let _filters = { ...filters }
    // @ts-ignore
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const renderHeader = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-card rounded-lg border shadow-sm">
          {/* Left side - Sort controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <i className="pi pi-sort-alt text-muted-foreground" />
              <Dropdown 
                options={sortOptions} 
                placeholder="Sort by..." 
                className="w-[200px] border rounded-md"
                panelClassName="min-w-[200px]"
              />
            </div>
          </div>

          {/* Right side - Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <i className="pi pi-search" />
              </span>
              <InputText 
                value={globalFilterValue} 
                onChange={onGlobalFilterChange} 
                placeholder="Search inventory by SKU, description, brand..."
                className="w-full sm:w-[400px] pl-9 h-10 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button asChild className="gap-2 h-10 px-4">
                <a href="/inventory/new">
                  <i className="pi pi-plus" />
                  New Item
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stockStatusBodyTemplate = (rowData: InventoryItem) => {
    let severity: "success" | "warning" | "danger" | "info"
    let label: string
    
    if (rowData.quantityOnHand === 0) {
      severity = "danger"
      label = "Out of Stock"
    } else if (rowData.quantityOnHand <= rowData.lowStockThreshold) {
      severity = "warning"
      label = "Low Stock"
    } else {
      severity = "success"
      label = "In Stock"
    }
    
    return <Tag value={label} severity={severity} />
  }

  const quantityBodyTemplate = (rowData: InventoryItem) => {
    return (
      <div className="text-sm">
        <div className="font-medium">{rowData.quantityOnHand}</div>
        {rowData.quantityReserved > 0 && (
          <div className="text-muted-foreground text-xs">
            {rowData.quantityReserved} reserved
          </div>
        )}
      </div>
    )
  }

  const priceBodyTemplate = (rowData: InventoryItem) => {
    if (!rowData.costCad) {
      return <span className="text-muted-foreground">-</span>
    }
    
    // Convert from CAD (database stores in CAD) to selected currency if needed
    const convertedAmount = currency === 'CAD' 
      ? rowData.costCad 
      : convertCurrency(rowData.costCad, 'CAD')
    
    return (
      <div className="text-sm font-medium">
        {formatCurrency(convertedAmount)}
      </div>
    )
  }

  const categoryBodyTemplate = (rowData: InventoryItem) => {
    return (
      <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 inline-block">
        {rowData.category}
      </div>
    )
  }

  const locationBodyTemplate = (rowData: InventoryItem) => {
    return (
      <div className="max-w-xs truncate">
        {rowData.warehouseLocation || "N/A"}
      </div>
    )
  }

  const descriptionBodyTemplate = (rowData: InventoryItem) => {
    return (
      <div className="max-w-xs truncate" title={rowData.description}>
        {rowData.description}
      </div>
    )
  }

  const actionsBodyTemplate = (rowData: InventoryItem) => {
    return (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/inventory/${rowData.id}`)
          }}
        >
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/inventory/${rowData.id}/edit`)
          }}
        >
          Edit
        </Button>
      </div>
    )
  }

  const header = renderHeader()

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

          <div className="bg-background border rounded-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-medium mb-2">Inventory List</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Review and manage all inventory items. Click on any row to view details.
              </p>

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
                  {header}
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Spinner size={32} />
                    </div>
                  ) : error ? (
                    <div className="text-center py-4 text-red-500">
                      {error}
                    </div>
                  ) : (
                    <div className="card">
                      <DataTable 
                        key={`inventory-table-${currency}`}
                        value={items}
                        paginator 
                        rows={10} 
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        dataKey="id"
                        filters={filters}
                        globalFilterFields={['sku', 'description', 'brand', 'category', 'warehouseLocation']}
                        emptyMessage="No inventory items found."
                        loading={loading}
                        sortMode="multiple"
                        removableSort
                        showGridlines
                        stripedRows
                        size="small"
                        className="p-datatable-sm cursor-pointer"
                        selectionMode="single"
                        selection={selectedItem}
                        onSelectionChange={onSelectionChange}
                        onRowClick={onRowClick}
                        rowHover
                        tableStyle={{ minWidth: '50rem' }}
                      >
                        <Column 
                          field="sku" 
                          header="SKU" 
                          sortable 
                          style={{ minWidth: '150px' }}
                        />
                        <Column 
                          field="description" 
                          header="Description" 
                          body={descriptionBodyTemplate}
                          sortable 
                          style={{ minWidth: '250px' }}
                        />
                        <Column 
                          field="brand" 
                          header="Brand" 
                          sortable 
                          style={{ minWidth: '150px' }}
                        />
                        <Column 
                          field="category" 
                          header="Category" 
                          body={categoryBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          field="quantityOnHand" 
                          header="Stock" 
                          body={quantityBodyTemplate}
                          sortable 
                          style={{ minWidth: '100px' }}
                        />
                        <Column 
                          field="costCad" 
                          header={`Price (${currency})`} 
                          body={priceBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                          key={`price-inventory-${currency}`}
                        />
                        <Column 
                          field="warehouseLocation" 
                          header="Location" 
                          body={locationBodyTemplate}
                          sortable 
                          style={{ minWidth: '150px' }}
                        />
                        <Column 
                          field="status" 
                          header="Status" 
                          body={stockStatusBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          header="Actions" 
                          body={actionsBodyTemplate}
                          style={{ minWidth: '120px' }}
                        />
                      </DataTable>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}