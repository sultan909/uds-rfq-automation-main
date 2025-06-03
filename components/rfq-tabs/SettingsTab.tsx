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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCustomizer } from "@/components/table-customizer";
import type { BaseTabProps, ColumnDefinition, RfqStatus } from "@/lib/types/rfq-tabs";

const SETTINGS_COLUMNS: ColumnDefinition[] = [
  { id: 'sku', label: 'SKU' },
  { id: 'status', label: 'Status' },
  { id: 'currency', label: 'Currency' },
  { id: 'unit', label: 'Unit' },
  { id: 'notes', label: 'Notes' },
  { id: 'actions', label: 'Actions' }
];

interface SettingsTabProps extends BaseTabProps {
  onStatusChange: (newStatus: RfqStatus) => void;
  onEditItem: (itemId: number) => void;
}

export function SettingsTab({
  items,
  visibleColumns,
  onColumnToggle,
  renderPagination,
  onStatusChange,
  onEditItem
}: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>SKU Settings</CardTitle>
          <TableCustomizer
            columns={SETTINGS_COLUMNS}
            visibleColumns={visibleColumns}
            onColumnToggle={onColumnToggle}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {SETTINGS_COLUMNS.map(column =>
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
                {visibleColumns.includes('status') && (
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => onStatusChange(value as RfqStatus)}
                    >
                      <SelectTrigger>
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
                  </TableCell>
                )}
                {visibleColumns.includes('currency') && (
                  <TableCell>{item.currency}</TableCell>
                )}
                {visibleColumns.includes('unit') && (
                  <TableCell>{item.unit}</TableCell>
                )}
                {visibleColumns.includes('notes') && (
                  <TableCell>{item.notes || 'N/A'}</TableCell>
                )}
                {visibleColumns.includes('actions') && (
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onEditItem(item.id)}>
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
  );
}
