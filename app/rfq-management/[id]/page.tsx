"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  User,
  Building,
  Calendar,
  Tag,
  Settings,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { rfqApi } from "@/lib/api-client";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner"

export default function RfqDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currency, formatCurrency, convertCurrency } = useCurrency();
  const [rfqData, setRfqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log();

  useEffect(() => {
    const fetchRfqData = async () => {
      try {
        setLoading(true);
        const response = await rfqApi.getById(id);
        if (response.success && response.data) {
          setRfqData(response.data);
        } else {
          setError("Failed to load RFQ data");
          toast.error("Failed to load RFQ data");
        }
      } catch (err) {
        setError("An error occurred while loading RFQ data");
        toast.error("An error occurred while loading RFQ data");
      } finally {
        setLoading(false);
      }
    };

    fetchRfqData();
  }, [id]);

  const handleCreateQuote = async () => {
    try {
      const response = await rfqApi.update(id, {
        status: "APPROVED",
      });
      if (response.success) {
        toast.success("Quote created successfully");
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data);
        }
      }
    } catch (err) {
      toast.error("Failed to create quote");
    }
  };

  const handleRejectRfq = async () => {
    try {
      const response = await rfqApi.update(id, {
        status: "REJECTED",
      });
      if (response.success) {
        toast.success("RFQ rejected successfully");
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data);
        }
      }
    } catch (err) {
      toast.error("Failed to reject RFQ");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="RFQ Detail" subtitle="View RFQ details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="flex justify-center items-center">
                <Spinner size={32} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rfqData) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Error" subtitle="Failed to load RFQ details" />
          <div className="flex-1 overflow-auto p-4">
            <div className="text-center text-red-500">
              {error || "RFQ not found"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={`RFQ Details: ${rfqData.rfqNumber}`}
          subtitle="View and manage request for quote"
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {rfqData.customer?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Customer
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {rfqData.customer?.type || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Customer Type
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(rfqData.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date Received
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">RFQ Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium capitalize">
                      {rfqData.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{rfqData.source}</span>
                  </div>
                  {rfqData.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">
                        {new Date(rfqData.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {rfqData.totalBudget && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Budget:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          currency === "CAD"
                            ? rfqData.totalBudget
                            : convertCurrency(rfqData.totalBudget, "CAD")
                        )}
                      </span>
                    </div>
                  )}
                  <div className="pt-4 flex gap-2">
                    <Button asChild>
                      <a href={`/rfq-management/${id}/create-quote`}>Create Quote</a>
                    </Button>
                    <Button variant="outline" onClick={handleRejectRfq}>
                      Reject RFQ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="items" className="space-y-4">
            <TabsList>
              <TabsTrigger value="items">
                <FileText className="h-4 w-4 mr-2" />
                Items
              </TabsTrigger>
              <TabsTrigger value="customer-history">
                <User className="h-4 w-4 mr-2" />
                Customer History
              </TabsTrigger>
              <TabsTrigger value="market-prices">
                <Tag className="h-4 w-4 mr-2" />
                Market Prices
              </TabsTrigger>
              <TabsTrigger value="sales-history">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Sales History
              </TabsTrigger>
              <TabsTrigger value="custom-table">
                <Building className="h-4 w-4 mr-2" />
                Custom Table
              </TabsTrigger>
              <TabsTrigger value="original-request">
                <FileText className="h-4 w-4 mr-2" />
                Original Request
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="m-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">SKU</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Quantity</th>
                      <th className="pb-2 font-medium">Unit Price</th>
                      <th className="pb-2 font-medium">Total</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqData.items?.map((item: any) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          {item.customerSku || item.inventory?.sku || "N/A"}
                        </td>
                        <td className="py-3">
                          {item.description ||
                            item.inventory?.description ||
                            "N/A"}
                        </td>
                        <td className="py-3">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3">
                          {formatCurrency(
                            currency === "CAD"
                              ? item.finalPrice ||
                                  item.suggestedPrice ||
                                  item.estimatedPrice ||
                                  0
                              : convertCurrency(
                                  item.finalPrice ||
                                    item.suggestedPrice ||
                                    item.estimatedPrice ||
                                    0,
                                  "CAD"
                                )
                          )}
                        </td>
                        <td className="py-3">
                          {formatCurrency(
                            currency === "CAD"
                              ? (item.finalPrice ||
                                  item.suggestedPrice ||
                                  item.estimatedPrice ||
                                  0) * item.quantity
                              : convertCurrency(
                                  (item.finalPrice ||
                                    item.suggestedPrice ||
                                    item.estimatedPrice ||
                                    0) * item.quantity,
                                  "CAD"
                                )
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm">
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="customer-history" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Customer History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">Customer history details go here.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market-prices" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Market Prices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">Market prices information goes here.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales-history" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Sales History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">Sales history details go here.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom-table" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">Custom table content goes here.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="original-request" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Original Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">Original request details go here.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div>
                        <div className="font-medium">RFQ Created</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(rfqData.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {rfqData.updatedAt !== rfqData.createdAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <div className="font-medium">RFQ Updated</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(rfqData.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="notifications" />
                      <Label htmlFor="notifications">
                        Enable email notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-pricing" />
                      <Label htmlFor="auto-pricing">
                        Enable automatic pricing
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="stock-check" />
                      <Label htmlFor="stock-check">
                        Check stock availability
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

