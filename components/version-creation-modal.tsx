import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/contexts/currency-context";
import { Trash2, Plus } from "lucide-react";
import type { QuotationEntryType, CreateQuotationItemRequest } from '@/lib/types/quotation';

interface VersionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    entryType: QuotationEntryType;
    notes?: string;
    items: CreateQuotationItemRequest[];
  }) => void;
  currentItems?: any[];
}

export function VersionCreationModal({
  isOpen,
  onClose,
  onSubmit,
  currentItems = [],
}: VersionCreationModalProps) {
  const { formatCurrency } = useCurrency();
  const [entryType, setEntryType] = React.useState<QuotationEntryType>('internal_quote');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<CreateQuotationItemRequest[]>([]);

  // Initialize items from current RFQ items
  React.useEffect(() => {
    if (currentItems.length > 0 && items.length === 0) {
      const initialItems = currentItems.map(item => ({
        skuId: item.internalProductId || item.inventory?.id,
        quantity: item.quantity || 1,
        unitPrice: item.finalPrice || item.suggestedPrice || 0,
        comment: '',
        skuCode: item.customerSku || item.inventory?.sku || '',
        description: item.description || item.inventory?.description || '',
      })).filter(item => item.skuId); // Only include items with valid SKU IDs
      
      setItems(initialItems);
    }
  }, [currentItems, items.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Please add at least one item to the quotation');
      return;
    }

    // Remove display fields before submitting
    const submitItems = items.map(({ skuCode, description, ...item }) => item);

    onSubmit({
      entryType,
      notes: notes.trim() || undefined,
      items: submitItems,
    });
  };
  const updateItem = (index: number, field: keyof CreateQuotationItemRequest, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const addNewItem = () => {
    // Find available items that aren't already added
    const availableItems = currentItems.filter(currentItem => 
      !items.some(item => item.skuId === (currentItem.internalProductId || currentItem.inventory?.id))
    );

    if (availableItems.length > 0) {
      const newItem = availableItems[0];
      const newQuotationItem: CreateQuotationItemRequest = {
        skuId: newItem.internalProductId || newItem.inventory?.id,
        quantity: 1,
        unitPrice: newItem.finalPrice || newItem.suggestedPrice || 0,
        comment: '',
        skuCode: newItem.customerSku || newItem.inventory?.sku || '',
        description: newItem.description || newItem.inventory?.description || '',
      };
      
      if (newQuotationItem.skuId) {
        setItems([...items, newQuotationItem]);
      }
    } else {
      alert('No more items available to add');
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quotation Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryType">Entry Type</Label>
              <Select value={entryType} onValueChange={(value: QuotationEntryType) => setEntryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal_quote">Internal Quote</SelectItem>
                  <SelectItem value="customer_feedback">Customer Feedback</SelectItem>
                  <SelectItem value="counter_offer">Counter Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Items</Label>
              <div className="p-2 bg-muted rounded-md text-center">
                {items.length} items
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="p-2 bg-muted rounded-md text-center font-semibold">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this version"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">SKU Items</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addNewItem}
                disabled={items.length >= currentItems.length}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No items added. Use "Add Item" button to add items to this version.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">#{index + 1}: {item.skuCode}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              min="1"
                              placeholder="Quantity"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              placeholder="Unit Price"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Total</Label>
                            <div className="p-2 bg-muted rounded-md text-center">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Comment</Label>
                            <Input
                              value={item.comment || ''}
                              onChange={(e) => updateItem(index, 'comment', e.target.value)}
                              placeholder="Add comment..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={items.length === 0}>
              Create Version ({items.length} items - {formatCurrency(totalAmount)})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
