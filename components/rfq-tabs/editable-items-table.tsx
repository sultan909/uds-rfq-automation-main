import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Save, Edit3, X, Check, History, ChevronDown, ChevronUp, Percent, Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { toast } from 'sonner';
import type { CreateQuotationItemRequest, SkuNegotiationHistory } from '@/lib/types/quotation';

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
  negotiationHistory?: SkuNegotiationHistory[];
  onCreateSkuChange?: (itemId: number, changes: {
    oldQuantity: number;
    newQuantity: number;
    oldUnitPrice: number;
    newUnitPrice: number;
    changeReason: string;
  }) => Promise<void>;
  onRefreshNegotiation?: () => Promise<void>; // NEW: callback to refresh negotiation data
}

export function EditableItemsTable({ 
  items, 
  onSaveQuotation, 
  isEditable,
  rfqStatus,
  negotiationHistory = [],
  onCreateSkuChange,
  onRefreshNegotiation
}: EditableItemsTableProps) {
  const { formatCurrency } = useCurrency();
  const [editingItems, setEditingItems] = useState<Record<number, EditableItem>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNegotiationHistory, setShowNegotiationHistory] = useState<Record<number, boolean>>({});
  const [changeReasons, setChangeReasons] = useState<Record<string, string>>({});
  const [isNegotiationMode, setIsNegotiationMode] = useState(false);
  
  // NEW: Track SKU change operations
  const [pendingSkuChanges, setPendingSkuChanges] = useState<Record<string, boolean>>({});
  const [skuChangeErrors, setSkuChangeErrors] = useState<Record<string, string>>({});

  // NEW: useEffect to refresh local state when negotiationHistory changes
  useEffect(() => {
    // Clear any stale error states when history updates
    setSkuChangeErrors({});
    // Force re-render of history displays
    setShowNegotiationHistory(prev => ({ ...prev }));
  }, [negotiationHistory]);

  // NEW: useEffect to initialize editing state when items change
  useEffect(() => {
    if (isEditMode && items.length > 0) {
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
    }
  }, [items, isEditMode]);

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
    setChangeReasons({});
    setPendingSkuChanges({});
    setSkuChangeErrors({});
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
      setChangeReasons({});
      setPendingSkuChanges({});
      setSkuChangeErrors({});
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

  // Helper functions for negotiation features
  const getItemNegotiationHistory = (itemId: number) => {
    return negotiationHistory.filter(h => 
      h.skuId === (items.find(item => item.id === itemId)?.internalProductId || 
                   items.find(item => item.id === itemId)?.inventory?.id)
    );
  };

  const hasNegotiationHistory = (itemId: number) => {
    return getItemNegotiationHistory(itemId).length > 0;
  };

  // IMPROVED: Better async handling for SKU changes
  const handleItemChangeWithReason = useCallback(async (
    itemId: number, 
    field: keyof EditableItem, 
    value: any, 
    reason?: string
  ) => {
    const currentItem = items.find(item => item.id === itemId);
    const editingItem = editingItems[itemId];
    
    if (!currentItem || !editingItem || !isNegotiationMode || !reason || !onCreateSkuChange) {
      // Just update local state if not in negotiation mode or no reason provided
      handleItemChange(itemId, field, value);
      return;
    }

    const changeKey = `${itemId}_${field}`;
    
    try {
      // Set loading state
      setPendingSkuChanges(prev => ({ ...prev, [changeKey]: true }));
      setSkuChangeErrors(prev => ({ ...prev, [changeKey]: '' }));

      // Update local state first for immediate UI feedback
      handleItemChange(itemId, field, value);

      const oldValue = field === 'quantity' ? currentItem.quantity : currentItem.unitPrice;
      const newValue = value;
      
      if (oldValue !== newValue) {
        await onCreateSkuChange(itemId, {
          oldQuantity: field === 'quantity' ? oldValue : editingItem.quantity,
          newQuantity: field === 'quantity' ? newValue : editingItem.quantity,
          oldUnitPrice: field === 'unitPrice' ? oldValue : editingItem.unitPrice,
          newUnitPrice: field === 'unitPrice' ? newValue : editingItem.unitPrice,
          changeReason: reason,
        });

        // Clear the reason after successful change
        setChangeReasons(prev => ({ ...prev, changeKey: '' }));
        
        // Refresh negotiation data if callback provided
        if (onRefreshNegotiation) {
          await onRefreshNegotiation();
        }

        toast.success('Change recorded successfully');
      }
    } catch (error) {
      console.error('Error recording change:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record change';
      setSkuChangeErrors(prev => ({ ...prev, [changeKey]: errorMessage }));
      toast.error(errorMessage);
      
      // Revert local state change on error
      handleItemChange(itemId, field, field === 'quantity' ? currentItem.quantity : currentItem.unitPrice);
    } finally {
      setPendingSkuChanges(prev => ({ ...prev, [changeKey]: false }));
    }
  }, [items, editingItems, isNegotiationMode, onCreateSkuChange, onRefreshNegotiation]);

  const isValidForEdit = isEditable && ['DRAFT', 'SENT', 'NEGOTIATING'].includes(rfqStatus || '');

  // Add bulk change functionality
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkChangePercentage, setBulkChangePercentage] = useState('');
  const [bulkChangeReason, setBulkChangeReason] = useState('');
  const [showBulkChangeModal, setShowBulkChangeModal] = useState(false);
  const [isBulkChanging, setIsBulkChanging] = useState(false);

  const handleSelectItem = (itemId: number, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedItems(selected ? items.map(item => item.id) : []);
  };

  // IMPROVED: Better bulk change handling
  const applyBulkPriceChange = async (percentage: number, reason: string) => {
    if (!onCreateSkuChange || selectedItems.length === 0) return;

    try {
      setIsBulkChanging(true);
      let successCount = 0;
      let errorCount = 0;

      for (const itemId of selectedItems) {
        const item = items.find(i => i.id === itemId);
        if (!item) continue;

        try {
          const oldPrice = item.unitPrice || 0;
          const newPrice = oldPrice * (1 + percentage / 100);

          await onCreateSkuChange(itemId, {
            oldQuantity: item.quantity,
            newQuantity: item.quantity,
            oldUnitPrice: oldPrice,
            newUnitPrice: newPrice,
            changeReason: reason,
          });

          // Update editing state
          handleItemChange(itemId, 'unitPrice', newPrice);
          successCount++;
        } catch (error) {
          console.error(`Error applying bulk change to item ${itemId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        // Refresh negotiation data
        if (onRefreshNegotiation) {
          await onRefreshNegotiation();
        }
        toast.success(`Bulk price change applied to ${successCount} items`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to apply changes to ${errorCount} items`);
      }
      
      setSelectedItems([]);
      setShowBulkChangeModal(false);
      setBulkChangePercentage('');
      setBulkChangeReason('');
    } catch (error) {
      console.error('Error applying bulk change:', error);
      toast.error('Failed to apply bulk changes');
    } finally {
      setIsBulkChanging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>SKU Items</CardTitle>
          <div className="flex gap-2">
            {!isEditMode && isValidForEdit && (
              <>
                <Button 
                  onClick={() => setIsNegotiationMode(!isNegotiationMode)}
                  variant={isNegotiationMode ? "default" : "outline"}
                  size="sm"
                >
                  {isNegotiationMode ? 'Exit Negotiation' : 'Negotiation Mode'}
                </Button>
                <Button 
                  onClick={handleEditStart}
                  variant="outline"
                  size="sm"
                  disabled={items.length === 0}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Items
                </Button>
              </>
            )}
            {isEditMode && (
              <>
                <div className="text-sm font-medium px-3 py-2 bg-muted rounded">
                  Total: {formatCurrency(totalAmount)}
                </div>
                {selectedItems.length > 0 && (
                  <Button 
                    onClick={() => setShowBulkChangeModal(true)}
                    variant="outline"
                    size="sm"
                    disabled={isBulkChanging}
                  >
                    {isBulkChanging ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Percent className="h-4 w-4 mr-2" />
                    )}
                    Bulk Change ({selectedItems.length})
                  </Button>
                )}
                <Button 
                  onClick={handleSaveQuotation}
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
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
        {isNegotiationMode && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            Negotiation Mode: Changes will be tracked and recorded in the negotiation history.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {isEditMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === items.length && items.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>SKU</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const editingItem = editingItems[item.id];
              const displayItem = isEditMode ? editingItem || item : item;
              const history = getItemNegotiationHistory(item.id);
              const hasHistory = hasNegotiationHistory(item.id);
              
              return (
                <React.Fragment key={item.id}>
                  <TableRow className={hasHistory ? 'bg-yellow-50' : ''}>
                    {isEditMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.customerSku || item.inventory?.sku || 'N/A'}
                        {hasHistory && (
                          <Badge variant="secondary" className="text-xs">
                            {history.length} changes
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.description || item.inventory?.description || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {isEditMode || isNegotiationMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={displayItem.quantity}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 0;
                                if (isNegotiationMode) {
                                  setChangeReasons(prev => ({ ...prev, [`${item.id}_quantity`]: '' }));
                                }
                                handleItemChange(item.id, 'quantity', newValue);
                              }}
                              className="w-20"
                              min="1"
                            />
                            {pendingSkuChanges[`${item.id}_quantity`] && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                          </div>
                          {isNegotiationMode && editingItem?.quantity !== item.quantity && (
                            <div className="space-y-1">
                              <Input
                                placeholder="Reason for quantity change..."
                                value={changeReasons[`${item.id}_quantity`] || ''}
                                onChange={(e) => setChangeReasons(prev => ({ 
                                  ...prev, 
                                  [`${item.id}_quantity`]: e.target.value 
                                }))}
                                className="w-full text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const reason = changeReasons[`${item.id}_quantity`];
                                    if (reason && reason.trim()) {
                                      handleItemChangeWithReason(item.id, 'quantity', editingItem?.quantity, reason);
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const reason = changeReasons[`${item.id}_quantity`];
                                  if (reason && reason.trim()) {
                                    handleItemChangeWithReason(item.id, 'quantity', editingItem?.quantity, reason);
                                  }
                                }}
                              />
                              {skuChangeErrors[`${item.id}_quantity`] && (
                                <div className="text-xs text-red-500">
                                  {skuChangeErrors[`${item.id}_quantity`]}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={history.some(h => h.changeType.includes('QUANTITY')) ? 'font-semibold text-blue-600' : ''}>
                          {displayItem.quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditMode || isNegotiationMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={displayItem.unitPrice}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                if (isNegotiationMode) {
                                  setChangeReasons(prev => ({ ...prev, [`${item.id}_price`]: '' }));
                                }
                                handleItemChange(item.id, 'unitPrice', newValue);
                              }}
                              className="w-28"
                              min="0"
                            />
                            {pendingSkuChanges[`${item.id}_price`] && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                          </div>
                          {isNegotiationMode && editingItem?.unitPrice !== item.unitPrice && (
                            <div className="space-y-1">
                              <Input
                                placeholder="Reason for price change..."
                                value={changeReasons[`${item.id}_price`] || ''}
                                onChange={(e) => setChangeReasons(prev => ({ 
                                  ...prev, 
                                  [`${item.id}_price`]: e.target.value 
                                }))}
                                className="w-full text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const reason = changeReasons[`${item.id}_price`];
                                    if (reason && reason.trim()) {
                                      handleItemChangeWithReason(item.id, 'unitPrice', editingItem?.unitPrice, reason);
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const reason = changeReasons[`${item.id}_price`];
                                  if (reason && reason.trim()) {
                                    handleItemChangeWithReason(item.id, 'unitPrice', editingItem?.unitPrice, reason);
                                  }
                                }}
                              />
                              {skuChangeErrors[`${item.id}_price`] && (
                                <div className="text-xs text-red-500">
                                  {skuChangeErrors[`${item.id}_price`]}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={history.some(h => h.changeType.includes('PRICE')) ? 'font-semibold text-green-600' : ''}>
                          {formatCurrency(displayItem.unitPrice || 0)}
                        </span>
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
                    <TableCell>
                      {hasHistory && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNegotiationHistory(prev => ({ 
                            ...prev, 
                            [item.id]: !prev[item.id] 
                          }))}
                        >
                          <History className="h-4 w-4" />
                          {showNegotiationHistory[item.id] ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Expandable history row */}
                  {showNegotiationHistory[item.id] && hasHistory && (
                    <TableRow>
                      <TableCell colSpan={isEditMode ? 9 : 8} className="bg-gray-50 p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Negotiation History</h4>
                          <div className="space-y-1">
                            {history
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((change, idx) => (
                                <div key={idx} className="text-xs p-2 bg-white rounded border">
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {new Date(change.createdAt).toLocaleDateString()} - {change.changeType}
                                    </span>
                                    <span className="text-gray-500">{change.changedBy}</span>
                                  </div>
                                  {change.oldQuantity !== change.newQuantity && (
                                    <div>Qty: {change.oldQuantity} → {change.newQuantity}</div>
                                  )}
                                  {change.oldUnitPrice !== change.newUnitPrice && (
                                    <div>Price: {formatCurrency(change.oldUnitPrice || 0)} → {formatCurrency(change.newUnitPrice || 0)}</div>
                                  )}
                                  {change.changeReason && (
                                    <div className="text-gray-600 italic">Reason: {change.changeReason}</div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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

      {/* Bulk Change Modal */}
      <Dialog open={showBulkChangeModal} onOpenChange={setShowBulkChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selected Items: {selectedItems.length}</Label>
              <div className="text-sm text-muted-foreground">
                {selectedItems.map(id => {
                  const item = items.find(i => i.id === id);
                  return item?.customerSku || item?.inventory?.sku || 'Unknown';
                }).join(', ')}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceChange">Price Change (%)</Label>
              <Input
                id="priceChange"
                type="number"
                step="0.1"
                placeholder="e.g., -10 for 10% decrease, 5 for 5% increase"
                value={bulkChangePercentage}
                onChange={(e) => setBulkChangePercentage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changeReason">Reason for Change</Label>
              <Textarea
                id="changeReason"
                placeholder="Enter reason for bulk price change..."
                value={bulkChangeReason}
                onChange={(e) => setBulkChangeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkChangeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const percentage = parseFloat(bulkChangePercentage);
                if (isNaN(percentage)) {
                  toast.error('Please enter a valid percentage');
                  return;
                }
                if (!bulkChangeReason.trim()) {
                  toast.error('Please enter a reason for the change');
                  return;
                }
                applyBulkPriceChange(percentage, bulkChangeReason);
              }}
              disabled={isBulkChanging}
            >
              {isBulkChanging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                'Apply Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}