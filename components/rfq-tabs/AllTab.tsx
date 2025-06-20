"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Tooltip } from 'primereact/tooltip';
import { useRef } from 'react';
import { useCurrency } from "@/contexts/currency-context";
import { Loader2 } from "lucide-react";

interface AllTabData {
  id: number;
  sku: string;
  quantityRequested: number;
  requestedPrice: number;
  currency: string;
  offeredQty: number;
  offeredPrice: number;
  offeredPriceCurrency: string;
  cost: number;
  qtyOnHand: number;
  qtyOnPO: number;
  pricePaidByRandmar: number | string;
  pricePaidByRandmarCurrency: string;
  qtyPurchasedByRandmar12m: number | string;
  pricePaidByUSG: number | string;
  pricePaidByUSGCurrency: string;
  qtyPurchasedByUSG12m: number | string;
  pricePaidByDCS: number | string;
  pricePaidByDCSCurrency: string;
  qtyPurchasedByDCS12m: number | string;
  qtySoldOutside12m: number | string;
  qtySoldOutside3m: number | string;
}

interface AllTabProps {
  rfqId: string;
  data: AllTabData[];
  loading: boolean;
  error: string | null;
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onLoad: () => void;
}

// Define available columns
const ALL_COLUMNS = [
  { field: 'sku', header: 'SKU', frozen: true },
  { field: 'quantityRequested', header: 'Quantity Requested' },
  { field: 'requestedPrice', header: 'Requested Price' },
  { field: 'offeredQty', header: 'Offered Qty' },
  { field: 'offeredPrice', header: 'Offered Price' },
  { field: 'cost', header: 'Cost' },
  { field: 'qtyOnHand', header: 'Qty on Hand' },
  { field: 'qtyOnPO', header: 'Qty on PO' },
  { field: 'pricePaidByRandmar', header: 'Price paid by Randmar' },
  { field: 'qtyPurchasedByRandmar12m', header: 'Qty Purchased by Randmar (12 months)' },
  { field: 'pricePaidByUSG', header: 'Price Paid by USG' },
  { field: 'qtyPurchasedByUSG12m', header: 'Qty Purchased by USG (12 months)' },
  { field: 'pricePaidByDCS', header: 'Price Paid by DCS' },
  { field: 'qtyPurchasedByDCS12m', header: 'Qty Purchased by DCS (12 months)' },
  { field: 'qtySoldOutside12m', header: 'Qty Sold Outside of Randmar, USG, DCS (12 months)' },
  { field: 'qtySoldOutside3m', header: 'Qty Sold Outside of Randmar, USG, DCS (3 months)' },
];

export function AllTab({ 
  rfqId, 
  data, 
  loading, 
  error, 
  totalRecords, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onLoad 
}: AllTabProps) {
  const { formatCurrency, convertCurrency, currency } = useCurrency();
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<AllTabData[]>>(null);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.map(col => col.field)
  );
  
  // Calculate lazy state from props
  const lazyState = {
    first: (currentPage - 1) * pageSize,
    rows: pageSize,
    page: currentPage,
  };

  // Call onLoad when component mounts to trigger data fetching
  useEffect(() => {
    onLoad();
  }, [onLoad]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error,
        life: 3000,
      });
    }
  }, [error]);

  const onPage = (event: any) => {
    const newPage = Math.floor(event.first / event.rows) + 1;
    const newPageSize = event.rows;
    onPageChange(newPage, newPageSize);
  };

  // Column templates for formatting
  const priceTemplate = (rowData: AllTabData, field: keyof AllTabData) => {
    const value = rowData[field];
    
    // If value is 'N/A' or null/undefined, return 'N/A'
    if (value === 'N/A' || value == null) {
      return 'N/A';
    }
    
    const numericValue = value as number;
    
    // Determine which currency to use based on the field
    let itemCurrency = 'CAD';
    
    if (field === 'requestedPrice' || field === 'cost') {
      itemCurrency = rowData.currency || 'CAD';
    } else if (field === 'offeredPrice') {
      itemCurrency = rowData.offeredPriceCurrency || 'CAD';
    } else if (field === 'pricePaidByRandmar') {
      itemCurrency = rowData.pricePaidByRandmarCurrency || 'CAD';
    } else if (field === 'pricePaidByUSG') {
      itemCurrency = rowData.pricePaidByUSGCurrency || 'CAD';
    } else if (field === 'pricePaidByDCS') {
      itemCurrency = rowData.pricePaidByDCSCurrency || 'CAD';
    }
    
    const convertedPrice = convertCurrency(numericValue || 0, itemCurrency as "CAD" | "USD");
    return formatCurrency(convertedPrice);
  };

  const quantityTemplate = (rowData: AllTabData, field: keyof AllTabData) => {
    const value = rowData[field];
    
    // If value is 'N/A' or null/undefined, return 'N/A'
    if (value === 'N/A' || value == null) {
      return 'N/A';
    }
    
    const numericValue = value as number;
    return (numericValue || 0).toLocaleString();
  };

  // Column toggle options for MultiSelect
  const columnOptions = ALL_COLUMNS.map(col => ({
    value: col.field,
    label: col.header
  }));

  const onColumnToggle = (event: any) => {
    setVisibleColumns(event.value);
  };

  // Export functions
  const exportCSV = (selectionOnly: boolean = false) => {
    dt.current?.exportCSV({ selectionOnly });
  };

  const saveAsExcelFile = (buffer: any, fileName: string) => {
    import('file-saver').then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let EXCEL_EXTENSION = '.xlsx';
        const data = new Blob([buffer], {
          type: EXCEL_TYPE
        });

        module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
      }
    });
  };

  const exportExcel = () => {
    import('xlsx').then((xlsx) => {
      // Format data for export
      const exportData = data.map(item => {
        const formattedItem: any = {};
        ALL_COLUMNS.forEach(col => {
          if (visibleColumns.includes(col.field)) {
            const value = item[col.field as keyof AllTabData];
            if (col.field.includes('price') || col.field.includes('Price') || col.field === 'cost') {
              // Handle N/A values
              if (value === 'N/A' || value == null) {
                formattedItem[col.header] = 'N/A';
              } else {
                // Determine which currency to use based on the field
                let itemCurrency = 'CAD';
                
                if (col.field === 'requestedPrice' || col.field === 'cost') {
                  itemCurrency = item.currency || 'CAD';
                } else if (col.field === 'offeredPrice') {
                  itemCurrency = item.offeredPriceCurrency || 'CAD';
                } else if (col.field === 'pricePaidByRandmar') {
                  itemCurrency = item.pricePaidByRandmarCurrency || 'CAD';
                } else if (col.field === 'pricePaidByUSG') {
                  itemCurrency = item.pricePaidByUSGCurrency || 'CAD';
                } else if (col.field === 'pricePaidByDCS') {
                  itemCurrency = item.pricePaidByDCSCurrency || 'CAD';
                }
                
                const convertedPrice = convertCurrency(value as number || 0, itemCurrency as "CAD" | "USD");
                formattedItem[col.header] = formatCurrency(convertedPrice);
              }
            } else if (col.field.includes('qty') || col.field.includes('Qty') || col.field.includes('quantity') || col.field.includes('Quantity')) {
              // Handle N/A values for quantities
              if (value === 'N/A' || value == null) {
                formattedItem[col.header] = 'N/A';
              } else {
                formattedItem[col.header] = (value as number || 0).toLocaleString();
              }
            } else {
              formattedItem[col.header] = value;
            }
          }
        });
        return formattedItem;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      saveAsExcelFile(excelBuffer, `RFQ_${rfqId}_AllData`);
    });
  };

  const exportPdf = async () => {
    try {
      const jsPDF = await import('jspdf');
      
      // Create document in landscape mode for wide tables
      const doc = new jsPDF.default('l', 'mm', 'a4');
      
      // Get visible columns and data
      const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.field));
      
      // Format data for export
      const exportData = data.map(item => {
        const formattedItem: any = {};
        visibleCols.forEach(col => {
          const value = item[col.field as keyof AllTabData];
          if (col.field.includes('price') || col.field.includes('Price') || col.field === 'cost') {
            // Handle N/A values
            if (value === 'N/A' || value == null) {
              formattedItem[col.field] = 'N/A';
            } else {
              // Determine which currency to use based on the field
              let itemCurrency = 'CAD';
              
              if (col.field === 'requestedPrice' || col.field === 'cost') {
                itemCurrency = item.currency || 'CAD';
              } else if (col.field === 'offeredPrice') {
                itemCurrency = item.offeredPriceCurrency || 'CAD';
              } else if (col.field === 'pricePaidByRandmar') {
                itemCurrency = item.pricePaidByRandmarCurrency || 'CAD';
              } else if (col.field === 'pricePaidByUSG') {
                itemCurrency = item.pricePaidByUSGCurrency || 'CAD';
              } else if (col.field === 'pricePaidByDCS') {
                itemCurrency = item.pricePaidByDCSCurrency || 'CAD';
              }
              
              const convertedPrice = convertCurrency(value as number || 0, itemCurrency as "CAD" | "USD");
              formattedItem[col.field] = formatCurrency(convertedPrice);
            }
          } else if (col.field.includes('qty') || col.field.includes('Qty') || col.field.includes('quantity') || col.field.includes('Quantity')) {
            // Handle N/A values for quantities
            if (value === 'N/A' || value == null) {
              formattedItem[col.field] = 'N/A';
            } else {
              formattedItem[col.field] = (value as number || 0).toLocaleString();
            }
          } else {
            formattedItem[col.field] = String(value || '');
          }
        });
        return formattedItem;
      });

      // Add title
      doc.setFontSize(16);
      doc.text(`RFQ ${rfqId} - All Item Data`, 20, 20);
      
      // Add export date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Table setup
      const startY = 40;
      let yPosition = startY;
      const pageHeight = 200; // Leave margin at bottom
      const colWidth = Math.floor((280 - 20) / visibleCols.length); // Distribute width evenly
      
      // Function to add table headers
      const addHeaders = (y: number) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        visibleCols.forEach((col, index) => {
          const xPos = 20 + (index * colWidth);
          doc.text(col.header.substring(0, 15), xPos, y); // Truncate long headers
        });
        return y + 8;
      };
      
      // Add headers
      yPosition = addHeaders(yPosition);
      doc.setFont('helvetica', 'normal');
      
      // Add data rows
      exportData.forEach((item, rowIndex) => {
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 20;
          yPosition = addHeaders(yPosition);
          doc.setFont('helvetica', 'normal');
        }
        
        visibleCols.forEach((col, colIndex) => {
          const xPos = 20 + (colIndex * colWidth);
          const cellValue = String(item[col.field] || '');
          // Truncate long values to fit in cell
          const truncatedValue = cellValue.length > 12 ? cellValue.substring(0, 12) + '...' : cellValue;
          doc.text(truncatedValue, xPos, yPosition);
        });
        
        yPosition += 6;
      });
      
      // Add footer with total items
      doc.setFontSize(8);
      doc.text(`Total Items: ${data.length}`, 20, yPosition + 10);
      
      doc.save(`RFQ_${rfqId}_AllData.pdf`);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'PDF exported successfully',
        life: 3000,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export PDF',
        life: 3000,
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>All RFQ Items Data</CardTitle>
        <div className="flex justify-between items-center">
          {/* Left side: Column toggle */}
          <div className="flex items-center gap-4">
            <MultiSelect
              value={visibleColumns}
              options={columnOptions}
              onChange={onColumnToggle}
              placeholder="Toggle Columns"
              className="w-80"
              display="chip"
              maxSelectedLabels={3}
              selectedItemsLabel="{0} columns selected"
            />
          </div>
          
          {/* Right side: Export buttons */}
          <div className="flex items-center gap-2 export-buttons">
            <span className="text-sm text-gray-600 mr-2">Export:</span>
            <Button 
              type="button" 
              icon="pi pi-file" 
              rounded 
              onClick={() => exportCSV(false)} 
              data-pr-tooltip="Export CSV" 
              size="small"
              severity="secondary"
              className="p-button-rounded p-button-text"
            />
            <Button 
              type="button" 
              icon="pi pi-file-excel" 
              severity="success" 
              rounded 
              onClick={exportExcel} 
              data-pr-tooltip="Export Excel" 
              size="small"
              className="p-button-rounded"
            />
            <Button 
              type="button" 
              icon="pi pi-file-pdf" 
              severity="warning" 
              rounded 
              onClick={exportPdf} 
              data-pr-tooltip="Export PDF" 
              size="small"
              className="p-button-rounded"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Toast ref={toast} />
        <Tooltip target=".export-buttons>button" position="bottom" />
        
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-muted-foreground">Loading all items data...</div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <div className="card">
            <DataTable
              key={currency} // Force re-render when currency changes
              ref={dt}
              value={data}
              lazy
              paginator={false}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              loading={false} // Disable built-in loading since we handle it above
              first={lazyState.first}
              onPage={onPage}
              scrollable
              scrollHeight="600px"
              resizableColumns
              columnResizeMode="expand"
              reorderableColumns
              className="p-datatable-sm"
              emptyMessage="Loading Data"
            >
              {ALL_COLUMNS.filter(col => visibleColumns.includes(col.field)).map((col) => {
                const isPriceField = col.field.includes('price') || col.field.includes('Price') || col.field === 'cost';
                const isQuantityField = col.field.includes('qty') || col.field.includes('Qty') || col.field.includes('quantity') || col.field.includes('Quantity');
                
                return (
                  <Column
                    key={col.field}
                    field={col.field}
                    header={col.header}
                    frozen={col.field === 'sku'}
                    resizeable
                    style={{ 
                      minWidth: col.field === 'sku' ? '120px' : 
                               col.header.length > 30 ? '250px' : 
                               col.header.length > 20 ? '180px' : '120px' 
                    }}
                    className={col.field === 'sku' ? 'font-semibold' : ''}
                    body={isPriceField ? 
                      (rowData) => priceTemplate(rowData, col.field as keyof AllTabData) :
                      isQuantityField ? 
                      (rowData) => quantityTemplate(rowData, col.field as keyof AllTabData) :
                      undefined
                    }
                  />
                );
              })}
            </DataTable>

            {/* Custom Paginator - only show when not loading */}
            <Paginator
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={onPage}
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
              className="mt-4"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}