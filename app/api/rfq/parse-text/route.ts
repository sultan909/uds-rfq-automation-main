import { NextRequest, NextResponse } from 'next/server';

interface ParsedItem {
  sku: string;
  description: string;
  quantity: number;
  price?: number | null;
}

// Common patterns for extracting SKU and quantity information
const PATTERNS = {
  // Line with SKU and optional quantity: "ABC123 - Description (Qty: 5)"
  lineWithQty: /^([A-Z0-9\-_]+)\s*[-–]\s*(.+?)\s*\((?:qty|quantity|q):\s*(\d+)\)/i,
  
  // Simple line: "ABC123 - Description"
  simpleLine: /^([A-Z0-9\-_]+)\s*[-–]\s*(.+)$/i,
  
  // Tab/comma separated: "ABC123	Description	5	$10.99"
  tabSeparated: /^([A-Z0-9\-_]+)\s*[\t,]\s*(.+?)(?:\s*[\t,]\s*(\d+))?(?:\s*[\t,]\s*\$?(\d+\.?\d*))?$/i,
  
  // Bullet points: "• ABC123 - Description (5 units)"
  bulletPoint: /^[•\-\*]\s*([A-Z0-9\-_]+)\s*[-–]\s*(.+?)(?:\s*\((\d+)\s*(?:units?|pcs?|ea)?\))?/i,
  
  // Number prefix: "1. ABC123 - Description"
  numberedList: /^\d+\.\s*([A-Z0-9\-_]+)\s*[-–]\s*(.+)$/i,
  
  // SKU at start of line with quantity mentioned: "ABC123 Description, quantity: 3"
  qtyMentioned: /^([A-Z0-9\-_]+)\s+(.+?),?\s*(?:qty|quantity|q):\s*(\d+)/i,
  
  // Price mentioned: "ABC123 - Description $15.99"
  withPrice: /^([A-Z0-9\-_]+)\s*[-–]\s*(.+?)\s*\$(\d+\.?\d*)$/i
};

function extractNumber(str: string): number | null {
  const match = str.match(/\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

function parseTextLine(line: string): ParsedItem | null {
  const cleanLine = line.trim();
  if (!cleanLine || cleanLine.length < 3) return null;
  
  // Try each pattern
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    const match = cleanLine.match(pattern);
    if (match) {
      const sku = match[1]?.trim();
      const description = match[2]?.trim();
      
      if (!sku || !description) continue;
      
      let quantity = 1;
      let price: number | null = null;
      
      // Extract quantity and price based on pattern
      if (patternName === 'lineWithQty' || patternName === 'bulletPoint' || patternName === 'qtyMentioned') {
        quantity = match[3] ? parseInt(match[3]) : 1;
      } else if (patternName === 'tabSeparated') {
        quantity = match[3] ? parseInt(match[3]) : 1;
        price = match[4] ? parseFloat(match[4]) : null;
      } else if (patternName === 'withPrice') {
        price = match[3] ? parseFloat(match[3]) : null;
      }
      
      // Look for quantity in description if not found yet
      if (quantity === 1 && description) {
        const qtyInDesc = description.match(/(\d+)\s*(?:units?|pcs?|pieces?|ea|each)/i);
        if (qtyInDesc) {
          quantity = parseInt(qtyInDesc[1]);
        }
      }
      
      return {
        sku,
        description,
        quantity: Math.max(1, quantity),
        price
      };
    }
  }
  
  return null;
}

// Try to parse as table format (detect delimiters)
function parseAsTable(text: string): ParsedItem[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 2) return [];
  
  // Detect delimiter (tab, comma, pipe)
  const firstLine = lines[0];
  let delimiter = '\t';
  
  if (firstLine.includes('|')) delimiter = '|';
  else if (firstLine.includes(',')) delimiter = ',';
  else if (firstLine.includes('\t')) delimiter = '\t';
  
  const items: ParsedItem[] = [];
  
  // Skip header row if it looks like headers
  const startIndex = lines[0].toLowerCase().includes('sku') || lines[0].toLowerCase().includes('part') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map(part => part.trim());
    
    if (parts.length >= 2) {
      const sku = parts[0];
      const description = parts[1];
      const quantity = parts[2] ? extractNumber(parts[2]) || 1 : 1;
      const price = parts[3] ? extractNumber(parts[3]) : null;
      
      if (sku && description) {
        items.push({
          sku,
          description,
          quantity,
          price
        });
      }
    }
  }
  
  return items;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Text content is required'
      }, { status: 400 });
    }
    
    const cleanText = text.trim();
    if (cleanText.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Text content cannot be empty'
      }, { status: 400 });
    }
    
    // First try parsing as table format
    let items = parseAsTable(cleanText);
    
    // If table parsing didn't work or found few items, try line-by-line parsing
    if (items.length === 0) {
      const lines = cleanText.split('\n');
      
      for (const line of lines) {
        const item = parseTextLine(line);
        if (item) {
          items.push(item);
        }
      }
    }
    
    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract any valid items from the text. Please ensure the format includes SKUs and descriptions.'
      }, { status: 400 });
    }
    
    // Remove duplicates based on SKU
    const uniqueItems = items.filter((item, index, array) => 
      array.findIndex(i => i.sku.toLowerCase() === item.sku.toLowerCase()) === index
    );
    
    return NextResponse.json({
      success: true,
      data: {
        items: uniqueItems,
        totalItems: uniqueItems.length,
        duplicatesRemoved: items.length - uniqueItems.length
      }
    });
    
  } catch (error) {
    // Silent error handling for text parsing
    return NextResponse.json({
      success: false,
      error: 'Failed to parse text content'
    }, { status: 500 });
  }
} 