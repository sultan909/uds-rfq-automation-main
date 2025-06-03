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
import type { BaseTabProps, ColumnDefinition } from "@/lib/types/rfq-tabs";

const MARKET_COLUMNS: ColumnDefinition[] = [
  { id: 'sku', label: 'SKU' },
  { id: 'marketPrice', label: 'Market Price' },
  { id: 'source', label: 'Source' },
  { id: 'lastUpdated', label: 'Last Updated' },
  { id: 'competitorPrice', label: 'Competitor Price' },
  { id: 'priceTrend', label: 'Price Trend' }
];

interface MarketDataTabProps extends BaseTabProps {}

export function MarketDataTab({
  items,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  formatCurrency
}: MarketDataTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Market Data</CardTitle>
          <TableCustomizer
            columns={MARKET_COLUMNS}
            visibleColumns={visibleColumns}
            onColumnToggle={onColumnToggle}
          />
        </div>
      </CardHeader>
      <CardContent>
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
            {items.map((item: any) => (
              <TableRow key={item.id}>
                {visibleColumns.includes('sku') && (
                  <TableCell>{item.customerSku || item.inventory?.sku}</TableCell>
                )}
                {visibleColumns.includes('marketPrice') && (
                  <TableCell>{formatCurrency(item.inventory?.marketPrice || 0)}</TableCell>
                )}
                {visibleColumns.includes('source') && (
                  <TableCell>{item.inventory?.marketSource || 'N/A'}</TableCell>
                )}
                {visibleColumns.includes('lastUpdated') && (
                  <TableCell>
                    {item.inventory?.marketLastUpdated
                      ? new Date(item.inventory.marketLastUpdated).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                )}
                {visibleColumns.includes('competitorPrice') && (
                  <TableCell>{formatCurrency(item.inventory?.competitorPrice || 0)}</TableCell>
                )}
                {visibleColumns.includes('priceTrend') && (
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
  );
}
