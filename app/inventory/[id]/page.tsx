"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { inventoryApi } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/spinner"

interface InventoryItem {
  id: number
  sku: string
  mpn: string
  brand: string
  description: string
  quantityOnHand: number
  quantityReserved: number
  costCad: number | null
  costUsd: number | null
  warehouseLocation: string | null
  lowStockThreshold: number
  lastSaleDate: string | null
  quickbooksItemId: string | null
  createdAt: string
  updatedAt: string
}

export default function InventoryItemView({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)
  const [history, setHistory] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    fetchItem()
    fetchHistory()
  }, [resolvedParams.id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.get(resolvedParams.id)
      if (response.success && response.data) {
        setItem(response.data as InventoryItem)
      } else {
        toast.error("Failed to load inventory item")
      }
    } catch (error) {
      toast.error("An error occurred while loading the item")
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError(null)
      const response = await inventoryApi.getHistory(resolvedParams.id)
      if (response.success && response.data) {
        setHistory(response.data)
      } else {
        setHistoryError("Failed to load item history")
      }
    } catch (error) {
      setHistoryError("An error occurred while loading item history")
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/inventory/${resolvedParams.id}/edit`)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Inventory Item"
            subtitle="View inventory item details"
          />
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

  if (!item) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Inventory Item"
            subtitle="View inventory item details"
          />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="text-center text-red-500">Item not found</div>
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
        <Header title="Inventory Item" subtitle="View inventory item details" />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{item.mpn}</h2>
              <Button onClick={handleEdit}>Edit Item</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">SKU</label>
                    <div className="font-medium">{item.sku}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">MPN</label>
                    <div className="font-medium">{item.mpn}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Brand
                    </label>
                    <div className="font-medium">{item.brand}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Description
                    </label>
                    <div className="font-medium">{item.description}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Stock Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Quantity On Hand
                    </label>
                    <div className="font-medium">{item.quantityOnHand}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Reserved Quantity
                    </label>
                    <div className="font-medium">{item.quantityReserved}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Cost (CAD)
                    </label>
                    <div className="font-medium">
                      ${item.costCad?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Cost (USD)
                    </label>
                    <div className="font-medium">
                      ${item.costUsd?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Low Stock Threshold
                    </label>
                    <div className="font-medium">{item.lowStockThreshold}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Last Sale Date
                    </label>
                    <div className="font-medium">
                      {item.lastSaleDate
                        ? new Date(item.lastSaleDate).toLocaleDateString()
                        : "No sales yet"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Warehouse Location
                    </label>
                    <div className="font-medium">
                      {item.warehouseLocation || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      QuickBooks ID
                    </label>
                    <div className="font-medium">
                      {item.quickbooksItemId || "Not linked"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Last Updated
                    </label>
                    <div className="font-medium">
                      {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* SKU Item History Section */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">SKU Item History</h3>
            {historyLoading ? (
              <div>Loading history...</div>
            ) : historyError ? (
              <div className="text-red-500">{historyError}</div>
            ) : history &&
              history.transactions &&
              history.transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Document #</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.transactions.map((tx: any) => (
                    <TableRow key={tx.id + tx.type + tx.date}>
                      <TableCell>
                        {tx.date ? new Date(tx.date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>{tx.documentNumber || "-"}</TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell>
                        {tx.price !== undefined && tx.price !== null
                          ? `$${tx.price.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {tx.totalAmount !== undefined && tx.totalAmount !== null
                          ? `$${tx.totalAmount.toFixed(2)}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div>No history found for this item.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
