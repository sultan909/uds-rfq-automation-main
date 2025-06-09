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
import { TableCustomizer } from "@/components/table-customizer";
import { Loader2 } from "lucide-react";
import { Paginator } from 'primereact/paginator';
import type { BaseTabProps, ColumnDefinition } from "@/lib/types/rfq-tabs";

const PRICING_COLUMNS: ColumnDefinition[] = [
  { id: 'sku', label: 'SKU' },
  { id: 'requestedPrice', label: 'Requested Price' },
  { id: 'suggestedPrice', label: 'Suggested Price' },
  { id: 'marketPrice', label: 'Market Price' },
  { id: 'cost', label: 'Cost' },
  { id: 'margin', label: 'Margin %' },
  { id: 'priceSource', label: 'Price Source' }
];

interface PricingTabProps extends BaseTabProps {
  data?: any[];
  loading?: boolean;
  error?: string | null;
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onLoad?: () => void;
}

export function PricingTab({
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
}: PricingTabProps) {
  // Trigger data load when component mounts
  useEffect(() => {
    if (onLoad && !loading && data.length === 0 && !error) {
      onLoad();
    }
  }, [onLoad, loading, data.length, error]);

  // Use cached data if available, fallback to items
  const displayData = data.length > 0 ? data : items || [];
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Pricing Analysis</CardTitle>
          <TableCustomizer
            columns={PRICING_COLUMNS}
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
              <div className="text-muted-foreground">Loading pricing data...</div>
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
                  {PRICING_COLUMNS.map(column =>
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
                    {visibleColumns.includes('requestedPrice') && (
                      <TableCell>
                        {item.requestedPrice 
                          ? formatCurrency(convertCurrency(item.requestedPrice, item.requestedPriceCurrency || 'CAD'))
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('suggestedPrice') && (
                      <TableCell className="font-medium">
                        {item.suggestedPrice 
                          ? formatCurrency(convertCurrency(item.suggestedPrice, item.suggestedPriceCurrency || 'CAD'))
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('marketPrice') && (
                      <TableCell>
                        {item.marketPrice 
                          ? formatCurrency(convertCurrency(item.marketPrice, item.marketPriceCurrency || 'CAD'))
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('cost') && (
                      <TableCell>
                        {item.cost 
                          ? formatCurrency(convertCurrency(item.cost, item.costCurrency || 'CAD'))
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.includes('margin') && (
                      <TableCell>
                        {item.margin ? `${item.margin}%` : 'N/A'}
                      </TableCell>
                    )}
                    {visibleColumns.includes('priceSource') && (
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.priceSource === 'market' ? 'bg-green-100 text-green-800' :
                          item.priceSource === 'manual' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.priceSource || 'unknown'}
                        </span>
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
