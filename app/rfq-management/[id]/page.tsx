"use client";

import { useEffect, useState } from "react";
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
import { rfqApi, customerApi, inventoryApi } from "@/lib/api-client";
import { toast } from "sonner";

interface RfqItem {
  sku: string;
  description: string;
  quantity: number;
  priceCAD: number;
  totalCAD: number;
}

interface RfqData {
  id: string;
  customer: string;
  date: string;
  source: string;
  status: string;
  items: RfqItem[];
  subtotalCAD: number;
  taxCAD: number;
  totalCAD: number;
}

export default function RfqDetail({ params }: { params: { id: string } }) {
  const { currency, formatCurrency, convertCurrency } = useCurrency();
  const [rfqData, setRfqData] = useState<RfqData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRfqData = async () => {
      try {
        setLoading(true);
        const response = await rfqApi.getById(params.id);
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
  }, [params.id]);

  const handleCreateQuote = async () => {
    try {
      const response = await rfqApi.update(params.id, {
        status: "QUOTED",
        // Add any additional quote data
      });
      if (response.success) {
        toast.success("Quote created successfully");
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(params.id);
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
      const response = await rfqApi.update(params.id, {
        status: "REJECTED",
        rejectionReason: "Rejected by user",
      });
      if (response.success) {
        toast.success("RFQ rejected successfully");
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(params.id);
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
          <Header
            title="Loading..."
            subtitle="Please wait while we load the RFQ details"
          />
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
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
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">{error || "RFQ not found"}</div>
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
          title={`RFQ Details: ${params.id}`}
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
                      <div className="font-medium">{rfqData.customer}</div>
                      <div className="text-sm text-muted-foreground">
                        Customer
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Dealer</div>
                      <div className="text-sm text-muted-foreground">
                        Customer Type
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{rfqData.date}</div>
                      <div className="text-sm text-muted-foreground">
                        Date Received
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{rfqData.source}</div>
                      <div className="text-sm text-muted-foreground">
                        Source
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        <span
                          className={`status-${rfqData.status.toLowerCase()}`}
                        >
                          {rfqData.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Status
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
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        currency === "CAD"
                          ? rfqData.subtotalCAD
                          : convertCurrency(rfqData.subtotalCAD, "CAD")
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (13%):</span>
                    <span className="font-medium">
                      {formatCurrency(
                        currency === "CAD"
                          ? rfqData.taxCAD
                          : convertCurrency(rfqData.taxCAD, "CAD")
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(
                        currency === "CAD"
                          ? rfqData.totalCAD
                          : convertCurrency(rfqData.totalCAD, "CAD")
                      )}
                    </span>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button onClick={handleCreateQuote}>Create Quote</Button>
                    <Button variant="outline" onClick={handleRejectRfq}>
                      Reject RFQ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requested Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="items">
                <TabsList className="mb-4">
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="history">Customer History</TabsTrigger>
                  <TabsTrigger value="market">Market Prices</TabsTrigger>
                  <TabsTrigger value="sales-history">Sales History</TabsTrigger>
                  <TabsTrigger value="custom-table">Custom Table</TabsTrigger>
                  <TabsTrigger value="original-request">
                    Original Request
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
                        {rfqData.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3">{item.sku}</td>
                            <td className="py-3">{item.description}</td>
                            <td className="py-3">{item.quantity}</td>
                            <td className="py-3">
                              {formatCurrency(
                                currency === "CAD"
                                  ? item.priceCAD
                                  : convertCurrency(item.priceCAD, "CAD")
                              )}
                            </td>
                            <td className="py-3">
                              {formatCurrency(
                                currency === "CAD"
                                  ? item.totalCAD
                                  : convertCurrency(item.totalCAD, "CAD")
                              )}
                            </td>
                            <td className="py-3">
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">SKU</th>
                          <th className="pb-2 font-medium">
                            Last Purchase Date
                          </th>
                          <th className="pb-2 font-medium">
                            Last Purchase Price
                          </th>
                          <th className="pb-2 font-medium">
                            Quantity (3 Months)
                          </th>
                          <th className="pb-2 font-medium">
                            Quantity (12 Months)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">CF226X</td>
                          <td className="py-3">4/10/2025</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 118.75
                                : convertCurrency(118.75, "CAD")
                            )}
                          </td>
                          <td className="py-3">12</td>
                          <td className="py-3">45</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">CE255X</td>
                          <td className="py-3">4/05/2025</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 92.5
                                : convertCurrency(92.5, "CAD")
                            )}
                          </td>
                          <td className="py-3">8</td>
                          <td className="py-3">32</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">CC364X</td>
                          <td className="py-3">3/28/2025</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 142.25
                                : convertCurrency(142.25, "CAD")
                            )}
                          </td>
                          <td className="py-3">5</td>
                          <td className="py-3">18</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="market" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">SKU</th>
                          <th className="pb-2 font-medium">Marketplace 1</th>
                          <th className="pb-2 font-medium">Marketplace 2</th>
                          <th className="pb-2 font-medium">Marketplace 3</th>
                          <th className="pb-2 font-medium">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">CF226X</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 125.99
                                : convertCurrency(125.99, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 129.5
                                : convertCurrency(129.5, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 122.75
                                : convertCurrency(122.75, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 126.08
                                : convertCurrency(126.08, "CAD")
                            )}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">CE255X</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 98.5
                                : convertCurrency(98.5, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 102.25
                                : convertCurrency(102.25, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 97.99
                                : convertCurrency(97.99, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 99.58
                                : convertCurrency(99.58, "CAD")
                            )}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">CC364X</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 149.99
                                : convertCurrency(149.99, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 152.5
                                : convertCurrency(152.5, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 147.75
                                : convertCurrency(147.75, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 150.08
                                : convertCurrency(150.08, "CAD")
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="sales-history" className="m-0">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-md font-medium">
                      Sales History Across All Customers
                    </h3>
                    <div className="flex items-center gap-2">
                      <select className="border rounded-md px-3 py-1.5 text-sm">
                        <option>Last 3 Months</option>
                        <option>Last 6 Months</option>
                        <option>Last 12 Months</option>
                        <option>All Time</option>
                      </select>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">SKU</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Quantity</th>
                          <th className="pb-2 font-medium">Unit Price</th>
                          <th className="pb-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">CF226X</td>
                          <td className="py-3">ABC Electronics</td>
                          <td className="py-3">4/15/2025</td>
                          <td className="py-3">10</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 118.5
                                : convertCurrency(118.5, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 1185.0
                                : convertCurrency(1185.0, "CAD")
                            )}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">CF226X</td>
                          <td className="py-3">Global Systems</td>
                          <td className="py-3">4/10/2025</td>
                          <td className="py-3">5</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 122.75
                                : convertCurrency(122.75, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 613.75
                                : convertCurrency(613.75, "CAD")
                            )}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">CE255X</td>
                          <td className="py-3">Midwest Distributors</td>
                          <td className="py-3">4/08/2025</td>
                          <td className="py-3">8</td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 94.25
                                : convertCurrency(94.25, "CAD")
                            )}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              currency === "CAD"
                                ? 754.0
                                : convertCurrency(754.0, "CAD")
                            )}
                          </td>
                        </tr>
                        <tr className="border-b bg-muted/20">
                          <td className="py-3 font-medium" colSpan={3}>
                            Average for CF226X
                          </td>
                          <td className="py-3 font-medium">7.5</td>
                          <td className="py-3 font-medium">
                            {formatCurrency(
                              currency === "CAD"
                                ? 120.63
                                : convertCurrency(120.63, "CAD")
                            )}
                          </td>
                          <td className="py-3 font-medium">
                            {formatCurrency(
                              currency === "CAD"
                                ? 899.38
                                : convertCurrency(899.38, "CAD")
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="custom-table" className="m-0">
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-2">
                      Select Columns to Display
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-sku" defaultChecked />
                        <Label htmlFor="col-sku">SKU</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-desc" defaultChecked />
                        <Label htmlFor="col-desc">Description</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-qty" defaultChecked />
                        <Label htmlFor="col-qty">Quantity</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-price" defaultChecked />
                        <Label htmlFor="col-price">Price</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-customer" />
                        <Label htmlFor="col-customer">Customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-date" />
                        <Label htmlFor="col-date">Date</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-margin" />
                        <Label htmlFor="col-margin">Margin</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="col-cost" />
                        <Label htmlFor="col-cost">Cost</Label>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        Apply Custom View
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">SKU</th>
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium">Quantity</th>
                          <th className="pb-2 font-medium">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfqData.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3">{item.sku}</td>
                            <td className="py-3">{item.description}</td>
                            <td className="py-3">{item.quantity}</td>
                            <td className="py-3">
                              {formatCurrency(
                                currency === "CAD"
                                  ? item.priceCAD
                                  : convertCurrency(item.priceCAD, "CAD")
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="original-request" className="m-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-md font-medium">
                      Original RFQ Request
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Received: 4/23/2025 via Email
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        View Original
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Original SKU</th>
                          <th className="pb-2 font-medium">Mapped SKU</th>
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium">Requested Qty</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">HP26X</td>
                          <td className="py-3">CF226X</td>
                          <td className="py-3">
                            HP 26X High Yield Black Toner
                          </td>
                          <td className="py-3">5</td>
                          <td className="py-3">
                            <span className="status-processed">Mapped</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">HP-55-X</td>
                          <td className="py-3">CE255X</td>
                          <td className="py-3">
                            HP 55X High Yield Black Toner
                          </td>
                          <td className="py-3">3</td>
                          <td className="py-3">
                            <span className="status-processed">Mapped</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">HP64X</td>
                          <td className="py-3">CC364X</td>
                          <td className="py-3">
                            HP 64X High Yield Black Toner
                          </td>
                          <td className="py-3">2</td>
                          <td className="py-3">
                            <span className="status-processed">Mapped</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">HP-UNKNOWN-123</td>
                          <td className="py-3">-</td>
                          <td className="py-3">Unknown Product</td>
                          <td className="py-3">1</td>
                          <td className="py-3">
                            <span className="status-rejected">Not Mapped</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <div className="p-4 border rounded-md bg-muted/20">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Change History
                      </h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>
                            4/23/2025 10:15 AM - RFQ Created from Email
                          </span>
                          <span className="text-muted-foreground">
                            John Smith
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            4/23/2025 10:20 AM - SKUs Mapped Automatically
                          </span>
                          <span className="text-muted-foreground">System</span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            4/23/2025 11:05 AM - Item HP-UNKNOWN-123 Marked as
                            Not Available
                          </span>
                          <span className="text-muted-foreground">
                            Jane Doe
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
