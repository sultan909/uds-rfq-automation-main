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
import { Spinner } from "@/components/spinner";
import type { BaseTabProps, ColumnDefinition, HistoryState, MainCustomer } from "@/lib/types/rfq-tabs";

interface HistoryTabProps extends BaseTabProps {
  history: HistoryState;
  historyLoading: boolean;
  historyError: string | null;
  mainCustomers: MainCustomer[];
  filters: { period: string; type: string };
  onFiltersChange: (filters: { period: string; type: string }) => void;
  historyColumns: ColumnDefinition[];
}

export function HistoryTab({
  items,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  formatCurrency,
  history,
  historyLoading,
  historyError,
  mainCustomers,
  filters,
  onFiltersChange,
  historyColumns
}: HistoryTabProps) {
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
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
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
                    const itemSku = item.inventory?.sku || item.customerSku || item.sku;
                    const salesHistory = history.history.filter((h) => h.sku === itemSku);
                    // @ts-ignore
                    const otherCustomerHistory = salesHistory[0]?.otherCustomerHistory;

                    if (salesHistory.length === 0) {
                      return null;
                    }

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{itemSku}</TableCell>
                        {mainCustomers.map(customer => {
                          const te = salesHistory[0]?.mainCustomerHistory;
                          // @ts-ignore
                          const customerHistory = te?.filter((t) => t.customerId === customer.id);

                          return (
                            <TableCell key={customer.id}>
                              {customerHistory && customerHistory.length > 0 ? (
                                <div className="space-y-1">
                                  <div>Last Price: {formatCurrency(customerHistory[0]?.lastPrice || 0)}</div>
                                  <div>Last Date: {new Date(customerHistory[0]?.lastTransaction).toLocaleDateString()}</div>
                                  <Badge variant={customerHistory[0]?.trend === 'up' ? 'default' : 'destructive'}>
                                    {customerHistory[0]?.trend === 'up' ? '↑' : '↓'}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No history</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          {otherCustomerHistory && otherCustomerHistory.length > 0 ? (
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
                    const itemSku = item.inventory?.sku || item.customerSku || item.sku;
                    const salesHistory = history.history.filter((h) => h.sku === itemSku);
                    // @ts-ignore
                    const otherCustomerHistory = salesHistory[0]?.otherCustomerHistory;

                    if (salesHistory.length === 0) {
                      return null;
                    }

                    let totalQuantity = 0;

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
                          {otherCustomerHistory && otherCustomerHistory.length > 0 ? (
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
                          {totalQuantity + (otherCustomerHistory?.length > 0 ? otherCustomerHistory[0].totalQuantity : 0)}
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
