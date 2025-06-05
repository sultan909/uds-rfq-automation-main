#!/usr/bin/env node

// Simple validation script to check if the quotation response implementation is correct

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Quotation Response System Implementation...\n');

const basePath = process.cwd();
const filesToCheck = [
  // Database and Types
  { path: 'db/schema.ts', description: 'Database schema with new tables' },
  { path: 'lib/types/quotation-response.ts', description: 'TypeScript types' },
  { path: 'drizzle/0003_add_quotation_responses.sql', description: 'Database migration' },
  
  // API Endpoints
  { path: 'app/api/rfq/[id]/quotation/[versionId]/responses/route.ts', description: 'Main responses API endpoint' },
  { path: 'app/api/rfq/[id]/quotation/[versionId]/responses/[responseId]/route.ts', description: 'Individual response API endpoint' },
  
  // UI Components
  { path: 'components/quotation-response-modal.tsx', description: 'Response recording modal' },
  { path: 'components/quotation-response-form.tsx', description: 'Response form component' },
  { path: 'components/response-form-fields.tsx', description: 'Form fields component' },
  { path: 'components/response-items-table.tsx', description: 'SKU-level response table' },
  
  // Enhanced Components
  { path: 'components/rfq-tabs/QuotationHistoryTab.tsx', description: 'Enhanced quotation history tab' },
  { path: 'components/quotation-history-table.tsx', description: 'Enhanced quotation history table' },
  
  // Integration
  { path: 'lib/api-client.ts', description: 'Enhanced API client' },
  { path: 'app/rfq-management/[id]/page.tsx', description: 'Enhanced RFQ detail page' },
];

let allFilesExist = true;
let implementationComplete = true;

console.log('📁 Checking File Existence:');
console.log('─'.repeat(50));

filesToCheck.forEach(file => {
  const fullPath = path.join(basePath, file.path);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file.path}`);
  console.log(`   ${file.description}`);
  
  if (!exists) {
    allFilesExist = false;
  }
});

console.log('\n📊 Implementation Summary:');
console.log('─'.repeat(50));

if (allFilesExist) {
  console.log('✅ All required files are present');
} else {
  console.log('❌ Some files are missing');
  implementationComplete = false;
}

// Check for key implementation features
console.log('\n🔧 Feature Implementation Check:');
console.log('─'.repeat(50));

try {
  // Check if database schema includes new tables
  const schemaContent = fs.readFileSync(path.join(basePath, 'db/schema.ts'), 'utf8');
  const hasQuotationResponses = schemaContent.includes('quotationResponses');
  const hasQuotationResponseItems = schemaContent.includes('quotationResponseItems');
  
  console.log(`${hasQuotationResponses ? '✅' : '❌'} Database schema includes quotation_responses table`);
  console.log(`${hasQuotationResponseItems ? '✅' : '❌'} Database schema includes quotation_response_items table`);
  
  // Check if API client has new methods
  const apiClientContent = fs.readFileSync(path.join(basePath, 'lib/api-client.ts'), 'utf8');
  const hasGetQuotationResponses = apiClientContent.includes('getQuotationResponses');
  const hasCreateQuotationResponse = apiClientContent.includes('createQuotationResponse');
  
  console.log(`${hasGetQuotationResponses ? '✅' : '❌'} API client has getQuotationResponses method`);
  console.log(`${hasCreateQuotationResponse ? '✅' : '❌'} API client has createQuotationResponse method`);
  
  // Check if main page has new handler
  const mainPageContent = fs.readFileSync(path.join(basePath, 'app/rfq-management/[id]/page.tsx'), 'utf8');
  const hasRecordQuotationResponse = mainPageContent.includes('handleRecordQuotationResponse');
  
  console.log(`${hasRecordQuotationResponse ? '✅' : '❌'} Main page has handleRecordQuotationResponse handler`);
  
} catch (error) {
  console.log('❌ Error checking file contents:', error.message);
  implementationComplete = false;
}

console.log('\n🎯 Final Status:');
console.log('─'.repeat(50));

if (implementationComplete && allFilesExist) {
  console.log('✅ Quotation Response System implementation appears to be COMPLETE!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run database migration: npm run db:push');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Test the new functionality in the RFQ detail page');
  console.log('4. Go to Quotation History tab and test "Record Detailed Response"');
} else {
  console.log('❌ Implementation is INCOMPLETE. Please check the missing components above.');
}

console.log('\n' + '='.repeat(50));
