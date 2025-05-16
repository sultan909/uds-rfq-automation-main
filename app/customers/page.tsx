"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, Building, Users } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"
import { useEffect, useState } from "react"
import { customerApi } from "@/lib/api-client"
import { toast } from "sonner"

interface CustomerTableRowProps {
  id: string
  name: string
  email: string
  type: string
  phone: string
  status: string
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    dealers: 0,
    wholesalers: 0
  })

  useEffect(() => {
    fetchCustomers()
  }, [selectedTab])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = selectedTab === "all" ? {} : { type: selectedTab.toUpperCase() }
      const response = await customerApi.list(params)
      
      if (response.success && response.data) {
        const customerData = response.data as any[]
        setCustomers(customerData)
        
        // Calculate statistics
        setStats({
          total: customerData.length,
          dealers: customerData.filter(c => c.type === 'DEALER').length,
          wholesalers: customerData.filter(c => c.type === 'WHOLESALER').length
        })
      } else {
        setError("Failed to load customers")
        toast.error("Failed to load customers")
      }
    } catch (err) {
      setError("An error occurred while loading customers")
      toast.error("An error occurred while loading customers")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCustomers()
      return
    }

    try {
      setLoading(true)
      const response = await customerApi.search(searchQuery, { type: selectedTab === "all" ? undefined : selectedTab.toUpperCase() })
      if (response.success && response.data) {
        setCustomers(response.data as any[])
      } else {
        setError("Failed to search customers")
        toast.error("Failed to search customers")
      }
    } catch (err) {
      setError("An error occurred while searching customers")
      toast.error("An error occurred while searching customers")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Customer Management" subtitle="Manage customer information and relationships" showNewCustomer />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dealers</div>
                <div className="text-2xl font-bold">{stats.dealers}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wholesalers</div>
                <div className="text-2xl font-bold">{stats.wholesalers}</div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Customer List</h2>
              <div className="flex gap-2">
                <Input type="search" placeholder="Search customers..." className="w-64" />
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="wholesaler">Wholesalers</TabsTrigger>
                <TabsTrigger value="dealer">Dealers</TabsTrigger>
                <TabsTrigger value="retailer">Retailers</TabsTrigger>
                <TabsTrigger value="direct">Direct</TabsTrigger>
              </TabsList>

              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <select className="border rounded-md px-3 py-1.5 text-sm bg-background text-foreground">
                    <option>Newest First</option>
                    <option>Oldest First</option>
                    <option>Name A-Z</option>
                    <option>Name Z-A</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input 
                    type="search" 
                    placeholder="Search customers..." 
                    className="w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </div>

              <TabsContent value={selectedTab} className="m-0">
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
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">Loading...</td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-red-500">{error}</td>
                        </tr>
                      ) : customers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">No customers found</td>
                        </tr>
                      ) : (
                        customers.map((customer) => (
                          <CustomerRow
                            key={customer.id}
                            name={customer.name}
                            type={customer.type}
                            lastOrder={customer.lastOrder || "Never"}
                            totalOrders={customer.totalOrders || 0}
                            totalSpentCAD={customer.totalSpentCAD || 0}
                          />
                        ))
                      )}
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
