"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/contexts/currency-context"

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" subtitle="Overview of your quotes, inventory, and sales" showNewRfq showDateFilter />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Active RFQs" value="24" change="8.2% from last week" trend="up" color="blue" />
            <MetricCard label="Conversion Rate" value="68.5%" change="4.3% from last month" trend="up" color="green" />
            <SalesVolumeMetric />
            <MetricCard label="Low Stock Alert" value="14" change="5 more than last week" trend="up" color="red" />
          </div>

          {/* Global Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input type="search" placeholder="Search for RFQs, SKUs, or Customers..." className="pl-10 py-6" />
            </div>
          </div>

          <div className="grid gap-6">
            {/* Active RFQs Table */}
            <Card className="p-4 bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Active RFQs</h2>
                <a href="/rfq-management" className="text-sm text-primary hover:underline">
                  View all
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-foreground">RFQ ID</th>
                      <th className="pb-2 font-medium text-foreground">Customer</th>
                      <th className="pb-2 font-medium text-foreground">Date</th>
                      <th className="pb-2 font-medium text-foreground">Items</th>
                      <th className="pb-2 font-medium text-foreground">Status</th>
                      <th className="pb-2 font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <RfqRow id="RFQ-2308" customer="ABC Electronics" date="4/25/2025" items={8} status="new" />
                    <RfqRow id="RFQ-2307" customer="Tech Solutions Inc" date="4/24/2025" items={5} status="draft" />
                    <RfqRow id="RFQ-2306" customer="Global Systems" date="4/24/2025" items={3} status="priced" />
                    <RfqRow id="RFQ-2304" customer="ABC Electronics" date="4/23/2025" items={6} status="sent" />
                    <RfqRow
                      id="RFQ-2303"
                      customer="Tech Solutions Inc"
                      date="4/23/2025"
                      items={4}
                      status="negotiating"
                    />
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Completed RFQs Table */}
            <Card className="p-4 bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Completed RFQs</h2>
                <a href="/rfq-management" className="text-sm text-primary hover:underline">
                  View all
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-foreground">RFQ ID</th>
                      <th className="pb-2 font-medium text-foreground">Customer</th>
                      <th className="pb-2 font-medium text-foreground">Date</th>
                      <th className="pb-2 font-medium text-foreground">Items</th>
                      <th className="pb-2 font-medium text-foreground">Status</th>
                      <th className="pb-2 font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <RfqRow id="RFQ-2302" customer="Global Systems" date="4/22/2025" items={7} status="declined" />
                    <RfqRow
                      id="RFQ-2301"
                      customer="Midwest Distributors"
                      date="4/22/2025"
                      items={3}
                      status="accepted"
                    />
                    <RfqRow id="RFQ-2299" customer="ABC Electronics" date="4/21/2025" items={5} status="processed" />
                    <RfqRow id="RFQ-2296" customer="Tech Solutions Inc" date="4/20/2025" items={4} status="accepted" />
                    <RfqRow id="RFQ-2294" customer="Global Systems" date="4/19/2025" items={2} status="processed" />
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add a new component for the Sales Volume metric that uses the currency context
function SalesVolumeMetric() {
  const { currency, formatCurrency, convertCurrency } = useCurrency()

  // Base values in CAD
  const salesValueCAD = 256800
  const changePercentage = -2.1

  // Format the value based on the selected currency
  const formattedValue = formatCurrency(currency === "CAD" ? salesValueCAD : convertCurrency(salesValueCAD, "CAD"))

  return (
    <div className={`metric-card bg-purple-50 dark:bg-purple-950/30`}>
      <div className="metric-label">Sales Volume</div>
      <div className="metric-value">{formattedValue}</div>
      <div className="metric-change metric-negative">
        <ArrowDownIcon className="inline w-3 h-3 mr-1" />
        {changePercentage}% from last month
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  color: "blue" | "green" | "purple" | "red"
}

function MetricCard({ label, value, change, trend, color }: MetricCardProps) {
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
      <div
        className={`metric-change ${
          trend === "up" ? "metric-positive" : trend === "down" ? "metric-negative" : "metric-neutral"
        }`}
      >
        {trend === "up" && <ArrowUpIcon className="inline w-3 h-3 mr-1" />}
        {trend === "down" && <ArrowDownIcon className="inline w-3 h-3 mr-1" />}
        {change}
      </div>
    </div>
  )
}

interface RfqRowProps {
  id: string
  customer: string
  date: string
  items: number
  status: "new" | "draft" | "priced" | "sent" | "negotiating" | "accepted" | "declined" | "processed"
}

function RfqRow({ id, customer, date, items, status }: RfqRowProps) {
  const statusClasses = {
    new: "status-new",
    draft: "status-draft",
    priced: "status-priced",
    sent: "status-sent",
    negotiating: "status-negotiating",
    accepted: "status-accepted",
    declined: "status-declined",
    processed: "status-processed",
  }

  const statusLabels = {
    new: "New",
    draft: "Draft",
    priced: "Priced",
    sent: "Sent",
    negotiating: "Negotiating",
    accepted: "Accepted",
    declined: "Declined",
    processed: "Processed",
  }

  return (
    <tr className="border-b text-foreground">
      <td className="py-3">{id}</td>
      <td className="py-3">{customer}</td>
      <td className="py-3">{date}</td>
      <td className="py-3">{items}</td>
      <td className="py-3">
        <span className={statusClasses[status]}>
          {statusLabels[status]}
        </span>
      </td>
      <td className="py-3">
        <a href={`/rfq-management/${id}`} className="text-primary hover:underline">
          View
        </a>
      </td>
    </tr>
  )
}
