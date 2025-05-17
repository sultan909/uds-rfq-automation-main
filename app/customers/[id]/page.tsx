"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { customerApi } from "@/lib/api-client"
import { toast } from "sonner"

interface Customer {
  id: number
  name: string
  type: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export default function CustomerView({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)
  const [history, setHistory] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomer()
    fetchHistory()
  }, [resolvedParams.id])

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
      const response = await customerApi.getHistory(resolvedParams.id)
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

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Customer" subtitle="View customer details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="text-center">Loading...</div>
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
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <Button onClick={handleEdit}>Edit Customer</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <div className="font-medium">{customer.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Type</label>
                    <div className="font-medium capitalize">{customer.type}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <div className="font-medium">{customer.email || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <div className="font-medium">{customer.phone || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Address</label>
                    <div className="font-medium">{customer.address || '-'}</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Created At</label>
                    <div className="font-medium">{new Date(customer.createdAt).toLocaleString()}</div>
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
            <h3 className="text-xl font-semibold mb-4">Customer History</h3>
            {historyLoading ? (
              <div>Loading history...</div>
            ) : historyError ? (
              <div className="text-red-500">{historyError}</div>
            ) : history && history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Document #</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((tx: any) => (
                    <TableRow key={tx.id + tx.type + tx.date}>
                      <TableCell>{tx.date ? new Date(tx.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>{tx.documentNumber || '-'}</TableCell>
                      <TableCell>{tx.sku || '-'}</TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell>{tx.price !== undefined && tx.price !== null ? `$${tx.price.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>{tx.totalAmount !== undefined && tx.totalAmount !== null ? `$${tx.totalAmount.toFixed(2)}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div>No history found for this customer.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 