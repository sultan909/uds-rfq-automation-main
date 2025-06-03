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
  MessageSquare,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { rfqApi, customerApi, inventoryApi, negotiationApi } from "@/lib/api-client";
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
import { EditableItemsTable } from "@/components/editable-items-table";
import { NegotiationTab } from "@/components/negotiation-tab";
import { QuotationHistoryTable } from "@/components/quotation-history-table";
import type { CreateQuotationRequest, QuotationVersionWithItems } from "@/lib/types/quotation";

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

// Add this interface near the top with other interfaces
interface InventoryResponse {
  id: number;
  sku: string;
  description: string;
  stock: number;
  costCad: number;
  costUsd: number;
  quantityOnHand: number;
  quantityReserved: number;
  warehouseLocation: string;
  lowStockThreshold: number;
  lastSaleDate: string | null;
}

// Add this near the top with other interfaces
type RfqStatus = 'PENDING' | 'IN_PROGRESS' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

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

  // Fetch negotiation history
  useEffect(() => {
    if (id) {
      fetchNegotiationHistory();
    }
  }, [id]);

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
            console.error(`❌ Error fetching history for item ${itemSku}:`, error);
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
        console.error('❌ Error in fetchHistory:', err);
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
      try {
        if (!rfqData?.items?.length) return;

        const inventoryData = await Promise.all(
          rfqData.items.map(async (item: any) => {
            try {
              // If item already has inventory data from creation, use it
              if (item.inventory) {
                return {
                  ...item,
                  inventory: item.inventory
                };
              }

              // Otherwise fetch from API
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
              console.error('Error processing item:', err);
              return item;
            }
          })
        );

        setSkuDetails(inventoryData.reduce((acc: Record<string, InventoryData>, item) => {
          acc[item.id] = item.inventory;
          return acc;
        }, {}));
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

  // Enhanced Sales History Export - Matching the History Tab Display Structure

  const exportToExcel = () => {
    try {
      // Validate rfqData exists and has required properties
      if (!rfqData) {
        throw new Error('No RFQ data available');
      }

      // Helper function to safely access customer history data
      // @ts-ignore
      const getCustomerHistoryData = (salesHistory, customerId) => {
        try {
          const mainCustomerHistory = salesHistory[0]?.mainCustomerHistory;
          if (!mainCustomerHistory) return null;

          // Handle both array and object formats
          if (Array.isArray(mainCustomerHistory)) {
            return mainCustomerHistory.find(h => h.customerId === customerId);
          } else {
            return mainCustomerHistory[customerId];
          }
        } catch (error) {
          console.warn('Error accessing customer history:', error);
          return null;
        }
      };

      // Helper function to get other customer history
      // @ts-ignore
      const getOtherCustomerHistory = (salesHistory) => {
        try {
          return salesHistory[0]?.otherCustomerHistory || [];
        } catch (error) {
          console.warn('Error accessing other customer history:', error);
          return [];
        }
      };

      // Create Pricing History Sheet (matches Pricing History tab)
      const createPricingHistorySheet = () => {
        const headers = [
          'SKU',
          ...mainCustomers.map(customer => `${customer.name} - Last Price`),
          ...mainCustomers.map(customer => `${customer.name} - Last Date`),
          ...mainCustomers.map(customer => `${customer.name} - Trend`),
          'Other Customers - Last Price',
          'Other Customers - Customer Name',
          'Other Customers - Last Date',
          'Other Customers - Trend'
        ];
        // @ts-ignore

        const rows = rfqData.items?.map((item) => {
          const itemSku = item.customerSku || item.inventory?.sku || 'N/A';
          const salesHistory = history.history.filter((h) => h.sku === itemSku);

          if (salesHistory.length === 0) {
            return [itemSku, ...Array(headers.length - 1).fill('No history')];
          }

          const otherCustomerHistory = getOtherCustomerHistory(salesHistory);
          const row = [itemSku];

          // Add main customer last prices
          mainCustomers.forEach(customer => {
            const customerHistory = getCustomerHistoryData(salesHistory, customer.id);
            row.push(customerHistory ? formatCurrency(customerHistory.lastPrice || 0) : 'No history');
          });

          // Add main customer last dates
          mainCustomers.forEach(customer => {
            const customerHistory = getCustomerHistoryData(salesHistory, customer.id);
            row.push(customerHistory && customerHistory.lastTransaction
              ? new Date(customerHistory.lastTransaction).toLocaleDateString()
              : 'N/A');
          });

          // Add main customer trends
          mainCustomers.forEach(customer => {
            const customerHistory = getCustomerHistoryData(salesHistory, customer.id);
            const trend = customerHistory?.trend;
            row.push(trend === 'up' ? '↑' : trend === 'down' ? '↓' : 'neutral');
          });

          // Add other customers data
          if (otherCustomerHistory.length > 0) {
            const otherCustomer = otherCustomerHistory[0];
            row.push(formatCurrency(otherCustomer.lastPrice || 0));
            row.push(otherCustomer.customer || 'N/A');
            row.push(otherCustomer.lastTransaction
              ? new Date(otherCustomer.lastTransaction).toLocaleDateString()
              : 'N/A');
            row.push(otherCustomer.trend === 'up' ? '↑' : otherCustomer.trend === 'down' ? '↓' : 'neutral');
          } else {
            row.push('No history', 'N/A', 'N/A', 'neutral');
          }

          return row;
        }) || [];

        return [headers, ...rows];
      };

      // Create Quantity History Sheet (matches Quantity History tab)
      const createQuantityHistorySheet = () => {
        const headers = [
          'SKU',
          ...mainCustomers.map(customer => `${customer.name} - Last Qty`),
          ...mainCustomers.map(customer => `${customer.name} - Total Qty`),
          ...mainCustomers.map(customer => `${customer.name} - Last Date`),
          'Other Customers - Last Qty',
          'Other Customers - Total Qty',
          'Other Customers - Customer Name',
          'Other Customers - Last Date',
          'Total Quantity (All Customers)'
        ];
        // @ts-ignore

        const rows = rfqData.items?.map((item) => {
          const itemSku = item.customerSku || item.inventory?.sku || 'N/A';
          const salesHistory = history.history.filter((h) => h.sku === itemSku);

          if (salesHistory.length === 0) {
            return [itemSku, ...Array(headers.length - 1).fill('No history')];
          }

          const otherCustomerHistory = getOtherCustomerHistory(salesHistory);
          const row = [itemSku];
          let totalQuantity = 0;

          // Add main customer last quantities
          mainCustomers.forEach(customer => {
            const customerHistory = getCustomerHistoryData(salesHistory, customer.id);
            row.push(customerHistory?.lastQuantity || 0);
          });

          // Add main customer total quantities
          mainCustomers.forEach(customer => {
            const customerHistory = getCustomerHistoryData(salesHistory, customer.id);
            const totalQty = customerHistory?.totalQuantity || 0;
            totalQuantity += totalQty;
            row.push(totalQty);
          });

          // Add main customer last dates
          mainCustomers.forEach(customer => {
            const customerHistory = getCustomerHistoryData(salesHistory, customer.id);
            row.push(customerHistory && customerHistory.lastTransaction
              ? new Date(customerHistory.lastTransaction).toLocaleDateString()
              : 'N/A');
          });

          // Add other customers data
          if (otherCustomerHistory.length > 0) {
            const otherCustomer = otherCustomerHistory[0];
            const otherQty = otherCustomer.totalQuantity || 0;
            totalQuantity += otherQty;

            row.push(otherCustomer.lastQuantity || 0);
            row.push(otherQty);
            row.push(otherCustomer.customer || 'N/A');
            row.push(otherCustomer.lastTransaction
              ? new Date(otherCustomer.lastTransaction).toLocaleDateString()
              : 'N/A');
          } else {
            row.push(0, 0, 'N/A', 'N/A');
          }

          // Add total quantity across all customers
          row.push(totalQuantity);

          return row;
        }) || [];

        return [headers, ...rows];
      };

      // Create Sales History Summary (original simple format for reference)
      const createSalesHistorySummary = () => {
        return [
          ['SKU', 'Date', 'Customer', 'Quantity', 'Unit Price', 'Total Amount', 'Status'],
          // @ts-ignore

          ...rfqData.items?.flatMap((item) => {
            const itemSku = item.customerSku || item.inventory?.sku;
            const salesHistory = history.history.filter((h) => h.sku === itemSku);

            if (salesHistory.length === 0) {
              return [];
            }

            const lastSale = salesHistory[0];
            return [
              itemSku,
              lastSale?.lastTransaction ? new Date(lastSale.lastTransaction).toLocaleDateString() : 'N/A',
              lastSale?.customer || 'N/A',
              lastSale?.lastQuantity || 'N/A',
              formatCurrency(lastSale?.lastPrice || 0),
              formatCurrency((lastSale?.lastPrice || 0) * (lastSale?.lastQuantity || 0)),
              lastSale?.trend === 'up' ? '↑' : lastSale?.trend === 'down' ? '↓' : 'neutral'
            ];
          }) || []
        ];
      };

      // Prepare the enhanced export data
      const exportData = {
        'RFQ Summary': [
          ['RFQ Number', rfqData.rfqNumber || 'N/A'],
          ['Date Received', rfqData.createdAt ? new Date(rfqData.createdAt).toLocaleDateString() : 'N/A'],
          ['Source', rfqData.source || 'N/A'],
          ['Status', rfqData.status || 'N/A'],
          ['Due Date', rfqData.dueDate ? new Date(rfqData.dueDate).toLocaleDateString() : 'N/A'],
          ['Total Budget', formatCurrency(
            currency === "CAD"
              ? (rfqData.totalBudget || 0)
              : convertCurrency(rfqData.totalBudget || 0, "CAD")
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
        // Enhanced Sales History - matches the History tab display
        'Sales History - Pricing': createPricingHistorySheet(),
        'Sales History - Quantity': createQuantityHistorySheet(),
        'Sales History - Summary': createSalesHistorySummary(),
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
        ],
        'Negotiation Communications': [
          ['Date', 'Type', 'Direction', 'Subject', 'Contact Person', 'Content', 'Follow-up Required', 'Follow-up Date', 'Follow-up Completed'],
          ...communications?.map((comm: any) => [
            new Date(comm.communicationDate).toLocaleDateString(),
            comm.communicationType,
            comm.direction,
            comm.subject || 'N/A',
            comm.contactPerson || 'N/A',
            comm.content?.substring(0, 100) + (comm.content?.length > 100 ? '...' : ''),
            comm.followUpRequired ? 'Yes' : 'No',
            comm.followUpDate ? new Date(comm.followUpDate).toLocaleDateString() : 'N/A',
            comm.followUpCompleted ? 'Yes' : 'No'
          ]) || [],
        ],
        'SKU Negotiation Changes': [
          ['Date', 'SKU', 'Change Type', 'Old Quantity', 'New Quantity', 'Old Price', 'New Price', 'Reason', 'Changed By'],
          ...negotiationHistory?.map((change: any) => [
            new Date(change.createdAt).toLocaleDateString(),
            change.sku?.sku || 'N/A',
            change.changeType,
            change.oldQuantity || 'N/A',
            change.newQuantity || 'N/A',
            change.oldUnitPrice ? formatCurrency(change.oldUnitPrice) : 'N/A',
            change.newUnitPrice ? formatCurrency(change.newUnitPrice) : 'N/A',
            change.changeReason || 'No reason provided',
            change.changedBy
          ]) || [],
        ]
      };

      // Log export data for debugging
      console.log('🚀 Export data prepared:', {
        sheets: Object.keys(exportData),
        pricingHistoryRows: exportData['Sales History - Pricing']?.length,
        quantityHistoryRows: exportData['Sales History - Quantity']?.length,
        mainCustomers: mainCustomers.map(c => c.name),
        historyData: history.history.length
      });

      // Ensure all sheets are valid arrays and handle empty data
      Object.entries(exportData).forEach(([sheetName, data]) => {
        if (!Array.isArray(data)) {
          console.error(`Invalid data for sheet ${sheetName}:`, data);
          // @ts-ignore
          exportData[sheetName] = [['No data available']];
        } else {
          // Ensure each row is an array and handle empty data
          // @ts-ignore

          exportData[sheetName] = data.length > 0
            ? data.map(row => Array.isArray(row) ? row : [row])
            : [['No data available']];
        }
      });

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Add each section as a separate worksheet
      Object.entries(exportData).forEach(([sheetName, data]) => {
        try {
          // Skip empty sheets
          if (!data || data.length === 0) {
            console.warn(`Skipping empty sheet: ${sheetName}`);
            return;
          }

          const ws = XLSX.utils.aoa_to_sheet(data);

          // Auto-fit column widths with better handling
          // @ts-ignore
          const colWidths = data[0].map((_, index: any) => {
            const maxLength = Math.max(
              ...data.map(row => {
                const cellValue = (row[index]?.toString() || '').length;
                return Math.min(Math.max(cellValue, 10), 50); // Min width 10, max width 50
              })
            );
            return { wch: maxLength + 2 }; // Add padding
          });

          ws['!cols'] = colWidths;
          XLSX.utils.book_append_sheet(wb, ws, sheetName);

          console.log(`✅ Sheet created: ${sheetName} with ${data.length} rows`);
        } catch (sheetError) {
          console.error(`Error processing sheet ${sheetName}:`, sheetError);
          // Create an error sheet instead of failing the entire export
          // @ts-ignore
          const errorWs = XLSX.utils.aoa_to_sheet([['Error processing this sheet', sheetError.message]]);
          XLSX.utils.book_append_sheet(wb, errorWs, `${sheetName}_ERROR`);
        }
      });

      // Check if workbook has any sheets
      if (wb.SheetNames.length === 0) {
        throw new Error('No valid data to export');
      }

      // Generate and download the Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RFQ_${rfqData.rfqNumber || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('RFQ data exported successfully with enhanced sales history');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(`Failed to export RFQ data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
          setRfqData(updatedRfq.data);
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
                      <TableCustomizer
                        columns={historyColumns}
                        visibleColumns={visibleColumns.history}
                        onColumnToggle={(columnId) => handleColumnToggle('history', columnId)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pricing" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="pricing">Pricing History</TabsTrigger>
                      <TabsTrigger value="quantity">Quantity History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pricing">
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
                              <TableHead>SKU</TableHead>
                              {mainCustomers.map(customer => (
                                <TableHead key={customer.id}>{customer.name}</TableHead>
                              ))}
                              <TableHead>Other Customers</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item: any) => {
                              const itemSku = item.customerSku || item.inventory?.sku;
                              const salesHistory = history.history.filter((h) => h.sku === itemSku) as HistoryItem[];
                              // @ts-ignore
                              const otherCustomerHistory = salesHistory[0]?.otherCustomerHistory

                              if (salesHistory.length === 0) {
                                return null;
                              }

                              return (
                                <TableRow key={item.id}>
                                  <TableCell>{itemSku}</TableCell>
                                  {mainCustomers.map(customer => {
                                    const te = salesHistory[0]?.mainCustomerHistory
                                    // @ts-ignore
                                    const customerHistory = te.filter((t) => t.customerId === customer.id)

                                    return (
                                      <TableCell key={customer.id}>
                                        {customerHistory.length > 0 ? (
                                          <div className="space-y-1">
                                            <div>Last Price: {formatCurrency(customerHistory[0]?.lastPrice || 0)}</div>
                                            <div>Last Date: {new Date(customerHistory[0]?.lastTransaction).toLocaleDateString()}</div>
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
                                  <TableCell>
                                    {otherCustomerHistory.length > 0 ? (
                                      <div className="space-y-1">
                                        <div>Last Price: {formatCurrency(otherCustomerHistory[0].lastPrice || 0)}</div>
                                        <div>Customer: {otherCustomerHistory[0].customer}</div>
                                        <div>Last Date: {new Date(otherCustomerHistory[0].lastTransaction).toLocaleDateString()}</div>
                                        <Badge variant={otherCustomerHistory[0].trend === 'up' ? 'default' : 'destructive'}>
                                          {otherCustomerHistory[0].trend === 'up' ? '↑' : '↓'}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">No history</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>

                    <TabsContent value="quantity">
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
                              <TableHead>SKU</TableHead>
                              {mainCustomers.map(customer => (
                                <TableHead key={customer.id}>{customer.name}</TableHead>
                              ))}
                              <TableHead>Other Customers</TableHead>
                              <TableHead>Total Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item: any) => {
                              const itemSku = item.customerSku || item.inventory?.sku;
                              const salesHistory = history.history.filter((h) => h.sku === itemSku) as HistoryItem[];
                              // @ts-ignore
                              const otherCustomerHistory = salesHistory[0]?.otherCustomerHistory

                              if (salesHistory.length === 0) {
                                return null;
                              }

                              let totalQuantity = 0;

                              // Get sales from non-main customers
                              const otherCustomerSales = salesHistory.filter(h =>
                                !mainCustomers.some(mc => mc.name === h.customer)
                              );

                              return (
                                <TableRow key={item.id}>
                                  <TableCell>{itemSku}</TableCell>
                                  {mainCustomers.map(customer => {
                                    const customerHistory = salesHistory[0]?.mainCustomerHistory?.[customer.id];
                                    if (customerHistory) {
                                      totalQuantity += customerHistory.totalQuantity;
                                    }
                                    return (
                                      <TableCell key={customer.id}>
                                        {customerHistory ? (
                                          <div className="space-y-1">
                                            <div>Last Qty: {customerHistory.lastQuantity}</div>
                                            <div>Total Qty: {customerHistory.totalQuantity}</div>
                                            <div>Last Date: {new Date(customerHistory.lastTransaction).toLocaleDateString()}</div>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">No history</span>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell>
                                    {otherCustomerHistory.length > 0 ? (
                                      <div className="space-y-1">
                                        <div>Last Qty: {otherCustomerHistory[0].lastQuantity}</div>
                                        <div>Total Qty: {otherCustomerHistory[0].totalQuantity}</div>
                                        <div>Customer: {otherCustomerHistory[0].customer}</div>
                                        <div>Last Date: {new Date(otherCustomerHistory[0].lastTransaction).toLocaleDateString()}</div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">No history</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {totalQuantity + (otherCustomerSales.length > 0 ? otherCustomerSales[0].totalQuantity : 0)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
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
                                onValueChange={(value) => handleStatusChange(value as RfqStatus)}
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Quotation History</h3>
                  <Button onClick={() => setIsVersionModalOpen(true)}>
                    Create New Version
                  </Button>
                </div>
                
                <QuotationHistoryTable
                  versions={quotationHistory}
                  onRecordResponse={(version) => {
                    setSelectedVersion(version);
                    setIsResponseModalOpen(true);
                  }}
                />
              </div>

              <VersionCreationModal
                isOpen={isVersionModalOpen}
                onClose={() => setIsVersionModalOpen(false)}
                onSubmit={handleCreateVersion}
                currentItems={items}
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


