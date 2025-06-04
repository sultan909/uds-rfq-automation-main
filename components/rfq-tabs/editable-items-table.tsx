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
  onRefreshNegotiation?: () => Promise<void>;
}

interface CellEditInfo {
  rowIndex: number;
  field: string;
  originalValue: any;
  newValue: any;
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
  
  // Track SKU change operations
  const [pendingSkuChanges, setPendingSkuChanges] = useState<Record<string, boolean>>({});
  const [skuChangeErrors, setSkuChangeErrors] = useState<Record<string, string>>({});

  // PrimeReact specific states
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [pendingCellEdits, setPendingCellEdits] = useState<Record<string, CellEditInfo>>({});
  const [reasonDialogVisible, setReasonDialogVisible] = useState(false);
  const [currentEditInfo, setCurrentEditInfo] = useState<CellEditInfo | null>(null);
  const [editReason, setEditReason] = useState('');

  // Double-click tracking
  const [lastClickTime, setLastClickTime] = useState<Record<string, number>>({});
  const [lastClickedCell, setLastClickedCell] = useState<string | null>(null);

  // Refs for auto-focus
  const editInputRef = useRef<HTMLInputElement>(null);

  // Initialize editing state when items change
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

  // Clear states when negotiation history changes
  useEffect(() => {
    setSkuChangeErrors({});
    setShowNegotiationHistory(prev => ({ ...prev }));
  }, [negotiationHistory]);

  const handleEditStart = () => {
    setIsEditMode(true);
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
    setEditingRows({});
    setPendingCellEdits({});
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
      setChangeReasons({});
      setPendingSkuChanges({});
      setSkuChangeErrors({});
      setEditingRows({});
      setPendingCellEdits({});
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

  // Handle cell edit complete
  const onCellEditComplete = async (e: any) => {
    const { rowData, newValue, field, originalEvent } = e;
    const rowKey = rowData.id.toString();
    
    // Update local state immediately
    setEditingItems(prev => ({
      ...prev,
      [rowData.id]: {
        ...prev[rowData.id],
        [field]: newValue
      }
    }));

    // Exit edit mode for this cell
    setEditingRows(prev => {
      const updated = { ...prev };
      delete updated[rowKey];
      return updated;
    });

    // If in negotiation mode and value changed, prompt for reason
    if (isNegotiationMode && onCreateSkuChange) {
      const currentItem = items.find(item => item.id === rowData.id);
      if (currentItem) {
        const oldValue = field === 'quantity' ? currentItem.quantity : currentItem.unitPrice;
        
        if (oldValue !== newValue) {
          const editInfo: CellEditInfo = {
            rowIndex: rowData.id,
            field,
            originalValue: oldValue,
            newValue
          };
          
          setCurrentEditInfo(editInfo);
          setReasonDialogVisible(true);
        }
      }
    }
  };

  // Handle cell edit cancel
  const onCellEditCancel = (e: any) => {
    const { rowData } = e;
    const rowKey = rowData.id.toString();
    
    setEditingRows(prev => {
      const updated = { ...prev };
      delete updated[rowKey];
      return updated;
    });
  };

  // Handle reason submission
  const handleReasonSubmit = async () => {
    if (!currentEditInfo || !editReason.trim() || !onCreateSkuChange) {
      toast.error('Please provide a reason for the change');
      return;
    }

    const { rowIndex: itemId, field, originalValue, newValue } = currentEditInfo;
    const changeKey = `${itemId}_${field}`;

    try {
      setPendingSkuChanges(prev => ({ ...prev, [changeKey]: true }));
      setSkuChangeErrors(prev => ({ ...prev, [changeKey]: '' }));

      const editingItem = editingItems[itemId];
      
      await onCreateSkuChange(itemId, {
        oldQuantity: field === 'quantity' ? originalValue : editingItem.quantity,
        newQuantity: field === 'quantity' ? newValue : editingItem.quantity,
        oldUnitPrice: field === 'unitPrice' ? originalValue : editingItem.unitPrice,
        newUnitPrice: field === 'unitPrice' ? newValue : editingItem.unitPrice,
        changeReason: editReason,
      });

      if (onRefreshNegotiation) {
        await onRefreshNegotiation();
      }

      toast.success('Change recorded successfully');
      setReasonDialogVisible(false);
      setEditReason('');
      setCurrentEditInfo(null);
    } catch (error) {
      console.error('Error recording change:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record change';
      setSkuChangeErrors(prev => ({ ...prev, [changeKey]: errorMessage }));
      toast.error(errorMessage);
      
      // Revert the change
      setEditingItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: originalValue
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
        ref={editInputRef}
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        onBlur={() => {
          // Handle blur - this will trigger onCellEditComplete
        }}
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
        ref={editInputRef}
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        onBlur={() => {
          // Handle blur - this will trigger onCellEditComplete
        }}
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
    
    return (
      <div className="space-y-1">
        <div 
          className={`cursor-pointer p-2 rounded ${hasQuantityChange ? 'font-semibold text-blue-600' : ''}`}
          onClick={(e) => handleCellClick(rowData, 'quantity', e)}
          title="Double-click to edit"
        >
          <div className="flex items-center gap-2">
            <span>{rowData.quantity}</span>
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
    
    return (
      <div className="space-y-1">
        <div 
          className={`cursor-pointer p-2 rounded ${hasPriceChange ? 'font-semibold text-green-600' : ''}`}
          onClick={(e) => handleCellClick(rowData, 'unitPrice', e)}
          title="Double-click to edit"
        >
          <div className="flex items-center gap-2">
            <span>{formatCurrency(rowData.unitPrice || 0)}</span>
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
    return formatCurrency((rowData.quantity || 0) * (rowData.unitPrice || 0));
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

  // Calculate total amount
  const totalAmount = Object.values(editingItems).reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 0
  );

  const isValidForEdit = isEditable && ['DRAFT', 'SENT', 'NEGOTIATING'].includes(rfqStatus || '');

  // Prepare data for DataTable
  const tableData = isEditMode ? Object.values(editingItems) : items;

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
            Negotiation Mode: Double-click on quantity or price cells to edit. Changes will be tracked and recorded in the negotiation history.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <DataTable 
          value={tableData}
          editMode="cell"
          onCellEditComplete={onCellEditComplete}
          onCellEditCancel={onCellEditCancel}
          editingRows={editingRows}
          onRowEditChange={setEditingRows}
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
                      {change.changeReason && (
                        <div className="text-gray-600 italic">Reason: {change.changeReason}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Reason Dialog */}
      <Dialog open={reasonDialogVisible} onOpenChange={setReasonDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Reason Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Please provide a reason for this change:</Label>
              {currentEditInfo && (
                <div className="text-sm text-muted-foreground mt-1">
                  {currentEditInfo.field === 'quantity' ? 'Quantity' : 'Price'} change: {currentEditInfo.originalValue} → {currentEditInfo.newValue}
                </div>
              )}
            </div>
            <Textarea
              placeholder="Enter reason for change..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setReasonDialogVisible(false);
                setEditReason('');
                setCurrentEditInfo(null);
                // Revert the change
                if (currentEditInfo) {
                  setEditingItems(prev => ({
                    ...prev,
                    [currentEditInfo.rowIndex]: {
                      ...prev[currentEditInfo.rowIndex],
                      [currentEditInfo.field]: currentEditInfo.originalValue
                    }
                  }));
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReasonSubmit}
              disabled={!editReason.trim()}
            >
              Record Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}