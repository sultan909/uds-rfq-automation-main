"use client"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { rfqApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/currency-context"
import { Search, Plus, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

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
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  })

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

  // Client-side sorting function for immediate visual feedback
  const sortDataLocally = (data: RfqData[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (field) {
        case 'rfqNumber':
          aValue = a.rfqNumber;
          bValue = b.rfqNumber;
          break;
        case 'customer.name':
          aValue = a.customer?.name || '';
          bValue = b.customer?.name || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'source':
          aValue = a.source;
          bValue = b.source;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'totalBudget':
          aValue = a.totalBudget || 0;
          bValue = b.totalBudget || 0;
          break;
        case 'itemCount':
          aValue = a.itemCount || 0;
          bValue = b.itemCount || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Column sorting handler
  const handleSort = (field: string) => {
    setSortConfig(prevSort => {
      let newSort;
      
      if (prevSort.field === field) {
        // Toggle direction if same field
        if (prevSort.direction === 'asc') {
          newSort = { field, direction: 'desc' as const };
        } else if (prevSort.direction === 'desc') {
          newSort = { field: null, direction: null };
        } else {
          newSort = { field, direction: 'asc' as const };
        }
      } else {
        // New field, start with ascending
        newSort = { field, direction: 'asc' as const };
      }
      
      // Apply client-side sorting immediately for visual feedback
      if (newSort.field && newSort.direction) {
        const sortedData = sortDataLocally(filteredRfqs, newSort.field, newSort.direction);
        setFilteredRfqs(sortedData);
      }
      
      return newSort;
    });
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Get sort icon for column
  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    }
    
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
  }

  // Sortable header component
  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  )

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
                            placeholder="Search RFQs by number, customer, or source..."
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
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableHeader field="rfqNumber">RFQ Number</SortableHeader>
                            <SortableHeader field="customer.name">Customer</SortableHeader>
                            <SortableHeader field="createdAt">Created</SortableHeader>
                            <SortableHeader field="updatedAt">Updated</SortableHeader>
                            <SortableHeader field="source">Source</SortableHeader>
                            <SortableHeader field="itemCount">Items</SortableHeader>
                            <SortableHeader field="totalBudget">Total Amount</SortableHeader>
                            <SortableHeader field="status">Status</SortableHeader>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRfqs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                {globalFilterValue ? `No RFQs found matching "${globalFilterValue}"` : "No RFQs found."}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRfqs.map((rfq) => {
                              const createdDate = formatDate(rfq.createdAt)
                              const updatedDate = formatDate(rfq.updatedAt)
                              const isRecent = Date.now() - new Date(rfq.updatedAt).getTime() < 24 * 60 * 60 * 1000
                              
                              return (
                                <TableRow 
                                  key={rfq.id} 
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleRowClick(rfq)}
                                >
                                  <TableCell className="font-medium">{rfq.rfqNumber}</TableCell>
                                  <TableCell>{rfq.customer?.name || "Unknown"}</TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="font-medium">{createdDate.date}</div>
                                      <div className="text-muted-foreground text-xs">{createdDate.time}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className={`font-medium ${isRecent ? 'text-primary' : ''}`}>
                                        {updatedDate.date}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {updatedDate.time}
                                        {isRecent && <span className="ml-1 text-primary">•</span>}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{rfq.source}</TableCell>
                                  <TableCell>{rfq.itemCount}</TableCell>
                                  <TableCell>
                                    <div className="text-sm font-medium">
                                      {formatAmount(rfq.totalBudget)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(rfq.status)}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                      
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                          {sortConfig.field && (
                            <span className="ml-2 text-primary">
                              (sorted by {sortConfig.field} {sortConfig.direction === 'asc' ? '↑' : '↓'})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Rows per page:</span>
                            <select 
                              value={itemsPerPage} 
                              onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1)
                              }}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage >= totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
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