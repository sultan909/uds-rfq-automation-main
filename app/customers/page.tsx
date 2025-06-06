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

export default function CustomerManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    dealers: 0,
    wholesalers: 0,
    retailers: 0,
    direct: 0
  })
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.EQUALS },
    phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
    city: { value: null, matchMode: FilterMatchMode.CONTAINS }
  })

  const customerTypeOptions = [
    { label: 'Dealer', value: 'DEALER' },
    { label: 'Wholesaler', value: 'WHOLESALER' },
    { label: 'Retailer', value: 'RETAILER' },
    { label: 'Direct', value: 'DIRECT' }
  ]



  // Fetch all customer data once
  useEffect(() => {
    fetchAllCustomers()
  }, [])

  // Filter customers when tab changes
  useEffect(() => {
    filterCustomersByTab()
  }, [selectedTab, allCustomers])

  const fetchAllCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all customers without type filter
      const response = await customerApi.list({})

      if (response.success && response.data) {
        const customerData = response.data as Customer[]
        setAllCustomers(customerData)

        // Calculate statistics from all data (remains constant)
        setStats({
          total: customerData.length,
          dealers: customerData.filter((c) => c.type === "DEALER").length,
          wholesalers: customerData.filter((c) => c.type === "WHOLESALER").length,
          retailers: customerData.filter((c) => c.type === "RETAILER").length,
          direct: customerData.filter((c) => c.type === "DIRECT").length,
        })
      } else {
        setError("Failed to load customers")
        toast.error("Failed to load customers")
      }
    } catch (err) {
      setError("An error occurred while loading customers")
      toast.error("An error occurred while loading customers")
    } finally {
      setLoading(false)
    }
  }

  const filterCustomersByTab = () => {
    let filtered = [...allCustomers]

    if (selectedTab !== "all") {
      filtered = allCustomers.filter(customer => 
        customer.type.toLowerCase() === selectedTab.toLowerCase()
      )
    }

    setFilteredCustomers(filtered)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      filterCustomersByTab()
      return
    }

    try {
      setLoading(true)
      const response = await customerApi.search(searchQuery, {})
      if (response.success && response.data) {
        const searchData = response.data as Customer[]
        
        // Apply tab filter to search results
        let filtered = searchData
        if (selectedTab !== "all") {
          filtered = searchData.filter(customer => 
            customer.type.toLowerCase() === selectedTab.toLowerCase()
          )
        }
        
        setFilteredCustomers(filtered)
      } else {
        setError("Failed to search customers")
        toast.error("Failed to search customers")
      }
    } catch (err) {
      setError("An error occurred while searching customers")
      toast.error("An error occurred while searching customers")
    } finally {
      setLoading(false)
    }
  }

  // Handle row click to navigate to customer details
  const onRowClick = (event: any) => {
    const customerData = event.data as Customer
    router.push(`/customers/${customerData.id}`)
  }

  // Handle row selection for visual feedback
  const onSelectionChange = (event: any) => {
    setSelectedCustomer(event.value)
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-card lg:justify-end rounded-lg border shadow-sm">

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <i className="pi pi-search" />
              </span>
              <InputText 
                value={globalFilterValue} 
                onChange={onGlobalFilterChange} 
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

              <Tabs defaultValue="all" onValueChange={setSelectedTab}>
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
                    <div className="card">
                      <DataTable 
                        key={`customers-table-${currency}`}
                        value={filteredCustomers}
                        paginator 
                        rows={10} 
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        dataKey="id"
                        filters={filters}
                        globalFilterFields={['name', 'email', 'phone', 'type', 'city']}
                        emptyMessage="No customers found."
                        loading={loading}
                        sortMode="multiple"
                        removableSort
                        showGridlines
                        stripedRows
                        size="small"
                        className="p-datatable-sm cursor-pointer"
                        selectionMode="single"
                        selection={selectedCustomer}
                        onSelectionChange={onSelectionChange}
                        onRowClick={onRowClick}
                        rowHover
                        tableStyle={{ minWidth: '50rem' }}
                      >
                        <Column 
                          field="name" 
                          header="Customer" 
                          body={nameBodyTemplate}
                          sortable 
                          style={{ minWidth: '200px' }}
                        />
                        <Column 
                          field="type" 
                          header="Type" 
                          body={customerTypeBodyTemplate}
                          sortable 
                          filter
                          filterElement={typeFilterTemplate}
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          field="phone" 
                          header="Contact" 
                          body={contactBodyTemplate}
                          sortable 
                          style={{ minWidth: '180px' }}
                        />
                        <Column 
                          field="lastOrder" 
                          header="Last Order" 
                          body={lastOrderBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          field="totalOrders" 
                          header="Orders" 
                          body={ordersBodyTemplate}
                          sortable 
                          style={{ minWidth: '100px' }}
                        />
                        <Column 
                          field="totalSpentCAD" 
                          header={`Total Spent (${currency})`} 
                          body={totalSpentBodyTemplate}
                          sortable 
                          style={{ minWidth: '140px' }}
                          key={`total-spent-customers-${currency}`}
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