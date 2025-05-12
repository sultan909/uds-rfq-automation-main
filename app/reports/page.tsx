"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import { SalesOverviewChart } from "@/components/reports/sales-overview-chart"
import { RfqConversionChart } from "@/components/reports/rfq-conversion-chart"
import { TopCustomersChart } from "@/components/reports/top-customers-chart"
import { TopProductsChart } from "@/components/reports/top-products-chart"
import { SalesByRegionChart } from "@/components/reports/sales-by-region-chart"
import { RfqStatusDistributionChart } from "@/components/reports/rfq-status-distribution-chart"
import { SalesMetricsCards } from "@/components/reports/sales-metrics-cards"
import { RfqMetricsCards } from "@/components/reports/rfq-metrics-cards"
import { DateRangePicker } from "@/components/date-range-picker"

export default function ReportsDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 3, 30),
  })

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports & Analytics" subtitle="Track performance metrics and business insights" />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <Tabs defaultValue="sales" className="w-[400px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
                <TabsTrigger value="rfq">RFQ Analytics</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-3">
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="sales">
            <TabsContent value="sales" className="m-0">
              <div className="space-y-6">
                <SalesMetricsCards />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle>Sales Overview</CardTitle>
                      <CardDescription>Monthly sales performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SalesOverviewChart />
                    </CardContent>
                  </Card>

                  <Card className="bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle>Top Customers</CardTitle>
                      <CardDescription>By sales volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TopCustomersChart />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                      <CardDescription>Best selling products by quantity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TopProductsChart />
                    </CardContent>
                  </Card>

                  <Card className="bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle>Sales by Region</CardTitle>
                      <CardDescription>Geographic distribution of sales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SalesByRegionChart />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rfq" className="m-0">
              <div className="space-y-6">
                <RfqMetricsCards />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle>RFQ Conversion Rate</CardTitle>
                      <CardDescription>Percentage of RFQs converted to sales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RfqConversionChart />
                    </CardContent>
                  </Card>

                  <Card className="bg-card text-card-foreground">
                    <CardHeader>
                      <CardTitle>RFQ Status Distribution</CardTitle>
                      <CardDescription>Current RFQ status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RfqStatusDistributionChart />
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle>RFQ Processing Time</CardTitle>
                    <CardDescription>Average time to process RFQs by month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      Processing time chart will be displayed here
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
