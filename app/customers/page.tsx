"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Users } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"
import { useEffect, useState } from "react"
import { customerApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useRouter } from "next/navigation"

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

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: string
  lastOrder: string | null
  totalOrders: number
  totalSpentCAD: number
  createdAt: string
  updatedAt: string
  status: string
  address: string | null
  city: string | null
  country: string | null
}

interface SortConfig {
  field: string | null
  direction: 'asc' | 'desc' | null
}

export default function CustomerManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
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
    dealers: 0,
    wholesalers: 0,
    retailers: 0,
    direct: 0
  })
  
  // Debounced search
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const customerTypeOptions = [
    { label: 'Dealer', value: 'DEALER' },
    { label: 'Wholesaler', value: 'WHOLESALER' },
    { label: 'Retailer', value: 'RETAILER' },
    { label: 'Direct', value: 'DIRECT' }
  ]

  // Column toggle functionality
  const columns = [
    { field: 'name', header: 'Customer' },
    { field: 'type', header: 'Type' },
    { field: 'phone', header: 'Contact' },
    { field: 'lastOrder', header: 'Last Order' },
    { field: 'totalOrders', header: 'Orders' },
    { field: 'totalSpentCAD', header: `Total Spent (${currency})` }
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

  // Fetch customers with pagination
  useEffect(() => {
    fetchCustomerData()
  }, [selectedTab, currentPage, itemsPerPage, globalFilterValue, sortConfig])

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString()
      }

      // Add filter parameters based on selected tab
      if (selectedTab !== "all") {
        params.type = selectedTab.toUpperCase()
      }

      // Add sorting parameters
      if (sortConfig.field && sortConfig.direction) {
        params.sortField = sortConfig.field
        params.sortOrder = sortConfig.direction
      }
      
      let response
      if (globalFilterValue && globalFilterValue.trim()) {
        response = await customerApi.search(globalFilterValue.trim(), params)
      } else {
        response = await customerApi.list(params)
      }

      if (response.success && response.data) {
        const customerData = response.data as Customer[]
        setFilteredCustomers(customerData)
        
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.totalItems || 0)
          setTotalPages(response.meta.pagination.totalPages || 1)
        }
        
        // Fetch all data for stats calculation
        await fetchStatsData()
      } else {
        const errorMessage = response.error || "Failed to load customers"
        setError(errorMessage)
        toast.error(errorMessage)
        setFilteredCustomers([])
      }
    } catch (err: any) {
      const errorMessage = "An error occurred while loading customers"
      setError(errorMessage)
      toast.error(errorMessage)
      setFilteredCustomers([])
      console.error("Customer fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsData = async () => {
    try {
      // Fetch all customers for stats calculation
      const statsResponse = await customerApi.list({ page: '1', pageSize: '9999' })
      
      if (statsResponse.success && statsResponse.data) {
        const allData = statsResponse.data as Customer[]
        
        setStats({
          total: allData.length,
          dealers: allData.filter((c) => c.type === "DEALER").length,
          wholesalers: allData.filter((c) => c.type === "WHOLESALER").length,
          retailers: allData.filter((c) => c.type === "RETAILER").length,
          direct: allData.filter((c) => c.type === "DIRECT").length,
        })
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
    const customerData = event.data as Customer
    router.push(`/customers/${customerData.id}`)
  }

  // Handle row selection for visual feedback
  const onSelectionChange = (event: any) => {
    setSelectedCustomer(event.value)
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
                placeholder="Search customers by name, email, phone..."
                className="w-full sm:w-[400px] pl-9 h-10 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button asChild className="gap-2 h-10 px-4">
                <a href="/customers/new">
                  <i className="pi pi-plus" />
                  New Customer
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

  const customerTypeBodyTemplate = (rowData: Customer) => {
    const typeMap = {
      DEALER: { severity: 'info', label: 'Dealer' },
      WHOLESALER: { severity: 'success', label: 'Wholesaler' },
      RETAILER: { severity: 'warning', label: 'Retailer' },
      DIRECT: { severity: 'danger', label: 'Direct' }
    }
    
    const type = typeMap[rowData.type as keyof typeof typeMap]
    return <Tag value={type?.label} severity={type?.severity as any} />
  }

  const nameBodyTemplate = (rowData: Customer) => {
    return (
      <div className="flex flex-col">
        <div className="font-medium">{rowData.name}</div>
        {rowData.email && (
          <div className="text-xs text-muted-foreground">{rowData.email}</div>
        )}
      </div>
    )
  }

  const contactBodyTemplate = (rowData: Customer) => {
    return (
      <div className="flex flex-col">
        {rowData.phone && (
          <div className="text-sm">{rowData.phone}</div>
        )}
        {rowData.city && (
          <div className="text-xs text-muted-foreground">
            {rowData.city}{rowData.country && `, ${rowData.country}`}
          </div>
        )}
      </div>
    )
  }

  const lastOrderBodyTemplate = (rowData: Customer) => {
    if (!rowData.lastOrder) {
      return <span className="text-muted-foreground">Never</span>
    }
    
    const date = new Date(rowData.lastOrder)
    const isRecent = Date.now() - date.getTime() < 30 * 24 * 60 * 60 * 1000 // Less than 30 days
    
    return (
      <div className="text-sm">
        <div className={`font-medium ${isRecent ? 'text-primary' : ''}`}>
          {date.toLocaleDateString()}
        </div>
        <div className="text-muted-foreground text-xs">
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isRecent && <span className="ml-1 text-primary">•</span>}
        </div>
      </div>
    )
  }

  const totalSpentBodyTemplate = (rowData: Customer) => {
    if (!rowData.totalSpentCAD || rowData.totalSpentCAD === 0) {
      return <span className="text-muted-foreground">-</span>
    }
    
    // Convert from CAD (database stores in CAD) to selected currency if needed
    const convertedAmount = currency === 'CAD' 
      ? rowData.totalSpentCAD 
      : convertCurrency(rowData.totalSpentCAD, 'CAD')
    
    return (
      <div className="text-sm font-medium">
        {formatCurrency(convertedAmount)}
      </div>
    )
  }

  const ordersBodyTemplate = (rowData: Customer) => {
    return (
      <div className="text-sm">
        <div className="font-medium">{rowData.totalOrders}</div>
        <div className="text-muted-foreground text-xs">
          {rowData.totalOrders === 1 ? 'order' : 'orders'}
        </div>
      </div>
    )
  }

  const actionsBodyTemplate = (rowData: Customer) => {
    return (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/customers/${rowData.id}`)
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
            router.push(`/customers/${rowData.id}/edit`)
          }}
        >
          Edit
        </Button>
      </div>
    )
  }

  const typeFilterTemplate = (options: any) => {
    return (
      <Dropdown 
        value={options.value} 
        options={customerTypeOptions} 
        onChange={(e) => options.filterCallback(e.value)} 
        placeholder="Select Type"
        className="p-column-filter"
        showClear
      />
    )
  }



  const header = renderHeader()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Customer Management"
          subtitle="Manage customer information and relationships"
          showNewCustomer
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Customers
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dealers</div>
                <div className="text-2xl font-bold">{stats.dealers}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wholesalers</div>
                <div className="text-2xl font-bold">{stats.wholesalers}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Retailers</div>
                <div className="text-2xl font-bold">{stats.retailers}</div>
              </div>
            </Card>
          </div>

          <div className="bg-background border rounded-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-medium mb-2">Customer List</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Review and manage all customer information. Click on any row to view details.
              </p>

              <Tabs value={selectedTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all" className="relative">
                    All
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {stats.total}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="dealer" className="relative">
                    Dealers
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {stats.dealers}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="wholesaler" className="relative">
                    Wholesalers
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {stats.wholesalers}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="retailer" className="relative">
                    Retailers
                    <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                      {stats.retailers}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="relative">
                    Direct
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      {stats.direct}
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
                        key={`customers-table-${currency}`}
                        value={filteredCustomers}
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
                        emptyMessage={globalFilterValue ? `No customers found matching "${globalFilterValue}"` : "No customers found."}
                        loadingIcon={loadingTemplate}
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        onRowClick={onRowClick}
                        selectionMode="single"
                        selection={selectedCustomer}
                        onSelectionChange={onSelectionChange}
                        header={tableHeader}
                      >
                        {visibleColumns.map((col) => {
                          switch (col.field) {
                            case 'name':
                              return (
                                <Column 
                                  key={col.field}
                                  field="name" 
                                  header="Customer" 
                                  body={nameBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '200px' }}
                                />
                              )
                            case 'type':
                              return (
                                <Column 
                                  key={col.field}
                                  field="type" 
                                  header="Type" 
                                  body={customerTypeBodyTemplate}
                                  sortable 
                                  filter
                                  filterElement={typeFilterTemplate}
                                  style={{ minWidth: '120px' }}
                                />
                              )
                            case 'phone':
                              return (
                                <Column 
                                  key={col.field}
                                  field="phone" 
                                  header="Contact" 
                                  body={contactBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '180px' }}
                                />
                              )
                            case 'lastOrder':
                              return (
                                <Column 
                                  key={col.field}
                                  field="lastOrder" 
                                  header="Last Order" 
                                  body={lastOrderBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '120px' }}
                                />
                              )
                            case 'totalOrders':
                              return (
                                <Column 
                                  key={col.field}
                                  field="totalOrders" 
                                  header="Orders" 
                                  body={ordersBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '100px' }}
                                />
                              )
                            case 'totalSpentCAD':
                              return (
                                <Column 
                                  key={col.field}
                                  field="totalSpentCAD" 
                                  header={`Total Spent (${currency})`} 
                                  body={totalSpentBodyTemplate}
                                  sortable 
                                  style={{ minWidth: '140px' }}
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