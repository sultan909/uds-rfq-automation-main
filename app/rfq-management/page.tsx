"use client"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { rfqApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/currency-context"

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

interface RfqData {
  id: number
  rfqNumber: string
  customer: {
    name: string
  }
  createdAt: string
  updatedAt: string
  source: string
  itemCount: number
  totalBudget: number | null
  status: string
}

export default function RfqManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  const [rfqs, setRfqs] = useState<RfqData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [selectedRfq, setSelectedRfq] = useState<RfqData | null>(null)
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    rfqNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'customer.name': { value: null, matchMode: FilterMatchMode.CONTAINS },
    source: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdAt: { value: null, matchMode: FilterMatchMode.DATE_IS }
  })

  const statusOptions = [    { label: 'Pending', value: 'pending' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Completed', value: 'completed' }
  ]

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Customer A-Z', value: 'customer_asc' },
    { label: 'Customer Z-A', value: 'customer_desc' }
  ]

  useEffect(() => {
    fetchRfqs()
  }, [selectedTab])

  const fetchRfqs = async () => {
    try {
      setLoading(true)
      const response = await rfqApi.list({
        status: selectedTab === "all" ? undefined : selectedTab.toUpperCase(),
      })
      if (response.success && response.data) {
        setRfqs(response.data as RfqData[])
      } else {
        setError("Failed to load RFQs")
        toast.error("Failed to load RFQs")
      }
    } catch (err) {
      setError("An error occurred while loading RFQs")
      toast.error("An error occurred while loading RFQs")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRfqs()
      return
    }

    try {
      setLoading(true);
      const response = await rfqApi.search(searchQuery, {
        status: selectedTab === "all" ? undefined : selectedTab.toUpperCase(),
      })
      if (response.success && response.data) {
        setRfqs(response.data as RfqData[])
      } else {
        setError("Failed to search RFQs")
        toast.error("Failed to search RFQs")
      }
    } catch (err) {
      setError("An error occurred while searching RFQs")
      toast.error("An error occurred while searching RFQs")
    } finally {
      setLoading(false)
    }
  }

  // Handle row click to navigate to RFQ details
  const onRowClick = (event: any) => {
    const rfqData = event.data as RfqData
    router.push(`/rfq-management/${rfqData.id}`)
  }

  // Handle row selection for visual feedback
  const onSelectionChange = (event: any) => {
    setSelectedRfq(event.value)
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Dropdown 
            options={sortOptions} 
            placeholder="Sort by..." 
            className="w-40"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText 
              value={globalFilterValue} 
              onChange={onGlobalFilterChange} 
              placeholder="Global Search..." 
              className="w-64"
            />
          </span>
          <Button onClick={handleSearch}>Search</Button>
          <Button asChild>
            <a href="/rfq-management/new">New RFQ</a>
          </Button>
        </div>
      </div>
    )
  }

  const statusBodyTemplate = (rowData: RfqData) => {
    const statusMap = {
      pending: { severity: 'warning', label: 'Pending' },
      in_review: { severity: 'info', label: 'In Review' },
      approved: { severity: 'success', label: 'Approved' },
      rejected: { severity: 'danger', label: 'Rejected' },
      completed: { severity: 'success', label: 'Completed' }
    }
    
    const status = statusMap[rowData.status.toLowerCase() as keyof typeof statusMap]
    return <Tag value={status?.label} severity={status?.severity as any} />
  }

  // Date template functions
  const createdDateBodyTemplate = (rowData: RfqData) => {
    const date = new Date(rowData.createdAt)
    return (
      <div className="text-sm">
        <div className="font-medium">{date.toLocaleDateString()}</div>
        <div className="text-muted-foreground text-xs">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    )
  }

  const updatedDateBodyTemplate = (rowData: RfqData) => {
    const date = new Date(rowData.updatedAt)
    const isRecent = Date.now() - date.getTime() < 24 * 60 * 60 * 1000 // Less than 24 hours
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

  const customerBodyTemplate = (rowData: RfqData) => {
    return rowData.customer?.name || "Unknown"
  }

  const totalAmountBodyTemplate = (rowData: RfqData) => {
    if (!rowData.totalBudget) {
      return <span className="text-muted-foreground">-</span>
    }
    
    // Convert from CAD (database stores in CAD) to selected currency if needed
    const convertedAmount = currency === 'CAD' 
      ? rowData.totalBudget 
      : convertCurrency(rowData.totalBudget, 'CAD')
    
    return (
      <div className="text-sm font-medium">
        {formatCurrency(convertedAmount)}
      </div>
    )
  }

  const statusFilterTemplate = (options: any) => {
    return (
      <Dropdown 
        value={options.value} 
        options={statusOptions} 
        onChange={(e) => options.filterCallback(e.value)} 
        placeholder="Select Status"
        className="p-column-filter"
        showClear
      />
    )
  }

  const dateFilterTemplate = (options: any) => {
    return (
      <Calendar 
        value={options.value} 
        onChange={(e) => options.filterCallback(e.value)} 
        placeholder="Select Date"
        dateFormat="mm/dd/yy"
        className="p-column-filter"
      />
    )
  }

  const header = renderHeader()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="RFQ Management"
          subtitle="Handle and process requests for quotes"
          showNewRfq
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-background border rounded-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-medium mb-2">RFQ List</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Review and manage all request for quotes. Click on any row to view details.
              </p>

              <Tabs defaultValue="all" onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_review">In Review</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
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
                        key={`rfq-table-${currency}`}
                        value={rfqs}
                        paginator 
                        rows={10} 
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        dataKey="id"
                        filters={filters}
                        globalFilterFields={['rfqNumber', 'customer.name', 'source', 'status']}
                        emptyMessage="No RFQs found."
                        loading={loading}
                        sortMode="multiple"
                        removableSort
                        showGridlines
                        stripedRows
                        size="small"
                        className="p-datatable-sm cursor-pointer"
                        selectionMode="single"
                        selection={selectedRfq}
                        onSelectionChange={onSelectionChange}
                        onRowClick={onRowClick}
                        rowHover
                        tableStyle={{ minWidth: '50rem' }}
                      >
                        <Column 
                          field="rfqNumber" 
                          header="RFQ Number" 
                          sortable 
                          style={{ minWidth: '150px' }}
                        />
                        <Column 
                          field="customer.name" 
                          header="Customer" 
                          body={customerBodyTemplate}
                          sortable 
                          style={{ minWidth: '200px' }}
                        />
                        <Column 
                          field="createdAt" 
                          header="Created" 
                          body={createdDateBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          field="updatedAt" 
                          header="Updated" 
                          body={updatedDateBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          field="source" 
                          header="Source" 
                          sortable 
                          style={{ minWidth: '120px' }}
                        />
                        <Column 
                          field="itemCount" 
                          header="Items" 
                          sortable 
                          style={{ minWidth: '100px' }}
                        />
                        <Column 
                          field="totalBudget" 
                          header="Total Amount" 
                          body={totalAmountBodyTemplate}
                          sortable 
                          style={{ minWidth: '120px' }}
                          key={`total-amount-rfq-${currency}`}
                        />
                        <Column 
                          field="status" 
                          header="Status" 
                          body={statusBodyTemplate}
                          sortable 
                          style={{ minWidth: '150px' }}
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