"use client"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, useCallback } from "react"
import { rfqApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/currency-context"

// PrimeReact imports
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'

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

interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
export default function RfqManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  
  // State management
  const [filteredRfqs, setFilteredRfqs] = useState<RfqData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [selectedRfq, setSelectedRfq] = useState<RfqData | null>(null)
  
  // Pagination state
  const [first, setFirst] = useState(0)
  const [rows, setRows] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  
  // Tab statistics state
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    draft: 0,
    priced: 0,
    sent: 0,
    negotiating: 0,
    accepted: 0,
    declined: 0,
    processed: 0
  })

  // Fetch initial stats for tabs (only once on mount)
  useEffect(() => {
    fetchTabStats()
  }, [])

  // Fetch data when pagination or filters change
  useEffect(() => {
    fetchRfqData()
  }, [selectedTab, first, rows, globalFilterValue])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when search changes
      if (first !== 0) {
        setFirst(0)
      } else {
        fetchRfqData()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [globalFilterValue])

  // Fetch tab statistics (global counts)
  const fetchTabStats = async () => {
    try {
      // Get all RFQs without pagination to calculate global stats
      const response = await rfqApi.list({ pageSize: 1000 }) // Large page size to get all
      
      if (response.success && response.data) {
        const rfqData = response.data as RfqData[]
        const statusStats = {
          total: rfqData.length,
          new: rfqData.filter(rfq => rfq.status.toLowerCase() === 'new').length,
          draft: rfqData.filter(rfq => rfq.status.toLowerCase() === 'draft').length,
          priced: rfqData.filter(rfq => rfq.status.toLowerCase() === 'priced').length,
          sent: rfqData.filter(rfq => rfq.status.toLowerCase() === 'sent').length,
          negotiating: rfqData.filter(rfq => rfq.status.toLowerCase() === 'negotiating').length,
          accepted: rfqData.filter(rfq => rfq.status.toLowerCase() === 'accepted').length,
          declined: rfqData.filter(rfq => rfq.status.toLowerCase() === 'declined').length,
          processed: rfqData.filter(rfq => rfq.status.toLowerCase() === 'processed').length,
        }
        setStats(statusStats)
      }
    } catch (err) {
      console.error("Failed to fetch tab stats:", err)
    }
  }
  // Main data fetching function
  const fetchRfqData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const page = Math.floor(first / rows) + 1
      const params: any = {
        page: page,
        pageSize: rows
      }

      // Add status filter if not "all"
      if (selectedTab !== "all") {
        params.status = selectedTab.toUpperCase()
      }

      let response
      // Use search or list API based on whether there's a search query
      if (globalFilterValue && globalFilterValue.trim()) {
        response = await rfqApi.search(globalFilterValue.trim(), params)
      } else {
        response = await rfqApi.list(params)
      }

      if (response.success && response.data) {
        const rfqData = response.data as RfqData[]
        setFilteredRfqs(rfqData)
        
        // Set total records from API response meta
        if (response.meta?.pagination && typeof response.meta.pagination.totalItems === 'number') {
          setTotalRecords(response.meta.pagination.totalItems)
        } else {
          // Fallback: estimate based on current data
          if (rfqData.length >= rows) {
            setTotalRecords((page * rows) + 1)
          } else {
            setTotalRecords(first + rfqData.length)
          }
        }
      } else {
        setError(response.error || "Failed to load RFQs")
        toast.error(response.error || "Failed to load RFQs")
        setFilteredRfqs([])
        setTotalRecords(0)
      }
    } catch (err) {
      const errorMessage = "An error occurred while loading RFQs"
      setError(errorMessage)
      toast.error(errorMessage)
      setFilteredRfqs([])
      setTotalRecords(0)
      console.error("RFQ fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Handle pagination events from PrimeReact DataTable
  const onPage = useCallback((event: any) => {
    console.log('Pagination event:', event)
    setFirst(event.first)
    setRows(event.rows)
  }, [])

  // Handle row click to navigate to RFQ details
  const onRowClick = useCallback((event: any) => {
    const rfqData = event.data as RfqData
    router.push(`/rfq-management/${rfqData.id}`)
  }, [router])

  // Handle row selection for visual feedback
  const onSelectionChange = useCallback((event: any) => {
    setSelectedRfq(event.value)
  }, [])

  // Handle search input change
  const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGlobalFilterValue(value)
  }, [])

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value)
    setFirst(0) // Reset to first page when changing tabs
    setGlobalFilterValue("") // Clear search when changing tabs
  }, [])
  // Render header with search
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
                placeholder="Search RFQs by number, customer, or source..."
                className="w-full sm:w-[400px] pl-9 h-10 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button asChild className="gap-2 h-10 px-4">
                <a href="/rfq-management/new">
                  <i className="pi pi-plus" />
                  New RFQ
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Status body template for DataTable
  const statusBodyTemplate = (rowData: RfqData) => {
    const statusMap = {
      new: { severity: 'info', label: 'New' },
      draft: { severity: 'warning', label: 'Draft' },
      priced: { severity: 'success', label: 'Priced' },
      sent: { severity: 'info', label: 'Sent' },
      negotiating: { severity: 'warning', label: 'Negotiating' },
      accepted: { severity: 'success', label: 'Accepted' },
      declined: { severity: 'danger', label: 'Declined' },
      processed: { severity: 'success', label: 'Processed' }
    }
    
    const status = statusMap[rowData.status.toLowerCase() as keyof typeof statusMap]
    return <Tag value={status?.label || rowData.status} severity={status?.severity as any} />
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
        {formatCurrency(convertedAmount || 0)}
      </div>
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

              <Tabs value={selectedTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all" className="relative">
                    All
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {stats.total}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="new" className="relative">
                    New
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {stats.new}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>                  <TabsTrigger value="draft" className="relative">
                    Draft
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stats.draft}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="priced" className="relative">
                    Priced
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {stats.priced}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="relative">
                    Sent
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {stats.sent}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="negotiating" className="relative">
                    Negotiating
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stats.negotiating}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="accepted" className="relative">
                    Accepted
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {stats.accepted}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="declined" className="relative">
                    Declined
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stats.declined}
                      {globalFilterValue.trim() && '*'}
                    </span>
                  </TabsTrigger>                  <TabsTrigger value="processed" className="relative">
                    Processed
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      globalFilterValue.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-cyan-100 text-cyan-800'
                    }`}>
                      {stats.processed}
                      {globalFilterValue.trim() && '*'}
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
                        key={`rfq-table-${currency}-${rows}-${selectedTab}`}
                        value={filteredRfqs}
                        lazy
                        paginator 
                        first={first}
                        rows={rows} 
                        totalRecords={totalRecords}
                        onPage={onPage}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="{first} to {last} of {totalRecords} entries"
                        dataKey="id"
                        emptyMessage={globalFilterValue ? `No RFQs found matching "${globalFilterValue}"` : "No RFQs found."}
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
                      >                        <Column 
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