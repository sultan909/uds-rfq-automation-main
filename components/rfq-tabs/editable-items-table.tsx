import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Save, Edit3, X, Check, History, ChevronDown, ChevronUp, Percent, Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { toast } from 'sonner';
import type { CreateQuotationItemRequest, SkuNegotiationHistory } from '@/lib/types/quotation';

// PrimeReact imports
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface EditableItem {
  id: number;
  internalProductId?: number;
  customerSku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
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
  }) => Promise<void>;
  onRefreshNegotiation?: () => Promise<void>;
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
  const { formatCurrency, convertCurrency, currency } = useCurrency();
  const [editingItems, setEditingItems] = useState<Record<number, EditableItem>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNegotiationHistory, setShowNegotiationHistory] = useState<Record<number, boolean>>({});
  const [isNegotiationMode, setIsNegotiationMode] = useState(false);
  
  // Track SKU change operations
  const [pendingSkuChanges, setPendingSkuChanges] = useState<Record<string, boolean>>({});
  const [skuChangeErrors, setSkuChangeErrors] = useState<Record<string, string>>({});

  // PrimeReact specific states
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});

  // Double-click tracking
  const [lastClickTime, setLastClickTime] = useState<Record<string, number>>({});
  const [lastClickedCell, setLastClickedCell] = useState<string | null>(null);

  // Refs for auto-focus
  const editInputRef = useRef<HTMLInputElement>(null);

  // Initialize editing state when items change or when entering negotiation mode
  useEffect(() => {
    if ((isEditMode || isNegotiationMode) && items.length > 0) {
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
  }, [items, isEditMode, isNegotiationMode]);

  // Clear states when negotiation history changes
  useEffect(() => {
    setSkuChangeErrors({});
    setShowNegotiationHistory(prev => ({ ...prev }));
  }, [negotiationHistory]);

  const handleEditStart = () => {
    setIsEditMode(true);
    // EditingItems will be initialized by the useEffect above
  };

  const handleEditCancel = () => {
    setIsEditMode(false);
    setEditingItems({});
    setPendingSkuChanges({});
    setSkuChangeErrors({});
    setEditingRows({});
  };

  // Toggle negotiation mode and ensure editing state is ready
  const handleToggleNegotiationMode = () => {
    const newNegotiationMode = !isNegotiationMode;
    setIsNegotiationMode(newNegotiationMode);
    
    if (newNegotiationMode && items.length > 0) {
      // Initialize editing state for negotiation mode
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
  };

  const handleSaveQuotation = async () => {
    try {
      setIsSaving(true);

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
      setPendingSkuChanges({});
      setSkuChangeErrors({});
      setEditingRows({});
      toast.success('Quotation saved successfully');
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };

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

  // Handle double-click detection for cell editing
  const handleCellClick = (rowData: EditableItem, field: string, event: React.MouseEvent) => {
    const cellKey = `${rowData.id}-${field}`;
    const currentTime = Date.now();
    const lastTime = lastClickTime[cellKey] || 0;
    
    if (currentTime - lastTime < 500 && lastClickedCell === cellKey) {
      // Double-click detected
      handleCellDoubleClick(rowData, field);
    } else {
      // Single click
      setLastClickTime(prev => ({ ...prev, [cellKey]: currentTime }));
      setLastClickedCell(cellKey);
    }
  };

  const handleCellDoubleClick = (rowData: EditableItem, field: string) => {
    if (!isNegotiationMode && !isEditMode) return;
    if (field !== 'quantity' && field !== 'unitPrice') return;

    const rowKey = rowData.id.toString();
    setEditingRows(prev => ({ ...prev, [rowKey]: true }));
    
    // Auto-focus on the input after a brief delay
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 100);
  };

  // Handle cell edit complete - now automatically saves negotiation changes
  const onRowEditComplete = async (e: any) => {
    const { rowData, newValue, field, originalEvent } = e;
    const rowKey = rowData.id.toString();
    
    // Get the current item from original items array to compare old values
    const originalItem = items.find(item => item.id === rowData.id);
    const oldValue = originalItem ? (field === 'quantity' ? originalItem.quantity : originalItem.unitPrice) : 0;
    
    // Update local editing state immediately
    setEditingItems(prev => ({
      ...prev,
      [rowData.id]: {
        ...prev[rowData.id],
        ...rowData, // Include all current row data
        [field]: newValue
      }
    }));

    // Exit edit mode for this cell
    setEditingRows(prev => {
      const updated = { ...prev };
      delete updated[rowKey];
      return updated;
    });

    // If in negotiation mode and value changed, automatically save the change
    if (isNegotiationMode && onCreateSkuChange && originalItem && oldValue !== newValue) {
      console.log('Saving SKU change:', { itemId: rowData.id, field, oldValue, newValue });
      await handleSkuChangeAutoSave(rowData.id, field, oldValue, newValue);
    }
  };

  // Automatically save SKU changes without requiring reason
  const handleSkuChangeAutoSave = async (itemId: number, field: string, oldValue: number, newValue: number) => {
    if (!onCreateSkuChange) {
      console.warn('onCreateSkuChange handler not provided');
      return;
    }

    const changeKey = `${itemId}_${field}`;

    try {
      setPendingSkuChanges(prev => ({ ...prev, [changeKey]: true }));
      setSkuChangeErrors(prev => ({ ...prev, [changeKey]: '' }));

      // Get current editing item state or fallback to original item
      const editingItem = editingItems[itemId] || items.find(item => item.id === itemId);
      
      if (!editingItem) {
        throw new Error('Item not found for SKU change');
      }

      const changeData = {
        oldQuantity: field === 'quantity' ? oldValue : editingItem.quantity,
        newQuantity: field === 'quantity' ? newValue : editingItem.quantity,
        oldUnitPrice: field === 'unitPrice' ? oldValue : editingItem.unitPrice,
        newUnitPrice: field === 'unitPrice' ? newValue : editingItem.unitPrice,
      };

      console.log('Creating SKU change with data:', changeData);
      
      await onCreateSkuChange(itemId, changeData);

      if (onRefreshNegotiation) {
        await onRefreshNegotiation();
      }

      toast.success('Change recorded successfully');
    } catch (error) {
      console.error('Error recording change:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record change';
      setSkuChangeErrors(prev => ({ ...prev, [changeKey]: errorMessage }));
      toast.error(errorMessage);
      
      // Revert the change on error
      setEditingItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: oldValue
        }
      }));
    } finally {
      setPendingSkuChanges(prev => ({ ...prev, [changeKey]: false }));
    }
  };

  // Custom cell editors for double-click editing
  const quantityEditor = (options: any) => {
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        className="w-full"
        min={1}
        showButtons={false}
        autoFocus
      />
    );
  };

  const priceEditor = (options: any) => {
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        className="w-full"
        mode="currency"
        currency="USD"
        locale="en-US"
        minFractionDigits={2}
        autoFocus
      />
    );
  };

  const commentEditor = (options: any) => {
    return (
      <InputTextarea
        value={options.value || ''}
        onChange={(e) => options.editorCallback(e.target.value)}
        placeholder="Add comment..."
        rows={2}
        className="w-full"
        autoFocus
      />
    );
  };

  // Custom body templates
  const skuBodyTemplate = (rowData: EditableItem) => {
    const history = getItemNegotiationHistory(rowData.id);
    const hasHistory = hasNegotiationHistory(rowData.id);
    
    return (
      <div className="flex items-center gap-2">
        {rowData.customerSku || rowData.inventory?.sku || 'N/A'}
        {hasHistory && (
          <Badge variant="secondary" className="text-xs">
            {history.length} changes
          </Badge>
        )}
      </div>
    );
  };

  const quantityBodyTemplate = (rowData: EditableItem) => {
    const history = getItemNegotiationHistory(rowData.id);
    const hasQuantityChange = history.some(h => h.changeType.includes('QUANTITY'));
    const changeKey = `${rowData.id}_quantity`;
    const isLoading = pendingSkuChanges[changeKey];
    const error = skuChangeErrors[changeKey];
    
    // Use editing state if available, otherwise use original data
    const currentQuantity = (isEditMode || isNegotiationMode) && editingItems[rowData.id] 
      ? editingItems[rowData.id].quantity 
      : rowData.quantity;
    
    return (
      <div className="space-y-1">
        <div 
          className={`cursor-pointer p-2 rounded hover:bg-gray-100 ${hasQuantityChange ? 'font-semibold text-blue-600' : ''}`}
          onClick={(e) => handleCellClick(rowData, 'quantity', e)}
          title="Double-click to edit"
        >
          <div className="flex items-center gap-2">
            <span>{currentQuantity}</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
        </div>
        {error && (
          <div className="text-xs text-red-500">{error}</div>
        )}
      </div>
    );
  };

  const priceBodyTemplate = (rowData: EditableItem) => {
    const history = getItemNegotiationHistory(rowData.id);
    const hasPriceChange = history.some(h => h.changeType.includes('PRICE'));
    const changeKey = `${rowData.id}_price`;
    const isLoading = pendingSkuChanges[changeKey];
    const error = skuChangeErrors[changeKey];
    
    // Use editing state if available, otherwise use original data
    const currentPrice = (isEditMode || isNegotiationMode) && editingItems[rowData.id] 
      ? editingItems[rowData.id].unitPrice 
      : rowData.unitPrice;
    
    // Convert currency if the item has a different currency than display currency
    const itemCurrency = rowData.currency || 'CAD'; // Fallback to CAD if currency not specified
    const convertedPrice = convertCurrency(currentPrice || 0, itemCurrency as "CAD" | "USD");
    
    return (
      <div className="space-y-1">
        <div 
          className={`cursor-pointer p-2 rounded hover:bg-gray-100 ${hasPriceChange ? 'font-semibold text-green-600' : ''}`}
          onClick={(e) => handleCellClick(rowData, 'unitPrice', e)}
          title="Double-click to edit"
        >
          <div className="flex items-center gap-2">
            <span>{formatCurrency(convertedPrice)}</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
        </div>
        {error && (
          <div className="text-xs text-red-500">{error}</div>
        )}
      </div>
    );
  };

  const totalBodyTemplate = (rowData: EditableItem) => {
    const itemCurrency = rowData.currency || 'CAD'; // Fallback to CAD if currency not specified
    const convertedPrice = convertCurrency(rowData.unitPrice || 0, itemCurrency as "CAD" | "USD");
    return formatCurrency((rowData.quantity || 0) * convertedPrice);
  };

  const statusBodyTemplate = (rowData: EditableItem) => {
    return (
      <Badge variant={rowData.status === 'APPROVED' ? 'default' : 'destructive'}>
        {rowData.status || 'PENDING'}
      </Badge>
    );
  };

  const historyBodyTemplate = (rowData: EditableItem) => {
    const hasHistory = hasNegotiationHistory(rowData.id);
    
    if (!hasHistory) return null;
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNegotiationHistory(prev => ({ 
          ...prev, 
          [rowData.id]: !prev[rowData.id] 
        }))}
      >
        <History className="h-4 w-4" />
        {showNegotiationHistory[rowData.id] ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
      </Button>
    );
  };

  // Calculate total amount using current editing state when available
  const totalAmount = (isEditMode || isNegotiationMode) && Object.keys(editingItems).length > 0
    ? Object.values(editingItems).reduce((sum, item) => {
        const itemCurrency = item.currency || 'CAD'; // Fallback to CAD if currency not specified
        const convertedPrice = convertCurrency(item.unitPrice, itemCurrency as "CAD" | "USD");
        return sum + (item.quantity * convertedPrice);
      }, 0)
    : items.reduce((sum, item) => {
        const itemCurrency = item.currency || 'CAD'; // Fallback to CAD if currency not specified
        const convertedPrice = convertCurrency(item.unitPrice || 0, itemCurrency as "CAD" | "USD");
        return sum + (item.quantity * convertedPrice);
      }, 0);

  const isValidForEdit = isEditable && ['DRAFT', 'SENT', 'NEGOTIATING'].includes(rfqStatus || '');

  // Use consistent data source - always use items as base, but show edited values in display
  const tableData = items;

  // Handle cell edit cancel
  const onRowEditCancel = (e: any) => {
    const { rowData } = e;
    const rowKey = rowData.id.toString();
    
    setEditingRows(prev => {
      const updated = { ...prev };
      delete updated[rowKey];
      return updated;
    });
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
                  onClick={handleToggleNegotiationMode}
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
            Negotiation Mode: Double-click on quantity or price cells to edit. Changes will be automatically saved.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <DataTable 
          key={currency} // Force re-render when currency changes
          value={tableData}
          editMode="cell"
          onRowEditComplete={onRowEditComplete}
          onRowEditCancel={onRowEditCancel}
          editingRows={editingRows}
          onRowEditChange={(event) => setEditingRows(event.data)}
          tableStyle={{ minWidth: '50rem' }}
          scrollable
          scrollHeight="600px"
          emptyMessage="No items found for this RFQ"
        >
          <Column 
            field="customerSku" 
            header="SKU" 
            body={skuBodyTemplate}
            style={{ width: '15%' }}
          />
          <Column 
            field="description" 
            header="Description"
            body={(rowData) => rowData.description || rowData.inventory?.description || 'N/A'}
            style={{ width: '25%' }}
          />
          <Column 
            field="quantity" 
            header="Quantity"
            body={quantityBodyTemplate}
            editor={quantityEditor}
            style={{ width: '10%' }}
          />
          <Column 
            field="unitPrice" 
            header="Unit Price"
            body={priceBodyTemplate}
            editor={priceEditor}
            style={{ width: '15%' }}
          />
          <Column 
            header="Total"
            body={totalBodyTemplate}
            style={{ width: '15%' }}
          />
          <Column 
            field="comment" 
            header="Comment"
            body={(rowData) => rowData.comment || '-'}
            editor={commentEditor}
            style={{ width: '15%' }}
          />
          <Column 
            field="status" 
            header="Status"
            body={statusBodyTemplate}
            style={{ width: '10%' }}
          />
          <Column 
            header="History"
            body={historyBodyTemplate}
            style={{ width: '10%' }}
          />
        </DataTable>

        {/* Expandable negotiation history */}
        {Object.entries(showNegotiationHistory).map(([itemId, isVisible]) => {
          if (!isVisible) return null;
          
          const history = getItemNegotiationHistory(Number(itemId));
          
          return (
            <div key={itemId} className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm mb-2">Negotiation History</h4>
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
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}