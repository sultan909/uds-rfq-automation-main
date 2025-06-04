"use client";

import React from "react";
import { useEffect, useState, use, useCallback } from "react";
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
  MessageSquare,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { rfqApi, customerApi, inventoryApi, negotiationApi } from "@/lib/api-client";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { EditableItemsTable } from "@/components/rfq-tabs/editable-items-table";
import { NegotiationTab } from "@/components/rfq-tabs/negotiation-tab";
import type { CreateQuotationRequest, QuotationVersionWithItems } from "@/lib/types/quotation";
import type { 
  RfqStatus, 
  TabName, 
  InventoryData, 
  InventoryResponse, 
  HistoryItem, 
  HistoryState, 
  MainCustomer,
  Customer
} from "@/lib/types/rfq-tabs";

// Import the new tab components
import {
  PricingTab,
  InventoryTab,
  MarketDataTab,
  SettingsTab,
  HistoryTab,
  QuotationHistoryTab,
  ExportTab,
  OriginalRequestTab
} from "@/components/rfq-tabs";

// Column definitions
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
  const [mainCustomers, setMainCustomers] = useState<MainCustomer[]>([]);
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
  const [history, setHistory] = useState<HistoryState>({ history: [] });
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
  const [visibleColumns, setVisibleColumns] = useState<Record<TabName, string[]>>({
    items: ITEMS_COLUMNS.map(col => col.id),
    pricing: PRICING_COLUMNS.map(col => col.id),
    inventory: INVENTORY_COLUMNS.map(col => col.id),
    history: historyColumns.map(col => col.id),
    market: MARKET_COLUMNS.map(col => col.id),
    settings: SETTINGS_COLUMNS.map(col => col.id),
    'quotation-history': QUOTATION_HISTORY_COLUMNS.map(col => col.id),
    'original-request': [] // Add this to satisfy the TabName type
  });

  // Add state for quotation history
  const [quotationHistory, setQuotationHistory] = useState<QuotationVersionWithItems[]>([]);
  const [quotationHistoryLoading, setQuotationHistoryLoading] = useState(true);

  // IMPROVED: Enhanced state for negotiation with better management
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);
  const [negotiationHistoryLoading, setNegotiationHistoryLoading] = useState(true);
  const [lastNegotiationRefresh, setLastNegotiationRefresh] = useState<number>(Date.now());

  // Add state for modals
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<QuotationVersionWithItems | null>(null);

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
        setError(null); // Clear previous errors
        
        const response = await rfqApi.getById(id, {
          page: currentPage,
          pageSize: itemsPerPage
        });

        if (response?.success && response.data) {
          setRfqData(response.data);

          if (response.meta?.pagination) {
            setTotalItems(response.meta.pagination.totalItems);
            setTotalPages(response.meta.pagination.totalPages);
          }
        } else {
          const errorMessage = response?.error || "Failed to load RFQ data";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (err: any) {
        console.warn('Error fetching RFQ:', err);
        
        let errorMessage = "An error occurred while loading RFQ data";
        if (err?.status === 404) {
          errorMessage = "RFQ not found";
        } else if (err?.status === 500) {
          errorMessage = "Server error loading RFQ data";
        } else if (err?.message) {
          errorMessage = `Error loading RFQ: ${err.message}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRfqData();
    }
  }, [id, currentPage, itemsPerPage]);

  // IMPROVED: Better negotiation history fetching with loading state
  const fetchNegotiationHistory = useCallback(async () => {
    if (!id) return;
    
    try {
      setNegotiationHistoryLoading(true);
      setNegotiationHistory([]); // Clear previous data
      
      const response = await negotiationApi.getSkuHistory(id);
      if (response?.success && Array.isArray(response.data)) {
        setNegotiationHistory(response.data);
        setLastNegotiationRefresh(Date.now());
      } else {
        setNegotiationHistory([]);
        console.warn('Failed to fetch negotiation history:', response?.error || 'Unknown error');
        // Only show toast error if it's not a "no data" scenario
        if (response?.error && !response?.error.includes('not found')) {
          toast.error('Failed to load negotiation history');
        }
      }
    } catch (error: any) {
      console.warn('Error fetching negotiation history:', error);
      setNegotiationHistory([]);
      
      // Only show user-facing error for unexpected errors, not 404s
      if (error?.status === 404) {
        console.info('No negotiation history found for RFQ:', id);
      } else if (error?.status === 500) {
        console.warn('Server error fetching negotiation history:', error.message);
        toast.error('Server error loading negotiation history. Some features may be limited.');
      } else {
        toast.error('Failed to load negotiation history');
      }
    } finally {
      setNegotiationHistoryLoading(false);
    }
  }, [id]);

  // Fetch negotiation history on mount and when ID changes
  useEffect(() => {
    // Only fetch negotiation history if we have valid RFQ data
    if (id && rfqData && !loading) {
      fetchNegotiationHistory();
    }
  }, [fetchNegotiationHistory, rfqData, loading]);

  const handleStatusChange = async (newStatus: RfqStatus) => {
    try {
      console.log('Attempting to change status to:', newStatus);
      const response = await rfqApi.update(id, {
        status: newStatus
      });
      
      console.log('Status update response:', response);
      
      if (response.success) {
        toast.success(`RFQ status updated to ${newStatus}`);
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data);
        }
      } else {
        const errorMessage = response.error || 'Failed to update RFQ status';
        console.warn('Status update failed:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.warn('Error updating RFQ status:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(`Failed to update RFQ status: ${errorMessage}`);
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
      if (!id || loading) return; // Don't fetch if still loading main RFQ data
      
      try {
        setQuotationHistoryLoading(true);
        const response = await rfqApi.getQuotationHistory(id);
        if (response?.success && response.data) {
          setQuotationHistory(response.data);
        } else {
          console.warn('Failed to fetch quotation history:', response?.error);
          setQuotationHistory([]);
          // Only show error for non-404 cases
          if (response?.error && !response?.error.includes('not found')) {
            toast.error('Failed to load quotation history');
          }
        }
      } catch (err: any) {
        console.warn('Error fetching quotation history:', err);
        setQuotationHistory([]);
        
        if (err?.status === 404) {
          console.info('No quotation history found for RFQ:', id);
        } else if (err?.status === 500) {
          console.warn('Server error fetching quotation history:', err.message);
          toast.error('Server error loading quotation history. Some features may be limited.');
        } else {
          toast.error('Failed to load quotation history');
        }
      } finally {
        setQuotationHistoryLoading(false);
      }
    };

    fetchQuotationHistory();
  }, [id, loading]);

  // Add handlers for version management
  const handleCreateQuotation = async (items: any[]) => {
    try {
      const quotationData: CreateQuotationRequest = {
        entryType: 'internal_quote',
        notes: 'Created from Items tab',
        items: items
      };

      const response = await rfqApi.createQuotation(id, quotationData);
      if (response.success) {
        toast.success('Quotation created successfully');
        // Refresh quotation history
        const historyResponse = await rfqApi.getQuotationHistory(id);
        if (historyResponse.success && historyResponse.data) {
          setQuotationHistory(historyResponse.data);
        }
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data);
        }
      } else {
        toast.error(response.error || 'Failed to create quotation');
      }
    } catch (error) {
      console.warn('Error creating quotation:', error);
      toast.error('Failed to create quotation');
    }
  };

  // IMPROVED: Better SKU change handling with state management
  const handleCreateSkuChange = async (itemId: number, changes: {
    oldQuantity: number;
    newQuantity: number;
    oldUnitPrice: number;
    newUnitPrice: number;
  }) => {
    try {
      const item = items.find((i: any) => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      const skuId = item.internalProductId || item.inventory?.id;
      if (!skuId) {
        throw new Error('SKU ID not found');
      }

      let changeType = 'BOTH';
      if (changes.oldQuantity === changes.newQuantity) {
        changeType = 'PRICE_CHANGE';
      } else if (changes.oldUnitPrice === changes.newUnitPrice) {
        changeType = 'QUANTITY_CHANGE';
      }

      const skuChangeData = {
        rfqId: parseInt(id),
        skuId: skuId,
        versionId: quotationHistory[0]?.id,
        changeType,
        oldQuantity: changes.oldQuantity,
        newQuantity: changes.newQuantity,
        oldUnitPrice: changes.oldUnitPrice,
        newUnitPrice: changes.newUnitPrice,
        changedBy: 'INTERNAL'
      };

      const response = await negotiationApi.createSkuChange(id, skuChangeData);
      if (response?.success) {
        // Immediately refresh negotiation history
        await fetchNegotiationHistory();
        toast.success('SKU change recorded successfully');
      } else {
        throw new Error(response?.error || 'Failed to record SKU change');
      }
    } catch (error: any) {
      console.warn('Error creating SKU change:', error);
      
      // Provide more specific error messages based on error type
      if (error?.status === 500) {
        toast.error('Server error recording SKU change. Please try again later.');
      } else if (error?.status === 404) {
        toast.error('RFQ or SKU not found. Please refresh the page.');
      } else if (error?.message?.includes('not found')) {
        toast.error('Item or SKU not found.');
      } else {
        toast.error(error?.message || 'Failed to record SKU change');
      }
      
      throw error; // Re-throw for the calling component to handle
    }
  };

  const handleCreateVersion = async (data: {
    entryType: any;
    notes?: string;
    items: any[];
  }) => {
    try {
      const response = await rfqApi.createQuotation(id, data);
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

  // I'll add a simplified version of the export function here
  // The full complex export function from the original can be moved to a separate utility
  const exportToExcel = () => {
    try {
      // Validate rfqData exists
      if (!rfqData) {
        throw new Error('No RFQ data available');
      }

      // Create basic export data structure
      const exportData = {
        'RFQ Summary': [
          ['RFQ Number', rfq.rfqNumber || 'N/A'],
          ['Date Received', rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : 'N/A'],
          ['Source', rfq.source || 'N/A'],
          ['Status', rfq.status || 'N/A'],
        ],
        'Customer Information': [
          ['Name', rfq.customer?.name || 'N/A'],
          ['Type', rfq.customer?.type || 'N/A'],
          ['Email', rfq.customer?.email || 'N/A'],
          ['Phone', rfq.customer?.phone || 'N/A'],
        ],
        'Items': [
          ['SKU', 'Description', 'Quantity', 'Unit Price', 'Total'],
          ...items.map((item: any) => [
            item.customerSku || item.inventory?.sku || 'N/A',
            item.description || item.inventory?.description || 'N/A',
            item.quantity || 'N/A',
            formatCurrency(item.estimatedPrice || 0),
            formatCurrency((item.estimatedPrice || 0) * (item.quantity || 0))
          ])
        ]
      };

      // Create workbook and export
      const wb = XLSX.utils.book_new();
      Object.entries(exportData).forEach(([sheetName, data]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RFQ_${rfq.rfqNumber || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('RFQ data exported successfully');
    } catch (error) {
      console.warn('Error exporting to Excel:', error);
      toast.error(`Failed to export RFQ data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add the useEffects for fetching main customers, history, and inventory data
  // These would be the same as in the original file...
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
          setVisibleColumns(prev => ({
            ...prev,
            history: [...prev.history, ...mainCustomerColumns.map(col => col.id)]
          }));
          
        } else {
          console.warn('Failed to fetch main customers:', response.error);
          toast.error('Failed to fetch main customers');
        }
      } catch (error) {
        console.warn('Error fetching main customers:', error);
        toast.error('Failed to fetch main customers');
      }
    };

    fetchMainCustomers();
  }, []);

  // Add the complex history fetching useEffect here (same as original)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!rfqData?.customer?.id || !items?.length || !mainCustomers?.length) return;

      try {
        setHistoryLoading(true);

        const mainCustomerMap = new Map<number, string>(
          mainCustomers.map(c => [c.id, c.name])
        );

        const historyPromises = items.map(async (item: any) => {
          const itemSku = item.customerSku || item.inventory?.sku;
          const itemId = item.inventory?.id;
          if (!itemSku || !itemId) return null;

          try {
            const inventoryHistory = await inventoryApi.getHistory(itemId, { period: filters.period });
            console.log(`🧾 Inventory history for item ${itemId}:`, inventoryHistory);

            // @ts-ignore
            if (inventoryHistory.success && inventoryHistory.data?.transactions) {
              // @ts-ignore
              const transactions = inventoryHistory.data.transactions.filter((tx: any) => tx.type === 'sale');
              console.log("transcations", transactions);

              const transactionsByCustomer: Record<number, any[]> = {};

              transactions.forEach((tx: any) => {
                const customerId = tx.customerId;
                if (!customerId) return;
                if (!transactionsByCustomer[customerId]) {
                  transactionsByCustomer[customerId] = [];
                }
                transactionsByCustomer[customerId].push(tx);
              });

              const mainCustomerHistory: any[] = [];
              const otherCustomerHistory: any[] = [];

              Object.entries(transactionsByCustomer).forEach(([customerIdStr, customerTxs]) => {
                const customerId = Number(customerIdStr);
                const isMainCustomer = mainCustomerMap.has(customerId);
                const customerName =
                  mainCustomerMap.get(customerId) ||
                  customerTxs[0]?.customerName || // fallback to first transaction name
                  `Customer ${customerId}`;

                const sortedTxs = [...customerTxs].sort((a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                const lastTx = sortedTxs[0];
                const totalQuantity = customerTxs.reduce((sum, tx) => sum + (tx.quantity || 0), 0);
                const totalPrice = customerTxs.reduce((sum, tx) => sum + (tx.unitPrice * (tx.quantity || 0)), 0);
                const avgPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0;
                const historyEntry = {
                  itemId: itemId,
                  sku: itemSku,
                  description: item.description || item.name || 'N/A',
                  customerId,
                  customer: customerName || `Customer ${customerId}`,
                  lastTransaction: lastTx.date,
                  lastPrice: lastTx.price,
                  lastQuantity: lastTx.quantity || 0,
                  totalQuantity,
                  avgPrice,
                };

                if (isMainCustomer) {
                  mainCustomerHistory.push(historyEntry);
                } else {
                  otherCustomerHistory.push(historyEntry);
                }
              });

              return {
                itemId: itemId,
                sku: itemSku,
                description: item.description || item.name || 'N/A',
                mainCustomerHistory,
                otherCustomerHistory,
              };
            }

            return null;
          } catch (error) {
            console.warn(`❌ Error fetching history for item ${itemSku}:`, error);
            return null;
          }
        });

        const results = await Promise.all(historyPromises);
        const validResults = results.filter(Boolean);

        // Flatten main and other customer data across all items



        setHistory({
          history: validResults
        });

      } catch (err) {
        console.warn('❌ Error in fetchHistory:', err);
        setHistoryError("An error occurred while loading history data");
        toast.error("An error occurred while loading history data");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [rfqData?.customer?.id, items, filters.period, mainCustomers]);
  
  // Add inventory data fetching useEffect (same as original)
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        if (!rfqData?.items?.length) return;

        const inventoryData = await Promise.all(
          rfqData.items.map(async (item: any) => {
            try {
              if (item.inventory) {
                return {
                  ...item,
                  inventory: item.inventory
                };
              }

              if (item.internalProductId) {
                const [inventoryResponse, historyResponse] = await Promise.all([
                  inventoryApi.get(item.internalProductId),
                  inventoryApi.getHistory(item.internalProductId, { period: 'all' })
                ]);

                if (inventoryResponse.success && inventoryResponse.data) {
                  const inventoryData = inventoryResponse.data as InventoryResponse;
                  const historyData = historyResponse.success ? historyResponse.data : null;

                  return {
                    ...item,
                    inventory: {
                      id: inventoryData.id,
                      sku: inventoryData.sku,
                      description: inventoryData.description,
                      stock: inventoryData.stock,
                      costCad: inventoryData.costCad,
                      costUsd: inventoryData.costUsd,
                      quantityOnHand: inventoryData.quantityOnHand,
                      quantityReserved: inventoryData.quantityReserved,
                      warehouseLocation: inventoryData.warehouseLocation,
                      lowStockThreshold: inventoryData.lowStockThreshold,
                      lastSaleDate: inventoryData.lastSaleDate
                    },
                    history: historyData
                  };
                }
              }

              return item;
            } catch (err) {
              console.warn('Error processing item:', err);
              return item;
            }
          })
        );

        setSkuDetails(inventoryData.reduce((acc: Record<string, InventoryData>, item) => {
          acc[item.id] = item.inventory;
          return acc;
        }, {}));
      } catch (err) {
        console.warn('Error in fetchInventoryData:', err);
        toast.error('Failed to fetch inventory data');
      }
    };

    fetchInventoryData();
  }, [rfqData?.items]);

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
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Select
                      value={rfq.status}
                      onValueChange={(value) => handleStatusChange(value as RfqStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PRICED">Priced</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="DECLINED">Declined</SelectItem>
                        <SelectItem value="PROCESSED">Processed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{rfq.source || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RFQ Number:</span>
                    <span className="font-medium">{rfq.rfqNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created Date:</span>
                    <span className="font-medium">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </span>
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
                      <span className="text-muted-foreground">Total Budget:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          currency === "CAD"
                            ? (rfq.totalBudget || 0)
                            : convertCurrency(rfq.totalBudget || 0, "CAD")
                        )}
                      </span>
                    </div>
                  )}
                  {rfq.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Notes:</span>
                      <span className="font-medium">{rfq.notes}</span>
                    </div>
                  )}
                  <div className="pt-4 flex gap-2">
                    <Button asChild>
                      <a href={`/rfq-management/${id}/create-quote`}>Create Quote</a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('PROCESSED')}
                      disabled={rfq.status === 'PROCESSED'}
                    >
                      Mark as Processed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('DECLINED')}
                      disabled={rfq.status === 'DECLINED'}
                    >
                      Decline RFQ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="items">
                <FileText className="mr-2 h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="original-request">
                <FileText className="mr-2 h-4 w-4" />
                Original Request
              </TabsTrigger>
              <TabsTrigger value="negotiation">
                <MessageSquare className="mr-2 h-4 w-4" />
                Negotiation
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
              <EditableItemsTable
                items={items}
                onSaveQuotation={handleCreateQuotation}
                isEditable={true}
                rfqStatus={rfq?.status}
                negotiationHistory={negotiationHistory}
                onCreateSkuChange={handleCreateSkuChange}
                onRefreshNegotiation={fetchNegotiationHistory}
              />
              {renderPagination()}
            </TabsContent>

            <TabsContent value="original-request" className="m-0">
              <OriginalRequestTab
                items={items}
                formatCurrency={formatCurrency}
              />
              {renderPagination()}
            </TabsContent>

            <TabsContent value="negotiation" className="m-0">
              <NegotiationTab
                rfqId={parseInt(id)}
                rfqStatus={rfq?.status || 'NEW'}
                currentVersion={quotationHistory[0]}
              />
            </TabsContent>

            <TabsContent value="pricing" className="m-0">
              <PricingTab
                items={items}
                visibleColumns={visibleColumns.pricing}
                onColumnToggle={(columnId) => handleColumnToggle('pricing', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="inventory" className="m-0">
              <InventoryTab
                items={items}
                visibleColumns={visibleColumns.inventory}
                onColumnToggle={(columnId) => handleColumnToggle('inventory', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                skuDetails={skuDetails}
              />
            </TabsContent>

            <TabsContent value="history" className="m-0">
              <HistoryTab
                items={items}
                visibleColumns={visibleColumns.history}
                onColumnToggle={(columnId) => handleColumnToggle('history', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                history={history}
                historyLoading={historyLoading}
                historyError={historyError}
                mainCustomers={mainCustomers}
                filters={filters}
                onFiltersChange={setFilters}
                historyColumns={historyColumns}
              />
            </TabsContent>

            <TabsContent value="market" className="m-0">
              <MarketDataTab
                items={items}
                visibleColumns={visibleColumns.market}
                onColumnToggle={(columnId) => handleColumnToggle('market', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <SettingsTab
                items={items}
                visibleColumns={visibleColumns.settings}
                onColumnToggle={(columnId) => handleColumnToggle('settings', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                onStatusChange={handleStatusChange}
                onEditItem={handleEditItem}
              />
            </TabsContent>

            <TabsContent value="quotation-history" className="m-0">
              <QuotationHistoryTab
                quotationHistory={quotationHistory}
                items={items}
                isVersionModalOpen={isVersionModalOpen}
                isResponseModalOpen={isResponseModalOpen}
                selectedVersion={selectedVersion}
                onOpenVersionModal={() => setIsVersionModalOpen(true)}
                onCloseVersionModal={() => setIsVersionModalOpen(false)}
                onOpenResponseModal={(version) => {
                  setSelectedVersion(version);
                  setIsResponseModalOpen(true);
                }}
                onCloseResponseModal={() => {
                  setIsResponseModalOpen(false);
                  setSelectedVersion(null);
                }}
                onCreateVersion={handleCreateVersion}
                onRecordResponse={handleRecordResponse}
              />
            </TabsContent>

            <TabsContent value="export" className="m-0">
              <ExportTab onExportToExcel={exportToExcel} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}