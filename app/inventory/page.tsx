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
import { DataTable, DataTablePageEvent, DataTableSortEvent, DataTableRowClickEvent } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { FilterMatchMode } from 'primereact/api'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { Calendar } from 'primereact/calendar'
import { Skeleton } from 'primereact/skeleton'
import { MultiSelect } from 'primereact/multiselect'

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
  cost: number | null
  costCurrency: string
  warehouseLocation: string | null
}

interface InventoryApiResponse extends Array<InventoryItem> {}

interface SortConfig {
  field: string | null
  direction: 'asc' | 'desc' | null
}

export default function InventoryManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // PrimeReact DataTable state
  const [first, setFirst] = useState(0)
  const [rows, setRows] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0 | null | undefined>(0)
  
  // Sort state - keeping for compatibility
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  })
  
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    active: 0
  })
  
  // Debounced search
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const stockStatusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' }
  ]

  // Column toggle functionality
  const columns = [
    { field: 'sku', header: 'SKU' },
    { field: 'description', header: 'Description' },
    { field: 'brand', header: 'Brand' },
    { field: 'category', header: 'Category' },
    { field: 'quantityOnHand', header: 'Stock' },
    { field: 'cost', header: 'Cost' },
    { field: 'warehouseLocation', header: 'Location' }
  ]

  const [visibleColumns, setVisibleColumns] = useState(columns)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  // Update globalFilterValue when debounced search changes
  useEffect(() => {
    setGlobalFilterValue(debouncedSearch)
  }, [debouncedSearch])

  // Fetch inventory with pagination
  useEffect(() => {
    fetchInventoryData()
  }, [selectedTab, currentPage, itemsPerPage, globalFilterValue, sortConfig])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString()
      }

      // Add filter parameters based on selected tab
      if (selectedTab === "low_stock") {
        params.lowStock = 'true'
      } else if (selectedTab === "out_of_stock") {
        params.outOfStock = 'true'
      }
      // Note: 'active' and 'all' don't need special parameters

      // Add sorting parameters
      if (sortConfig.field && sortConfig.direction) {
        params.sortField = sortConfig.field
        params.sortOrder = sortConfig.direction
      }
      
      let response
      if (globalFilterValue && globalFilterValue.trim()) {
        response = await inventoryApi.search(globalFilterValue.trim(), params)
      } else {
        response = await inventoryApi.list(params)
      }

      if (response.success && response.data) {
        const inventoryData = response.data as InventoryApiResponse
        setFilteredItems(inventoryData)
        
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.totalItems || 0)
          setTotalPages(response.meta.pagination.totalPages || 1)
        }
        
        // Fetch all data for stats calculation
        await fetchStatsData()
      } else {
        const errorMessage = response.error || "Failed to load inventory"
        setError(errorMessage)
        toast.error(errorMessage)
        setFilteredItems([])
      }
    } catch (err: any) {
      const errorMessage = "An error occurred while loading inventory"
      setError(errorMessage)
      toast.error(errorMessage)
      setFilteredItems([])
      console.error("Inventory fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsData = async () => {
    try {
      // Fetch all inventory for stats calculation
      const statsResponse = await inventoryApi.list({ page: '1', pageSize: '9999' })
      
      if (statsResponse.success && statsResponse.data) {
        const allData = statsResponse.data as InventoryApiResponse
        
        const totalStats = {
          total: allData.length,
          lowStock: allData.filter(
            (item: InventoryItem) =>
              item.quantityOnHand <= item.lowStockThreshold &&
              item.quantityOnHand > 0
          ).length,
          outOfStock: allData.filter(
            (item: InventoryItem) => item.quantityOnHand === 0
          ).length,
          active: allData.filter(
            (item: InventoryItem) =>
              item.quantityOnHand > item.lowStockThreshold
          ).length,
        }
        setStats(totalStats)
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleTabChange = (value: string) => {
    setSelectedTab(value)
    setCurrentPage(1)
    setSearchValue("")
    setGlobalFilterValue("")
    setSortConfig({ field: null, direction: null }) // Reset sort when changing tabs
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  // PrimeReact pagination handler
  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first)
    setRows(event.rows)
    setCurrentPage(Math.floor(event.first / event.rows) + 1)
    setItemsPerPage(event.rows)
  }

  // PrimeReact sort handler
  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField || '')
    setSortOrder(event.sortOrder || 0)
    
    // Update old sort config for compatibility
    setSortConfig({
      field: event.sortField || null,
      direction: event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : null
    })
  }

  // Handle row click with proper typing
  const onRowClick = (event: DataTableRowClickEvent) => {
    const itemData = event.data as InventoryItem
    router.push(`/inventory/${itemData.id}`)
  }

  // Handle row selection for visual feedback
  const onSelectionChange = (event: any) => {
    setSelectedItem(event.value)
  }

  // Column toggle functionality
  const onColumnToggle = (event: any) => {
    let selectedColumns = event.value
    let orderedSelectedColumns = columns.filter((col) => 
      selectedColumns.some((sCol: any) => sCol.field === col.field)
    )
    setVisibleColumns(orderedSelectedColumns)
  }

  // Loading template for lazy loading
  const loadingTemplate = () => {
    return (
      <div className="flex items-center p-2">
        <Skeleton width="100%" height="1rem" />
      </div>
    )
  }

  const renderHeader = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-card lg:justify-end rounded-lg border shadow-sm">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <i className="pi pi-search" />
              </span>
              <InputText 
                value={searchValue} 
                onChange={handleSearchChange} 
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

  // Create header with column toggle
  const tableHeader = (
    <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
      <MultiSelect 
        value={visibleColumns} 
        options={columns} 
        optionLabel="header" 
        onChange={onColumnToggle} 
        className="w-full sm:w-20rem" 
        display="chip"
        placeholder="Select Columns"
      />
    </div>
  )

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
    if (!rowData.cost) {
      return <span className="text-muted-foreground">-</span>
    }
    
    // Convert from stored currency to selected display currency
    const convertedAmount = convertCurrency(
      rowData.cost, 
      rowData.costCurrency as 'CAD' | 'USD'
    )
    
    return (
      <div className="text-sm font-medium">
        {formatCurrency(convertedAmount)}
        {/* <div className="text-xs text-muted-foreground">
          {rowData.costCurrency !== currency && `(${rowData.costCurrency}: ${formatCurrency(rowData.cost)})`}
        </div> */}
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

              <Tabs value={selectedTab} onValueChange={handleTabChange}>
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
                    <div className="border rounded-lg">
                      <DataTable 
                        key={`inventory-table-${currency}-${selectedTab}`}
                        value={filteredItems}
                        lazy
                        paginator
                        first={first}
                        rows={rows}
                        totalRecords={totalItems}
                        onPage={onPage}
                        loading={loading}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={onSort}
                        stripedRows
                        rowHover
                        scrollable
                        scrollHeight="600px"
                        tableStyle={{ minWidth: '50rem' }}
                        emptyMessage={globalFilterValue ? `No inventory items found matching "${globalFilterValue}"` : `No ${selectedTab === 'all' ? '' : selectedTab.replace('_', ' ')} inventory items found.`}
                        loadingIcon={loadingTemplate}
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        onRowClick={onRowClick}
                        selectionMode="single"
                        selection={selectedItem}
                        onSelectionChange={onSelectionChange}
                        header={tableHeader}
                      >
                        {visibleColumns.map((col) => {
                          switch (col.field) {
                            case 'sku':
                              return (
                                <Column 
                                  key={col.field}
                                  field="sku" 
                                  header="SKU" 
                                  sortable 
                                  style={{ minWidth: '150px' }}
                                />
                              )
                            case 'description':
                              return (
                                <Column 
                                  key={col.field}
                                  field="description" 
                                  header="Description" 
                                  body={descriptionBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '200px' }}
                                />
                              )
                            case 'brand':
                              return (
                                <Column 
                                  key={col.field}
                                  field="brand" 
                                  header="Brand" 
                                  sortable 
                                  style={{ minWidth: '120px' }}
                                />
                              )
                            case 'category':
                              return (
                                <Column 
                                  key={col.field}
                                  field="category" 
                                  header="Category" 
                                  body={categoryBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '100px' }}
                                />
                              )
                            case 'quantityOnHand':
                              return (
                                <Column 
                                  key={col.field}
                                  field="quantityOnHand" 
                                  header="Stock" 
                                  body={stockStatusBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '100px' }}
                                />
                              )
                            case 'cost':
                              return (
                                <Column 
                                  key={col.field}
                                  field="cost" 
                                  header="Cost" 
                                  body={priceBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '120px' }}
                                />
                              )
                            case 'warehouseLocation':
                              return (
                                <Column 
                                  key={col.field}
                                  field="warehouseLocation" 
                                  header="Location" 
                                  body={locationBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '120px' }}
                                />
                              )
                            default:
                              return null
                          }
                        })}
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