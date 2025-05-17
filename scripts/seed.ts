// scripts/seed.ts

import { db, migrationClient } from '../db'; // Use migrationClient for seeding
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

// Helper to get a random element from an array
function getRandomElement<T>(arr: T[]): T {
  return faker.helpers.arrayElement(arr);
}

// Helper function to format dates as ISO strings (YYYY-MM-DD)
function formatDateToISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to get a date in the future
function getFutureDate(daysInFuture: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysInFuture);
  return formatDateToISOString(date);
}

// Helper to get a date in the past
function getPastDate(daysInPast: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysInPast);
  return formatDateToISOString(date);
}

async function main() {
  console.log('Seeding database...');

  try {
    // Clear existing data
    console.log('Truncating tables...');
    await db.execute(sql`TRUNCATE TABLE
      market_pricing,
      sales_history,
      po_items,
      purchase_orders,
      audit_log,
      comments,
      quotation_items,
      quotations,
      rfq_items,
      rfqs,
      sku_variations,
      sku_mappings,
      inventory_items,
      vendors,
      customers,
      email_templates,
      settings,
      users
      RESTART IDENTITY CASCADE`);
    console.log('Tables truncated.');

    // --- Seed Users ---
    console.log('Seeding users...');
    const userRoles = schema.userRoleEnum.enumValues;
    const departments = ['Administration', 'Procurement', 'Sales', 'Finance', 'IT'];
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const usersData = [
      { 
        email: 'admin@example.com', 
        name: faker.person.fullName(), 
        password: hashedPassword, 
        role: 'ADMIN' as const, 
        department: 'Administration' 
      },
      { 
        email: 'manager@example.com', 
        name: faker.person.fullName(), 
        password: hashedPassword, 
        role: 'MANAGER' as const, 
        department: 'Procurement' 
      },
      { 
        email: 'sales1@example.com', 
        name: faker.person.fullName(), 
        password: hashedPassword, 
        role: 'SALES' as const, 
        department: 'Sales' 
      },
      { 
        email: 'sales2@example.com', 
        name: faker.person.fullName(), 
        password: hashedPassword, 
        role: 'SALES' as const, 
        department: 'Sales' 
      },
      { 
        email: 'employee@example.com', 
        name: faker.person.fullName(), 
        password: hashedPassword, 
        role: 'EMPLOYEE' as const, 
        department: 'Finance' 
      }
    ];
    
    const insertedUsers = await db.insert(schema.users).values(usersData).returning();
    console.log(`Inserted ${insertedUsers.length} users`);

    // --- Seed Customers ---
    console.log('Seeding customers...');
    const customerTypes = schema.customerTypeEnum.enumValues;
    const regions = ['North America', 'Europe', 'Asia', 'South America', 'Australia'];
    
    const customersData = Array(8).fill(null).map(() => ({
      name: faker.company.name(),
      type: getRandomElement(customerTypes),
      region: getRandomElement(regions),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.country(),
      contactPerson: faker.person.fullName(),
      quickbooksId: `QB-${faker.string.alphanumeric(8)}`,
      isActive: faker.datatype.boolean(0.9)
    }));
    
    const insertedCustomers = await db.insert(schema.customers).values(customersData).returning();
    console.log(`Inserted ${insertedCustomers.length} customers`);

    // --- Seed Vendors ---
    console.log('Seeding vendors...');
    const vendorCategories = ['IT', 'Office Supplies', 'Manufacturing', 'Logistics', 'Services'];
    
    const vendorsData = Array(5).fill(null).map(() => ({
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.country(),
      contactPerson: faker.person.fullName(),
      category: getRandomElement(vendorCategories),
      isActive: faker.datatype.boolean(0.9),
      quickbooksId: `QB-${faker.string.alphanumeric(8)}`
    }));
    
    const insertedVendors = await db.insert(schema.vendors).values(vendorsData).returning();
    console.log(`Inserted ${insertedVendors.length} vendors`);

    // --- Seed Inventory Items ---
    console.log('Seeding inventory items...');
    const brands = ['HP', 'Canon', 'Epson', 'Brother', 'Lexmark', 'Samsung', 'Xerox', 'Ricoh'];
    const categories = ['TONER', 'DRUM', 'INK', 'PARTS', 'OTHER'];
    
    const inventoryItemsData = Array(10).fill(null).map(() => {
      const brand = getRandomElement(brands);
      const category = getRandomElement(categories);
      const costCad = parseFloat(faker.commerce.price({ min: 20, max: 500 }));
      return {
        sku: `${brand.substring(0, 2).toUpperCase()}-${faker.string.alphanumeric(5).toUpperCase()}`,
        mpn: faker.string.alphanumeric(8).toUpperCase(),
        brand: brand,
        category: category,
        description: `${brand} ${faker.commerce.productName()} ${category === 'TONER' ? 'Toner Cartridge' : 
          category === 'DRUM' ? 'Drum Unit' : 
          category === 'INK' ? 'Ink Cartridge' : 
          category === 'PARTS' ? 'Replacement Part' : 'Accessory'}`,
        stock: faker.number.int({ min: 0, max: 100 }),
        costCad: costCad,
        costUsd: parseFloat((costCad * 0.75).toFixed(2)),
        warehouseLocation: `Aisle ${faker.string.alpha(1).toUpperCase()}${faker.number.int({ min: 1, max: 20 })}-Shelf ${faker.number.int({ min: 1, max: 5 })}`,
        quantityOnHand: faker.number.int({ min: 0, max: 50 }),
        quantityReserved: faker.number.int({ min: 0, max: 10 }),
        lowStockThreshold: 5,
        lastSaleDate: getPastDate(faker.number.int({ min: 1, max: 30 })),
        quickbooksItemId: `QB-${faker.string.alphanumeric(8)}`
      };
    });
    
    const insertedInventoryItems = await db.insert(schema.inventoryItems).values(inventoryItemsData).returning();
    console.log(`Inserted ${insertedInventoryItems.length} inventory items`);

    // --- Seed SKU Mappings ---
    console.log('Seeding SKU mappings...');
    
    const skuMappingsData = insertedInventoryItems.slice(0, 5).map(item => ({
      standardSku: item.sku,
      standardDescription: item.description
    }));
    
    const insertedSkuMappings = await db.insert(schema.skuMappings).values(skuMappingsData).returning();
    console.log(`Inserted ${insertedSkuMappings.length} SKU mappings`);

    // --- Seed SKU Variations ---
    console.log('Seeding SKU variations...');
    
    const skuVariationsData = [];
    for (const mapping of insertedSkuMappings) {
      for (const customer of insertedCustomers.slice(0, 3)) {
        skuVariationsData.push({
          mappingId: mapping.id,
          customerId: customer.id,
          variationSku: `${customer.name.substring(0, 2).toUpperCase()}-${mapping.standardSku}`,
          source: 'Customer Provided'
        });
      }
    }
    
    const insertedSkuVariations = await db.insert(schema.skuVariations).values(skuVariationsData).returning();
    console.log(`Inserted ${insertedSkuVariations.length} SKU variations`);

    // --- Seed RFQs ---
    console.log('Seeding RFQs...');
    const rfqStatuses = schema.rfqStatusEnum.enumValues;
    const rfqSources = ['Email', 'Phone', 'Website', 'Direct Contact'];
    
    const rfqsData = [];
    for (const customer of insertedCustomers) {
      for (let i = 0; i < 2; i++) { // 2 RFQs per customer
        const vendor = getRandomElement(insertedVendors);
        const requestor = getRandomElement(insertedUsers);
        const status = getRandomElement(rfqStatuses);
        const approver = status === 'APPROVED' || status === 'COMPLETED' ? 
                        insertedUsers.find(u => u.role === 'ADMIN' || u.role === 'MANAGER') : null;
        const futureDays = faker.number.int({ min: 30, max: 180 });
        rfqsData.push({
          rfqNumber: `RFQ-${faker.string.numeric(5)}`,
          title: `RFQ for ${customer.name}`,
          description: faker.lorem.paragraph(),
          requestorId: requestor.id,
          customerId: customer.id,
          vendorId: vendor.id,
          status: status,
          dueDate: getFutureDate(futureDays),
          attachments: faker.datatype.boolean() ? [faker.system.fileName()] : null,
          totalBudget: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
          approvedBy: approver?.id || null,
          rejectionReason: status === 'REJECTED' ? faker.lorem.sentence() : null,
          source: getRandomElement(rfqSources),
          notes: faker.lorem.paragraph()
        });
      }
    }
    
    const insertedRfqs = await db.insert(schema.rfqs).values(rfqsData).returning();
    console.log(`Inserted ${insertedRfqs.length} RFQs`);

    // --- Seed RFQ Items ---
    console.log('Seeding RFQ items...');
    
    const rfqItemsData = [];
    for (const rfq of insertedRfqs) {
      // Add 2-3 items per RFQ, ensure each inventory item is used at least once
      const usedItems = new Set();
      const itemCount = faker.number.int({ min: 2, max: 3 });
      for (let i = 0; i < itemCount; i++) {
        let inventoryItem;
        do {
          inventoryItem = getRandomElement(insertedInventoryItems);
        } while (usedItems.has(inventoryItem.id));
        usedItems.add(inventoryItem.id);
        if (!inventoryItem || inventoryItem.costCad === null) continue;
        const costCad = inventoryItem.costCad as number;
        const skuVariation = insertedSkuVariations.find(
          sv => sv.customerId === rfq.customerId && 
               insertedSkuMappings.find(sm => sm.id === sv.mappingId)?.standardSku === inventoryItem.sku
        );
        rfqItemsData.push({
          rfqId: rfq.id,
          name: inventoryItem.description,
          description: faker.lorem.sentence(),
          quantity: faker.number.int({ min: 1, max: 50 }),
          unit: 'pcs',
          customerSku: skuVariation?.variationSku || null,
          internalProductId: inventoryItem.id,
          suggestedPrice: parseFloat(faker.commerce.price({ min: costCad * 1.1, max: costCad * 1.5 })),
          finalPrice: null,
          currency: 'CAD',
          status: 'PENDING',
          estimatedPrice: parseFloat(faker.commerce.price({ min: costCad * 1.2, max: costCad * 1.8 }))
        });
      }
    }
    
    const insertedRfqItems = await db.insert(schema.rfqItems).values(rfqItemsData).returning();
    console.log(`Inserted ${insertedRfqItems.length} RFQ items`);

    // --- Seed Quotations ---
    console.log('Seeding quotations...');
    
    const quotationsData = [];
    for (const rfq of insertedRfqs.filter(r => ['IN_REVIEW', 'APPROVED', 'COMPLETED'].includes(r.status))) {
      if (!rfq.vendorId) continue; // Skip if no vendor
      const totalAmount = parseFloat(faker.commerce.price({ min: 5000, max: 50000 }));
      quotationsData.push({
        quoteNumber: `Q-${faker.string.numeric(6)}`,
        rfqId: rfq.id,
        customerId: rfq.customerId,
        vendorId: rfq.vendorId,
        totalAmount: totalAmount,
        deliveryTime: `${faker.number.int({ min: 1, max: 4 })} weeks`,
        validUntil: getFutureDate(faker.number.int({ min: 60, max: 180 })),
        termsAndConditions: faker.lorem.paragraph(),
        attachments: faker.datatype.boolean() ? [faker.system.fileName()] : null,
        isSelected: rfq.status === 'COMPLETED',
        status: rfq.status === 'COMPLETED' ? 'APPROVED' : 'PENDING',
        notes: faker.lorem.paragraph(),
        expiryDate: getFutureDate(faker.number.int({ min: 30, max: 90 })),
        createdBy: getRandomElement(insertedUsers.filter(u => u.role === 'SALES')).id
      });
    }
    
    const insertedQuotations = await db.insert(schema.quotations).values(quotationsData).returning();
    console.log(`Inserted ${insertedQuotations.length} quotations`);

    // --- Seed Quotation Items ---
    console.log('Seeding quotation items...');
    
    const quotationItemsData = [];
    for (const quotation of insertedQuotations) {
      const rfqItems = insertedRfqItems.filter(item => item.rfqId === quotation.rfqId);
      
      for (const rfqItem of rfqItems) {
        const product = insertedInventoryItems.find(ii => ii.id === rfqItem.internalProductId);
        if (!product || product.costCad === null) continue;
        const costCad = product.costCad as number;
        
        const unitPrice = parseFloat(faker.commerce.price({ 
          min: costCad * 1.2, 
          max: costCad * 1.8 
        }));
        const quantity = rfqItem.quantity;
        const extendedPrice = parseFloat((unitPrice * quantity).toFixed(2));
        
        quotationItemsData.push({
          quotationId: quotation.id,
          rfqItemId: rfqItem.id,
          productId: product.id,
          unitPrice: unitPrice,
          quantity: quantity,
          extendedPrice: extendedPrice,
          currency: 'CAD',
          description: `Quoted price for ${product.description}`
        });
      }
    }
    
    const insertedQuotationItems = await db.insert(schema.quotationItems).values(quotationItemsData).returning();
    console.log(`Inserted ${insertedQuotationItems.length} quotation items`);

    // --- Seed Comments ---
    console.log('Seeding comments...');
    
    const commentsData = [];
    for (const rfq of insertedRfqs) {
      // Add 1-3 comments per RFQ
      const commentCount = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < commentCount; i++) {
        commentsData.push({
          content: faker.lorem.paragraph(),
          userId: getRandomElement(insertedUsers).id,
          rfqId: rfq.id
        });
      }
    }
    
    const insertedComments = await db.insert(schema.comments).values(commentsData).returning();
    console.log(`Inserted ${insertedComments.length} comments`);

    // --- Seed Email Templates ---
    console.log('Seeding email templates...');
    
    const emailTemplatesData = [
      {
        name: 'RFQ Created Notification',
        subject: 'New RFQ Created: {{rfq_title}}',
        body: 'Dear {{recipient_name}},\n\nA new RFQ has been created with title {{rfq_title}}. Please review it at your earliest convenience.\n\nRegards,\nRFQ System',
        variables: ['recipient_name', 'rfq_title', 'rfq_id'],
        isActive: true
      },
      {
        name: 'Quote Approval Request',
        subject: 'Approval Required for Quote: {{quote_number}}',
        body: 'Dear {{approver_name}},\n\nA new quote requires your approval: {{quote_number}} for {{customer_name}}.\n\nRegards,\nRFQ System',
        variables: ['approver_name', 'quote_number', 'customer_name'],
        isActive: true
      },
      {
        name: 'Quote Approved Notification',
        subject: 'Quote Approved: {{quote_number}}',
        body: 'Dear {{recipient_name}},\n\nThe quote {{quote_number}} has been approved by {{approver_name}}.\n\nRegards,\nRFQ System',
        variables: ['recipient_name', 'quote_number', 'approver_name'],
        isActive: true
      }
    ];
    
    const insertedEmailTemplates = await db.insert(schema.emailTemplates).values(emailTemplatesData).returning();
    console.log(`Inserted ${insertedEmailTemplates.length} email templates`);

    // --- Seed Settings ---
    console.log('Seeding settings...');
    
    const adminId = insertedUsers.find(u => u.role === 'ADMIN')?.id;
    const settingsData = [
      {
        key: 'default_currency',
        value: 'CAD',
        description: 'Default currency used throughout the system',
        updatedBy: adminId
      },
      {
        key: 'quote_expiry_days',
        value: '30',
        description: 'Number of days until quotes automatically expire',
        updatedBy: adminId
      },
      {
        key: 'enable_quickbooks_sync',
        value: 'true',
        description: 'Enable automatic syncing with QuickBooks',
        updatedBy: adminId
      },
      {
        key: 'minimum_markup_percentage',
        value: '20',
        description: 'Minimum markup percentage for quotes',
        updatedBy: adminId
      }
    ];
    
    const insertedSettings = await db.insert(schema.settings).values(settingsData).returning();
    console.log(`Inserted ${insertedSettings.length} settings`);

    // --- Seed Purchase Orders ---
    console.log('Seeding purchase orders...');
    
    const poStatuses = ['OPEN', 'RECEIVED', 'CLOSED', 'CANCELLED'];
    const purchaseOrdersData = [];
    
    for (let i = 0; i < 3; i++) {
      const vendor = getRandomElement(insertedVendors);
      const totalAmount = parseFloat(faker.commerce.price({ min: 1000, max: 50000 }));
      purchaseOrdersData.push({
        poNumber: `PO-${faker.string.numeric(6)}`,
        vendorId: vendor.id,
        status: getRandomElement(poStatuses),
        orderDate: new Date(),  // Use Date object instead of string
        expectedArrivalDate: getFutureDate(faker.number.int({ min: 15, max: 60 })),
        totalAmount: totalAmount,
        currency: 'CAD',
        quickbooksPoId: `QB-PO-${faker.string.alphanumeric(8)}`
      });
    }
    
    const insertedPurchaseOrders = await db.insert(schema.purchaseOrders).values(purchaseOrdersData).returning();
    console.log(`Inserted ${insertedPurchaseOrders.length} purchase orders`);

    // --- Seed PO Items ---
    console.log('Seeding purchase order items...');
    
    const poItemsData = [];
    for (const po of insertedPurchaseOrders) {
      // Add 2-3 items per PO
      const itemCount = faker.number.int({ min: 2, max: 3 });
      for (let i = 0; i < itemCount; i++) {
        const product = getRandomElement(insertedInventoryItems);
        if (!product || product.costCad === null) continue;
        const costCad = product.costCad as number;
        
        const quantity = faker.number.int({ min: 5, max: 50 });
        const unitCost = costCad;
        const extendedCost = parseFloat((unitCost * quantity).toFixed(2));
        
        poItemsData.push({
          poId: po.id,
          productId: product.id,
          quantity: quantity,
          unitCost: unitCost,
          extendedCost: extendedCost,
          currency: 'CAD'
        });
      }
    }
    
    const insertedPoItems = await db.insert(schema.poItems).values(poItemsData).returning();
    console.log(`Inserted ${insertedPoItems.length} purchase order items`);

    // --- Seed Sales History ---
    console.log('Seeding sales history...');
    
    const salesHistoryData = [];
    for (const customer of insertedCustomers) {
      // Add 2-3 sales per customer
      for (let i = 0; i < 3; i++) {
        const product = getRandomElement(insertedInventoryItems);
        if (!product || product.costCad === null) continue;
        const costCad = product.costCad as number;
        
        const quantity = faker.number.int({ min: 1, max: 20 });
        const unitPrice = parseFloat(faker.commerce.price({ min: costCad * 1.3, max: costCad * 2 }));
        const extendedPrice = parseFloat((unitPrice * quantity).toFixed(2));
        
        salesHistoryData.push({
          invoiceNumber: `INV-${faker.string.numeric(6)}`,
          customerId: customer.id,
          productId: product.id,
          quantity: quantity,
          unitPrice: unitPrice,
          extendedPrice: extendedPrice,
          currency: 'CAD',
          saleDate: getPastDate(faker.number.int({ min: 1, max: 90 })),
          quickbooksInvoiceId: `QB-INV-${faker.string.alphanumeric(8)}`
        });
      }
    }
    
    const insertedSalesHistory = await db.insert(schema.salesHistory).values(salesHistoryData).returning();
    console.log(`Inserted ${insertedSalesHistory.length} sales history records`);

    // --- Seed Market Pricing ---
    console.log('Seeding market pricing...');
    
    const marketPricingSources = ['MarketTrends Inc.', 'PriceWatch', 'CompetitorMonitor', 'IndustryInsight'];
    const marketPricingData = [];
    
    for (const item of insertedInventoryItems) {
      if (!item || item.costCad === null) continue;
      const costCad = item.costCad as number;
      
      marketPricingData.push({
        productId: item.id,
        source: getRandomElement(marketPricingSources),
        price: parseFloat(faker.commerce.price({ min: costCad * 1.1, max: costCad * 1.6 })),
        currency: 'CAD'
      });
    }
    
    const insertedMarketPricing = await db.insert(schema.marketPricing).values(marketPricingData).returning();
    console.log(`Inserted ${insertedMarketPricing.length} market pricing records`);

    // --- Seed Audit Log ---
    console.log('Seeding audit log...');
    
    const auditLogData = [];
    // User login entries
    for (const user of insertedUsers) {
      auditLogData.push({
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: { ip: faker.internet.ip(), browser: 'Chrome' }
      });
    }
    
    // RFQ actions
    for (const rfq of insertedRfqs) {
      auditLogData.push({
        userId: rfq.requestorId,
        action: 'RFQ_CREATED',
        entityType: 'RFQ',
        entityId: rfq.id,
        details: { rfqNumber: rfq.rfqNumber, customerId: rfq.customerId }
      });
      
      if (rfq.status !== 'PENDING') {
        auditLogData.push({
          userId: getRandomElement(insertedUsers).id,
          action: `RFQ_STATUS_CHANGED`,
          entityType: 'RFQ',
          entityId: rfq.id,
          details: { 
            oldStatus: 'PENDING', 
            newStatus: rfq.status 
          }
        });
      }
    }
    
    // Quote actions
    for (const quote of insertedQuotations) {
      auditLogData.push({
        userId: quote.createdBy,
        action: 'QUOTE_CREATED',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: { quoteNumber: quote.quoteNumber, rfqId: quote.rfqId }
      });
      
      if (quote.isSelected) {
        auditLogData.push({
          userId: getRandomElement(insertedUsers.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN')).id,
          action: 'QUOTE_SELECTED',
          entityType: 'QUOTE',
          entityId: quote.id,
          details: { quoteNumber: quote.quoteNumber, rfqId: quote.rfqId }
        });
      }
    }
    
    const insertedAuditLogs = await db.insert(schema.auditLog).values(auditLogData).returning();
    console.log(`Inserted ${insertedAuditLogs.length} audit log entries`);

    console.log('Seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    console.log("Closing database connection...");
    await migrationClient.end();
    console.log("Database connection closed.");
  }
}

main();