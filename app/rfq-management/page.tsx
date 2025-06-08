"use client"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { rfqApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/currency-context"
import { Search, Plus } from "lucide-react"

// PrimeReact imports
import { DataTable, DataTablePageEvent, DataTableSortEvent, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Skeleton } from 'primereact/skeleton';
import { MultiSelect } from 'primereact/multiselect';
import 'primereact/resources/themes/lara-dark-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import '@/styles/primereact-dark-theme.css';

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

interface SortConfig {
  field: string | null
  direction: 'asc' | 'desc' | null
}

export default function RfqManagement() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  
  // Simplified state management
  const [filteredRfqs, setFilteredRfqs] = useState<RfqData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [globalFilterValue, setGlobalFilterValue] = useState("")
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

  // Column toggle functionality
  const columns = [
    { field: 'rfqNumber', header: 'RFQ Number' },
    { field: 'customer.name', header: 'Customer' },
    { field: 'createdAt', header: 'Created' },
    { field: 'updatedAt', header: 'Updated' },
    { field: 'source', header: 'Source' },
    { field: 'itemCount', header: 'Items' },
    { field: 'totalBudget', header: 'Total Amount' },
    { field: 'status', header: 'Status' }
  ];

  const [visibleColumns, setVisibleColumns] = useState(columns);

  // Debounced search
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

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

  // Simplified data fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params: any = {
          page: currentPage.toString(),
          pageSize: itemsPerPage.toString()
        }

        if (selectedTab !== "all") {
          params.status = selectedTab.toUpperCase()
        }

        // Add sorting parameters
        if (sortConfig.field && sortConfig.direction) {
          params.sortField = sortConfig.field
          params.sortOrder = sortConfig.direction
        }
        
        let response
        if (globalFilterValue && globalFilterValue.trim()) {
          response = await rfqApi.search(globalFilterValue.trim(), params)
        } else {
          response = await rfqApi.list(params)
        }

        if (response.success && response.data) {
          const rfqData = response.data as RfqData[]
          setFilteredRfqs(rfqData)
          
          if (response.meta?.pagination) {
            setTotalItems(response.meta.pagination.totalItems || 0)
            setTotalPages(response.meta.pagination.totalPages || 1)
          }
        } else {
          const errorMessage = response.error || "Failed to load RFQs"
          setError(errorMessage)
          toast.error(errorMessage)
          setFilteredRfqs([])
        }
      } catch (err: any) {
        const errorMessage = "An error occurred while loading RFQs"
        setError(errorMessage)
        toast.error(errorMessage)
        setFilteredRfqs([])
        console.error("RFQ fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [selectedTab, currentPage, itemsPerPage, globalFilterValue, sortConfig])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const handleTabChange = (value: string) => {
    setSelectedTab(value)
    setCurrentPage(1)
    setSearchValue("")
    setGlobalFilterValue("")
    setSortConfig({ field: null, direction: null }) // Reset sort when changing tabs
  }

  const handleRowClick = (rfq: RfqData) => {
    router.push(`/rfq-management/${rfq.id}`)
  }

  // These functions are now handled by PrimeReact DataTable internally

  // PrimeReact pagination handler
  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
    setCurrentPage(Math.floor(event.first / event.rows) + 1);
    setItemsPerPage(event.rows);
  };

  // PrimeReact sort handler
  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField || '');
    setSortOrder(event.sortOrder || 0);
    
    // Update old sort config for compatibility
    setSortConfig({
      field: event.sortField || null,
      direction: event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : null
    });
  };

  // Handle row click with proper typing
  const onRowClick = (event: DataTableRowClickEvent) => {
    handleRowClick(event.data as RfqData);
  };

  // Column toggle functionality
  const onColumnToggle = (event: any) => {
    let selectedColumns = event.value;
    let orderedSelectedColumns = columns.filter((col) => 
      selectedColumns.some((sCol: any) => sCol.field === col.field)
    );
    setVisibleColumns(orderedSelectedColumns);
  };

  // Create header with column toggle
  const tableHeader = (
    <div className="flex justify-between items-center p-4 bg-card border-b">
      {/* <span className="text-lg font-semibold">RFQ Management</span> */}
      <MultiSelect 
        value={visibleColumns} 
        options={columns} 
        optionLabel="header" 
        onChange={onColumnToggle} 
        className="w-full sm:w-20rem dark:bg-gray-800 dark:border-gray-600" 
        display="chip"
        placeholder="Select Columns"
        style={{ 
          backgroundColor: 'var(--surface-ground)',
          border: '1px solid var(--surface-border)',
          color: 'var(--text-color)'
        }}
      />
    </div>
  );

  // Loading template for lazy loading
  const loadingTemplate = () => {
    return (
      <div className="flex items-center p-2">
        <Skeleton width="100%" height="1rem" />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { variant: "secondary" as const, label: "New" },
      draft: { variant: "outline" as const, label: "Draft" },
      priced: { variant: "default" as const, label: "Priced" },
      sent: { variant: "secondary" as const, label: "Sent" },
      negotiating: { variant: "destructive" as const, label: "Negotiating" },
      accepted: { variant: "default" as const, label: "Accepted" },
      declined: { variant: "destructive" as const, label: "Declined" },
      processed: { variant: "default" as const, label: "Processed" }
    }
    
    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || 
                   { variant: "outline" as const, label: status }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-"
    
    const convertedAmount = currency === 'CAD' 
      ? amount 
      : convertCurrency(amount, 'CAD')
    
    return formatCurrency(convertedAmount || 0)
  }

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
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="priced">Priced</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
                  <TabsTrigger value="accepted">Accepted</TabsTrigger>
                  <TabsTrigger value="declined">Declined</TabsTrigger>
                  <TabsTrigger value="processed">Processed</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="m-0">
                  <div className="space-y-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-card lg:justify-end rounded-lg border shadow-sm">
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            value={searchValue} 
                            onChange={handleSearchChange} 
                            placeholder="Search RFQs by number, customer, source, status, description, contact person, email, phone, department..."
                            className="w-full sm:w-[400px] pl-9"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button asChild className="gap-2">
                            <a href="/rfq-management/new">
                              <Plus className="h-4 w-4" />
                              New RFQ
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

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
                        value={filteredRfqs}
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
                        // resizableColumns
                        tableStyle={{ minWidth: '50rem' }}
                        emptyMessage={globalFilterValue ? `No RFQs found matching "${globalFilterValue}"` : "No RFQs found."}
                        loadingIcon={loadingTemplate}
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        onRowClick={onRowClick}
                        selectionMode="single"
                        header={tableHeader}
                      >
                        {visibleColumns.map((col) => {
                          switch (col.field) {
                            case 'rfqNumber':
                              return (
                                <Column 
                                  key={col.field}
                                  field="rfqNumber" 
                                  header="RFQ Number" 
                                  sortable 
                                  style={{ width: '15%' }}
                                  body={(rowData) => (
                                    <span className="font-medium">{rowData.rfqNumber}</span>
                                  )}
                                />
                              );
                            case 'customer.name':
                              return (
                                <Column 
                                  key={col.field}
                                  field="customer.name" 
                                  header="Customer" 
                                  sortable 
                                  style={{ width: '15%' }}
                                  body={(rowData) => rowData.customer?.name || "Unknown"}
                                />
                              );
                            case 'createdAt':
                              return (
                                <Column 
                                  key={col.field}
                                  field="createdAt" 
                                  header="Created" 
                                  sortable 
                                  style={{ width: '12%' }}
                                  body={(rowData) => {
                                    const createdDate = formatDate(rowData.createdAt);
                                    return (
                                      <div className="text-sm">
                                        <div className="font-medium">{createdDate.date}</div>
                                        <div className="text-muted-foreground text-xs">{createdDate.time}</div>
                                      </div>
                                    );
                                  }}
                                />
                              );
                            case 'updatedAt':
                              return (
                                <Column 
                                  key={col.field}
                                  field="updatedAt" 
                                  header="Updated" 
                                  sortable 
                                  style={{ width: '12%' }}
                                  body={(rowData) => {
                                    const updatedDate = formatDate(rowData.updatedAt);
                                    const isRecent = Date.now() - new Date(rowData.updatedAt).getTime() < 24 * 60 * 60 * 1000;
                                    return (
                                      <div className="text-sm">
                                        <div className={`font-medium ${isRecent ? 'text-primary' : ''}`}>
                                          {updatedDate.date}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                          {updatedDate.time}
                                          {isRecent && <span className="ml-1 text-primary">•</span>}
                                        </div>
                                      </div>
                                    );
                                  }}
                                />
                              );
                            case 'source':
                              return (
                                <Column 
                                  key={col.field}
                                  field="source" 
                                  header="Source" 
                                  sortable 
                                  style={{ width: '10%' }}
                                />
                              );
                            case 'itemCount':
                              return (
                                <Column 
                                  key={col.field}
                                  field="itemCount" 
                                  header="Items" 
                                  sortable 
                                  style={{ width: '8%' }}
                                />
                              );
                            case 'totalBudget':
                              return (
                                <Column 
                                  key={col.field}
                                  field="totalBudget" 
                                  header="Total Amount" 
                                  sortable 
                                  style={{ width: '12%' }}
                                  body={(rowData) => (
                                    <div className="text-sm font-medium">
                                      {formatAmount(rowData.totalBudget)}
                                    </div>
                                  )}
                                />
                              );
                            case 'status':
                              return (
                                <Column 
                                  key={col.field}
                                  field="status" 
                                  header="Status" 
                                  sortable 
                                  style={{ width: '16%' }}
                                  body={(rowData) => getStatusBadge(rowData.status)}
                                />
                              );
                            default:
                              return null;
                          }
                        })}
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