"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableCustomizer } from "@/components/table-customizer";
import { Loader2 } from "lucide-react";
import { Paginator } from 'primereact/paginator';
import type { BaseTabProps, ColumnDefinition } from "@/lib/types/rfq-tabs";

const MARKET_COLUMNS: ColumnDefinition[] = [
  { id: 'sku', label: 'SKU' },
  { id: 'brand', label: 'Brand' },
  { id: 'requestedPrice', label: 'Requested Price' },
  { id: 'marketPrice', label: 'Market Price' },
  { id: 'marketSource', label: 'Source' },
  { id: 'lastUpdated', label: 'Last Updated' },
  { id: 'priceTrend', label: 'Price Trend' },
  { id: 'marketPosition', label: 'Position' },
  { id: 'dataFreshness', label: 'Data Freshness' },
  { id: 'recommendedAction', label: 'Recommendation' }
];

interface MarketDataTabProps extends BaseTabProps {
  data?: any[];
  loading?: boolean;
  error?: string | null;
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onLoad?: () => void;
}

export function MarketDataTab({
  items,
  data = [],
  loading = false,
  error = null,
  totalRecords = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onLoad,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  formatCurrency,
  convertCurrency
}: MarketDataTabProps) {
  // Trigger data load when component mounts
  useEffect(() => {
    if (onLoad && !loading && data.length === 0 && !error) {
      onLoad();
    }
  }, [onLoad, loading, data.length, error]);

  // Use cached data if available, fallback to items
  const displayData = data.length > 0 ? data : items || [];

  const getTrendBadge = (trend: string) => {
    const variants = {
      increasing: 'bg-green-100 text-green-800',
      stable: 'bg-blue-100 text-blue-800',
      decreasing: 'bg-red-100 text-red-800',
    };
    return variants[trend as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getPositionBadge = (position: string) => {
    const variants = {
      above_market: 'bg-orange-100 text-orange-800',
      competitive: 'bg-green-100 text-green-800',
      below_market: 'bg-blue-100 text-blue-800',
    };
    return variants[position as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getFreshnessBadge = (freshness: string) => {
    const variants = {
      fresh: 'bg-green-100 text-green-800',
      recent: 'bg-yellow-100 text-yellow-800',
      outdated: 'bg-orange-100 text-orange-800',
      stale: 'bg-red-100 text-red-800',
    };
    return variants[freshness as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Market Data Analysis</CardTitle>
          <TableCustomizer
            columns={MARKET_COLUMNS}
            visibleColumns={visibleColumns}
            onColumnToggle={onColumnToggle}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading && displayData.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-muted-foreground">Loading market data...</div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {MARKET_COLUMNS.map(column =>
                    visibleColumns.includes(column.id) && (
                      <TableHead key={column.id}>{column.label}</TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item: any) => (
                  <TableRow key={item.id}>
                    {visibleColumns.includes('sku') && (
                      <TableCell className="font-mono">{item.sku}</TableCell>
                    )}
                    {visibleColumns.includes('brand') && (
                      <TableCell>{item.brand || 'N/A'}</TableCell>
                    )}
                    {visibleColumns.includes('requestedPrice') && (
                      <TableCell>
                        {item.requestedPrice 
                          ? formatCurrency(convertCurrency(item.requestedPrice, item.requestedPriceCurrency || 'CAD'))
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('marketPrice') && (
                      <TableCell className="font-medium">
                        {item.marketPrice 
                          ? formatCurrency(convertCurrency(item.marketPrice, item.marketPriceCurrency || 'CAD'))
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('marketSource') && (
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {item.marketSource || 'unknown'}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes('lastUpdated') && (
                      <TableCell>
                        {item.lastUpdated 
                          ? new Date(item.lastUpdated).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('priceTrend') && (
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTrendBadge(item.priceTrend || 'stable')}`}>
                          {item.priceTrend || 'stable'}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes('marketPosition') && (
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionBadge(item.marketPosition || 'competitive')}`}>
                          {item.marketPosition?.replace('_', ' ') || 'competitive'}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes('dataFreshness') && (
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFreshnessBadge(item.dataFreshness || 'unknown')}`}>
                          {item.dataFreshness || 'unknown'}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes('recommendedAction') && (
                      <TableCell className="text-sm">
                        {item.recommendedAction || 'No recommendation'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Enhanced pagination for cached data */}
            {onPageChange && totalRecords > 0 ? (
              <div className="mt-4">
                <Paginator
                  first={(currentPage - 1) * pageSize}
                  rows={pageSize}
                  totalRecords={totalRecords}
                  rowsPerPageOptions={[10, 20, 50]}
                  onPageChange={(e) => onPageChange(Math.floor(e.first / e.rows) + 1, e.rows)}
                  template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                />
              </div>
            ) : (
              renderPagination && renderPagination()
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
