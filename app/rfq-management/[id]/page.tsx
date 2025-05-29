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
  Clock,
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
import { VersionCreationModal } from "@/components/version-creation-modal";
import { VersionStatusManager } from "@/components/version-status-manager";
import { CustomerResponseModal } from "@/components/customer-response-modal";

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

interface HistoryItem {
  sku: string;
  lastTransaction: string;
  customer: string;
  lastPrice: number;
  lastQuantity: number;
  totalQuantity: number;
  avgPrice: number;
  trend: string;
  mainCustomerHistory?: {
    [customerId: string]: {
      lastTransaction: string;
      lastPrice: number;
      lastQuantity: number;
      totalQuantity: number;
      avgPrice: number;
      trend: string;
    }
  }
}

interface HistoryState {
  history: HistoryItem[];
}

interface SalesHistoryResponse {
  success: boolean;
  data: {
    history: Array<{
      type: string;
      date: string;
      customerName: string;
      unitPrice: number;
      quantity: number;
      priceTrend?: string;
      sku: string;
    }>;
    customerName?: string;
  };
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

// Add new interface for quotation history
interface QuotationVersion {
  versionNumber: number;
  status: 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
  estimatedPrice: number;
  finalPrice: number;
  changes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customerResponse?: {
    status: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
    comments: string;
    requestedChanges?: string;
    respondedAt: string;
  };
}

// Add new columns for quotation history
const QUOTATION_HISTORY_COLUMNS = [
  { id: 'version', label: 'Version' },
  { id: 'status', label: 'Status' },
  { id: 'estimatedPrice', label: 'Estimated Price' },
  { id: 'finalPrice', label: 'Final Price' },
  { id: 'changes', label: 'Changes' },
  { id: 'createdBy', label: 'Created By' },
  { id: 'createdAt', label: 'Created At' },
  { id: 'customerResponse', label: 'Customer Response' }
];

// Add type for tab names
type TabName = 'items' | 'pricing' | 'inventory' | 'history' | 'market' | 'settings' | 'quotation-history';

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
  const [mainCustomers, setMainCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [historyColumns, setHistoryColumns] = useState([
    { id: 'sku', label: 'SKU' },
    { id: 'lastTransaction', label: 'Last Transaction' },
    { id: 'customer', label: 'Customer' },
    { id: 'lastPrice', label: 'Last Price' },
    { id: 'lastQuantity', label: 'Last Quantity' },
    { id: 'totalQuantity', label: 'Total Quantity' },
    { id: 'avgPrice', label: 'Average Price' },
    { id: 'trend', label: 'Price Trend' }
  ]);
  const [history, setHistory] = useState<{ history: HistoryItem[] }>({ history: [] });
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
    history: historyColumns.map(col => col.id),
    market: MARKET_COLUMNS.map(col => col.id),
    settings: SETTINGS_COLUMNS.map(col => col.id),
    'quotation-history': QUOTATION_HISTORY_COLUMNS.map(col => col.id)
  });

  // Add state for quotation history
  const [quotationHistory, setQuotationHistory] = useState<QuotationVersion[]>([]);
  const [quotationHistoryLoading, setQuotationHistoryLoading] = useState(true);

  // Add state for modals
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<QuotationVersion | null>(null);

  // Ensure we have the correct data structure
  const rfq = rfqData?.data || rfqData;
  const items = rfq?.items || [];

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
        
        if (response.success && response.data) {
          setRfqData(response.data);
          
          if (response.meta?.pagination) {
            setTotalItems(response.meta.pagination.totalItems);
            setTotalPages(response.meta.pagination.totalPages);
          }
        } else {
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

    if (id) {
      fetchRfqData();
    }
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
    const fetchMainCustomers = async () => {
      try {
        const response = await customerApi.list({ main_customer: 'true' });
        if (response.success && response.data) {
          const customers = response.data as Array<{ id: number; name: string }>;
          setMainCustomers(customers);
          const mainCustomerColumns = customers.map(customer => ({
            id: `mainCustomer_${customer.id}`,
            label: `${customer.name} History`
          }));
          setHistoryColumns(prev => [...prev, ...mainCustomerColumns]);
          // Ensure main customer columns are always visible
          setVisibleColumns(prev => ({
            ...prev,
            history: [...prev.history, ...mainCustomerColumns.map(col => col.id)]
          }));
        } else {
          console.error('Failed to fetch main customers:', response.error);
          toast.error('Failed to fetch main customers');
        }
      } catch (error) {
        console.error('Error fetching main customers:', error);
        toast.error('Failed to fetch main customers');
      }
    };
    
    fetchMainCustomers();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!rfqData?.customer?.id || !items?.length || !mainCustomers?.length) return;
      
      try {
        setHistoryLoading(true);
        const salesPromises = items.map(async (item: any) => {
          const itemSku = item.customerSku || item.inventory?.sku;
          if (!itemSku) return null;

          const response = await customerApi.getHistory(rfqData.customer.id, filters.period) as SalesHistoryResponse;
          
          const mainCustomerHistoryPromises = mainCustomers.map(async (customer) => {
            const customerHistory = await customerApi.getHistory(customer.id.toString(), filters.period) as SalesHistoryResponse;
            if (customerHistory.success && customerHistory.data) {
              const itemHistory = customerHistory.data.history?.filter((h) => {
                return h.type === 'sale' && h.sku === itemSku;
              }) || [];

              if (itemHistory.length > 0) {
                const lastSale = itemHistory[0];
                const totalSales = itemHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);
                const avgSalePrice = itemHistory.reduce((sum, h) => sum + (h.unitPrice || 0), 0) / itemHistory.length;

                return {
                  [customer.id]: {
                    lastTransaction: lastSale.date,
                    lastPrice: lastSale.unitPrice,
                    lastQuantity: lastSale.quantity,
                    totalQuantity: totalSales,
                    avgPrice: avgSalePrice,
                    trend: lastSale.priceTrend || 'neutral'
                  }
                };
              }
            }
            return null;
          });

          const mainCustomerHistoryResults = await Promise.all(mainCustomerHistoryPromises);
          const mainCustomerHistory = mainCustomerHistoryResults.reduce((acc, curr) => {
            if (curr) {
              return { ...acc, ...curr };
            }
            return acc;
          }, {});

          if (response.success && response.data) {
            const itemHistory = response.data.history?.filter((h) => {
              return h.type === 'sale' && h.sku === itemSku;
            }) || [];

            const transformedHistory = itemHistory.map((sale) => ({
              sku: itemSku,
              lastTransaction: sale.date,
              customer: response.data.customerName || 'Unknown Customer',
              lastPrice: sale.unitPrice,
              lastQuantity: sale.quantity,
              totalQuantity: sale.quantity,
              avgPrice: sale.unitPrice,
              trend: sale.priceTrend || 'neutral',
              mainCustomerHistory
            }));

            return {
              itemId: item.id,
              sku: itemSku,
              history: transformedHistory
            };
          }
          return null;
        });

        const results = await Promise.all(salesPromises);
        const validResults = results.filter(result => result !== null);
        
        setHistory({
          history: validResults.flatMap(result => result?.history || [])
        });
      } catch (err) {
        console.error('Error fetching history:', err);
        setHistoryError("An error occurred while loading history data");
        toast.error("An error occurred while loading history data");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [rfqData?.customer?.id, items, filters.period, mainCustomers]);

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!rfqData?.items?.length) return;
      
      try {
        const inventoryPromises = rfqData.items.map(async (item: any) => {
          if (!item.inventory?.id) return null;

          try {
            const response = await inventoryApi.get(item.inventory.id) as ApiResponse<InventoryData>;
            
            if (!response.success || !response.data) {
              return null;
            }

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

            return {
              itemId: item.id,
              inventoryData
            };
          } catch (err) {
            console.error('Error fetching inventory for item:', item.id, err);
            return null;
          }
        });

        const inventoryResults = await Promise.all(inventoryPromises);
        const inventoryDataMap = inventoryResults.reduce((acc: Record<string, InventoryData>, result) => {
          if (result) {
            acc[result.itemId] = result.inventoryData;
          }
          return acc;
        }, {});
        
        setSkuDetails(inventoryDataMap);
      } catch (err) {
        console.error('Error in fetchInventoryData:', err);
        toast.error('Failed to fetch inventory data');
      }
    };

    fetchInventoryData();
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
            const itemSku = item.customerSku || item.inventory?.sku;
            console.log("itemsku", itemSku);
            console.log("history", history);
            
            const salesHistory = history.history.filter((h) => h.sku === itemSku) as HistoryItem[];
            console.log("filtered history", salesHistory);

            if (salesHistory.length === 0) {
              return [];
            }

            const lastSale = salesHistory[0] as HistoryItem;
            const totalSales = salesHistory.reduce((sum: number, h: any) => sum + (h.quantity || 0), 0);
            const avgSalePrice = salesHistory.length > 0 
              ? salesHistory.reduce((sum: number, h: any) => sum + (h.unitPrice || 0), 0) / salesHistory.length 
              : 0;

            return [
              itemSku,
              lastSale?.lastTransaction ? new Date(lastSale.lastTransaction).toLocaleDateString() : 'N/A',
              lastSale?.customer || 'N/A',
              lastSale?.lastQuantity || 'N/A',
              formatCurrency(lastSale?.lastPrice || 0),
              formatCurrency(lastSale?.lastPrice * lastSale?.lastQuantity || 0),
              lastSale?.trend === 'up' ? '↑' : lastSale?.trend === 'down' ? '↓' : 'neutral'
            ];
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

  console.log('Rendering with RFQ:', {
    rfqData,
    rfq,
    items,
    skuDetails
  });

  const handleColumnToggle = (tab: TabName, columnId: string) => {
    // Don't allow toggling off main customer columns in history tab
    if (tab === 'history' && columnId.startsWith('mainCustomer_')) {
      return;
    }
    
    setVisibleColumns(prev => ({
      ...prev,
      [tab]: prev[tab].includes(columnId)
        ? prev[tab].filter(id => id !== columnId)
        : [...prev[tab], columnId]
    }));
  };

  // Add useEffect to fetch quotation history
  useEffect(() => {
    const fetchQuotationHistory = async () => {
      try {
        setQuotationHistoryLoading(true);
        // TODO: Replace with actual API call
        const response = await rfqApi.getQuotationHistory(id);
        if (response.success && response.data) {
          setQuotationHistory(response.data);
        }
      } catch (err) {
        console.error('Error fetching quotation history:', err);
        toast.error('Failed to load quotation history');
      } finally {
        setQuotationHistoryLoading(false);
      }
    };

    if (id) {
      fetchQuotationHistory();
    }
  }, [id]);

  // Add handlers for version management
  const handleCreateVersion = async (data: {
    estimatedPrice: number;
    finalPrice: number;
    changes: string;
  }) => {
    try {
      const response = await rfqApi.createVersion(id, data);
      if (response.success) {
        toast.success('Version created successfully');
        // Refresh quotation history
        const historyResponse = await rfqApi.getQuotationHistory(id);
        if (historyResponse.success && historyResponse.data) {
          setQuotationHistory(historyResponse.data);
        }
      } else {
        toast.error(response.error || 'Failed to create version');
      }
    } catch (error) {
      toast.error('Failed to create version');
    } finally {
      setIsVersionModalOpen(false);
    }
  };

  const handleRecordResponse = async (data: {
    status: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
    comments: string;
    requestedChanges?: string;
  }) => {
    if (!selectedVersion) return;

    try {
      const response = await rfqApi.recordCustomerResponse(id, selectedVersion.versionNumber, data);
      if (response.success) {
        toast.success('Customer response recorded successfully');
        // Refresh quotation history
        const historyResponse = await rfqApi.getQuotationHistory(id);
        if (historyResponse.success && historyResponse.data) {
          setQuotationHistory(historyResponse.data);
        }
      } else {
        toast.error(response.error || 'Failed to record customer response');
      }
    } catch (error) {
      toast.error('Failed to record customer response');
    } finally {
      setIsResponseModalOpen(false);
      setSelectedVersion(null);
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
            <TabsList className="grid w-full grid-cols-8">
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
              <TabsTrigger value="quotation-history">
                <Clock className="mr-2 h-4 w-4" />
                Quotation History
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
                    <CardTitle>Sales History</CardTitle>
                    <TableCustomizer
                      columns={historyColumns}
                      visibleColumns={visibleColumns.history}
                      onColumnToggle={(columnId) => handleColumnToggle('history', columnId)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Spinner size={32} />
                    </div>
                  ) : historyError ? (
                    <div className="text-red-500 text-center py-4">{historyError}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {historyColumns.map((column: { id: string; label: string }) => 
                            visibleColumns.history.includes(column.id) && (
                              <TableHead key={column.id}>{column.label}</TableHead>
                            )
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item: any) => {
                          const itemSku = item.customerSku || item.inventory?.sku;
                          const salesHistory = history.history.filter((h) => h.sku === itemSku) as HistoryItem[];

                          if (salesHistory.length === 0) {
                            return null;
                          }

                          const lastSale = salesHistory[0] as HistoryItem;
                          const totalSales = salesHistory.reduce((sum: number, h: any) => sum + (h.quantity || 0), 0);
                          const avgSalePrice = salesHistory.length > 0 
                            ? salesHistory.reduce((sum: number, h: any) => sum + (h.unitPrice || 0), 0) / salesHistory.length 
                            : 0;

                          return (
                            <TableRow key={item.id}>
                              {visibleColumns.history.includes('sku') && (
                                <TableCell>{itemSku}</TableCell>
                              )}
                              {visibleColumns.history.includes('lastTransaction') && (
                                <TableCell>
                                  {lastSale?.lastTransaction 
                                    ? new Date(lastSale.lastTransaction).toLocaleDateString()
                                    : 'N/A'}
                                </TableCell>
                              )}
                              {visibleColumns.history.includes('customer') && (
                                <TableCell className="text-green-600">
                                  {lastSale?.customer || 'N/A'}
                                </TableCell>
                              )}
                              {visibleColumns.history.includes('lastPrice') && (
                                <TableCell>{formatCurrency(lastSale?.lastPrice || 0)}</TableCell>
                              )}
                              {visibleColumns.history.includes('lastQuantity') && (
                                <TableCell>{lastSale?.lastQuantity || 'N/A'}</TableCell>
                              )}
                              {visibleColumns.history.includes('totalQuantity') && (
                                <TableCell>{totalSales}</TableCell>
                              )}
                              {visibleColumns.history.includes('avgPrice') && (
                                <TableCell>{formatCurrency(avgSalePrice)}</TableCell>
                              )}
                              {visibleColumns.history.includes('trend') && (
                                <TableCell>
                                  <Badge variant={lastSale?.trend === 'up' ? 'default' : 'destructive'}>
                                    {lastSale?.trend === 'up' ? '↑' : '↓'}
                                  </Badge>
                                </TableCell>
                              )}
                              {/* Render main customer history columns */}
                              {mainCustomers.map(customer => {
                                const columnId = `mainCustomer_${customer.id}`;
                                if (!visibleColumns.history.includes(columnId)) return null;
                                
                                const customerHistory = lastSale?.mainCustomerHistory?.[customer.id];
                                return (
                                  <TableCell key={columnId}>
                                    {customerHistory ? (
                                      <div className="space-y-1">
                                        <div>Last: {new Date(customerHistory.lastTransaction).toLocaleDateString()}</div>
                                        <div>Price: {formatCurrency(customerHistory.lastPrice)}</div>
                                        <div>Qty: {customerHistory.lastQuantity}</div>
                                        <div>Total: {customerHistory.totalQuantity}</div>
                                        <div>Avg: {formatCurrency(customerHistory.avgPrice)}</div>
                                        <Badge variant={customerHistory.trend === 'up' ? 'default' : 'destructive'}>
                                          {customerHistory.trend === 'up' ? '↑' : '↓'}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">No history</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
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

            <TabsContent value="quotation-history" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Quotation History</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsVersionModalOpen(true)}>
                        Create New Version
                      </Button>
                      <TableCustomizer
                        columns={QUOTATION_HISTORY_COLUMNS}
                        visibleColumns={visibleColumns['quotation-history']}
                        onColumnToggle={(columnId) => handleColumnToggle('quotation-history', columnId)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotationHistoryLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Spinner size={32} />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {QUOTATION_HISTORY_COLUMNS.map(column => 
                            visibleColumns['quotation-history'].includes(column.id) && (
                              <TableHead key={column.id}>{column.label}</TableHead>
                            )
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotationHistory.map((version) => (
                          <TableRow key={version.versionNumber}>
                            {visibleColumns['quotation-history'].includes('version') && (
                              <TableCell>v{version.versionNumber}</TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('status') && (
                              <TableCell>
                                <VersionStatusManager
                                  currentStatus={version.status}
                                  versionId={version.versionNumber}
                                  rfqId={id}
                                  onStatusChange={(newStatus) => {
                                    const updatedHistory = quotationHistory.map(v =>
                                      v.versionNumber === version.versionNumber
                                        ? { ...v, status: newStatus }
                                        : v
                                    );
                                    // @ts-ignore
                                    setQuotationHistory(updatedHistory);
                                  }}
                                />
                              </TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('estimatedPrice') && (
                              <TableCell>{formatCurrency(version.estimatedPrice)}</TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('finalPrice') && (
                              <TableCell>{formatCurrency(version.finalPrice)}</TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('changes') && (
                              <TableCell>{version.changes}</TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('createdBy') && (
                              <TableCell>{version.createdBy}</TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('createdAt') && (
                              <TableCell>
                                {new Date(version.createdAt).toLocaleDateString()}
                              </TableCell>
                            )}
                            {visibleColumns['quotation-history'].includes('customerResponse') && (
                              <TableCell>
                                {version.customerResponse ? (
                                  <div className="space-y-1">
                                    <Badge variant={
                                      version.customerResponse.status === 'ACCEPTED' ? 'default' :
                                      version.customerResponse.status === 'DECLINED' ? 'destructive' :
                                      'secondary'
                                    }>
                                      {version.customerResponse.status}
                                    </Badge>
                                    {version.customerResponse.comments && (
                                      <p className="text-sm text-muted-foreground">
                                        {version.customerResponse.comments}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVersion(version);
                                      setIsResponseModalOpen(true);
                                    }}
                                  >
                                    Record Response
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <VersionCreationModal
                isOpen={isVersionModalOpen}
                onClose={() => setIsVersionModalOpen(false)}
                onSubmit={handleCreateVersion}
                currentPrice={rfq?.totalBudget}
              />

              <CustomerResponseModal
                isOpen={isResponseModalOpen}
                onClose={() => {
                  setIsResponseModalOpen(false);
                  setSelectedVersion(null);
                }}
                onSubmit={handleRecordResponse}
              />
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


