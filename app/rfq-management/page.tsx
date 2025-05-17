"use client"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { rfqApi } from "@/lib/api-client"
import { toast } from "sonner"

interface RfqTableRowProps {
  rfqId: number
  rfqNumber:string
  customer: string
  date: string
  source: string
  items: number
  status: string
}

export default function RfqManagement() {
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    fetchRfqs()
  }, [selectedTab])
console.log("rfqs",rfqs);

  const fetchRfqs = async () => {
    try {
      setLoading(true)
      const response = await rfqApi.list({ status: selectedTab === "all" ? undefined : selectedTab.toUpperCase() })
      if (response.success && response.data) {
        setRfqs(response.data as any[])
      } else {
        setError("Failed to load RFQs")
        toast.error("Failed to load RFQs")
      }
    } catch (err) {
      setError("An error occurred while loading RFQs")
      toast.error("An error occurred while loading RFQs")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRfqs()
      return
    }

    try {
      setLoading(true)
      const response = await rfqApi.search(searchQuery, { status: selectedTab === "all" ? undefined : selectedTab.toUpperCase() })
      if (response.success && response.data) {
        setRfqs(response.data as any[])
      } else {
        setError("Failed to search RFQs")
        toast.error("Failed to search RFQs")
      }
    } catch (err) {
      setError("An error occurred while searching RFQs")
      toast.error("An error occurred while searching RFQs")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="RFQ Management" subtitle="Handle and process requests for quotes" showNewRfq />
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-background border rounded-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-medium mb-2">RFQ List</h2>
              <p className="text-sm text-muted-foreground mb-4">Review and manage all request for quotes</p>

              <Tabs defaultValue="all" onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_review">In Review</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <select className="border rounded-md px-3 py-1.5 text-sm bg-background text-foreground">
                      <option>Newest First</option>
                      <option>Oldest First</option>
                      <option>Customer A-Z</option>
                      <option>Customer Z-A</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="search" 
                      placeholder="Search RFQs..." 
                      className="w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch}>Search</Button>
                    <Button asChild>
                      <a href="/rfq-management/new">Add New RFQ</a>
                    </Button>
                  </div>
                </div>

                <TabsContent value={selectedTab} className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium text-foreground">RFQ Number</th>
                          <th className="pb-2 font-medium text-foreground">Customer</th>
                          <th className="pb-2 font-medium text-foreground">Date</th>
                          <th className="pb-2 font-medium text-foreground">Source</th>
                          <th className="pb-2 font-medium text-foreground">Items</th>
                          <th className="pb-2 font-medium text-foreground">Status</th>
                          <th className="pb-2 font-medium text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">Loading...</td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-red-500">{error}</td>
                          </tr>
                        ) : rfqs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">No RFQs found</td>
                          </tr>
                        ) : (
                          rfqs.map((rfq) => (
                            <RfqTableRow
                              key={rfq.id}
                              rfqId={rfq.id}
                              rfqNumber={rfq.rfqNumber}
                              customer={rfq.customer?.name || "Unknown"}
                              date={new Date(rfq.createdAt).toLocaleDateString()}
                              source={rfq.source}
                              items={rfq.items?.length || 0}
                              status={rfq.status.toLowerCase()}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RfqTableRow({ rfqId, rfqNumber, customer, date, source, items, status }: RfqTableRowProps) {
  const statusClasses = {
    pending: "status-new",
    in_review: "status-draft",
    approved: "status-accepted",
    rejected: "status-declined",
    completed: "status-processed",
  }

  const statusLabels = {
    pending: "Pending",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
  }

  return (
    <tr className="border-b text-foreground">
      <td className="py-3">{rfqNumber}</td>
      <td className="py-3">{customer}</td>
      <td className="py-3">{date}</td>
      <td className="py-3">{source}</td>
      <td className="py-3">{items}</td>
      <td className="py-3">
        <span className={statusClasses[status as keyof typeof statusClasses]}>
          {statusLabels[status as keyof typeof statusLabels]}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/rfq-management/${rfqId}`}>View</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={`/rfq-management/${rfqId}/create-quote`}>Quote</a>
          </Button>
        </div>
      </td>
    </tr>
  )
}
