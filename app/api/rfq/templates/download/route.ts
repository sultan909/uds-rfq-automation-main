import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

/**
 * GET /api/rfq/templates/download
 * Download RFQ template file
 */
export async function GET(request: NextRequest) {
  try {
    // Create template data
    const templateData = [
      ['SKU', 'Description', 'Quantity', 'Price', 'Unit'],
      ['EXAMPLE-001', 'Example Product 1', '10', '25.99', 'EA'],
      ['EXAMPLE-002', 'Example Product 2', '5', '45.50', 'EA'],
      ['SAMPLE-SKU-123', 'Sample Electronics Component', '15', '12.75', 'EA'],
      ['DEMO-PART-456', 'Demo Hardware Part', '8', '89.99', 'EA'],
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // SKU
      { width: 30 }, // Description
      { width: 10 }, // Quantity
      { width: 10 }, // Price
      { width: 8 },  // Unit
    ];

    // Style the header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:E1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E6E6FA" } },
        alignment: { horizontal: "center" }
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RFQ Template');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true 
    });

    // Create response with proper headers
    const response = new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="RFQ_Template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate template file' },
      { status: 500 }
    );
  }
}
