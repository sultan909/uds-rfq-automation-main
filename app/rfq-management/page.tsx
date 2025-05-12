import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RfqManagement() {
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

              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="priced">Priced</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
                  <TabsTrigger value="accepted">Accepted</TabsTrigger>
                  <TabsTrigger value="declined">Declined</TabsTrigger>
                  <TabsTrigger value="processed">Processed</TabsTrigger>
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
                  <div>
                    <Input type="search" placeholder="Search RFQs..." className="w-64" />
                  </div>
                </div>

                <TabsContent value="all" className="m-0">
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
                        <RfqTableRow
                          id="RFQ-1328"
                          customer="Tech Solutions Inc"
                          date="4/23/2025"
                          source="Email"
                          items={0}
                          status="new"
                        />
                        <RfqTableRow
                          id="RFQ-2301"
                          customer="Midwest Distributors"
                          date="4/23/2025"
                          source="Website"
                          items={0}
                          status="draft"
                        />
                        <RfqTableRow
                          id="RFQ-2302"
                          customer="Global Systems"
                          date="4/23/2025"
                          source="Email"
                          items={0}
                          status="declined"
                        />
                        <RfqTableRow
                          id="RFQ-2303"
                          customer="Tech Solutions Inc"
                          date="4/23/2025"
                          source="Phone"
                          items={0}
                          status="processed"
                        />
                        <RfqTableRow
                          id="RFQ-2304"
                          customer="ABC Electronics"
                          date="4/23/2025"
                          source="Email"
                          items={0}
                          status="negotiating"
                        />
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="new" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <RfqTableRow
                          id="RFQ-1328"
                          customer="Tech Solutions Inc"
                          date="4/23/2025"
                          source="Email"
                          items={0}
                          status="new"
                        />
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="draft" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <RfqTableRow
                          id="RFQ-2301"
                          customer="Midwest Distributors"
                          date="4/23/2025"
                          source="Website"
                          items={0}
                          status="draft"
                        />
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="priced" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="sent" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="negotiating" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <RfqTableRow
                          id="RFQ-2304"
                          customer="ABC Electronics"
                          date="4/23/2025"
                          source="Email"
                          items={0}
                          status="negotiating"
                        />
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="accepted" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="declined" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <RfqTableRow
                          id="RFQ-2302"
                          customer="Global Systems"
                          date="4/23/2025"
                          source="Email"
                          items={0}
                          status="declined"
                        />
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="processed" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RFQ Number</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Source</th>
                          <th className="pb-2 font-medium">Items</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <RfqTableRow
                          id="RFQ-2303"
                          customer="Tech Solutions Inc"
                          date="4/23/2025"
                          source="Phone"
                          items={0}
                          status="processed"
                        />
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

interface RfqTableRowProps {
  id: string
  customer: string
  date: string
  source: string
  items: number
  status: "new" | "draft" | "priced" | "sent" | "negotiating" | "accepted" | "declined" | "processed"
}

function RfqTableRow({ id, customer, date, source, items, status }: RfqTableRowProps) {
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
      <td className="py-3">{source}</td>
      <td className="py-3">{items}</td>
      <td className="py-3">
        <span className={statusClasses[status]}>{statusLabels[status]}</span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/rfq-management/${id}`}>View</a>
          </Button>
          <Button variant="ghost" size="sm">
            Quote
          </Button>
        </div>
      </td>
    </tr>
  )
}
