import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ParsedItem {
  sku: string;
  description: string;
  quantity: number;
  price?: number | null;
}

// Common column name variations to look for
const COLUMN_MAPPINGS = {
  sku: ['sku', 'part', 'part number', 'part_number', 'partnumber', 'item', 'product', 'code'],
  description: ['description', 'desc', 'name', 'product name', 'item name', 'product_name'],
  quantity: ['quantity', 'qty', 'amount', 'count', 'units'],
  price: ['price', 'cost', 'unit price', 'unit_price', 'unitprice', 'rate', 'amount']
};

function findColumnIndex(headers: string[], columnType: keyof typeof COLUMN_MAPPINGS): number {
  const variations = COLUMN_MAPPINGS[columnType];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toString().toLowerCase().trim();
    if (variations.includes(header)) {
      return i;
    }
  }
  
  return -1;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle string numbers with commas
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,$]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');
    
    if (!isExcel && !isCsv) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file type. Please upload CSV or Excel files only.'
      }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    
    let worksheet: XLSX.WorkSheet;
    
    if (isExcel) {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];
    } else {
      // Parse CSV file
      const csvData = new TextDecoder().decode(buffer);
      const csvWorkbook = XLSX.read(csvData, { type: 'string' });
      worksheet = csvWorkbook.Sheets[csvWorkbook.SheetNames[0]];
    }

    // Convert to array of arrays
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'File must contain at least a header row and one data row'
      }, { status: 400 });
    }

    // Find column indices
    const headers = data[0].map((h: any) => h?.toString() || '');
    const skuIndex = findColumnIndex(headers, 'sku');
    const descIndex = findColumnIndex(headers, 'description');
    const qtyIndex = findColumnIndex(headers, 'quantity');
    const priceIndex = findColumnIndex(headers, 'price');

    if (skuIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find SKU/Part Number column. Please ensure your file has a column named SKU, Part, or Part Number.'
      }, { status: 400 });
    }

    if (descIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Could not find Description column. Please ensure your file has a column named Description, Desc, or Name.'
      }, { status: 400 });
    }

    // Parse data rows
    const items: ParsedItem[] = [];
    const errors: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length === 0) continue; // Skip empty rows
      
      const sku = row[skuIndex]?.toString().trim();
      const description = row[descIndex]?.toString().trim();
      const quantity = qtyIndex >= 0 ? parseNumber(row[qtyIndex]) : 1;
      const price = priceIndex >= 0 ? parseNumber(row[priceIndex]) : null;

      if (!sku) {
        errors.push(`Row ${i + 1}: Missing SKU`);
        continue;
      }

      if (!description) {
        errors.push(`Row ${i + 1}: Missing description`);
        continue;
      }

      if (!quantity || quantity <= 0) {
        errors.push(`Row ${i + 1}: Invalid quantity for SKU ${sku}`);
        continue;
      }

      items.push({
        sku,
        description,
        quantity,
        price
      });
    }

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid items found in the file'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalItems: items.length,
        errors: errors.length > 0 ? errors : null,
        columnMapping: {
          sku: headers[skuIndex],
          description: headers[descIndex],
          quantity: qtyIndex >= 0 ? headers[qtyIndex] : 'Not found (using default: 1)',
          price: priceIndex >= 0 ? headers[priceIndex] : 'Not found'
        }
      }
    });

  } catch (error) {
    // Silent error handling for file parsing
    return NextResponse.json({
      success: false,
      error: 'Failed to parse file. Please check the file format and try again.'
    }, { status: 500 });
  }
} 