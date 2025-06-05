import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/currency-context';
import type { ResponseItemStatus } from '@/lib/types/quotation-response';

interface ResponseItemsTableProps {
  items: any[];
  itemResponses: Record<number, {
    itemStatus: ResponseItemStatus;
    requestedQuantity?: number;
    requestedUnitPrice?: number;
    itemSpecificComments?: string;
  }>;
  setItemResponses: React.Dispatch<React.SetStateAction<any>>;
}

export function ResponseItemsTable({ 
  items, 
  itemResponses, 
  setItemResponses 
}: ResponseItemsTableProps) {
  const { formatCurrency } = useCurrency();

  const updateItemResponse = (itemId: number, field: string, value: any) => {
    setItemResponses((prev: any) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      }
    }));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Original Qty</TableHead>
          <TableHead>Original Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested Qty</TableHead>
          <TableHead>Requested Price</TableHead>
          <TableHead>Comments</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.sku?.sku || 'N/A'}</TableCell>
            <TableCell>{item.sku?.description || 'N/A'}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
            <TableCell>
              <Select
                value={itemResponses[item.id]?.itemStatus || 'PENDING'}
                onValueChange={(value) => updateItemResponse(item.id, 'itemStatus', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="COUNTER_PROPOSED">Counter Proposed</SelectItem>
                  <SelectItem value="NEEDS_CLARIFICATION">Needs Clarification</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                className="w-20"
                placeholder={item.quantity.toString()}
                value={itemResponses[item.id]?.requestedQuantity || ''}
                onChange={(e) => updateItemResponse(item.id, 'requestedQuantity', Number(e.target.value))}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                className="w-24"
                placeholder={item.unitPrice.toString()}
                value={itemResponses[item.id]?.requestedUnitPrice || ''}
                onChange={(e) => updateItemResponse(item.id, 'requestedUnitPrice', Number(e.target.value))}
              />
            </TableCell>
            <TableCell>
              <Textarea
                className="min-w-[200px]"
                rows={2}
                placeholder="Item comments..."
                value={itemResponses[item.id]?.itemSpecificComments || ''}
                onChange={(e) => updateItemResponse(item.id, 'itemSpecificComments', e.target.value)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
