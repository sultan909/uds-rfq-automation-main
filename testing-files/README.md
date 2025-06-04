# UDS RFQ Testing Files

This folder contains sample files for testing the RFQ creation functionality in the UDS RFQ Management System.

## Files

### 📄 sample-rfq-text.txt
**Purpose**: Test the "Paste Text" functionality
**Usage**: 
1. Open this file and copy any section of text
2. Navigate to RFQ Management > New RFQ > Manual Entry
3. Click the "Paste Text" tab
4. Paste the copied text and click "Parse Content"
5. Verify that SKUs, descriptions, quantities, and prices are extracted correctly

**Formats Included**:
- Simple SKU - Description format
- SKU with quantity in parentheses
- Bullet points with units
- Numbered lists
- Tab/comma/pipe separated data
- Real-world email/document examples
- Mixed format examples

### 📊 sample-rfq.csv
**Purpose**: Test the "Upload File" functionality with standard column names
**Usage**:
1. Navigate to RFQ Management > New RFQ > Manual Entry
2. Click the "Upload File" tab
3. Upload this CSV file
4. Verify that all 10 items are imported correctly

**Columns**: SKU, Description, Quantity, Price

### 📊 sample-rfq-alt-columns.csv
**Purpose**: Test the flexible column detection feature
**Usage**: Same as above, but tests alternative column names
**Columns**: Part Number, Product Name, Qty, Unit Price

## Testing Scenarios

### 1. Text Parsing Test
Copy different text formats from `sample-rfq-text.txt` to test:
- ✅ Basic SKU-Description parsing
- ✅ Quantity extraction from various formats
- ✅ Price parsing with currency symbols
- ✅ Duplicate removal
- ✅ Mixed format handling

### 2. File Upload Test
Upload the CSV files to test:
- ✅ Standard column names (SKU, Description, Quantity, Price)
- ✅ Alternative column names (Part Number, Product Name, Qty, Unit Price)
- ✅ Error handling for missing columns
- ✅ Data validation and parsing

### 3. SKU Mapping Test
The sample SKUs (PUMP123, VALVE456, etc.) are designed to be non-standard SKUs that should trigger the SKU mapping detector, allowing you to test:
- ✅ Non-standard SKU detection
- ✅ SKU mapping suggestions
- ✅ Manual SKU editing
- ✅ Mapping acceptance/rejection

## Expected Behavior

### Successful Import
- Items should be imported into the RFQ items table
- Non-standard SKUs should trigger the SKU mapping detector
- Success message should show the number of imported items
- Any warnings or errors should be displayed appropriately

### Error Handling
- Invalid file formats should show error messages
- Missing required columns should be detected
- Empty or malformed data should be handled gracefully

## Notes

- **Quantities**: Will default to 1 if not specified
- **Prices**: Are optional and will show as null if not provided
- **Duplicates**: Are automatically removed based on SKU
- **Non-standard SKUs**: Will trigger the mapping detector since these SKUs don't exist in the inventory
- **Currency**: The system respects the selected currency (CAD/USD) setting

## Troubleshooting

If testing doesn't work as expected:
1. Check browser console for JavaScript errors
2. Check network tab for API call failures
3. Verify the development server is running
4. Ensure database is properly seeded with inventory data
5. Check that all required dependencies are installed (xlsx library)

## Adding Your Own Test Files

You can create additional test files following these guidelines:
- **CSV files**: Ensure headers are in the first row
- **Text files**: Use any of the supported formats shown in sample-rfq-text.txt
- **Excel files**: Save as .xlsx or .xls format with proper column headers

The system is designed to be flexible and handle various real-world scenarios! 