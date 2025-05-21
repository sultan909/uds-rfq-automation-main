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
import { rfqApi, customerApi, inventoryApi } from "@/lib/api-client";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

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
  const [filters, setFilters] = useState({ period: '3months', type: 'all' });
  const [history, setHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [inventoryHistory, setInventoryHistory] = useState<Record<string, any>>({});
  const [inventoryHistoryLoading, setInventoryHistoryLoading] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        console.log('Fetching history for customer:', rfqData.customer.id);
        const response = await customerApi.getHistory(rfqData.customer.id, filters.period);
        console.log('History response:', response);
        if (response.success && response.data) {
          setHistory(response.data);
          // @ts-ignore
          setHistoryStats(response.data.stats);
        } else {
          setHistoryError("Failed to load history data");
          toast.error("Failed to load history data");
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setHistoryError("An error occurred while loading history data");
        toast.error("An error occurred while loading history data");
      } finally {
        setHistoryLoading(false);
      }
    };

    const fetchInventoryHistory = async (item: any) => {
      if (!item.inventory?.id) return;
      
      try {
        setInventoryHistoryLoading(prev => ({ ...prev, [item.id]: true }));
        console.log('Fetching inventory history for item:', item.inventory.id);
        const response = await inventoryApi.getHistory(item.inventory.id, filters);
        console.log('Inventory history response:', response);
        if (response.success && response.data) {
          setInventoryHistory(prev => ({
            ...prev,
            [item.id]: response.data
          }));
        }
      } catch (err) {
        console.error('Error fetching inventory history:', err);
      } finally {
        setInventoryHistoryLoading(prev => ({ ...prev, [item.id]: false }));
      }
    };

    if (rfqData?.customer?.id) {
      fetchHistory();
      // Fetch inventory history for each item
      rfqData.items?.forEach((item: any) => {
        if (item.inventory?.id) {
          fetchInventoryHistory(item);
        }
      });
    }
  }, [rfqData?.customer?.id, rfqData?.items, filters.period]);

  const exportToExcel = () => {
    try {
      // Prepare the data for export
      const exportData: Record<string, any[][]> = {
        'RFQ Summary': [
          ['RFQ Number', rfqData.rfqNumber],
          ['Date Received', new Date(rfqData.createdAt).toLocaleDateString()],
          ['Source', rfqData.source],
          ['Status', rfqData.status],
          ['Due Date', rfqData.dueDate ? new Date(rfqData.dueDate).toLocaleDateString() : 'N/A'],
          ['Total Budget', formatCurrency(
            currency === "CAD"
              ? rfqData.totalBudget
              : convertCurrency(rfqData.totalBudget, "CAD")
          )],
        ],
        'Customer Information': [
          ['Name', rfqData.customer?.name || 'N/A'],
          ['Type', rfqData.customer?.type || 'N/A'],
          ['Email', rfqData.customer?.email || 'N/A'],
          ['Phone', rfqData.customer?.phone || 'N/A'],
          ['Address', rfqData.customer?.address || 'N/A'],
          ['Contact Person', rfqData.customer?.contactPerson || 'N/A'],
        ],
        'Requestor Information': [
          ['Name', rfqData.requestor?.name || 'N/A'],
          ['Email', rfqData.requestor?.email || 'N/A'],
          ['Role', rfqData.requestor?.role || 'N/A'],
        ],
        'Requested Items': [
          ['SKU', 'Description', 'Quantity', 'Unit', 'Estimated Price', 'Final Price', 'Total', 'Status'],
          ...rfqData.items?.map((item: any) => [
            item.customerSku || item.inventory?.sku || 'N/A',
            item.description || item.inventory?.description || 'N/A',
            item.quantity,
            item.unit || 'EA',
            formatCurrency(
              currency === "CAD"
                ? item.estimatedPrice || 0
                : convertCurrency(item.estimatedPrice || 0, "CAD")
            ),
            formatCurrency(
              currency === "CAD"
                ? item.finalPrice || item.suggestedPrice || 0
                : convertCurrency(item.finalPrice || item.suggestedPrice || 0, "CAD")
            ),
            formatCurrency(
              currency === "CAD"
                ? (item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0) * item.quantity
                : convertCurrency(
                    (item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0) * item.quantity,
                    "CAD"
                  )
            ),
            item.status?.toLowerCase() || 'pending',
          ]) || [],
        ],
      };

      // Add Customer History Summary if available
      if (historyStats) {
        exportData['Customer History Summary'] = [
          ['Total RFQs', historyStats.totalRfqs],
          ['Total Spent', formatCurrency(
            currency === "CAD"
              ? historyStats.totalSpentCAD
              : convertCurrency(historyStats.totalSpentCAD, "CAD")
          )],
          ['Average Order Value', formatCurrency(
            currency === "CAD"
              ? historyStats.averageOrderValueCAD
              : convertCurrency(historyStats.averageOrderValueCAD, "CAD")
          )],
          ['Acceptance Rate', `${historyStats.acceptanceRate}%`],
        ];
      }

      // Add Customer Transaction History if available
      if (history?.history && history.history.length > 0) {
        exportData['Customer Transaction History'] = [
          ['Date', 'Type', 'Document #', 'SKU', 'Description', 'Quantity', 'Unit Price', 'Total Amount', 'Status'],
          ...history.history.map((item: any) => [
            item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
            item.type || 'N/A',
            item.documentNumber || 'N/A',
            item.sku || 'N/A',
            item.description || 'N/A',
            item.quantity || 'N/A',
            formatCurrency(
              currency === "CAD"
                ? item.unitPrice || 0
                : convertCurrency(item.unitPrice || 0, "CAD")
            ),
            formatCurrency(
              currency === "CAD"
                ? item.totalAmount || 0
                : convertCurrency(item.totalAmount || 0, "CAD")
            ),
            item.status?.toLowerCase() || 'N/A',
          ]),
        ];
      }

      // Add Inventory History for each item
      if (rfqData.items) {
        rfqData.items.forEach((item: any) => {
          const itemHistory = inventoryHistory[item.id];
          if (itemHistory?.transactions && itemHistory.transactions.length > 0) {
            exportData[`Inventory History - ${item.customerSku || item.inventory?.sku || 'Unknown SKU'}`] = [
              ['Date', 'Type', 'Source', 'Document #', 'Customer/Vendor', 'Quantity', 'Unit Price', 'Total Amount', 'Status'],
              ...itemHistory.transactions.map((transaction: any) => [
                transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A',
                transaction.type || 'N/A',
                transaction.source || 'N/A',
                transaction.documentNumber || 'N/A',
                transaction.customerName || transaction.vendorName || 'N/A',
                transaction.quantity || 'N/A',
                formatCurrency(
                  currency === "CAD"
                    ? transaction.unitPrice || 0
                    : convertCurrency(transaction.unitPrice || 0, "CAD")
                ),
                formatCurrency(
                  currency === "CAD"
                    ? transaction.totalAmount || 0
                    : convertCurrency(transaction.totalAmount || 0, "CAD")
                ),
                transaction.status?.toLowerCase() || 'N/A',
              ]),
            ];
          }
        });
      }

      // Add Item-wise Sales Statistics
      if (rfqData.items) {
        rfqData.items.forEach((rfqItem: any) => {
          const itemHistory = history?.history?.filter((item: any) => {
            const itemSku = item.sku || item.customerSku;
            const rfqItemSku = rfqItem.customerSku || rfqItem.inventory?.sku;
            return itemSku === rfqItemSku;
          }) || [];

          const itemInventoryHistory = inventoryHistory[rfqItem.id]?.transactions || [];
          const combinedHistory = [
            ...itemHistory.map((item: any) => ({ ...item, source: 'customer' })),
            ...itemInventoryHistory.map((item: any) => ({ ...item, source: 'inventory' }))
          ];

          if (combinedHistory.length > 0) {
            exportData[`Item Statistics - ${rfqItem.customerSku || rfqItem.inventory?.sku || 'Unknown SKU'}`] = [
              ['Metric', 'Value'],
              ['Total Orders', combinedHistory.filter((item: any) => item.type === 'sale').length],
              ['Total Quantity Sold', combinedHistory
                .filter((item: any) => item.type === 'sale')
                .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)],
              ['Average Sale Price', formatCurrency(
                currency === "CAD"
                  ? combinedHistory
                      .filter((item: any) => item.type === 'sale')
                      .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                      (combinedHistory.filter((item: any) => item.type === 'sale').length || 1)
                  : convertCurrency(
                      combinedHistory
                        .filter((item: any) => item.type === 'sale')
                        .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                        (combinedHistory.filter((item: any) => item.type === 'sale').length || 1),
                      "CAD"
                    )
              )],
              ['Total RFQs', combinedHistory.filter((item: any) => item.type === 'rfq').length],
              ['Total RFQ Quantity', combinedHistory
                .filter((item: any) => item.type === 'rfq')
                .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)],
              ['Average RFQ Price', formatCurrency(
                currency === "CAD"
                  ? combinedHistory
                      .filter((item: any) => item.type === 'rfq')
                      .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                      (combinedHistory.filter((item: any) => item.type === 'rfq').length || 1)
                  : convertCurrency(
                      combinedHistory
                        .filter((item: any) => item.type === 'rfq')
                        .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                        (combinedHistory.filter((item: any) => item.type === 'rfq').length || 1),
                      "CAD"
                    )
              )],
              ['Total Revenue', formatCurrency(
                currency === "CAD"
                  ? combinedHistory
                      .filter((item: any) => item.type === 'sale')
                      .reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0)
                  : convertCurrency(
                      combinedHistory
                        .filter((item: any) => item.type === 'sale')
                        .reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0),
                      "CAD"
                    )
              )],
              ['Conversion Rate', `${Math.round(
                (combinedHistory.filter((item: any) => item.type === 'sale').length /
                  combinedHistory.filter((item: any) => item.type === 'rfq').length) * 100 || 0
              )}%`],
              ['Last Sale', combinedHistory
                .filter((item: any) => item.type === 'sale')
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
                ? new Date(
                    combinedHistory
                      .filter((item: any) => item.type === 'sale')
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
                  ).toLocaleDateString()
                : "No sales"],
            ];
          }
        });
      }

      // Add Additional Notes if available
      if (rfqData.notes) {
        exportData['Additional Notes'] = [[rfqData.notes]];
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Add each section as a separate worksheet
      Object.entries(exportData).forEach(([sheetName, data]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Auto-fit column widths
        const colWidths = data[0].map((_, index) => {
          const maxLength = Math.max(
            ...data.map(row => {
              const cellValue = row[index]?.toString() || '';
              return cellValue.length;
            })
          );
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }; // Min width 10, max width 50
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RFQ_${rfqData.rfqNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('RFQ data exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export RFQ data');
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

          <Tabs defaultValue="all">
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
              <TabsTrigger value="all">
                <FileText className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Complete RFQ Information</CardTitle>
                    <Button onClick={() => exportToExcel()}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* RFQ Summary Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">RFQ Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">RFQ Number</div>
                          <div className="font-medium">{rfqData.rfqNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Date Received</div>
                          <div className="font-medium">{new Date(rfqData.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Source</div>
                          <div className="font-medium">{rfqData.source}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className="font-medium capitalize">{rfqData.status.toLowerCase()}</div>
                        </div>
                        {rfqData.dueDate && (
                          <div>
                            <div className="text-sm text-muted-foreground">Due Date</div>
                            <div className="font-medium">{new Date(rfqData.dueDate).toLocaleDateString()}</div>
                          </div>
                        )}
                        {rfqData.totalBudget && (
                          <div>
                            <div className="text-sm text-muted-foreground">Total Budget</div>
                            <div className="font-medium">
                              {formatCurrency(
                                currency === "CAD"
                                  ? rfqData.totalBudget
                                  : convertCurrency(rfqData.totalBudget, "CAD")
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Name</div>
                          <div className="font-medium">{rfqData.customer?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div className="font-medium">{rfqData.customer?.type || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{rfqData.customer?.email || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Phone</div>
                          <div className="font-medium">{rfqData.customer?.phone || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Address</div>
                          <div className="font-medium">{rfqData.customer?.address || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Contact Person</div>
                          <div className="font-medium">{rfqData.customer?.contactPerson || "N/A"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Requestor Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Requestor Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Name</div>
                          <div className="font-medium">{rfqData.requestor?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{rfqData.requestor?.email || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Role</div>
                          <div className="font-medium">{rfqData.requestor?.role || "N/A"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Requested Items</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Estimated Price</TableHead>
                              <TableHead>Final Price</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rfqData.items?.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.customerSku || item.inventory?.sku || "N/A"}</TableCell>
                                <TableCell>{item.description || item.inventory?.description || "N/A"}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit || "EA"}</TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    currency === "CAD"
                                      ? item.estimatedPrice || 0
                                      : convertCurrency(item.estimatedPrice || 0, "CAD")
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    currency === "CAD"
                                      ? item.finalPrice || item.suggestedPrice || 0
                                      : convertCurrency(item.finalPrice || item.suggestedPrice || 0, "CAD")
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    currency === "CAD"
                                      ? (item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0) * item.quantity
                                      : convertCurrency(
                                          (item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0) * item.quantity,
                                          "CAD"
                                        )
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      item.status === 'COMPLETED' ? 'default' :
                                      item.status === 'PENDING' ? 'secondary' :
                                      'destructive'
                                    }
                                    className="capitalize"
                                  >
                                    {item.status?.toLowerCase() || "pending"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Customer History Summary */}
                    {historyStats && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Customer History Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{historyStats.totalRfqs}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatCurrency(
                                  currency === "CAD"
                                    ? historyStats.totalSpentCAD
                                    : convertCurrency(historyStats.totalSpentCAD, "CAD")
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatCurrency(
                                  currency === "CAD"
                                    ? historyStats.averageOrderValueCAD
                                    : convertCurrency(historyStats.averageOrderValueCAD, "CAD")
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{historyStats.acceptanceRate}%</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {rfqData.notes && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{rfqData.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                  <div className="flex justify-between items-center">
                    <CardTitle>Customer History</CardTitle>
                    <div className="flex items-center gap-4">
                      <Select
                        value={filters.period}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3months">Last 3 Months</SelectItem>
                          <SelectItem value="6months">Last 6 Months</SelectItem>
                          <SelectItem value="12months">Last 12 Months</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={filters.type}
                        onValueChange={(value: 'all' | 'rfq' | 'sale') => setFilters(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="rfq">RFQs</SelectItem>
                          <SelectItem value="sale">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Spinner size={32} />
                    </div>
                  ) : historyError ? (
                    <div className="text-red-500">{historyError}</div>
                  ) : history?.history && history.history.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Document #</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.history
                          .filter((item: any) => 
                            filters.type === 'all' || 
                            (filters.type === 'rfq' && item.type === 'rfq') ||
                            (filters.type === 'sale' && item.type === 'sale')
                          )
                          .map((item: any) => (
                            <TableRow key={item.id + item.type + item.date}>
                              <TableCell>
                                {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={item.type === 'rfq' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.documentNumber || "-"}</TableCell>
                              <TableCell>{item.sku || "-"}</TableCell>
                              <TableCell>{item.description || "-"}</TableCell>
                              <TableCell>{item.quantity || "-"}</TableCell>
                              <TableCell>
                                {item.unitPrice ? formatCurrency(
                                  currency === "CAD"
                                    ? item.unitPrice
                                    : convertCurrency(item.unitPrice, "CAD")
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                {item.totalAmount ? formatCurrency(
                                  currency === "CAD"
                                    ? item.totalAmount
                                    : convertCurrency(item.totalAmount, "CAD")
                                ) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">No transaction history found.</div>
                  )}

                  {/* Customer Statistics */}
                  {historyStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{historyStats.totalRfqs}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              currency === "CAD"
                                ? historyStats.totalSpentCAD
                                : convertCurrency(historyStats.totalSpentCAD, "CAD")
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              currency === "CAD"
                                ? historyStats.averageOrderValueCAD
                                : convertCurrency(historyStats.averageOrderValueCAD, "CAD")
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{historyStats.acceptanceRate}%</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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
                  <div className="flex justify-between items-center">
                    <CardTitle>Sales History</CardTitle>
                    <div className="flex items-center gap-4">
                      <Select
                        value={filters.period}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3months">Last 3 Months</SelectItem>
                          <SelectItem value="6months">Last 6 Months</SelectItem>
                          <SelectItem value="12months">Last 12 Months</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Spinner size={32} />
                    </div>
                  ) : historyError ? (
                    <div className="text-red-500">{historyError}</div>
                  ) : !rfqData?.items || rfqData.items.length === 0 ? (
                    <div className="text-center py-4">No items in this RFQ.</div>
                  ) : !history?.history || history.history.length === 0 ? (
                    <div className="text-center py-4">No sales history found for any items in this RFQ.</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Item-wise Sales History */}
                      {rfqData.items?.map((rfqItem: any) => {
                        console.log('Processing RFQ item:', rfqItem);
                        const itemHistory = history.history.filter((item: any) => {
                          const itemSku = item.sku || item.customerSku;
                          const rfqItemSku = rfqItem.customerSku || rfqItem.inventory?.sku;
                          console.log('Comparing SKUs:', { itemSku, rfqItemSku });
                          return itemSku === rfqItemSku;
                        });
                        
                        // Get inventory history for this item
                        const itemInventoryHistory = inventoryHistory[rfqItem.id]?.transactions || [];
                        const isInventoryHistoryLoading = inventoryHistoryLoading[rfqItem.id];
                        
                        // Combine both histories
                        const combinedHistory = [
                          ...itemHistory.map((item: any) => ({ ...item, source: 'customer' })),
                          ...itemInventoryHistory.map((item: any) => ({ ...item, source: 'inventory' }))
                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        
                        console.log('Combined history for item:', combinedHistory);
                        
                        if (combinedHistory.length === 0 && !isInventoryHistoryLoading) {
                          return (
                            <div key={rfqItem.id} className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-medium">{rfqItem.customerSku || rfqItem.inventory?.sku || "N/A"}</h3>
                                  <p className="text-sm text-muted-foreground">{rfqItem.description || rfqItem.inventory?.description || "N/A"}</p>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">Current RFQ Quantity: {rfqItem.quantity}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatCurrency(
                                      currency === "CAD"
                                        ? rfqItem.finalPrice || rfqItem.suggestedPrice || rfqItem.estimatedPrice || 0
                                        : convertCurrency(
                                            rfqItem.finalPrice || rfqItem.suggestedPrice || rfqItem.estimatedPrice || 0,
                                            "CAD"
                                          )
                                    )} per unit
                                  </div>
                                </div>
                              </div>
                              <div className="text-center py-4 text-muted-foreground">
                                No history found for this item.
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={rfqItem.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium">{rfqItem.customerSku || rfqItem.inventory?.sku || "N/A"}</h3>
                                <p className="text-sm text-muted-foreground">{rfqItem.description || rfqItem.inventory?.description || "N/A"}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">Current RFQ Quantity: {rfqItem.quantity}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(
                                    currency === "CAD"
                                      ? rfqItem.finalPrice || rfqItem.suggestedPrice || rfqItem.estimatedPrice || 0
                                      : convertCurrency(
                                          rfqItem.finalPrice || rfqItem.suggestedPrice || rfqItem.estimatedPrice || 0,
                                          "CAD"
                                        )
                                  )} per unit
                                </div>
                              </div>
                            </div>

                            {/* Item Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="p-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Sales Overview</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Total Orders:</span>
                                    <Badge variant="secondary">
                                      {combinedHistory.filter((item: any) => item.type === 'sale').length}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Quantity Sold:</span>
                                    <Badge variant="secondary">
                                      {combinedHistory
                                        .filter((item: any) => item.type === 'sale')
                                        .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Avg. Sale Price:</span>
                                    <Badge variant="secondary">
                                      {formatCurrency(
                                        currency === "CAD"
                                          ? combinedHistory
                                              .filter((item: any) => item.type === 'sale')
                                              .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                                              (combinedHistory.filter((item: any) => item.type === 'sale').length || 1)
                                          : convertCurrency(
                                              combinedHistory
                                                .filter((item: any) => item.type === 'sale')
                                                .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                                                (combinedHistory.filter((item: any) => item.type === 'sale').length || 1),
                                              "CAD"
                                            )
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>

                              <Card className="p-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">RFQ History</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Total RFQs:</span>
                                    <Badge variant="secondary">
                                      {combinedHistory.filter((item: any) => item.type === 'rfq').length}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total RFQ Quantity:</span>
                                    <Badge variant="secondary">
                                      {combinedHistory
                                        .filter((item: any) => item.type === 'rfq')
                                        .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Avg. RFQ Price:</span>
                                    <Badge variant="secondary">
                                      {formatCurrency(
                                        currency === "CAD"
                                          ? combinedHistory
                                              .filter((item: any) => item.type === 'rfq')
                                              .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                                              (combinedHistory.filter((item: any) => item.type === 'rfq').length || 1)
                                          : convertCurrency(
                                              combinedHistory
                                                .filter((item: any) => item.type === 'rfq')
                                                .reduce((sum: number, item: any) => sum + (item.unitPrice || 0), 0) / 
                                                (combinedHistory.filter((item: any) => item.type === 'rfq').length || 1),
                                              "CAD"
                                            )
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>

                              <Card className="p-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Performance</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Total Revenue:</span>
                                    <Badge variant="secondary">
                                      {formatCurrency(
                                        currency === "CAD"
                                          ? combinedHistory
                                              .filter((item: any) => item.type === 'sale')
                                              .reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0)
                                          : convertCurrency(
                                              combinedHistory
                                                .filter((item: any) => item.type === 'sale')
                                                .reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0),
                                              "CAD"
                                            )
                                      )}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Conversion Rate:</span>
                                    <Badge variant="secondary">
                                      {Math.round(
                                        (combinedHistory.filter((item: any) => item.type === 'sale').length /
                                          combinedHistory.filter((item: any) => item.type === 'rfq').length) * 100 || 0
                                      )}%
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Last Sale:</span>
                                    <Badge variant="secondary">
                                      {combinedHistory
                                        .filter((item: any) => item.type === 'sale')
                                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
                                        ? new Date(
                                            combinedHistory
                                              .filter((item: any) => item.type === 'sale')
                                              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
                                          ).toLocaleDateString()
                                        : "No sales"}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            </div>

                            {/* Transaction History */}
                            <Tabs defaultValue="all" className="mt-6">
                              <TabsList>
                                <TabsTrigger value="all">All Transactions</TabsTrigger>
                                <TabsTrigger value="rfq">RFQs</TabsTrigger>
                                <TabsTrigger value="sale">Sales</TabsTrigger>
                              </TabsList>

                              <TabsContent value="all" className="mt-0">
                                {isInventoryHistoryLoading ? (
                                  <div className="flex justify-center py-4">
                                    <Spinner size={24} />
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Document #</TableHead>
                                        <TableHead>Customer/Vendor</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {combinedHistory.map((item: any) => (
                                        <TableRow key={item.id + item.type + item.date}>
                                          <TableCell>
                                            {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                                          </TableCell>
                                          <TableCell>
                                            <Badge 
                                              variant={item.type === 'rfq' ? 'default' : 'secondary'}
                                              className="capitalize"
                                            >
                                              {item.type}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                              {item.source}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>{item.documentNumber || "-"}</TableCell>
                                          <TableCell className="text-blue-600">
                                            {item.customerName || item.vendorName || "-"}
                                          </TableCell>
                                          <TableCell>{item.quantity || "-"}</TableCell>
                                          <TableCell>
                                            {item.unitPrice ? formatCurrency(
                                              currency === "CAD"
                                                ? item.unitPrice
                                                : convertCurrency(item.unitPrice, "CAD")
                                            ) : "-"}
                                          </TableCell>
                                          <TableCell>
                                            {item.totalAmount ? formatCurrency(
                                              currency === "CAD"
                                                ? item.totalAmount
                                                : convertCurrency(item.totalAmount, "CAD")
                                            ) : "-"}
                                          </TableCell>
                                          <TableCell>
                                            <Badge 
                                              variant={
                                                item.status === 'COMPLETED' ? 'default' :
                                                item.status === 'PENDING' ? 'secondary' :
                                                'destructive'
                                              }
                                              className="capitalize"
                                            >
                                              {item.status?.toLowerCase() || "-"}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </TabsContent>

                              <TabsContent value="rfq" className="mt-0">
                                {isInventoryHistoryLoading ? (
                                  <div className="flex justify-center py-4">
                                    <Spinner size={24} />
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Document #</TableHead>
                                        <TableHead>Customer/Vendor</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {combinedHistory
                                        .filter((item: any) => item.type === 'rfq')
                                        .map((item: any) => (
                                          <TableRow key={item.id + item.type + item.date}>
                                            <TableCell>
                                              {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="outline" className="capitalize">
                                                {item.source}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>{item.documentNumber || "-"}</TableCell>
                                            <TableCell className="text-blue-600">
                                              {item.customerName || item.vendorName || "-"}
                                            </TableCell>
                                            <TableCell>{item.quantity || "-"}</TableCell>
                                            <TableCell>
                                              {item.unitPrice ? formatCurrency(
                                                currency === "CAD"
                                                  ? item.unitPrice
                                                  : convertCurrency(item.unitPrice, "CAD")
                                              ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item.totalAmount ? formatCurrency(
                                                currency === "CAD"
                                                  ? item.totalAmount
                                                  : convertCurrency(item.totalAmount, "CAD")
                                              ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                              <Badge 
                                                variant={
                                                  item.status === 'COMPLETED' ? 'default' :
                                                  item.status === 'PENDING' ? 'secondary' :
                                                  'destructive'
                                                }
                                                className="capitalize"
                                              >
                                                {item.status?.toLowerCase() || "-"}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </TabsContent>

                              <TabsContent value="sale" className="mt-0">
                                {isInventoryHistoryLoading ? (
                                  <div className="flex justify-center py-4">
                                    <Spinner size={24} />
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Document #</TableHead>
                                        <TableHead>Customer/Vendor</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {combinedHistory
                                        .filter((item: any) => item.type === 'sale')
                                        .map((item: any) => (
                                          <TableRow key={item.id + item.type + item.date}>
                                            <TableCell>
                                              {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="outline" className="capitalize">
                                                {item.source}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>{item.documentNumber || "-"}</TableCell>
                                            <TableCell className="text-blue-600">
                                              {item.customerName || item.vendorName || "-"}
                                            </TableCell>
                                            <TableCell>{item.quantity || "-"}</TableCell>
                                            <TableCell>
                                              {item.unitPrice ? formatCurrency(
                                                currency === "CAD"
                                                  ? item.unitPrice
                                                  : convertCurrency(item.unitPrice, "CAD")
                                              ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item.totalAmount ? formatCurrency(
                                                currency === "CAD"
                                                  ? item.totalAmount
                                                  : convertCurrency(item.totalAmount, "CAD")
                                              ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                              <Badge 
                                                variant={
                                                  item.status === 'COMPLETED' ? 'default' :
                                                  item.status === 'PENDING' ? 'secondary' :
                                                  'destructive'
                                                }
                                                className="capitalize"
                                              >
                                                {item.status?.toLowerCase() || "-"}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  <CardTitle>Original Request Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Request Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Request Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">RFQ Number</div>
                          <div className="font-medium">{rfqData.rfqNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Date Received</div>
                          <div className="font-medium">{new Date(rfqData.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Source</div>
                          <div className="font-medium">{rfqData.source}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className="font-medium capitalize">{rfqData.status.toLowerCase()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Requestor Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Requestor Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Name</div>
                          <div className="font-medium">{rfqData.requestor?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{rfqData.requestor?.email || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Role</div>
                          <div className="font-medium">{rfqData.requestor?.role || "N/A"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Name</div>
                          <div className="font-medium">{rfqData.customer?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div className="font-medium">{rfqData.customer?.type || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{rfqData.customer?.email || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Phone</div>
                          <div className="font-medium">{rfqData.customer?.phone || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Address</div>
                          <div className="font-medium">{rfqData.customer?.address || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Contact Person</div>
                          <div className="font-medium">{rfqData.customer?.contactPerson || "N/A"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Original Items */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Original Items Requested</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Estimated Price</TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rfqData.items?.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.customerSku || item.inventory?.sku || "N/A"}</TableCell>
                                <TableCell>{item.description || item.inventory?.description || "N/A"}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit || "EA"}</TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    currency === "CAD"
                                      ? item.estimatedPrice || 0
                                      : convertCurrency(item.estimatedPrice || 0, "CAD")
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    currency === "CAD"
                                      ? (item.estimatedPrice || 0) * item.quantity
                                      : convertCurrency((item.estimatedPrice || 0) * item.quantity, "CAD")
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {rfqData.notes && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{rfqData.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
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

