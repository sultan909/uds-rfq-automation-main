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
import { TableCustomizer } from "@/components/table-customizer";
import type { BaseTabProps, ColumnDefinition } from "@/lib/types/rfq-tabs";

const PRICING_COLUMNS: ColumnDefinition[] = [
  { id: 'sku', label: 'SKU' },
  { id: 'unitPrice', label: 'Unit Price' },
  { id: 'marketPrice', label: 'Market Price' },
  { id: 'cost', label: 'Cost' },
  { id: 'margin', label: 'Margin' }
];

interface PricingTabProps extends BaseTabProps {}

export function PricingTab({
  items,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  formatCurrency,
  convertCurrency
}: PricingTabProps) {
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
            {items.map((item: any) => (
              <TableRow key={item.id}>
                {visibleColumns.includes('sku') && (
                  <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                )}
                {visibleColumns.includes('unitPrice') && (
                  <TableCell>
                    {formatCurrency(convertCurrency(item.unitPrice || 0, item.currency))}
                  </TableCell>
                )}
                {visibleColumns.includes('marketPrice') && (
                  <TableCell>{formatCurrency(item.inventory?.marketPrice || 0)}</TableCell>
                )}
                {visibleColumns.includes('cost') && (
                  <TableCell>
                    {item.inventory?.cost 
                      ? formatCurrency(convertCurrency(item.inventory.cost, item.inventory.costCurrency))
                      : 'N/A'
                    }
                  </TableCell>
                )}
                {visibleColumns.includes('margin') && (
                  <TableCell>
                    {item.unitPrice && item.inventory?.cost
                      ? (() => {
                          const convertedUnitPrice = convertCurrency(item.unitPrice, item.currency);
                          const convertedCost = convertCurrency(item.inventory.cost, item.inventory.costCurrency);
                          return `${((convertedUnitPrice - convertedCost) / convertedUnitPrice * 100).toFixed(1)}%`;
                        })()
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
  );
}
