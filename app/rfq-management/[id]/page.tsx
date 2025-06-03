"use client";

import React from "react";
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
import { EditableItemsTable } from "@/components/editable-items-table";
import { NegotiationTab } from "@/components/negotiation-tab";
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
  ExportTab
} from "@/components/rfq-tabs";

// Column definitions
const ITEMS_COLUMNS = [
  { id: 'sku', label: 'SKU' },
  { id: 'description', label: 'Description' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'unitPrice', label: 'Unit Price' },
  { id: 'total', label: 'Total' },
  { id: 'status', label: 'Status' },
  { id: 'versions', label: 'Versions' }  // Add this line
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

// Add this interface near the top of the file with other interfaces
interface RfqData {
  items: Array<{
    id: string;
    finalPrice: number | null;
    suggestedPrice: number | null;
    customerSku: string | null;
    inventory?: {
      sku: string;
    };
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Add this interface near the top with other interfaces
interface ItemVersion {
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

export default function RfqDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { currency, formatCurrency, convertCurrency } = useCurrency();
  const [rfqData, setRfqData] = useState<RfqData | null>(null);
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
  const [quotationHistory, setQuotationHistory] = useState<QuotationVersionWithItems[]>([]);
  const [quotationHistoryLoading, setQuotationHistoryLoading] = useState(true);

  // Add state for negotiation
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);
  const [negotiationHistoryLoading, setNegotiationHistoryLoading] = useState(true);

  // Add state for modals
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<QuotationVersionWithItems | null>(null);

  // Ensure we have the correct data structure
  const rfq = rfqData?.data || rfqData;
  const items = rfq?.items || [];

  const handleUnitPriceChange = async (itemId: string, newPrice: number, event?: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    // If it's a keyboard event and not Enter key, just update the local state
    if (event && 'key' in event && event.key !== 'Enter') {
      return;
    }

    try {
      const item: any = items.find((i: any) => i.id === itemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }

      const sku = item.customerSku || item.inventory?.sku;
      if (!sku) {
        toast.error('Item SKU not found');
        return;
      }

      if (isNaN(newPrice)) {
        toast.error('Invalid price value');
        return;
      }

      console.log('Updating price:', { sku, newPrice });
      
      const response = await fetch(`/api/rfq/${id}/items/${sku}/price`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ price: newPrice })
      });

      const result = await response.json();
      console.log('Price update response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update price');
      }

      if (result.success) {
        toast.success('Price updated successfully');
        // Update the local state immediately for better UX
        setRfqData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i: any) => 
              i.id === itemId 
                ? { ...i, finalPrice: newPrice }
                : i
            )
          };
        });
        // Then refresh the full RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data as RfqData);
        }
      } else {
        throw new Error(result.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update price');
    }
  };

  const handleItemStatusChange = async (itemId: string, newStatus: RfqStatus) => {
    try {
      const item: any = items.find((i: any) => i.id === itemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }

      const sku = item.customerSku || item.inventory?.sku;
      if (!sku) {
        toast.error('Item SKU not found');
        return;
      }

      console.log('Updating item status:', { sku, newStatus });

      const response = await fetch(`/api/rfq/${id}/items/${sku}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      console.log('Status update response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      if (result.success) {
        toast.success('Status updated successfully');
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data as RfqData);
        }
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

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
          setRfqData(response.data as RfqData);

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
          setRfqData(updatedRfq.data as RfqData);
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
          setRfqData(updatedRfq.data as RfqData);
        }
      }
    } catch (err) {
      toast.error("Failed to reject RFQ");
    }
  };

  useEffect(() => {
    if (id) {
      fetchNegotiationHistory();
    }
  }, [id]);
  const handleStatusChange = async (newStatus: RfqStatus) => {
    try {
      const response = await rfqApi.update(id, {
        status: newStatus
      });
      if (response.success) {
        toast.success(`RFQ status updated to ${newStatus}`);
        // Refresh RFQ data
        const updatedRfq = await rfqApi.getById(id);
        if (updatedRfq.success && updatedRfq.data) {
          setRfqData(updatedRfq.data as RfqData);
        }
      } else {
        toast.error('Failed to update RFQ status');
      }
    } catch (err) {
      console.error('Error updating RFQ status:', err);
      toast.error('Failed to update RFQ status');
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
      try {
        setQuotationHistoryLoading(true);
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
      console.error('Error creating quotation:', error);
      toast.error('Failed to create quotation');
    }
  };

  const handleCreateSkuChange = async (itemId: number, changes: {
    oldQuantity: number;
    newQuantity: number;
    oldUnitPrice: number;
    newUnitPrice: number;
    changeReason: string;
  }) => {
    try {
      const item = items.find(i => i.id === itemId);
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
        changeReason: changes.changeReason,
        changedBy: 'INTERNAL'
      };

      const response = await negotiationApi.createSkuChange(id, skuChangeData);
      if (response.success) {
        // Refresh negotiation history
        await fetchNegotiationHistory();
      } else {
        throw new Error(response.error || 'Failed to record SKU change');
      }
    } catch (error) {
      console.error('Error creating SKU change:', error);
      throw error;
    }
  };

  const fetchNegotiationHistory = async () => {
    try {
      setNegotiationHistoryLoading(true);
      const response = await negotiationApi.getSkuHistory(id);
      if (response.success) {
        setNegotiationHistory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching negotiation history:', error);
    } finally {
      setNegotiationHistoryLoading(false);
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

  // Add handler for creating item-specific versions
  const handleCreateItemVersion = async (data: {
    estimatedPrice: number;
    finalPrice: number;
    changes: string;
  }) => {
    if (!versionModalSku) return;

    try {
      const response = await rfqApi.createItemVersion(id, versionModalSku, data);
      if (response.success) {
        toast.success('Item version created successfully');
        // Close the modal
        setIsCreateItemVersionModalOpen(false);
        // Refresh the item versions in the modal
        const versionsResponse = await rfqApi.getItemVersions(id, versionModalSku);
        if (versionsResponse.success && versionsResponse.data) {
          // Update the versions in the modal
          setItemVersions((prev: Record<string, ItemVersion[]>) => ({
            ...prev,
            [versionModalSku]: versionsResponse.data as ItemVersion[]
          }));
        }
      } else {
        toast.error(response.error || 'Failed to create item version');
      }
    } catch (error) {
      console.error('Error creating item version:', error);
      toast.error('Failed to create item version');
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
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="QUOTED">Quoted</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                      onClick={() => handleStatusChange('COMPLETED')}
                      disabled={rfq.status === 'COMPLETED'}
                    >
                      Mark as Completed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('CANCELLED')}
                      disabled={rfq.status === 'CANCELLED'}
                    >
                      Cancel RFQ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="items">
                <FileText className="mr-2 h-4 w-4" />
                Items
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
      <ItemVersionModal
        isOpen={isItemVersionModalOpen}
        onClose={() => {
          setIsItemVersionModalOpen(false);
          setVersionModalSku(null);
        }}
        rfqId={id}
        sku={versionModalSku || ''}
        onRecordResponse={(version) => {
          setSelectedItemVersion(version);
          setIsItemResponseModalOpen(true);
        }}
        onCreateVersion={() => setIsCreateItemVersionModalOpen(true)}
      />

      <CreateItemVersionModal
        isOpen={isCreateItemVersionModalOpen}
        onClose={() => setIsCreateItemVersionModalOpen(false)}
        onSubmit={handleCreateItemVersion}
        currentPrice={rfq?.totalBudget || 0}
      />

      <CustomerResponseModal
        isOpen={isItemResponseModalOpen}
        onClose={() => {
          setIsItemResponseModalOpen(false);
          setSelectedItemVersion(null);
        }}
        onSubmit={handleRecordItemResponse}
      />
    </div>
  );
}

// Update the API stub for createItemVersion
rfqApi.createItemVersion = async (rfqId: string, sku: string, data: {
  estimatedPrice: number;
  finalPrice: number;
  changes: string;
}) => {
  try {
    const response = await fetch(`/api/rfq/${rfqId}/items/${sku}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        status: 'NEW',
        createdBy: 'System', // TODO: Get from auth context
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create version');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating item version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create version'
    };
  }
};
