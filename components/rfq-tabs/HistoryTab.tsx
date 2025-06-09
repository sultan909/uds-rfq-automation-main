"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCustomizer } from "@/components/table-customizer";
import { Loader2 } from "lucide-react";
import type { BaseTabProps, ColumnDefinition, HistoryState, MainCustomer } from "@/lib/types/rfq-tabs";

interface AllTabData {
  id: number;
  sku: string;
  quantityRequested: number;
  requestedPrice: number;
  currency: string;
  offeredQty: number;
  offeredPrice: number;
  offeredPriceCurrency: string;
  cost: number;
  qtyOnHand: number;
  qtyOnPO: number;
  pricePaidByRandmar: number | string;
  pricePaidByRandmarCurrency: string;
  qtyPurchasedByRandmar12m: number | string;
  pricePaidByUSG: number | string;
  pricePaidByUSGCurrency: string;
  qtyPurchasedByUSG12m: number | string;
  pricePaidByDCS: number | string;
  pricePaidByDCSCurrency: string;
  qtyPurchasedByDCS12m: number | string;
  qtySoldOutside12m: number | string;
  qtySoldOutside3m: number | string;
}

interface HistoryTabProps extends BaseTabProps {
  allTabData?: AllTabData[];
  allTabLoading?: boolean;
  allTabError?: string | null;
  mainCustomers: MainCustomer[];
  filters: { period: string; type: string };
  onFiltersChange: (filters: { period: string; type: string }) => void;
  historyColumns: ColumnDefinition[];
  onLoadAllTab?: () => void;
}

export function HistoryTab({
  items,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  formatCurrency,
  convertCurrency,
  allTabData = [],
  allTabLoading = false,
  allTabError = null,
  mainCustomers,
  filters,
  onFiltersChange,
  historyColumns,
  onLoadAllTab
}: HistoryTabProps) {
  // Trigger data load when component mounts if no data exists
  React.useEffect(() => {
    if (onLoadAllTab && !allTabLoading && allTabData.length === 0 && !allTabError) {
      onLoadAllTab();
    }
  }, [onLoadAllTab, allTabLoading, allTabData.length, allTabError]);

  // Set default filter to 12 months if not set
  React.useEffect(() => {
    if (!filters.period || (filters.period !== '3months' && filters.period !== '12months')) {
      onFiltersChange({ ...filters, period: '12months' });
    }
  }, [filters, onFiltersChange]);

  // Debug logging (optional - can remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('HistoryTab Debug:', {
      itemsCount: items?.length || 0,
      allTabDataCount: allTabData?.length || 0,
      allTabLoading,
      allTabError,
      mainCustomersCount: mainCustomers?.length || 0,
      filters,
      sampleAllTabItem: allTabData?.[0]
    });
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Sales History</CardTitle>
          <div className="flex items-center gap-4">
            <Select
              value={filters.period}
              onValueChange={(value) => onFiltersChange({ ...filters, period: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <TableCustomizer
              columns={historyColumns}
              visibleColumns={visibleColumns}
              onColumnToggle={onColumnToggle}
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
            {allTabLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="text-muted-foreground">Loading history data...</div>
                </div>
              </div>
            ) : allTabError ? (
              <div className="text-red-500 text-center py-4">{allTabError}</div>
            ) : allTabData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-medium">No pricing history available</p>
                <p className="text-sm mt-2">Try adjusting the time period filter or check back later.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Randmar</TableHead>
                    <TableHead>USG</TableHead>
                    <TableHead>DCS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTabData.map((historyItem) => {
                    // Helper function to format currency from all tab data
                    const formatHistoryPrice = (price: number | string, currency: string) => {
                      if (price === 'N/A' || price === null || price === undefined) return 'N/A';
                      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
                      if (isNaN(numericPrice)) return 'N/A';
                      const convertedPrice = convertCurrency(numericPrice, currency as "CAD" | "USD");
                      return formatCurrency(convertedPrice);
                    };

                    return (
                      <TableRow key={historyItem.id}>
                        <TableCell className="font-medium">{historyItem.sku}</TableCell>
                        {/* Randmar Column */}
                        <TableCell>
                          {historyItem.pricePaidByRandmar !== 'N/A' ? (
                            <div className="space-y-1 text-sm">
                              <div>Price: {formatHistoryPrice(historyItem.pricePaidByRandmar, historyItem.pricePaidByRandmarCurrency)}</div>
                              <div className="text-muted-foreground">Randmar</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No history</span>
                          )}
                        </TableCell>
                        {/* USG Column */}
                        <TableCell>
                          {historyItem.pricePaidByUSG !== 'N/A' ? (
                            <div className="space-y-1 text-sm">
                              <div>Price: {formatHistoryPrice(historyItem.pricePaidByUSG, historyItem.pricePaidByUSGCurrency)}</div>
                              <div className="text-muted-foreground">USG</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No history</span>
                          )}
                        </TableCell>
                        {/* DCS Column */}
                        <TableCell>
                          {historyItem.pricePaidByDCS !== 'N/A' ? (
                            <div className="space-y-1 text-sm">
                              <div>Price: {formatHistoryPrice(historyItem.pricePaidByDCS, historyItem.pricePaidByDCSCurrency)}</div>
                              <div className="text-muted-foreground">DCS</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No history</span>
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
            {allTabLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="text-muted-foreground">Loading history data...</div>
                </div>
              </div>
            ) : allTabError ? (
              <div className="text-red-500 text-center py-4">{allTabError}</div>
            ) : allTabData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-medium">No quantity history available</p>
                <p className="text-sm mt-2">Try adjusting the time period filter or check back later.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Randmar ({filters.period === '3months' ? '3m' : '12m'})</TableHead>
                    <TableHead>USG ({filters.period === '3months' ? '3m' : '12m'})</TableHead>
                    <TableHead>DCS ({filters.period === '3months' ? '3m' : '12m'})</TableHead>
                    <TableHead>Outside Sales ({filters.period === '3months' ? '3m' : '12m'})</TableHead>
                    <TableHead>Total Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTabData.map((historyItem) => {
                    // Helper function to format quantities
                    const formatQuantity = (qty: number | string) => {
                      if (qty === 'N/A' || qty === null || qty === undefined) return 0;
                      const numericQty = typeof qty === 'string' ? parseFloat(qty) : qty;
                      return isNaN(numericQty) ? 0 : numericQty;
                    };

                    // Get quantities based on selected period
                    const is3MonthPeriod = filters.period === '3months';
                    
                    // For 12-month period, use the 12m data
                    // For 3-month period, use the 3m data where available, otherwise show 0
                    const randmarQty = is3MonthPeriod ? 0 : formatQuantity(historyItem.qtyPurchasedByRandmar12m);
                    const usgQty = is3MonthPeriod ? 0 : formatQuantity(historyItem.qtyPurchasedByUSG12m);
                    const dcsQty = is3MonthPeriod ? 0 : formatQuantity(historyItem.qtyPurchasedByDCS12m);
                    
                    // Outside sales data - use appropriate period
                    const outsideQty = is3MonthPeriod 
                      ? formatQuantity(historyItem.qtySoldOutside3m)
                      : formatQuantity(historyItem.qtySoldOutside12m);
                    
                    // Note: We don't have 3-month data for main customers (Randmar, USG, DCS)
                    // Only outside sales has both 3m and 12m data available
                    const totalQuantity = randmarQty + usgQty + dcsQty + outsideQty;

                    return (
                      <TableRow key={historyItem.id}>
                        <TableCell className="font-medium">{historyItem.sku}</TableCell>
                        {/* Randmar Column */}
                        <TableCell>
                          {is3MonthPeriod ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>No 3-month data</div>
                              {/* <div className="text-xs">Only 12m available</div> */}
                            </div>
                          ) : randmarQty > 0 ? (
                            <div className="space-y-1 text-sm">
                              <div>Qty: <span className="font-medium">{randmarQty.toLocaleString()}</span></div>
                              <div className="text-muted-foreground">12 months</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No purchases</span>
                          )}
                        </TableCell>
                        {/* USG Column */}
                        <TableCell>
                          {is3MonthPeriod ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>No 3-month data</div>
                              {/* <div className="text-xs">Only 12m available</div> */}
                            </div>
                          ) : usgQty > 0 ? (
                            <div className="space-y-1 text-sm">
                              <div>Qty: <span className="font-medium">{usgQty.toLocaleString()}</span></div>
                              <div className="text-muted-foreground">12 months</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No purchases</span>
                          )}
                        </TableCell>
                        {/* DCS Column */}
                        <TableCell>
                          {is3MonthPeriod ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>No 3-month data</div>
                              {/* <div className="text-xs">Only 12m available</div> */}
                            </div>
                          ) : dcsQty > 0 ? (
                            <div className="space-y-1 text-sm">
                              <div>Qty: <span className="font-medium">{dcsQty.toLocaleString()}</span></div>
                              <div className="text-muted-foreground">12 months</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No purchases</span>
                          )}
                        </TableCell>
                        {/* Outside Sales Column */}
                        <TableCell>
                          {outsideQty > 0 ? (
                            <div className="space-y-1 text-sm">
                              <div>Qty: <span className="font-medium">{outsideQty.toLocaleString()}</span></div>
                              <div className="text-muted-foreground">{is3MonthPeriod ? '3 months' : '12 months'}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No outside sales</span>
                          )}
                        </TableCell>
                        {/* Total Quantity Column */}
                        <TableCell className="font-semibold text-right">
                          {totalQuantity > 0 ? totalQuantity.toLocaleString() : '0'}
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
  );
}
