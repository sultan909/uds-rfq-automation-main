import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/currency-context';

// PrimeReact imports
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface OriginalRequestItem {
  id: number;
  internalProductId?: number;
  customerSku?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  estimatedPrice?: number;
  originalQuantity?: number;
  originalPrice?: number;
  requestedQuantity?: number;
  requestedPrice?: number;
  comment?: string;
  status?: string;
  inventory?: {
    id: number;
    sku: string;
    description: string;
  };
}

interface OriginalRequestTabProps {
  items: OriginalRequestItem[];
  formatCurrency: (amount: number) => string;
  convertCurrency: (amount: number, sourceCurrency?: "CAD" | "USD") => number;
}

export function OriginalRequestTab({ 
  items, 
  formatCurrency,
  convertCurrency
}: OriginalRequestTabProps) {
  // Use the currency context directly to ensure reactivity to currency changes
  const { currency } = useCurrency();
  // Custom body templates for original request display
  const skuBodyTemplate = (rowData: OriginalRequestItem) => {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {rowData.customerSku || rowData.inventory?.sku || 'N/A'}
        </span>
      </div>
    );
  };

  const descriptionBodyTemplate = (rowData: OriginalRequestItem) => {
    return (
      <div className="max-w-xs">
        <span className="text-sm">
          {rowData.description || rowData.inventory?.description || 'N/A'}
        </span>
      </div>
    );
  };

  const quantityBodyTemplate = (rowData: OriginalRequestItem) => {
    // Show the original requested quantity
    const originalQty = rowData.originalQuantity || rowData.requestedQuantity || rowData.quantity;
    
    return (
      <div className="flex items-center justify-center">
        {/* <Badge variant="outline" className=""> */}
        <span className="font-mono text-sm">
          {originalQty}
        </span>
        {/* </Badge> */}
      </div>
    );
  };

  const priceBodyTemplate = (rowData: OriginalRequestItem) => {
    // Show the original requested price or estimated price
    const originalPrice = rowData.originalPrice || rowData.requestedPrice || rowData.estimatedPrice || rowData.unitPrice || 0;
    // Use the currency from the item data, fallback to CAD if not available
    const itemCurrency = (rowData as any).currency || 'CAD';
    const convertedPrice = convertCurrency(originalPrice, itemCurrency as "CAD" | "USD");
    

    
    return (
      <div className="flex items-center justify-end">
        <span className="font-mono text-sm">
          {formatCurrency(convertedPrice)}
        </span>
      </div>
    );
  };

  const totalBodyTemplate = (rowData: OriginalRequestItem) => {
    const originalQty = rowData.originalQuantity || rowData.requestedQuantity || rowData.quantity;
    const originalPrice = rowData.originalPrice || rowData.requestedPrice || rowData.estimatedPrice || rowData.unitPrice || 0;
    // Use the currency from the item data, fallback to CAD if not available
    const itemCurrency = (rowData as any).currency || 'CAD';
    const convertedPrice = convertCurrency(originalPrice, itemCurrency as "CAD" | "USD");
    const total = originalQty * convertedPrice;
    
    return (
      <div className="flex items-center justify-end">
        <span className="text-sm font-semibold">
          {formatCurrency(total)}
        </span>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: OriginalRequestItem) => {
    return (
      <Badge variant="secondary">
        ORIGINAL
      </Badge>
    );
  };

  const commentBodyTemplate = (rowData: OriginalRequestItem) => {
    return (
      <div className="max-w-xs">
        <span className="text-sm text-muted-foreground">
          {rowData.comment || '-'}
        </span>
      </div>
    );
  };

  // Calculate totals for the original request
  const totalQuantity = items.reduce((sum, item) => {
    const qty = item.originalQuantity || item.requestedQuantity || item.quantity;
    return sum + qty;
  }, 0);

  const totalAmount = items.reduce((sum, item) => {
    const qty = item.originalQuantity || item.requestedQuantity || item.quantity;
    const price = item.originalPrice || item.requestedPrice || item.estimatedPrice || item.unitPrice || 0;
    // Use the currency from the item data, fallback to CAD if not available
    const itemCurrency = (item as any).currency || 'CAD';
    const convertedPrice = convertCurrency(price, itemCurrency as "CAD" | "USD");
    return sum + (qty * convertedPrice);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Original Request</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="text-muted-foreground">
              Total Items: <span className="font-semibold">{items.length}</span>
            </div>
            <div className="text-muted-foreground">
              Total Quantity: <span className="font-semibold">{totalQuantity}</span>
            </div>
            <div className="text-muted-foreground">
              Total Value: <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          This shows the original items and quantities as requested by the customer before any negotiations or modifications.
        </div>
      </CardHeader>
      <CardContent>
        <DataTable 
          key={currency} // Force re-render when currency changes
          value={items}
          tableStyle={{ minWidth: '50rem' }}
          scrollable
          scrollHeight="600px"
          emptyMessage="No original request items found"
          stripedRows
        >
          <Column 
            field="customerSku" 
            header="Original SKU" 
            body={skuBodyTemplate}
            style={{ width: '15%' }}
            sortable
          />
          <Column 
            field="description" 
            header="Description"
            body={descriptionBodyTemplate}
            style={{ width: '30%' }}
            sortable
          />
          <Column 
            field="quantity" 
            header="Requested Quantity"
            body={quantityBodyTemplate}
            style={{ width: '15%' }}
            sortable
          />
          <Column 
            field="unitPrice" 
            header="Requested Price"
            body={priceBodyTemplate}
            style={{ width: '15%' }}
            sortable
          />
          <Column 
            header="Total Value"
            body={totalBodyTemplate}
            style={{ width: '15%' }}
          />
          <Column 
            field="status" 
            header="Status"
            body={statusBodyTemplate}
            style={{ width: '10%' }}
          />
        </DataTable>

        {/* Summary section */}
        {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Original Request Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{items.length}</div>
              <div className="text-sm text-muted-foreground">Total SKUs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalQuantity}</div>
              <div className="text-sm text-muted-foreground">Total Quantity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-muted-foreground">Total Estimated Value</div>
            </div>
          </div>
        </div> */}

        {/* Info note */}
        {/* <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-medium">Original Request Information</div>
              <div className="mt-1">
                This tab displays the items exactly as they were originally requested by the customer. 
                Any changes made during negotiations can be viewed in the "Items" tab and "Negotiation" tab.
                Compare this original request with current quotations to track all modifications.
              </div>
            </div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}