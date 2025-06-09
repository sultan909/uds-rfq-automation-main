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
import type { BaseTabProps, ColumnDefinition, InventoryData } from "@/lib/types/rfq-tabs";

const INVENTORY_COLUMNS: ColumnDefinition[] = [
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

interface InventoryTabProps extends BaseTabProps {
  skuDetails: Record<string, InventoryData>;
  data?: any[];
  loading?: boolean;
  error?: string | null;
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onLoad?: () => void;
}

export function InventoryTab({
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
  skuDetails
}: InventoryTabProps) {
  // Trigger data load when component mounts
  useEffect(() => {
    if (onLoad && !loading && data.length === 0 && !error) {
      onLoad();
    }
  }, [onLoad, loading, data.length, error]);

  // Use cached data if available, fallback to items
  const displayData = data.length > 0 ? data : items || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      in_stock: 'bg-green-100 text-green-800',
      medium_stock: 'bg-yellow-100 text-yellow-800',
      low_stock: 'bg-orange-100 text-orange-800',
      out_of_stock: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Inventory Status</CardTitle>
          <TableCustomizer
            columns={INVENTORY_COLUMNS}
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
              <div className="text-muted-foreground">Loading inventory data...</div>
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
                  {INVENTORY_COLUMNS.map(column =>
                    visibleColumns.includes(column.id) && (
                      <TableHead key={column.id}>{column.label}</TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item: any) => {
                  const inventoryData = skuDetails[item.id];
                  return (
                    <TableRow key={item.id}>
                      {visibleColumns.includes('sku') && (
                        <TableCell className="font-mono">{item.sku}</TableCell>
                      )}
                      {visibleColumns.includes('quantityRequested') && (
                        <TableCell className="font-medium">{item.quantityRequested || 0}</TableCell>
                      )}
                      {visibleColumns.includes('quantityOnHand') && (
                        <TableCell>{item.quantityOnHand || 0}</TableCell>
                      )}
                      {visibleColumns.includes('quantityReserved') && (
                        <TableCell>{item.quantityReserved || 0}</TableCell>
                      )}
                      {visibleColumns.includes('availableQuantity') && (
                        <TableCell className="font-medium">
                          {item.availableQuantity || 0}
                        </TableCell>
                      )}
                      {visibleColumns.includes('quantityOnPO') && (
                        <TableCell>{item.quantityOnPO || 0}</TableCell>
                      )}
                      {visibleColumns.includes('warehouseLocation') && (
                        <TableCell>{item.warehouseLocation || 'N/A'}</TableCell>
                      )}
                      {visibleColumns.includes('stockStatus') && (
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(item.stockStatus || 'unknown')}`}>
                            {item.stockStatus?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.includes('turnoverRate') && (
                        <TableCell>
                          {item.turnoverRate ? `${item.turnoverRate}x` : 'N/A'}
                        </TableCell>
                      )}
                      {visibleColumns.includes('daysSinceLastSale') && (
                        <TableCell>
                          {item.daysSinceLastSale !== null ? `${item.daysSinceLastSale} days` : 'N/A'}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
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
