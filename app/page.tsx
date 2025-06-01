"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import {Spinner} from "@/components/spinner"
import { ArrowUpIcon, ArrowDownIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/contexts/currency-context"
import { useEffect, useState } from "react"

interface DashboardMetrics {
  rfqMetrics: {
    totalRfqs: number
    activeRfqs: number
    completedRfqs: number
    declinedRfqs: number
    conversionRate: number
    weeklyConversionRate: number
    weeklyConversionChange: number
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
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED"
  itemCount: number
}

interface DashboardRfqList {
  activeRfqs: RfqListItem[]
  completedRfqs: RfqListItem[]
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [rfqList, setRfqList] = useState<DashboardRfqList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  console.log("rfqq",rfqList);
  

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
          // showDateFilter
        />
        <div className="flex-1 overflow-auto p-4">
          {/* Global Search - move this above KPI cards */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Active RFQs"
              value={metrics.rfqMetrics.activeRfqs.toString()}
              color="blue"
            />
            <ConversionRateMetric rfqMetrics={metrics.rfqMetrics} />
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-foreground">
                        RFQ Number
                      </th>
                      <th className="pb-2 font-medium text-foreground">
                        Customer
                      </th>
                      <th className="pb-2 font-medium text-foreground">Date</th>
                      <th className="pb-2 font-medium text-foreground">
                        Items
                      </th>
                      <th className="pb-2 font-medium text-foreground">
                        Status
                      </th>
                      <th className="pb-2 font-medium text-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqList?.activeRfqs.map((rfq) => (
                      <tr key={rfq.id} className="border-b text-foreground">
                        <td className="py-3">{rfq.rfqNumber}</td>
                        <td className="py-3">{rfq.customerName}</td>
                        <td className="py-3">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">{rfq.itemCount}</td>
                        <td className="py-3">
                          <span className={getStatusClass(rfq.status)}>
                            {getStatusLabel(rfq.status)}
                          </span>
                        </td>
                        <td className="py-3">
                          <a
                            href={`/rfq-management/${rfq.id}`}
                            className="text-primary hover:underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Completed RFQs Table */}
            <Card className="p-4 bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Completed RFQs</h2>
                <a
                  href="/rfq-management"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-foreground">
                        RFQ Number
                      </th>
                      <th className="pb-2 font-medium text-foreground">
                        Customer
                      </th>
                      <th className="pb-2 font-medium text-foreground">Date</th>
                      <th className="pb-2 font-medium text-foreground">
                        Items
                      </th>
                      <th className="pb-2 font-medium text-foreground">
                        Status
                      </th>
                      <th className="pb-2 font-medium text-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqList?.completedRfqs.map((rfq) => (
                      <tr key={rfq.id} className="border-b text-foreground">
                        <td className="py-3">{rfq.rfqNumber}</td>
                        <td className="py-3">{rfq.customerName}</td>
                        <td className="py-3">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">{rfq.itemCount}</td>
                        <td className="py-3">
                          <span className={getStatusClass(rfq.status)}>
                            {getStatusLabel(rfq.status)}
                          </span>
                        </td>
                        <td className="py-3">
                          <a
                            href={`/rfq-management/${rfq.id}`}
                            className="text-primary hover:underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Conversion Rate metric with weekly data
function ConversionRateMetric({
  rfqMetrics,
}: {
  rfqMetrics: DashboardMetrics["rfqMetrics"];
}) {
  const trend = rfqMetrics.weeklyConversionChange >= 0 ? "up" : "down";
  const changeValue = Math.abs(rfqMetrics.weeklyConversionChange || 0);

  return (
    <div className="metric-card bg-green-50 dark:bg-green-950/30">
      <div className="metric-label">Conversion Rate</div>
      <div className="metric-value">{rfqMetrics.conversionRate.toFixed(1)}%</div>
      <div className={`metric-change ${
        trend === "up" ? "metric-positive" : "metric-negative"
      }`}>
        {trend === "up" ? (
          <ArrowUpIcon className="inline w-3 h-3 mr-1" />
        ) : (
          <ArrowDownIcon className="inline w-3 h-3 mr-1" />
        )}
        {changeValue.toFixed(1)}% this week
      </div>
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
      <div className="metric-label">Sales Volume</div>
      <div className="metric-value">{formattedValue}</div>
      <div className={`metric-change ${
        trend === "up" ? "metric-positive" : "metric-negative"
      }`}>
        {trend === "up" ? (
          <ArrowUpIcon className="inline w-3 h-3 mr-1" />
        ) : (
          <ArrowDownIcon className="inline w-3 h-3 mr-1" />
        )}
        {Math.abs(percentageChange).toFixed(1)}% this week
      </div>
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

// Helper functions for status display
function getStatusClass(status: string) {
  const statusClasses = {
    PENDING: "status-new",
    IN_REVIEW: "status-draft",
    APPROVED: "status-accepted",
    REJECTED: "status-declined",
    COMPLETED: "status-processed"
  }
  return statusClasses[status as keyof typeof statusClasses]
}

function getStatusLabel(status: string) {
  const statusLabels = {
    PENDING: "Pending",
    IN_REVIEW: "In Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed"
  }
  return statusLabels[status as keyof typeof statusLabels]
}
