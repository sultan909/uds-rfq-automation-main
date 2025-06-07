"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/spinner"
import { ArrowUpIcon, ArrowDownIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/contexts/currency-context"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

// PrimeReact imports
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'

// PrimeReact CSS imports
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '../styles/primereact-theme.css'

interface DashboardMetrics {
  rfqMetrics: {
    totalRfqs: number
    activeRfqs: number
    completedRfqs: number
    declinedRfqs: number
    weeklyProcessedRfqs: number
  }
  customerMetrics: {
    totalCustomers: number
    activeCustomers: number
  }
  inventoryMetrics: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
  }
  salesMetrics: {
    totalSalesCAD: number
    recentSalesCAD: number
    weeklySalesCAD: number
    weeklySalesChange: number
    currency: string
  }
}

interface RfqListItem {
  id: number
  rfqNumber: string
  customerName: string
  createdAt: string
  updatedAt: string
  status: "NEW" | "DRAFT" | "PRICED" | "SENT" | "NEGOTIATING" | "ACCEPTED" | "DECLINED" | "PROCESSED";
  totalBudget: number | null
  itemCount: number
}

interface DashboardRfqList {
  activeRfqs: RfqListItem[]
  completedRfqs: RfqListItem[]
  processedRfqs: RfqListItem[]
}

export default function Dashboard() {
  const router = useRouter()
  const { currency, formatCurrency, convertCurrency } = useCurrency()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [rfqList, setRfqList] = useState<DashboardRfqList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Force re-render when currency changes
  const [currencyKey, setCurrencyKey] = useState(0)
  
  useEffect(() => {
    setCurrencyKey(prev => prev + 1)
  }, [currency])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsResponse, rfqListResponse] = await Promise.all([
          fetch('/api/dashboard/metrics'),
          fetch('/api/dashboard/rfq-list')
        ]);

        if (!metricsResponse.ok)
          throw new Error('Failed to fetch dashboard metrics')
        if (!rfqListResponse.ok) 
          throw new Error('Failed to fetch RFQ list')

        const [metricsData, rfqListData] = await Promise.all([
          metricsResponse.json(),
          rfqListResponse.json()
        ]);

        setMetrics(metricsData.data)
        setRfqList(rfqListData.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle row click for navigation with useCallback to prevent re-renders
  const onRowClick = useCallback((event: any) => {
    try {
      const rfqData = event.data as RfqListItem
      if (rfqData && rfqData.id) {
        console.log('Navigating to RFQ:', rfqData.id) // Debug log
        router.push(`/rfq-management/${rfqData.id}`)
      }
    } catch (error) {
      console.error('Error navigating to RFQ:', error)
    }
  }, [router])

  // Status template for PrimeReact Tag component
  const statusBodyTemplate = useCallback((rowData: RfqListItem) => {
    const statusMap = {
      NEW: { severity: 'info' as const, label: 'New' },
      DRAFT: { severity: 'warning' as const, label: 'Draft' },
      PRICED: { severity: 'success' as const, label: 'Priced' },
      SENT: { severity: 'info' as const, label: 'Sent' },
      NEGOTIATING: { severity: 'warning' as const, label: 'Negotiating' },
      ACCEPTED: { severity: 'success' as const, label: 'Accepted' },
      DECLINED: { severity: 'danger' as const, label: 'Declined' },
      PROCESSED: { severity: 'success' as const, label: 'Processed' },
    }
    
    
    const status = statusMap[rowData.status]
    return <Tag value={status.label} severity={status.severity} />
  }, [])

  // Date template functions
  const createdDateBodyTemplate = useCallback((rowData: RfqListItem) => {
    const date = new Date(rowData.createdAt)
    return (
      <div className="text-sm">
        <div className="font-medium">{date.toLocaleDateString()}</div>
        <div className="text-muted-foreground text-xs">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    )
  }, [])

  const updatedDateBodyTemplate = useCallback((rowData: RfqListItem) => {
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
  }, [])

  // Total amount template function - NOT using useCallback so it updates with currency changes
  const totalAmountBodyTemplate = (rowData: RfqListItem) => {
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

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={32} />
      </div>
    );
  if (error)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  if (!metrics) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          subtitle="Overview of your quotes, inventory, and sales"
          showNewRfq
        />
        <div className="flex-1 overflow-auto p-4">
          {/* Global Search */}
          <div className="mb-6 flex items-center justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="search"
                placeholder="Search for RFQs, SKUs, or Customers..."
                className="pl-10 py-6"
              />
            </div>
            <a href="/rfq-management/new" className="ml-4">
              <button className="btn btn-primary px-6 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                NEW RFQ
              </button>
            </a>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Active RFQs"
              value={metrics.rfqMetrics.activeRfqs.toString()}
              color="blue"
            />
            <WeeklyProcessedRfqsMetric rfqMetrics={metrics.rfqMetrics} />
            <SalesVolumeMetric salesData={metrics.salesMetrics} />
            <MetricCard
              label="Low Stock Alert"
              value={metrics.inventoryMetrics.lowStockItems.toString()}
              color="red"
            />
          </div>

          <div className="grid gap-6">
            {/* Active RFQs Table */}
            <Card className="p-4 bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Active RFQs</h2>
                <a
                  href="/rfq-management"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </a>
              </div>
              <div className="card">
                <DataTable 
                  value={rfqList?.activeRfqs || []}
                  paginator={rfqList?.activeRfqs && rfqList.activeRfqs.length > 5}
                  rows={5}
                  rowsPerPageOptions={[5, 10, 15]}
                  dataKey="id"
                  emptyMessage="No active RFQs found."
                  loading={loading}
                  className="p-datatable-sm"
                  onRowClick={onRowClick}
                  rowHover
                  size="small"
                  tableStyle={{ minWidth: '50rem', cursor: 'pointer' }}
                  key={`active-rfqs-${currency}-${currencyKey}`}
                >
                  <Column 
                    field="rfqNumber" 
                    header="RFQ Number" 
                    sortable 
                    style={{ minWidth: '150px' }}
                  />
                  <Column 
                    field="customerName" 
                    header="Customer" 
                    sortable 
                    style={{ minWidth: '180px' }}
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
                    field="itemCount" 
                    header="Items" 
                    sortable 
                    style={{ minWidth: '80px' }}
                  />
                  <Column 
                    field="totalBudget" 
                    header="Total Amount" 
                    body={totalAmountBodyTemplate}
                    sortable 
                    style={{ minWidth: '120px' }}
                    key={`total-amount-active-${currency}`}
                  />
                  <Column 
                    field="status" 
                    header="Status" 
                    body={statusBodyTemplate}
                    sortable 
                    style={{ minWidth: '120px' }}
                  />
                </DataTable>
              </div>
            </Card>

            {/* Processed RFQs Table */}
            <Card className="p-4 bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Processed RFQs</h2>
                <a
                  href="/rfq-management"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </a>
              </div>
              <div className="card">
                <DataTable 
                  value={rfqList?.processedRfqs || []}
                  paginator={rfqList?.processedRfqs && rfqList.processedRfqs.length > 5}
                  rows={5}
                  rowsPerPageOptions={[5, 10, 15]}
                  dataKey="id"
                  emptyMessage="No processed RFQs found."
                  loading={loading}
                  className="p-datatable-sm"
                  onRowClick={onRowClick}
                  rowHover
                  size="small"
                  tableStyle={{ minWidth: '50rem', cursor: 'pointer' }}
                  key={`processed-rfqs-${currency}-${currencyKey}`}
                >
                  <Column 
                    field="rfqNumber" 
                    header="RFQ Number" 
                    sortable 
                    style={{ minWidth: '150px' }}
                  />
                  <Column 
                    field="customerName" 
                    header="Customer" 
                    sortable 
                    style={{ minWidth: '180px' }}
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
                    field="itemCount" 
                    header="Items" 
                    sortable 
                    style={{ minWidth: '80px' }}
                  />
                  <Column 
                    field="totalBudget" 
                    header="Total Amount" 
                    body={totalAmountBodyTemplate}
                    sortable 
                    style={{ minWidth: '120px' }}
                    key={`total-amount-processed-${currency}`}
                  />
                  <Column 
                    field="status" 
                    header="Status" 
                    body={statusBodyTemplate}
                    sortable 
                    style={{ minWidth: '120px' }}
                  />
                </DataTable>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Weekly Processed RFQs metric
function WeeklyProcessedRfqsMetric({
  rfqMetrics,
}: {
  rfqMetrics: DashboardMetrics["rfqMetrics"];
}) {
  return (
    <div className="metric-card bg-green-50 dark:bg-green-950/30">
      <div className="metric-label">Weekly Processed RFQs</div>
      <div className="metric-value">{rfqMetrics.weeklyProcessedCount}</div>
    </div>
  );
}

// Sales Volume metric with weekly data
function SalesVolumeMetric({
  salesData,
}: {
  salesData: DashboardMetrics["salesMetrics"];
}) {
  const { currency, formatCurrency, convertCurrency } = useCurrency();

  // Format the value based on the selected currency
  const formattedValue = formatCurrency(
    currency === salesData.currency
      ? salesData.weeklySalesCAD || salesData.totalSalesCAD
      : convertCurrency(
          salesData.weeklySalesCAD || salesData.totalSalesCAD,
          salesData.currency as "CAD" | "USD"
        )
  );

  // Use weekly sales change if available, otherwise calculate from recent sales
  const percentageChange = salesData.weeklySalesChange !== undefined 
    ? salesData.weeklySalesChange 
    : salesData.totalSalesCAD > 0 
      ? ((salesData.recentSalesCAD / salesData.totalSalesCAD) * 100) - 100 
      : 0;

  const trend = percentageChange >= 0 ? "up" : "down";

  return (
    <div className="metric-card bg-purple-50 dark:bg-purple-950/30">
      <div className="metric-label">Weekly Sales Volume</div>
      <div className="metric-value">{formattedValue}</div>
      {/* <div className={`metric-change ${
        trend === "up" ? "metric-positive" : "metric-negative"
      }`}>
        {trend === "up" ? (
          <ArrowUpIcon className="inline w-3 h-3 mr-1" />
        ) : (
          <ArrowDownIcon className="inline w-3 h-3 mr-1" />
        )}
        {Math.abs(percentageChange).toFixed(1)}% this week
      </div> */}
    </div>
  );
}

interface MetricCardProps {
  label: string
  value: string
  color: "blue" | "green" | "purple" | "red"
}

function MetricCard({ label, value, color }: MetricCardProps) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-950/30",
    green: "bg-green-50 dark:bg-green-950/30",
    purple: "bg-purple-50 dark:bg-purple-950/30",
    red: "bg-red-50 dark:bg-red-950/30",
  }

  return (
    <div className={`metric-card ${colorMap[color]}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}