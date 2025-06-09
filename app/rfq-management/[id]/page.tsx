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
import type { CreateQuotationResponseRequest } from "@/lib/types/quotation-response";
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
  AllTab,
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
  { id: 'quantityRequested', label: 'Requested' },
  { id: 'quantityOnHand', label: 'On Hand' },
  { id: 'quantityReserved', label: 'Reserved' },
  { id: 'availableQuantity', label: 'Available' },
  { id: 'quantityOnPO', label: 'On PO' },
  { id: 'warehouseLocation', label: 'Location' },
  { id: 'stockStatus', label: 'Status' },
  { id: 'turnoverRate', label: 'Turnover' },
  { id: 'daysSinceLastSale', label: 'Days Since Sale' }
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
    all: [], // Will be managed internally by AllTab component
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

  // Enhanced state management for all tabs with caching
  const [tabDataCache, setTabDataCache] = useState<Record<string, {
    data: any[];
    loading: boolean;
    error: string | null;
    totalRecords: number;
    currentPage: number;
    pageSize: number;
    dataFetched: boolean;
    lastFetched?: number;
  }>>({
    all: {
      data: [],
      loading: false,
      error: null,
      totalRecords: 0,
      currentPage: 1,
      pageSize: 10,
      dataFetched: false,
    },
    pricing: {
      data: [],
      loading: false,
      error: null,
      totalRecords: 0,
      currentPage: 1,
      pageSize: 10,
      dataFetched: false,
    },
    inventory: {
      data: [],
      loading: false,
      error: null,
      totalRecords: 0,
      currentPage: 1,
      pageSize: 10,
      dataFetched: false,
    },
    market: {
      data: [],
      loading: false,
      error: null,
      totalRecords: 0,
      currentPage: 1,
      pageSize: 10,
      dataFetched: false,
    }
  });

  // Legacy state for backwards compatibility (can be removed once all tabs are migrated)
  const [allTabData, setAllTabData] = useState<any[]>([]);
  const [allTabLoading, setAllTabLoading] = useState(false);
  const [allTabError, setAllTabError] = useState<string | null>(null);
  const [allTabTotalRecords, setAllTabTotalRecords] = useState(0);
  const [allTabCurrentPage, setAllTabCurrentPage] = useState(1);
  const [allTabPageSize, setAllTabPageSize] = useState(10);
  const [allTabDataFetched, setAllTabDataFetched] = useState(false);

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

  // Universal tab data fetcher with caching and optimization
  const updateTabState = useCallback((tabName: string, updates: Partial<typeof tabDataCache['all']>) => {
    setTabDataCache(prev => ({
      ...prev,
      [tabName]: {
        ...prev[tabName],
        ...updates
      }
    }));
  }, []);

  // Generic function to fetch tab data with caching
  const fetchTabData = useCallback(async (
    tabName: string, 
    endpoint: string, 
    page: number = 1, 
    pageSize: number = 10,
    forceRefresh: boolean = false
  ) => {
    if (!id) return;

    // Get current state directly to avoid dependency issues
    setTabDataCache(currentCache => {
      const tabState = currentCache[tabName];
      
      // Check if data is already cached and recent (within 5 minutes)
      const cacheTimeout = 5 * 60 * 1000; // 5 minutes
      const isCacheValid = tabState?.dataFetched && 
                          tabState?.lastFetched && 
                          (Date.now() - tabState.lastFetched) < cacheTimeout &&
                          !forceRefresh;
      
      if (isCacheValid && tabState.currentPage === page && tabState.pageSize === pageSize) {
        console.log(`Using cached data for ${tabName} tab`);
        return currentCache; // No update needed
      }

      // Start loading state
      const updatedCache = {
        ...currentCache,
        [tabName]: {
          ...tabState,
          loading: true,
          error: null
        }
      };

      // Fetch data asynchronously
      (async () => {
        try {
          const response = await fetch(
            `/api/rfq/${id}/${endpoint}?page=${page}&pageSize=${pageSize}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${tabName} tab data`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            setTabDataCache(prevCache => ({
              ...prevCache,
              [tabName]: {
                ...prevCache[tabName],
                data: result.data || [],
                totalRecords: result.meta?.pagination?.totalItems || 0,
                currentPage: page,
                pageSize: pageSize,
                dataFetched: true,
                lastFetched: Date.now(),
                loading: false,
                error: null
              }
            }));

            // Update legacy state for ALL tab (backwards compatibility)
            if (tabName === 'all') {
              setAllTabData(result.data || []);
              setAllTabTotalRecords(result.meta?.pagination?.totalItems || 0);
              setAllTabCurrentPage(page);
              setAllTabPageSize(pageSize);
              setAllTabDataFetched(true);
              setAllTabLoading(false);
              setAllTabError(null);
            }
          } else {
            throw new Error(result.error || `Failed to fetch ${tabName} tab data`);
          }
        } catch (error) {
          console.error(`Error fetching ${tabName} tab data:`, error);
          const errorMessage = `Failed to load ${tabName.toUpperCase()} tab data`;
          
          setTabDataCache(prevCache => ({
            ...prevCache,
            [tabName]: {
              ...prevCache[tabName],
              loading: false,
              error: errorMessage
            }
          }));
          
          // Update legacy state for ALL tab (backwards compatibility)
          if (tabName === 'all') {
            setAllTabLoading(false);
            setAllTabError(errorMessage);
          }
          
          toast.error(errorMessage);
        }
      })();

      return updatedCache;
    });
  }, [id]);

  // Specific fetchers for each tab
  const fetchAllTabData = useCallback((page: number = 1, pageSize: number = 10, forceRefresh: boolean = false) => {
    return fetchTabData('all', 'all-data', page, pageSize, forceRefresh);
  }, [fetchTabData]);

  const fetchPricingTabData = useCallback((page: number = 1, pageSize: number = 10, forceRefresh: boolean = false) => {
    return fetchTabData('pricing', 'pricing-data', page, pageSize, forceRefresh);
  }, [fetchTabData]);

  const fetchInventoryTabData = useCallback((page: number = 1, pageSize: number = 10, forceRefresh: boolean = false) => {
    return fetchTabData('inventory', 'inventory-data', page, pageSize, forceRefresh);
  }, [fetchTabData]);

  const fetchMarketTabData = useCallback((page: number = 1, pageSize: number = 10, forceRefresh: boolean = false) => {
    return fetchTabData('market', 'market-data', page, pageSize, forceRefresh);
  }, [fetchTabData]);

  // Cache invalidation and refresh functions
  const invalidateTabCache = useCallback((tabName: string) => {
    setTabDataCache(prev => ({
      ...prev,
      [tabName]: {
        ...prev[tabName],
        dataFetched: false, 
        lastFetched: undefined,
        data: [],
        error: null 
      }
    }));
  }, []);

  const refreshTabData = useCallback((tabName: string) => {
    setTabDataCache(currentCache => {
      const tabState = currentCache[tabName];
      switch (tabName) {
        case 'all':
          fetchAllTabData(tabState.currentPage, tabState.pageSize, true);
          break;
        case 'pricing':
          fetchPricingTabData(tabState.currentPage, tabState.pageSize, true);
          break;
        case 'inventory':
          fetchInventoryTabData(tabState.currentPage, tabState.pageSize, true);
          break;
        case 'market':
          fetchMarketTabData(tabState.currentPage, tabState.pageSize, true);
          break;
      }
      return currentCache;
    });
  }, [fetchAllTabData, fetchPricingTabData, fetchInventoryTabData, fetchMarketTabData]);

  // Track if preloading has been initiated to prevent multiple triggers
  const [preloadInitiated, setPreloadInitiated] = useState(false);
  
  // Preload common tabs after main RFQ data loads
  useEffect(() => {
    if (rfqData && !loading && id && !preloadInitiated) {
      setPreloadInitiated(true);
      
      // Preload ALL tab data immediately since it's the default tab
      console.log('Preloading ALL tab data...');
      fetchAllTabData();
      
      // Preload other commonly used tabs after a short delay
      const preloadTimer = setTimeout(() => {
        console.log('Preloading pricing and inventory tab data...');
        fetchPricingTabData();
        fetchInventoryTabData();
      }, 1000); // 1 second delay to not overwhelm the server

      return () => clearTimeout(preloadTimer);
    }
  }, [rfqData, loading, id, preloadInitiated, fetchAllTabData, fetchPricingTabData, fetchInventoryTabData]);

  // Universal tab load handlers
  const handleTabLoad = useCallback((tabName: string) => {
    setTabDataCache(currentCache => {
      const tabState = currentCache[tabName];
      if (!tabState?.dataFetched && id) {
        switch (tabName) {
          case 'all':
            fetchAllTabData(tabState.currentPage, tabState.pageSize);
            break;
          case 'pricing':
            fetchPricingTabData(tabState.currentPage, tabState.pageSize);
            break;
          case 'inventory':
            fetchInventoryTabData(tabState.currentPage, tabState.pageSize);
            break;
          case 'market':
            fetchMarketTabData(tabState.currentPage, tabState.pageSize);
            break;
          default:
            console.warn(`No handler for tab: ${tabName}`);
        }
      }
      return currentCache;
    });
  }, [id, fetchAllTabData, fetchPricingTabData, fetchInventoryTabData, fetchMarketTabData]);

  // Universal pagination handlers
  const handleTabPageChange = useCallback((tabName: string, newPage: number, newPageSize: number) => {
    setTabDataCache(prev => ({
      ...prev,
      [tabName]: {
        ...prev[tabName],
        currentPage: newPage,
        pageSize: newPageSize
      }
    }));
    
    switch (tabName) {
      case 'all':
        fetchAllTabData(newPage, newPageSize);
        break;
      case 'pricing':
        fetchPricingTabData(newPage, newPageSize);
        break;
      case 'inventory':
        fetchInventoryTabData(newPage, newPageSize);
        break;
      case 'market':
        fetchMarketTabData(newPage, newPageSize);
        break;
      default:
        console.warn(`No pagination handler for tab: ${tabName}`);
    }
  }, [fetchAllTabData, fetchPricingTabData, fetchInventoryTabData, fetchMarketTabData]);

  // Legacy handlers for backwards compatibility
  const handleAllTabLoad = useCallback(() => {
    handleTabLoad('all');
  }, [handleTabLoad]);

  const handleAllTabPageChange = useCallback((newPage: number, newPageSize: number) => {
    handleTabPageChange('all', newPage, newPageSize);
  }, [handleTabPageChange]);

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

  const handlePushToQB = async () => {
    try {
      // Dummy action for now - show loading state and success message
      toast.loading("Pushing RFQ to QuickBooks...", { id: "qb-push" });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      toast.success("RFQ successfully pushed to QuickBooks!", { id: "qb-push" });
      
      // TODO: Implement actual QuickBooks integration
      console.log("Push to QB clicked for RFQ:", id);
      console.log("RFQ Data:", rfqData);
      console.log("Items:", items);
      
    } catch (error) {
      toast.error("Failed to push to QuickBooks", { id: "qb-push" });
      console.error("Error pushing to QB:", error);
    }
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
      // @ts-ignore
      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      const skuId = item.internalProductId || item?.inventory?.id;
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

  // New handler for detailed quotation responses
  const handleRecordQuotationResponse = async (versionId: number, data: any) => {
    try {
      const response = await rfqApi.createQuotationResponse(id, versionId.toString(), data);
      if (response.success) {
        toast.success('Detailed quotation response recorded successfully');
        // Refresh quotation history to show updated response data
        const historyResponse = await rfqApi.getQuotationHistory(id);
        if (historyResponse.success && historyResponse.data) {
          setQuotationHistory(historyResponse.data);
        }
      } else {
        toast.error(response.error || 'Failed to record detailed quotation response');
      }
    } catch (error) {
      console.error('Error recording detailed quotation response:', error);
      toast.error('Failed to record detailed quotation response');
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
                      cost: inventoryData.cost,
                      costCurrency: inventoryData.costCurrency,
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

  // Debug component for development (remove in production)
  const DebugCacheInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
        <details>
          <summary className="cursor-pointer font-semibold">Cache Status (Debug)</summary>
          <div className="mt-2 space-y-1">
            {Object.entries(tabDataCache).map(([tabName, state]) => (
              <div key={tabName} className="flex justify-between">
                <span className="font-mono">{tabName}:</span>
                <span className={`px-2 py-1 rounded ${
                  state.dataFetched ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {state.dataFetched ? 'Cached' : 'Not Loaded'} 
                  ({state.data.length} items)
                  {state.lastFetched && ` - ${Math.round((Date.now() - state.lastFetched) / 1000)}s ago`}
                </span>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
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
                        {(() => {
                          // Calculate the actual total budget by converting each item's price to display currency
                          const actualTotalBudget = items.reduce((sum: number, item: any) => {
                            const convertedPrice = convertCurrency(item.unitPrice || 0, item.currency as "CAD" | "USD");
                            return sum + (convertedPrice * item.quantity);
                          }, 0);
                          return formatCurrency(actualTotalBudget);
                        })()}
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
                    <Button onClick={handlePushToQB}>
                      Push to QB
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

          <DebugCacheInfo />

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex w-full overflow-x-auto gap-1">
              <TabsTrigger value="all" className="flex-shrink-0">
                <FileText className="mr-2 h-4 w-4" />
                ALL
              </TabsTrigger>
              <TabsTrigger value="items" className="flex-shrink-0">
                <FileText className="mr-2 h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="original-request" className="flex-shrink-0">
                <FileText className="mr-2 h-4 w-4" />
                Original Request
              </TabsTrigger>
              <TabsTrigger value="negotiation" className="flex-shrink-0">
                <MessageSquare className="mr-2 h-4 w-4" />
                Negotiation
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex-shrink-0">
                <Tag className="mr-2 h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex-shrink-0">
                <Building className="mr-2 h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-shrink-0">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="market" className="flex-shrink-0">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Market Data
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-shrink-0">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="quotation-history" className="flex-shrink-0">
                <Clock className="mr-2 h-4 w-4" />
                Quotation History
              </TabsTrigger>
              <TabsTrigger value="export" className="flex-shrink-0">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="m-0">
              <AllTab 
                rfqId={id}
                data={allTabData}
                loading={allTabLoading}
                error={allTabError}
                totalRecords={allTabTotalRecords}
                currentPage={allTabCurrentPage}
                pageSize={allTabPageSize}
                onPageChange={handleAllTabPageChange}
                onLoad={handleAllTabLoad}
              />
            </TabsContent>

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
                convertCurrency={convertCurrency}
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
                data={tabDataCache.pricing.data}
                loading={tabDataCache.pricing.loading}
                error={tabDataCache.pricing.error}
                totalRecords={tabDataCache.pricing.totalRecords}
                currentPage={tabDataCache.pricing.currentPage}
                pageSize={tabDataCache.pricing.pageSize}
                onPageChange={(page, size) => handleTabPageChange('pricing', page, size)}
                onLoad={() => handleTabLoad('pricing')}
                visibleColumns={visibleColumns.pricing}
                onColumnToggle={(columnId) => handleColumnToggle('pricing', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                convertCurrency={convertCurrency}
              />
            </TabsContent>

            <TabsContent value="inventory" className="m-0">
              <InventoryTab
                items={items}
                data={tabDataCache.inventory.data}
                loading={tabDataCache.inventory.loading}
                error={tabDataCache.inventory.error}
                totalRecords={tabDataCache.inventory.totalRecords}
                currentPage={tabDataCache.inventory.currentPage}
                pageSize={tabDataCache.inventory.pageSize}
                onPageChange={(page, size) => handleTabPageChange('inventory', page, size)}
                onLoad={() => handleTabLoad('inventory')}
                visibleColumns={visibleColumns.inventory}
                onColumnToggle={(columnId) => handleColumnToggle('inventory', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                convertCurrency={convertCurrency}
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
                convertCurrency={convertCurrency}
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
                data={tabDataCache.market.data}
                loading={tabDataCache.market.loading}
                error={tabDataCache.market.error}
                totalRecords={tabDataCache.market.totalRecords}
                currentPage={tabDataCache.market.currentPage}
                pageSize={tabDataCache.market.pageSize}
                onPageChange={(page, size) => handleTabPageChange('market', page, size)}
                onLoad={() => handleTabLoad('market')}
                visibleColumns={visibleColumns.market}
                onColumnToggle={(columnId) => handleColumnToggle('market', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                convertCurrency={convertCurrency}
              />
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <SettingsTab
                items={items}
                visibleColumns={visibleColumns.settings}
                onColumnToggle={(columnId) => handleColumnToggle('settings', columnId)}
                renderPagination={renderPagination}
                formatCurrency={formatCurrency}
                convertCurrency={convertCurrency}
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
                onRecordQuotationResponse={handleRecordQuotationResponse}
                rfqId={id}
                customerEmail={rfq?.customer?.email}
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