"use client";

import React from "react";
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
import type { BaseTabProps, ColumnDefinition, InventoryData } from "@/lib/types/rfq-tabs";

const INVENTORY_COLUMNS: ColumnDefinition[] = [
  { id: 'sku', label: 'SKU' },
  { id: 'onHand', label: 'On Hand' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'available', label: 'Available' },
  { id: 'location', label: 'Location' },
  { id: 'status', label: 'Status' }
];

interface InventoryTabProps extends BaseTabProps {
  skuDetails: Record<string, InventoryData>;
}

export function InventoryTab({
  items,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  skuDetails
}: InventoryTabProps) {
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
            {items.map((item: any) => {
              const inventoryData = skuDetails[item.id];
              return (
                <TableRow key={item.id}>
                  {visibleColumns.includes('sku') && (
                    <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                  )}
                  {visibleColumns.includes('onHand') && (
                    <TableCell>{inventoryData?.quantityOnHand || 0}</TableCell>
                  )}
                  {visibleColumns.includes('reserved') && (
                    <TableCell>{inventoryData?.quantityReserved || 0}</TableCell>
                  )}
                  {visibleColumns.includes('available') && (
                    <TableCell>
                      {(inventoryData?.quantityOnHand || 0) - (inventoryData?.quantityReserved || 0)}
                    </TableCell>
                  )}
                  {visibleColumns.includes('location') && (
                    <TableCell>{inventoryData?.warehouseLocation || 'N/A'}</TableCell>
                  )}
                  {visibleColumns.includes('status') && (
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
  );
}
