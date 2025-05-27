"use client";

import React from "react";
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
  ChevronLeft,
  ChevronRight,
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
import { TableCustomizer } from "@/components/table-customizer";

// Add these type definitions at the top of the file, after the imports
interface InventoryData {
  id: number;
  sku: string;
  mpn: string;
  brand: string;
  description: string;
  quantityOnHand: number;
  quantityReserved: number;
  warehouseLocation: string;
  lowStockThreshold: number;
  costCad?: number;
  costUsd?: number;
  marketPrice?: number;
  marketSource?: string;
  marketLastUpdated?: string;
  competitorPrice?: number;
  marketTrend?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Add these column definitions at the top of the file
const ITEMS_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'description', label: 'Description' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'unitPrice', label: 'Unit Price' },
  { id: 'total', label: 'Total' },
  { id: 'status', label: 'Status' }
];

const PRICING_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'requestedPrice', label: 'Requested Price' },
  { id: 'suggestedPrice', label: 'Suggested Price' },
  { id: 'marketPrice', label: 'Market Price' },
  { id: 'cost', label: 'Cost' },
  { id: 'margin', label: 'Margin' }
];

const INVENTORY_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'onHand', label: 'On Hand' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'available', label: 'Available' },
  { id: 'location', label: 'Location' },
  { id: 'status', label: 'Status' }
];

const HISTORY_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'type', label: 'Type' },
  { id: 'lastTransaction', label: 'Last Transaction' },
  { id: 'customerVendor', label: 'Customer/Vendor' },
  { id: 'lastPrice', label: 'Last Price' },
  { id: 'lastQuantity', label: 'Last Quantity' },
  { id: 'totalQuantity', label: 'Total Quantity' },
  { id: 'avgPrice', label: 'Avg. Price' },
  { id: 'trend', label: 'Trend' }
];

const MARKET_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'marketPrice', label: 'Market Price' },
  { id: 'source', label: 'Source' },
  { id: 'lastUpdated', label: 'Last Updated' },
  { id: 'competitorPrice', label: 'Competitor Price' },
  { id: 'priceTrend', label: 'Price Trend' }
];

const SETTINGS_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'status', label: 'Status' },
  { id: 'currency', label: 'Currency' },
  { id: 'unit', label: 'Unit' },
  { id: 'notes', label: 'Notes' },
  { id: 'actions', label: 'Actions' }
];

// Add type for tab names
type TabName = 'items' | 'pricing' | 'inventory' | 'history' | 'market' | 'settings';

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
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [skuDetails, setSkuDetails] = useState<Record<string, InventoryData>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState({
    items: ITEMS_COLUMNS.map(col => col.id),
    pricing: PRICING_COLUMNS.map(col => col.id),
    inventory: INVENTORY_COLUMNS.map(col => col.id),
    history: HISTORY_COLUMNS.map(col => col.id),
    market: MARKET_COLUMNS.map(col => col.id),
    settings: SETTINGS_COLUMNS.map(col => col.id)
  });

  // Calculate pagination
  useEffect(() => {
    if (rfqData?.meta?.pagination) {
      setTotalItems(rfqData.meta.pagination.totalItems);
      setTotalPages(rfqData.meta.pagination.totalPages);
    }
  }, [rfqData?.meta?.pagination]);

  useEffect(() => {
    const fetchRfqData = async () => {
      try {
        setLoading(true);
        const response = await rfqApi.getById(id, {
          page: currentPage,
          pageSize: itemsPerPage
        });
        console.log('Raw RFQ API Response:', response);
        
        if (response.success && response.data) {
          console.log('RFQ Data before setting:', response.data);
          // Ensure we're setting the correct data structure
          const rfqData = {
            ...response.data,
            // @ts-ignore
            items: response.data.items || []
          };
          console.log('Processed RFQ Data:', rfqData);
          setRfqData(rfqData);
          
          // Update pagination state from response metadata
          if (response.meta?.pagination) {
            console.log('Setting pagination state:', response.meta.pagination);
            setTotalItems(response.meta.pagination.totalItems);
            setTotalPages(response.meta.pagination.totalPages);
          } else {
            console.log('No pagination metadata in response');
          }
        } else {
          console.error('Failed to load RFQ data:', response);
          setError("Failed to load RFQ data");
          toast.error("Failed to load RFQ data");
        }
      } catch (err) {
        console.error('Error fetching RFQ:', err);
        setError("An error occurred while loading RFQ data");
        toast.error("An error occurred while loading RFQ data");
      } finally {
        setLoading(false);
      }
    };

    fetchRfqData();
  }, [id, currentPage, itemsPerPage]);

  // Add debug render
  if (rfqData) {
    console.log('Current RFQ Data State:', rfqData);
  }

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

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        console.log('Starting fetchInventoryData');
        console.log('Current rfqData:', rfqData);
        console.log('Items to process:', rfqData?.items);
        
        if (!rfqData?.items?.length) {
          console.log('No items to process');
          return;
        }

        // Fetch inventory data for each item
        const inventoryPromises = rfqData.items.map(async (item: any) => {
          console.log('Processing item:', {
            id: item.id,
            inventoryId: item.inventory?.id,
            sku: item.customerSku || item.inventory?.sku
          });

          if (!item.inventory?.id) {
            console.log('Item has no inventory ID:', item);
            return null;
          }

          try {
            console.log('Fetching inventory for ID:', item.inventory.id);
            const response = await inventoryApi.get(item.inventory.id) as ApiResponse<InventoryData>;
            console.log('Raw inventory API response:', response);
            
            if (!response.success || !response.data) {
              console.error('Failed to fetch inventory:', response.error);
              return null;
            }

            // Ensure we have the required inventory data
            const inventoryData: InventoryData = {
              id: response.data.id || 0,
              sku: response.data.sku || '',
              mpn: response.data.mpn || '',
              brand: response.data.brand || '',
              description: response.data.description || '',
              quantityOnHand: response.data.quantityOnHand || 0,
              quantityReserved: response.data.quantityReserved || 0,
              warehouseLocation: response.data.warehouseLocation || 'N/A',
              lowStockThreshold: response.data.lowStockThreshold || 5,
              costCad: response.data.costCad,
              costUsd: response.data.costUsd,
              marketPrice: response.data.marketPrice,
              marketSource: response.data.marketSource,
              marketLastUpdated: response.data.marketLastUpdated,
              competitorPrice: response.data.competitorPrice,
              marketTrend: response.data.marketTrend
            };

            console.log('Processed inventory data:', inventoryData);

            return {
              itemId: item.id,
              inventoryData
            };
          } catch (err) {
            console.error('Error fetching inventory for item:', item.id, err);
            return null;
          }
        });

        console.log('Waiting for all inventory promises to resolve...');
        const inventoryResults = await Promise.all(inventoryPromises);
        console.log('Inventory results:', inventoryResults);
        
        const inventoryDataMap = inventoryResults.reduce((acc: Record<string, InventoryData>, result) => {
          if (result) {
            acc[result.itemId] = result.inventoryData;
          }
          return acc;
        }, {});
        
        console.log('Final inventory data map:', inventoryDataMap);
        setSkuDetails(inventoryDataMap);
      } catch (err) {
        console.error('Error in fetchInventoryData:', err);
        toast.error('Failed to fetch inventory data');
      }
    };

    if (rfqData?.items) {
      console.log('Triggering fetchInventoryData');
      fetchInventoryData();
    }
  }, [rfqData?.items]);

  useEffect(() => {
    console.log('Current skuDetails:', skuDetails);
  }, [skuDetails]);

  const exportToExcel = () => {
    try {
      // Prepare the data for export
      const exportData = {
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
        'SKU Details': [
          ['SKU', 'Description', 'Quantity', 'Unit', 'Requested Price', 'Suggested Price', 'Market Price', 'Cost', 'Margin', 'Status', 'On Hand', 'Reserved', 'Available', 'Location'],
          ...rfqData.items?.map((item: any) => {
            const inventoryData = skuDetails[item.id];
            const quantityOnHand = inventoryData?.quantityOnHand || 0;
            const quantityReserved = inventoryData?.quantityReserved || 0;
            const available = quantityOnHand - quantityReserved;
            const margin = item.suggestedPrice && item.inventory?.costCad
              ? ((item.suggestedPrice - item.inventory.costCad) / item.suggestedPrice * 100).toFixed(1)
              : 'N/A';

            return [
              item.customerSku || item.inventory?.sku || 'N/A',
              item.description || item.inventory?.description || 'N/A',
              item.quantity || 'N/A',
              item.unit || 'EA',
              formatCurrency(item.estimatedPrice || 0),
              formatCurrency(item.suggestedPrice || 0),
              formatCurrency(item.inventory?.marketPrice || 0),
              formatCurrency(item.inventory?.costCad || 0),
              margin + '%',
              item.status || 'N/A',
              quantityOnHand,
              quantityReserved,
              available,
              inventoryData?.warehouseLocation || 'N/A'
            ];
          }) || [],
        ],
        'Sales History': [
          ['SKU', 'Date', 'Customer', 'Quantity', 'Unit Price', 'Total Amount', 'Status'],
          ...rfqData.items?.flatMap((item: any) => {
            const salesHistory = history?.history?.filter((h: any) => {
              const itemSku = item.customerSku || item.inventory?.sku;
              const historySku = h.sku || h.customerSku;
              return historySku === itemSku && h.type === 'sale';
            }) || [];

            return salesHistory.map((sale: any) => [
              item.customerSku || item.inventory?.sku || 'N/A',
              sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A',
              sale.customerName || 'N/A',
              sale.quantity || 'N/A',
              formatCurrency(sale.unitPrice || 0),
              formatCurrency(sale.totalAmount || 0),
              sale.status || 'N/A'
            ]);
          }) || [],
        ],
        'Purchase History': [
          ['SKU', 'Date', 'Vendor', 'Quantity', 'Unit Price', 'Total Amount', 'Status'],
          ...rfqData.items?.flatMap((item: any) => {
            const purchaseHistory = inventoryHistory[item.id]?.transactions?.filter((t: any) => 
              t.type === 'purchase'
            ) || [];

            return purchaseHistory.map((purchase: any) => [
              item.customerSku || item.inventory?.sku || 'N/A',
              purchase.date ? new Date(purchase.date).toLocaleDateString() : 'N/A',
              purchase.vendorName || 'N/A',
              purchase.quantity || 'N/A',
              formatCurrency(purchase.price || 0),
              formatCurrency(purchase.totalAmount || 0),
              purchase.status || 'N/A'
            ]);
          }) || [],
        ],
        'Market Data': [
          ['SKU', 'Market Price', 'Source', 'Last Updated', 'Competitor Price', 'Price Trend'],
          ...rfqData.items?.map((item: any) => [
            item.customerSku || item.inventory?.sku || 'N/A',
            formatCurrency(item.inventory?.marketPrice || 0),
            item.inventory?.marketSource || 'N/A',
            item.inventory?.marketLastUpdated
              ? new Date(item.inventory.marketLastUpdated).toLocaleDateString()
              : 'N/A',
            formatCurrency(item.inventory?.competitorPrice || 0),
            item.inventory?.marketTrend || 'N/A'
          ]) || [],
        ]
      };

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Add each section as a separate worksheet
      Object.entries(exportData).forEach(([sheetName, data]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Auto-fit column widths
        // @ts-ignore
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

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      const response = await rfqApi.update(id, {
        items: rfqData.items.map((item: any) => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      });
      if (response.success) {
        toast.success("Item status updated successfully");
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data);
        }
      }
    } catch (err) {
      toast.error("Failed to update item status");
    }
  };

  const handleEditItem = (itemId: number) => {
    // Implement edit functionality
    console.log("Edit item:", itemId);
  };

  // Update the pagination display in the UI
  const renderPagination = () => {
    console.log('Rendering pagination with state:', { totalItems, totalPages, currentPage });
    if (!totalItems || totalItems <= 0) {
      console.log('No items to paginate');
      return null;
    }

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between mt-4 border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Update the pagination controls to use backend pagination
  const handlePageChange = (newPage: number) => {
    console.log('Handling page change:', { newPage, totalPages });
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Ensure we have the correct data structure
  const rfq = rfqData?.data || rfqData;
  console.log('Rendering with RFQ:', {
    rfqData,
    rfq,
    items: rfq?.items,
    skuDetails
  });

  const handleColumnToggle = (tab: TabName, columnId: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [tab]: prev[tab].includes(columnId)
        ? prev[tab].filter(id => id !== columnId)
        : [...prev[tab], columnId]
    }));
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
    console.log('Error or no data:', { error, rfqData });
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

  // Update the table body to use the correct data structure
  const items = rfq?.items || [];
  console.log('Items to render:', items);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={`RFQ Details: ${rfq.rfqNumber}`}
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
                        {rfq.customer?.name || "Unknown"}
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
                        {rfq.customer?.type || "Unknown"}
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
                        {new Date(rfq.createdAt).toLocaleDateString()}
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
                      {rfq.status?.toLowerCase() || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{rfq.source || 'N/A'}</span>
                  </div>
                  {rfq.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">
                        {new Date(rfq.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {rfq.totalBudget && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Budget:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          currency === "CAD"
                            ? rfq.totalBudget
                            : convertCurrency(rfq.totalBudget, "CAD")
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

          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="items">
                <FileText className="mr-2 h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <Tag className="mr-2 h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Building className="mr-2 h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="market">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Market Data
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="export">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>SKU Items</CardTitle>
                    <TableCustomizer
                      columns={ITEMS_COLUMNS}
                      visibleColumns={visibleColumns.items}
                      onColumnToggle={(columnId) => handleColumnToggle('items', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {ITEMS_COLUMNS.map(column => 
                          visibleColumns.items.includes(column.id) && (
                            <TableHead key={column.id}>{column.label}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => (
                        <TableRow key={item.id}>
                          {visibleColumns.items.includes('sku') && (
                            <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                          )}
                          {visibleColumns.items.includes('description') && (
                            <TableCell>{item.description || item.inventory?.description}</TableCell>
                          )}
                          {visibleColumns.items.includes('quantity') && (
                            <TableCell>{item.quantity}</TableCell>
                          )}
                          {visibleColumns.items.includes('unitPrice') && (
                            <TableCell>{formatCurrency(item.finalPrice || item.suggestedPrice || 0)}</TableCell>
                          )}
                          {visibleColumns.items.includes('total') && (
                            <TableCell>{formatCurrency((item.finalPrice || item.suggestedPrice || 0) * item.quantity)}</TableCell>
                          )}
                          {visibleColumns.items.includes('status') && (
                            <TableCell>
                              <Badge variant={item.status === 'APPROVED' ? 'default' : 'destructive'}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Pricing Analysis</CardTitle>
                    <TableCustomizer
                      columns={PRICING_COLUMNS}
                      visibleColumns={visibleColumns.pricing}
                      onColumnToggle={(columnId) => handleColumnToggle('pricing', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {PRICING_COLUMNS.map(column => 
                          visibleColumns.pricing.includes(column.id) && (
                            <TableHead key={column.id}>{column.label}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => (
                        <TableRow key={item.id}>
                          {visibleColumns.pricing.includes('sku') && (
                            <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                          )}
                          {visibleColumns.pricing.includes('requestedPrice') && (
                            <TableCell>{formatCurrency(item.estimatedPrice || 0)}</TableCell>
                          )}
                          {visibleColumns.pricing.includes('suggestedPrice') && (
                            <TableCell>{formatCurrency(item.suggestedPrice || 0)}</TableCell>
                          )}
                          {visibleColumns.pricing.includes('marketPrice') && (
                            <TableCell>{formatCurrency(item.inventory?.marketPrice || 0)}</TableCell>
                          )}
                          {visibleColumns.pricing.includes('cost') && (
                            <TableCell>{formatCurrency(item.inventory?.costCad || 0)}</TableCell>
                          )}
                          {visibleColumns.pricing.includes('margin') && (
                            <TableCell>
                              {item.suggestedPrice && item.inventory?.costCad
                                ? `${((item.suggestedPrice - item.inventory.costCad) / item.suggestedPrice * 100).toFixed(1)}%`
                                : 'N/A'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Inventory Status</CardTitle>
                    <TableCustomizer
                      columns={INVENTORY_COLUMNS}
                      visibleColumns={visibleColumns.inventory}
                      onColumnToggle={(columnId) => handleColumnToggle('inventory', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {INVENTORY_COLUMNS.map(column => 
                          visibleColumns.inventory.includes(column.id) && (
                            <TableHead key={column.id}>{column.label}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => {
                        const inventoryData = skuDetails[item.id];
                        return (
                          <TableRow key={item.id}>
                            {visibleColumns.inventory.includes('sku') && (
                              <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                            )}
                            {visibleColumns.inventory.includes('onHand') && (
                              <TableCell>{inventoryData?.quantityOnHand || 0}</TableCell>
                            )}
                            {visibleColumns.inventory.includes('reserved') && (
                              <TableCell>{inventoryData?.quantityReserved || 0}</TableCell>
                            )}
                            {visibleColumns.inventory.includes('available') && (
                              <TableCell>
                                {(inventoryData?.quantityOnHand || 0) - (inventoryData?.quantityReserved || 0)}
                              </TableCell>
                            )}
                            {visibleColumns.inventory.includes('location') && (
                              <TableCell>{inventoryData?.warehouseLocation || 'N/A'}</TableCell>
                            )}
                            {visibleColumns.inventory.includes('status') && (
                              <TableCell>
                                <Badge variant={
                                  (inventoryData?.quantityOnHand || 0) > (inventoryData?.lowStockThreshold || 0)
                                    ? 'default'
                                    : 'destructive'
                                }>
                                  {(inventoryData?.quantityOnHand || 0) > (inventoryData?.lowStockThreshold || 0)
                                    ? 'In Stock'
                                    : 'Low Stock'}
                                </Badge>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>SKU History</CardTitle>
                    <TableCustomizer
                      columns={HISTORY_COLUMNS}
                      visibleColumns={visibleColumns.history}
                      onColumnToggle={(columnId) => handleColumnToggle('history', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {HISTORY_COLUMNS.map(column => 
                          visibleColumns.history.includes(column.id) && (
                            <TableHead key={column.id}>{column.label}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => {
                        const salesHistory = history?.history?.filter((h: any) => {
                          const itemSku = item.customerSku || item.inventory?.sku;
                          const historySku = h.sku || h.customerSku;
                          return historySku === itemSku && h.type === 'sale';
                        }) || [];
                        
                        const purchaseHistory = inventoryHistory[item.id]?.transactions?.filter((t: any) => 
                          t.type === 'purchase'
                        ) || [];

                        if (salesHistory.length === 0 && purchaseHistory.length === 0) {
                          return null;
                        }

                        const lastSale = salesHistory[0];
                        const lastPurchase = purchaseHistory[0];
                        const totalSales = salesHistory.reduce((sum: number, h: any) => sum + (h.quantity || 0), 0);
                        const totalPurchases = purchaseHistory.reduce((sum: number, h: any) => sum + (h.quantity || 0), 0);
                        const avgSalePrice = salesHistory.length > 0 
                          ? salesHistory.reduce((sum: number, h: any) => sum + (h.unitPrice || 0), 0) / salesHistory.length 
                          : 0;
                        const avgPurchasePrice = purchaseHistory.length > 0
                          ? purchaseHistory.reduce((sum: number, h: any) => sum + (h.price || 0), 0) / purchaseHistory.length
                          : 0;

                        return (
                          <React.Fragment key={item.id}>
                            {salesHistory.length > 0 && (
                              <TableRow>
                                {visibleColumns.history.includes('sku') && (
                                  <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                                )}
                                {visibleColumns.history.includes('type') && (
                                  <TableCell>
                                    <Badge variant="default">Sales</Badge>
                                  </TableCell>
                                )}
                                {visibleColumns.history.includes('lastTransaction') && (
                                  <TableCell>
                                    {lastSale?.date 
                                      ? new Date(lastSale.date).toLocaleDateString()
                                      : 'N/A'}
                                  </TableCell>
                                )}
                                {visibleColumns.history.includes('customerVendor') && (
                                  <TableCell className="text-green-600">
                                    {lastSale?.customerName || 'N/A'}
                                  </TableCell>
                                )}
                                {visibleColumns.history.includes('lastPrice') && (
                                  <TableCell>{formatCurrency(lastSale?.unitPrice || 0)}</TableCell>
                                )}
                                {visibleColumns.history.includes('lastQuantity') && (
                                  <TableCell>{lastSale?.quantity || 'N/A'}</TableCell>
                                )}
                                {visibleColumns.history.includes('totalQuantity') && (
                                  <TableCell>{totalSales}</TableCell>
                                )}
                                {visibleColumns.history.includes('avgPrice') && (
                                  <TableCell>{formatCurrency(avgSalePrice)}</TableCell>
                                )}
                                {visibleColumns.history.includes('trend') && (
                                  <TableCell>
                                    <Badge variant={lastSale?.priceTrend === 'up' ? 'default' : 'destructive'}>
                                      {lastSale?.priceTrend === 'up' ? '↑' : '↓'}
                                    </Badge>
                                  </TableCell>
                                )}
                              </TableRow>
                            )}
                            {purchaseHistory.length > 0 && (
                              <TableRow>
                                {visibleColumns.history.includes('sku') && (
                                  <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                                )}
                                {visibleColumns.history.includes('type') && (
                                  <TableCell>
                                    <Badge variant="secondary">Purchases</Badge>
                                  </TableCell>
                                )}
                                {visibleColumns.history.includes('lastTransaction') && (
                                  <TableCell>
                                    {lastPurchase?.date 
                                      ? new Date(lastPurchase.date).toLocaleDateString()
                                      : 'N/A'}
                                  </TableCell>
                                )}
                                {visibleColumns.history.includes('customerVendor') && (
                                  <TableCell className="text-blue-600">
                                    {lastPurchase?.vendorName || 'N/A'}
                                  </TableCell>
                                )}
                                {visibleColumns.history.includes('lastPrice') && (
                                  <TableCell>{formatCurrency(lastPurchase?.price || 0)}</TableCell>
                                )}
                                {visibleColumns.history.includes('lastQuantity') && (
                                  <TableCell>{lastPurchase?.quantity || 'N/A'}</TableCell>
                                )}
                                {visibleColumns.history.includes('totalQuantity') && (
                                  <TableCell>{totalPurchases}</TableCell>
                                )}
                                {visibleColumns.history.includes('avgPrice') && (
                                  <TableCell>{formatCurrency(avgPurchasePrice)}</TableCell>
                                )}
                                {visibleColumns.history.includes('trend') && (
                                  <TableCell>
                                    <Badge variant={lastPurchase?.priceTrend === 'up' ? 'default' : 'destructive'}>
                                      {lastPurchase?.priceTrend === 'up' ? '↑' : '↓'}
                                    </Badge>
                                  </TableCell>
                                )}
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Market Data</CardTitle>
                    <TableCustomizer
                      columns={MARKET_COLUMNS}
                      visibleColumns={visibleColumns.market}
                      onColumnToggle={(columnId) => handleColumnToggle('market', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {MARKET_COLUMNS.map(column => 
                          visibleColumns.market.includes(column.id) && (
                            <TableHead key={column.id}>{column.label}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => (
                        <TableRow key={item.id}>
                          {visibleColumns.market.includes('sku') && (
                            <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                          )}
                          {visibleColumns.market.includes('marketPrice') && (
                            <TableCell>{formatCurrency(item.inventory?.marketPrice || 0)}</TableCell>
                          )}
                          {visibleColumns.market.includes('source') && (
                            <TableCell>{item.inventory?.marketSource || 'N/A'}</TableCell>
                          )}
                          {visibleColumns.market.includes('lastUpdated') && (
                            <TableCell>
                              {item.inventory?.marketLastUpdated
                                ? new Date(item.inventory.marketLastUpdated).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                          )}
                          {visibleColumns.market.includes('competitorPrice') && (
                            <TableCell>{formatCurrency(item.inventory?.competitorPrice || 0)}</TableCell>
                          )}
                          {visibleColumns.market.includes('priceTrend') && (
                            <TableCell>
                              <Badge variant={item.inventory?.marketTrend === 'up' ? 'default' : 'destructive'}>
                                {item.inventory?.marketTrend === 'up' ? '↑' : '↓'}
                              </Badge>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>SKU Settings</CardTitle>
                    <TableCustomizer
                      columns={SETTINGS_COLUMNS}
                      visibleColumns={visibleColumns.settings}
                      onColumnToggle={(columnId) => handleColumnToggle('settings', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {SETTINGS_COLUMNS.map(column => 
                          visibleColumns.settings.includes(column.id) && (
                            <TableHead key={column.id}>{column.label}</TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => (
                        <TableRow key={item.id}>
                          {visibleColumns.settings.includes('sku') && (
                            <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                          )}
                          {visibleColumns.settings.includes('status') && (
                            <TableCell>
                              <Select
                                value={item.status}
                                onValueChange={(value) => handleStatusChange(item.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Pending</SelectItem>
                                  <SelectItem value="APPROVED">Approved</SelectItem>
                                  <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                          {visibleColumns.settings.includes('currency') && (
                            <TableCell>{item.currency}</TableCell>
                          )}
                          {visibleColumns.settings.includes('unit') && (
                            <TableCell>{item.unit}</TableCell>
                          )}
                          {visibleColumns.settings.includes('notes') && (
                            <TableCell>{item.notes || 'N/A'}</TableCell>
                          )}
                          {visibleColumns.settings.includes('actions') && (
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => handleEditItem(item.id)}>
                                Edit
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Export RFQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={exportToExcel}>
                    Export RFQ Data
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


