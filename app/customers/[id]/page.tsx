"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { customerApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Customer {
  id: number
  name: string
  type: string
  email: string | null
  phone: string | null
  address: string | null
  contactPerson: string | null
  region: string | null
  quickbooksId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface HistoryFilters {
  period?: string
  type?: 'all' | 'rfq' | 'sale'
}

export default function CustomerView({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)
  const [history, setHistory] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [filters, setFilters] = useState<HistoryFilters>({
    period: '3months',
    type: 'all'
  })

  useEffect(() => {
    fetchCustomer()
    fetchHistory()
  }, [resolvedParams.id, filters])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await customerApi.getById(resolvedParams.id)
      if (response.success && response.data) {
        setCustomer(response.data as Customer)
      } else {
        toast.error("Failed to load customer")
      }
    } catch (error) {
      toast.error("An error occurred while loading the customer")
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError(null)
      const response = await customerApi.getHistory(resolvedParams.id, filters.period)
      if (response.success && response.data) {
        setHistory(response.data)
      } else {
        setHistoryError("Failed to load customer history")
      }
    } catch (error) {
      setHistoryError("An error occurred while loading customer history")
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/customers/${resolvedParams.id}/edit`)
  }

  const calculateHistoryStats = () => {
    if (!history?.history) return null

    const stats = {
      totalRfqs: history.totalRfqs || 0,
      totalSpentCAD: history.metrics?.totalSpentCAD || 0,
      averageOrderValueCAD: history.metrics?.averageOrderValueCAD || 0,
      acceptanceRate: history.metrics?.acceptanceRate || 0
    }

    return stats
  }

  const historyStats = calculateHistoryStats()

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Customer" subtitle="View customer details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="flex justify-center items-center">
                <Spinner size={32} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Customer" subtitle="View customer details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="text-center text-red-500">Customer not found</div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Customer" subtitle="View customer details" />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <div className="text-muted-foreground">
                  <Badge variant="outline" className="mr-2">
                    {customer.type}
                  </Badge>
                  {customer.region && (
                    <Badge variant="secondary">{customer.region}</Badge>
                  )}
                </div>
              </div>
              <Button onClick={handleEdit}>Edit Customer</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <div className="font-medium">{customer.email || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <div className="font-medium">{customer.phone || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Address</label>
                    <div className="font-medium">{customer.address || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Contact Person</label>
                    <div className="font-medium">{customer.contactPerson || "Not specified"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">QuickBooks ID</label>
                    <div className="font-medium">{customer.quickbooksId || "Not linked"}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className="font-medium">
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Customer Since</label>
                    <div className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Last Updated</label>
                    <div className="font-medium">{new Date(customer.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer History Section */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Customer History</h3>
              <div className="flex items-center gap-4">
                <Select
                  value={filters.period}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="12months">Last 12 Months</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.type}
                  onValueChange={(value: 'all' | 'rfq' | 'sale') => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="rfq">RFQs Only</SelectItem>
                    <SelectItem value="sale">Sales Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historyStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Total RFQs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Count:</span>
                      <Badge variant="secondary">{historyStats.totalRfqs}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Acceptance Rate:</span>
                      <Badge variant="secondary">{(historyStats.acceptanceRate * 100).toFixed(1)}%</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Sales</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Spent:</span>
                      <Badge variant="secondary">${historyStats.totalSpentCAD.toFixed(2)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Order:</span>
                      <Badge variant="secondary">${historyStats.averageOrderValueCAD.toFixed(2)}</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <Tabs defaultValue="transactions" className="w-full">
              <TabsList>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="rfqs">RFQs</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions">
                {historyLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <Spinner size={32} />
                  </div>
                ) : historyError ? (
                  <div className="text-red-500">{historyError}</div>
                ) : history?.history && history.history.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Document #</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.history
                        .filter((item: any) =>
                          filters.type === 'all' ||
                          (filters.type === 'rfq' && item.type === 'rfq') ||
                          (filters.type === 'sale' && item.type === 'sale')
                        )
                        .map((item: any) => (
                          <TableRow key={item.id + item.type + item.date}>
                            <TableCell>
                              {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.type === 'rfq' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.documentNumber || "-"}</TableCell>
                            <TableCell>{item.sku || "-"}</TableCell>
                            <TableCell>{item.description || "-"}</TableCell>
                            <TableCell>{item.quantity || "-"}</TableCell>
                            <TableCell>
                              {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              {item.totalAmount ? `$${item.totalAmount.toFixed(2)}` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">No transaction history found.</div>
                )}
              </TabsContent>

              <TabsContent value="rfqs">
                {historyLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <Spinner size={32} />
                  </div>
                ) : historyError ? (
                  <div className="text-red-500">{historyError}</div>
                ) : history?.rfqs && history.rfqs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>RFQ Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Budget</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.rfqs.map((rfq: any) => (
                        <TableRow key={rfq.id}>
                          <TableCell>
                            {new Date(rfq.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{rfq.rfqNumber}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                rfq.status === 'COMPLETED' ? 'default' :
                                  rfq.status === 'APPROVED' ? 'default' :
                                    rfq.status === 'REJECTED' ? 'destructive' :
                                      'secondary'
                              }
                              className="capitalize"
                            >
                              {rfq.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{rfq.itemCount}</TableCell>
                          <TableCell>
                            {rfq.totalBudget ? `$${rfq.totalBudget.toFixed(2)}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">No RFQ history found.</div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
