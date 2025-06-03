import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Edit3, X, Check } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { toast } from 'sonner';
import type { CreateQuotationItemRequest } from '@/lib/types/quotation';

interface EditableItem {
  id: number;
  internalProductId?: number;
  customerSku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  comment?: string;
  status?: string;
  inventory?: {
    id: number;
    sku: string;
    description: string;
  };
}

interface EditableItemsTableProps {
  items: EditableItem[];
  onSaveQuotation: (items: CreateQuotationItemRequest[]) => Promise<void>;
  isEditable: boolean;
  rfqStatus?: string;
}

export function EditableItemsTable({ 
  items, 
  onSaveQuotation, 
  isEditable,
  rfqStatus 
}: EditableItemsTableProps) {
  const { formatCurrency } = useCurrency();
  const [editingItems, setEditingItems] = useState<Record<number, EditableItem>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = () => {
    setIsEditMode(true);
    // Initialize editing state with current values
    const editingState: Record<number, EditableItem> = {};
    items.forEach(item => {
      editingState[item.id] = {
        ...item,
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 1,
        comment: item.comment || ''
      };
    });
    setEditingItems(editingState);
  };

  const handleEditCancel = () => {
    setIsEditMode(false);
    setEditingItems({});
  };

  const handleItemChange = (itemId: number, field: keyof EditableItem, value: any) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSaveQuotation = async () => {
    try {
      setIsSaving(true);

      // Convert editing items to quotation items format
      const quotationItems: CreateQuotationItemRequest[] = Object.values(editingItems)
        .filter(item => item.internalProductId || item.inventory?.id)
        .map(item => ({
          skuId: item.internalProductId || item.inventory!.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          comment: item.comment || undefined
        }));
      if (quotationItems.length === 0) {
        toast.error('No valid items found to create quotation');
        return;
      }

      await onSaveQuotation(quotationItems);
      setIsEditMode(false);
      setEditingItems({});
      toast.success('Quotation saved successfully');
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = Object.values(editingItems).reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 0
  );

  const isValidForEdit = isEditable && ['DRAFT', 'SENT', 'NEGOTIATING'].includes(rfqStatus || '');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>SKU Items</CardTitle>
          <div className="flex gap-2">
            {!isEditMode && isValidForEdit && (
              <Button 
                onClick={handleEditStart}
                variant="outline"
                size="sm"
                disabled={items.length === 0}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Items
              </Button>
            )}
            {isEditMode && (
              <>
                <div className="text-sm font-medium px-3 py-2 bg-muted rounded">
                  Total: {formatCurrency(totalAmount)}
                </div>
                <Button 
                  onClick={handleSaveQuotation}
                  size="sm"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Quotation
                </Button>
                <Button 
                  onClick={handleEditCancel}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
        {isEditMode && (
          <div className="text-sm text-muted-foreground">
            Edit quantities, prices, and add comments. Click "Save Quotation" to create a new version with these changes.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>            {items.map((item) => {
              const editingItem = editingItems[item.id];
              const displayItem = isEditMode ? editingItem || item : item;
              
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.customerSku || item.inventory?.sku || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.description || item.inventory?.description || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {isEditMode ? (
                      <Input
                        type="number"
                        value={displayItem.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20"
                        min="1"
                      />
                    ) : (
                      displayItem.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={displayItem.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-28"
                        min="0"
                      />
                    ) : (
                      formatCurrency(displayItem.unitPrice || 0)
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency((displayItem.quantity || 0) * (displayItem.unitPrice || 0))}
                  </TableCell>
                  <TableCell>
                    {isEditMode ? (
                      <Textarea
                        value={displayItem.comment || ''}
                        onChange={(e) => handleItemChange(item.id, 'comment', e.target.value)}
                        placeholder="Add comment..."
                        className="min-h-[60px] w-48"
                        rows={2}
                      />
                    ) : (
                      displayItem.comment || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'APPROVED' ? 'default' : 'destructive'}>
                      {item.status || 'PENDING'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items found for this RFQ
          </div>
        )}
      </CardContent>
    </Card>
  );
}
