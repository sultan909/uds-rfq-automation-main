"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, Building, Users } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"

export default function Customers() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Customer Management" subtitle="Manage your customer relationships" />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
                <div className="text-2xl font-bold">312</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dealers</div>
                <div className="text-2xl font-bold">287</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wholesalers</div>
                <div className="text-2xl font-bold">25</div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Customer List</h2>
              <div className="flex gap-2">
                <Input type="search" placeholder="Search customers..." className="w-64" />
                <Button>Add Customer</Button>
              </div>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Customers</TabsTrigger>
                <TabsTrigger value="dealers">Dealers</TabsTrigger>
                <TabsTrigger value="wholesalers">Wholesalers</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="m-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Customer Name
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Type
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Last Order
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Total Orders
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">
                          <div className="flex items-center gap-1">
                            Total Spent
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <CustomerRow
                        name="Tech Solutions Inc"
                        type="Dealer"
                        lastOrder="4/22/2025"
                        totalOrders={42}
                        totalSpentCAD={24850.75}
                      />
                      <CustomerRow
                        name="ABC Electronics"
                        type="Wholesaler"
                        lastOrder="4/20/2025"
                        totalOrders={128}
                        totalSpentCAD={156420.5}
                      />
                      <CustomerRow
                        name="Global Systems"
                        type="Dealer"
                        lastOrder="4/18/2025"
                        totalOrders={18}
                        totalSpentCAD={8745.25}
                      />
                      <CustomerRow
                        name="Midwest Distributors"
                        type="Dealer"
                        lastOrder="4/15/2025"
                        totalOrders={36}
                        totalSpentCAD={18320.0}
                      />
                      <CustomerRow
                        name="IJS Globe"
                        type="Wholesaler"
                        lastOrder="4/23/2025"
                        totalOrders={215}
                        totalSpentCAD={245780.25}
                      />
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="dealers" className="m-0">
                {/* Similar table structure for dealers */}
              </TabsContent>

              <TabsContent value="wholesalers" className="m-0">
                {/* Similar table structure for wholesalers */}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface CustomerRowProps {
  name: string
  type: "Dealer" | "Wholesaler"
  lastOrder: string
  totalOrders: number
  totalSpentCAD: number
}

function CustomerRow({ name, type, lastOrder, totalOrders, totalSpentCAD }: CustomerRowProps) {
  const { currency, formatCurrency, convertCurrency } = useCurrency()

  // Format the total spent based on the selected currency
  const formattedTotalSpent = formatCurrency(currency === "CAD" ? totalSpentCAD : convertCurrency(totalSpentCAD, "CAD"))

  return (
    <tr className="border-b">
      <td className="py-3">{name}</td>
      <td className="py-3">
        <span className={type === "Dealer" ? "status-processed" : "status-pending"}>{type}</span>
      </td>
      <td className="py-3">{lastOrder}</td>
      <td className="py-3">{totalOrders}</td>
      <td className="py-3">{formattedTotalSpent}</td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </div>
      </td>
    </tr>
  )
}
