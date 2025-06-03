// scripts/seed.ts

import { db, migrationClient } from '../db'; // Use migrationClient for seeding
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { type RfqStatus } from '../db/schema';

// Helper to get a random element from an array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
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
      negotiation_communications,
      sku_negotiation_history,
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
    
    // Fixed wholesale customers with main_customer true
    const fixedCustomers = [
      {
        name: 'Randmar',
        type: 'WHOLESALER',
        region: 'North America',
        email: 'info@randmar.com',
        phone: faker.phone.number(),
        address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.country(),
        contactPerson: faker.person.fullName(),
        quickbooksId: `QB-RAND${faker.string.alphanumeric(4)}`,
        isActive: true,
        main_customer: true
      },
      {
        name: 'UGS',
        type: 'WHOLESALER',
        region: 'North America',
        email: 'info@ugs.com',
        phone: faker.phone.number(),
        address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.country(),
        contactPerson: faker.person.fullName(),
        quickbooksId: `QB-UGS${faker.string.alphanumeric(4)}`,
        isActive: true,
        main_customer: true
      },
      {
        name: 'DCS',
        type: 'WHOLESALER',
        region: 'North America',
        email: 'info@dcs.com',
        phone: faker.phone.number(),
        address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.country(),
        contactPerson: faker.person.fullName(),
        quickbooksId: `QB-DCS${faker.string.alphanumeric(4)}`,
        isActive: true,
        main_customer: true
      }
    ];
    
    // Generate additional random customers
    const randomCustomers = Array(5).fill(null).map(() => ({
      name: faker.company.name(),
      type: getRandomElement(customerTypes),
      region: getRandomElement(regions),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.country(),
      contactPerson: faker.person.fullName(),
      quickbooksId: `QB-${faker.string.alphanumeric(8)}`,
      isActive: faker.datatype.boolean(0.9),
      main_customer: false
    }));
    
    // Combine fixed and random customers
    const customersData = [...fixedCustomers, ...randomCustomers];
    // @ts-ignore
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
    const rfqsData: Array<{
      rfqNumber: string;
      title: string;
      description: string;
      requestorId: number;
      customerId: number;
      vendorId: number | null;
      status: RfqStatus;
      dueDate: string | null;
      attachments: string[] | null;
      totalBudget: number | null;
      approvedBy: number | null;
      rejectionReason: string | null;
      source: string;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const customer of insertedCustomers) {
      // Create multiple RFQs per customer with different statuses
      const statusDistribution: { status: RfqStatus; count: number }[] = [
        { status: 'NEW', count: 2 },
        { status: 'DRAFT', count: 2 },
        { status: 'PRICED', count: 2 },
        { status: 'SENT', count: 2 },
        { status: 'NEGOTIATING', count: 1 },
        { status: 'ACCEPTED', count: 1 },
        { status: 'DECLINED', count: 1 },
        { status: 'PROCESSED', count: 1 }
      ];

      for (const { status, count } of statusDistribution) {
        for (let i = 0; i < count; i++) {
          const requestor = getRandomElement(insertedUsers);
          const vendor = faker.datatype.boolean() ? getRandomElement(insertedVendors) : null;
          const dueDate = faker.datatype.boolean() ? getFutureDate(30) : null;
          const totalBudget = faker.datatype.boolean() ? faker.number.float({ min: 1000, max: 10000, precision: 2 }) : null;
          const approvedBy = status === 'ACCEPTED' || status === 'PROCESSED' ? getRandomElement(insertedUsers.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER')).id : null;
          const rejectionReason = status === 'DECLINED' ? faker.lorem.sentence() : null;

          rfqsData.push({
            rfqNumber: `RFQ-${faker.string.numeric(5)}`,
            title: faker.commerce.productName(),
            description: faker.lorem.paragraph(),
            requestorId: requestor.id,
            customerId: customer.id,
            vendorId: vendor?.id || null,
            status,
            dueDate,
            attachments: faker.datatype.boolean() ? [faker.system.fileName()] : null,
            totalBudget,
            approvedBy,
            rejectionReason,
            source: faker.helpers.arrayElement(['Email', 'Phone', 'Website', 'In Person']),
            notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    const insertedRfqs = await db.insert(schema.rfqs).values(rfqsData).returning();
    console.log(`Inserted ${insertedRfqs.length} RFQs`);

    // --- Seed RFQ Items ---
    console.log('Seeding RFQ items...');
    
    const rfqItemsData: Array<{
      rfqId: number;
      name: string;
      description: string;
      quantity: number;
      unit: string;
      customerSku: string | null;
      internalProductId: number;
      suggestedPrice: number;
      finalPrice: number | null;
      currency: string;
      status: RfqStatus;
      estimatedPrice: number;
    }> = [];

    for (const rfq of insertedRfqs) {
      // Add 2-5 items per RFQ, ensure each inventory item is used at least once
      const usedItems = new Set();
      const itemCount = faker.number.int({ min: 2, max: 5 });
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

        // Set final price based on RFQ status
        let finalPrice = null;
        if (['PRICED', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'PROCESSED'].includes(rfq.status)) {
          finalPrice = parseFloat(faker.commerce.price({ min: costCad * 1.1, max: costCad * 1.5 }));
        }

        rfqItemsData.push({
          rfqId: rfq.id,
          name: inventoryItem.description,
          description: faker.lorem.sentence(),
          quantity: faker.number.int({ min: 1, max: 50 }),
          unit: 'pcs',
          customerSku: skuVariation?.variationSku || null,
          internalProductId: inventoryItem.id,
          suggestedPrice: parseFloat(faker.commerce.price({ min: costCad * 1.1, max: costCad * 1.5 })),
          finalPrice,
          currency: 'CAD',
          status: rfq.status,
          estimatedPrice: parseFloat(faker.commerce.price({ min: costCad * 1.2, max: costCad * 1.8 }))
        });
      }
    }
    
    const insertedRfqItems = await db.insert(schema.rfqItems).values(rfqItemsData).returning();
    console.log(`Inserted ${insertedRfqItems.length} RFQ items`);

    // --- Seed Quotations ---
    console.log('Seeding quotations...');
    const quotationsData = insertedRfqs.map(rfq => {
      // Find a random admin or manager to be the creator
      const adminOrManager = getRandomElement(insertedUsers.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER'));
      
      return {
        quoteNumber: `Q-${faker.string.numeric(5)}`,
        rfqId: rfq.id,
        customerId: rfq.customerId,
        vendorId: rfq.vendorId || getRandomElement(insertedVendors).id,
        totalAmount: rfq.totalBudget || faker.number.float({ min: 1000, max: 10000, precision: 2 }),
        deliveryTime: `${faker.number.int({ min: 1, max: 30 })} days`,
        validUntil: getFutureDate(30),
        termsAndConditions: faker.lorem.paragraph(),
        attachments: faker.datatype.boolean() ? [faker.system.fileName()] : null,
        isSelected: rfq.status === 'PROCESSED',
        status: rfq.status === 'PROCESSED' ? 'ACCEPTED' : 'NEW',
        notes: faker.lorem.paragraph(),
        expiryDate: getFutureDate(30),
        createdBy: adminOrManager.id,
        createdAt: new Date(rfq.createdAt.getTime() + faker.number.int({ min: 3600000, max: 86400000 })),
        updatedAt: new Date(rfq.updatedAt.getTime() + faker.number.int({ min: 3600000, max: 86400000 }))
      };
    });
    
    const insertedQuotations = await db.insert(schema.quotations).values(quotationsData).returning();
    console.log(`Inserted ${insertedQuotations.length} quotations`);

    // --- Seed Quotation Items ---
    console.log('Seeding quotation items...');
    const quotationItemsData = insertedQuotations.flatMap(quotation => {
      const rfq = insertedRfqs.find(r => r.id === quotation.rfqId);
      if (!rfq) return [];

      const rfqItemsForRfq = insertedRfqItems.filter(item => item.rfqId === rfq.id);
      return rfqItemsForRfq.map(item => {
        if (!item.internalProductId) return null;
        
        // Ensure we have a valid unit price
        const unitPrice = item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0;
        if (unitPrice <= 0) return null;

        return {
          quotationId: quotation.id,
          rfqItemId: item.id,
          productId: item.internalProductId,
          unitPrice,
          quantity: item.quantity,
          extendedPrice: unitPrice * item.quantity,
          currency: item.currency,
          createdAt: new Date(quotation.createdAt.getTime() + faker.number.int({ min: 3600000, max: 86400000 })),
          updatedAt: new Date(quotation.updatedAt.getTime() + faker.number.int({ min: 3600000, max: 86400000 }))
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);
    });
    
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
      
      if (rfq.status !== 'NEW') {
        auditLogData.push({
          userId: getRandomElement(insertedUsers).id,
          action: `RFQ_STATUS_CHANGED`,
          entityType: 'RFQ',
          entityId: rfq.id,
          details: { 
            oldStatus: 'NEW', 
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

    // --- Seed Quotation Versions ---
    console.log('Seeding quotation versions...');
    
    const quotationVersionsData = [];
    for (const rfq of insertedRfqs) {
      // Create 1-2 versions per RFQ
      const numVersions = faker.number.int({ min: 1, max: 2 });
      for (let i = 1; i <= numVersions; i++) {
        const estimatedPrice = parseFloat(faker.commerce.price({ min: 1000, max: 5000 }));
        const finalPrice = estimatedPrice * (1 + faker.number.float({ min: 0.1, max: 0.3 }));
        quotationVersionsData.push({
          rfqId: rfq.id,
          versionNumber: i,
          status: i === 1 ? 'NEW' : 'SENT',
          estimatedPrice: Math.round(estimatedPrice),
          finalPrice: Math.round(finalPrice),
          changes: i === 1 ? 'Initial quote' : 'Updated pricing based on market conditions',
          createdBy: 'System'
        });
      }
    }
    
    const insertedQuotationVersions = await db.insert(schema.quotationVersions).values(quotationVersionsData).returning();
    console.log(`Inserted ${insertedQuotationVersions.length} quotation versions`);

    // --- Seed Customer Responses ---
    console.log('Seeding customer responses...');
    
    const customerResponsesData = [];
    for (const version of insertedQuotationVersions) {
      // Add responses to some versions
      if (faker.datatype.boolean(0.7)) { // 70% chance of having a response
        customerResponsesData.push({
          versionId: version.id,
          status: faker.helpers.arrayElement(['ACCEPTED', 'DECLINED', 'NEGOTIATING']),
          comments: faker.lorem.sentence(),
          requestedChanges: faker.datatype.boolean() ? faker.lorem.paragraph() : null
        });
      }
    }
    
    const insertedCustomerResponses = await db.insert(schema.customerResponses).values(customerResponsesData).returning();
    console.log(`Inserted ${insertedCustomerResponses.length} customer responses`);

    // --- Seed Negotiation Communications ---
    console.log('Seeding negotiation communications...');
    
    const communicationTypes = ['EMAIL', 'PHONE_CALL', 'MEETING', 'INTERNAL_NOTE'];
    const directions = ['OUTBOUND', 'INBOUND'];
    
    const negotiationCommunicationsData = [];
    
    // Add communications to RFQs that are in negotiating status or have been negotiated
    const negotiatableRfqs = insertedRfqs.filter(rfq => 
      ['NEGOTIATING', 'ACCEPTED', 'DECLINED', 'PROCESSED'].includes(rfq.status)
    );

    for (const rfq of negotiatableRfqs) {
      const numCommunications = faker.number.int({ min: 2, max: 8 });
      const customer = insertedCustomers.find(c => c.id === rfq.customerId);
      const relatedVersions = insertedQuotationVersions.filter(v => v.rfqId === rfq.id);
      
      for (let i = 0; i < numCommunications; i++) {
        const communicationType = getRandomElement(communicationTypes);
        const direction = getRandomElement(directions);
        const user = getRandomElement(insertedUsers.filter(u => ['SALES', 'MANAGER', 'ADMIN'].includes(u.role)));
        const relatedVersion = faker.datatype.boolean(0.6) ? getRandomElement(relatedVersions) : null;
        
        // Create realistic communication dates (spread over the last 30 days)
        const communicationDate = new Date();
        communicationDate.setDate(communicationDate.getDate() - faker.number.int({ min: 1, max: 30 }));
        communicationDate.setHours(faker.number.int({ min: 8, max: 17 }), faker.number.int({ min: 0, max: 59 }));

        // Follow-up logic
        const followUpRequired = faker.datatype.boolean(0.3); // 30% chance
        const followUpCompleted = followUpRequired ? faker.datatype.boolean(0.7) : false; // 70% completed
        const followUpDate = followUpRequired ? new Date(communicationDate.getTime() + faker.number.int({ min: 86400000, max: 604800000 })) : null; // 1-7 days later
        const followUpCompletedAt = followUpCompleted ? new Date(followUpDate!.getTime() + faker.number.int({ min: 3600000, max: 172800000 })) : null; // 1 hour to 2 days after due date

        // Generate realistic content based on communication type and direction
        let subject = null;
        let content = '';
        
        switch (communicationType) {
          case 'EMAIL':
            if (direction === 'OUTBOUND') {
              subject = faker.helpers.arrayElement([
                `Quote Update for RFQ ${rfq.rfqNumber}`,
                `Pricing Discussion - ${rfq.title}`,
                `Follow-up on Your RFQ Request`,
                `Revised Quotation - ${rfq.rfqNumber}`
              ]);
              content = faker.helpers.arrayElement([
                `Hi ${customer?.contactPerson || 'there'},\n\nI wanted to follow up on your RFQ ${rfq.rfqNumber}. We've reviewed your requirements and have some updated pricing to discuss.\n\nBest regards,\n${user.name}`,
                `Dear ${customer?.contactPerson || 'Customer'},\n\nThank you for your interest in our products. I've attached the revised quotation for ${rfq.title}. Please let me know if you have any questions.\n\nRegards,\n${user.name}`,
                `Hello,\n\nI wanted to reach out regarding the pricing on ${rfq.title}. We have some flexibility on volume orders and would like to discuss options.\n\nLooking forward to hearing from you,\n${user.name}`
              ]);
            } else {
              subject = faker.helpers.arrayElement([
                `Re: Quote for ${rfq.rfqNumber}`,
                `Pricing Questions - ${rfq.title}`,
                `RFQ ${rfq.rfqNumber} - Additional Requirements`,
                `Quote Review and Feedback`
              ]);
              content = faker.helpers.arrayElement([
                `Thank you for the quotation. We're reviewing the pricing and have a few questions about the delivery timeline and volume discounts.`,
                `Hi ${user.name},\n\nWe received your quote for ${rfq.title}. The pricing looks good but we need to discuss quantity adjustments for some items.`,
                `The quotation is mostly acceptable, but we need better pricing on items 2 and 4. Can we schedule a call to discuss?`,
                `We appreciate the quick turnaround. Could you provide alternative options with different delivery schedules?`
              ]);
            }
            break;
            
          case 'PHONE_CALL':
            content = faker.helpers.arrayElement([
              `Discussed pricing options for ${rfq.title}. Customer expressed interest in volume discounts and extended payment terms.`,
              `Phone call with ${customer?.contactPerson || 'customer contact'} regarding delivery schedules. They need faster delivery for 3 items.`,
              `Negotiated pricing on high-volume items. Customer agreed to 15% price reduction in exchange for 90-day payment terms.`,
              `Customer called to clarify technical specifications and delivery requirements. Provided additional product information.`,
              `Discussed alternative product options that could reduce overall cost while maintaining quality standards.`
            ]);
            break;
            
          case 'MEETING':
            subject = faker.helpers.arrayElement([
              `Meeting: ${rfq.title} Discussion`,
              `In-Person Review - RFQ ${rfq.rfqNumber}`,
              `Contract Negotiation Meeting`,
              `Product Specification Meeting`
            ]);
            content = faker.helpers.arrayElement([
              `Met with ${customer?.contactPerson || 'customer team'} to review quotation in detail. Discussed volume pricing, delivery schedules, and payment terms.`,
              `Face-to-face meeting to go through technical requirements and pricing structure. Customer interested in long-term partnership.`,
              `Reviewed all line items in the quotation. Customer requested price adjustments on 3 items and faster delivery for urgent requirements.`,
              `Strategic meeting to discuss annual contract terms and volume commitments. Negotiated favorable pricing for both parties.`
            ]);
            break;
            
          case 'INTERNAL_NOTE':
            content = faker.helpers.arrayElement([
              `Internal note: Customer seems price-sensitive on items 1-3. Consider offering volume discount if they increase quantities.`,
              `Note: Customer has been a long-term client. Authorize up to 10% discount to close this deal.`,
              `Competitive pressure from other suppliers. Customer mentioned competitor pricing is 8% lower.`,
              `Customer requires NET 60 payment terms. Check with finance before agreeing.`,
              `Follow-up required: Customer wants to see alternative products with better margins.`,
              `Internal review: Pricing is competitive but delivery timeline needs adjustment.`
            ]);
            break;
        }

        negotiationCommunicationsData.push({
          rfqId: rfq.id,
          versionId: relatedVersion?.id || null,
          communicationType: communicationType as any,
          direction: direction as any,
          subject,
          content,
          contactPerson: direction === 'INBOUND' || communicationType !== 'INTERNAL_NOTE' ? customer?.contactPerson || faker.person.fullName() : null,
          communicationDate,
          followUpRequired,
          followUpDate,
          followUpCompleted,
          followUpCompletedAt,
          enteredByUserId: user.id,
          createdAt: new Date(communicationDate.getTime() + faker.number.int({ min: 300000, max: 3600000 })), // 5 minutes to 1 hour after communication
          updatedAt: new Date()
        });
      }
    }
    
    const insertedNegotiationCommunications = await db.insert(schema.negotiationCommunications).values(negotiationCommunicationsData).returning();
    console.log(`Inserted ${insertedNegotiationCommunications.length} negotiation communications`);

    // --- Seed SKU Negotiation History ---
    console.log('Seeding SKU negotiation history...');
    
    const changeTypes = ['PRICE_CHANGE', 'QUANTITY_CHANGE', 'BOTH'];
    const changedByOptions = ['CUSTOMER', 'INTERNAL'];
    
    const skuNegotiationHistoryData = [];
    
    // Create SKU changes for RFQs that have communications
    const rfqsWithCommunications = [...new Set(insertedNegotiationCommunications.map(comm => comm.rfqId))];
    
    for (const rfqId of rfqsWithCommunications) {
      const rfq = insertedRfqs.find(r => r.id === rfqId);
      if (!rfq) continue;
      
      const rfqItems = insertedRfqItems.filter(item => item.rfqId === rfqId);
      const communications = insertedNegotiationCommunications.filter(comm => comm.rfqId === rfqId);
      const versions = insertedQuotationVersions.filter(v => v.rfqId === rfqId);
      
      // Create 1-3 SKU changes per RFQ
      const numChanges = faker.number.int({ min: 1, max: Math.min(3, rfqItems.length) });
      const selectedItems = faker.helpers.arrayElements(rfqItems, numChanges);
      
      for (const item of selectedItems) {
        if (!item.internalProductId) continue;
        
        const changeType = getRandomElement(changeTypes);
        const changedBy = getRandomElement(changedByOptions);
        const relatedCommunication = faker.datatype.boolean(0.7) ? getRandomElement(communications) : null;
        const relatedVersion = faker.datatype.boolean(0.5) ? getRandomElement(versions) : null;
        const user = getRandomElement(insertedUsers.filter(u => ['SALES', 'MANAGER', 'ADMIN'].includes(u.role)));
        
        // Generate realistic old and new values
        let oldQuantity = item.quantity;
        let newQuantity = item.quantity;
        let oldUnitPrice = item.suggestedPrice;
        let newUnitPrice = item.suggestedPrice;
        
        if (changeType === 'QUANTITY_CHANGE' || changeType === 'BOTH') {
          // Quantity changes typically involve increases or decreases of 10-50%
          const quantityMultiplier = faker.number.float({ min: 0.5, max: 1.8 });
          newQuantity = Math.max(1, Math.round(oldQuantity * quantityMultiplier));
        }
        
        if (changeType === 'PRICE_CHANGE' || changeType === 'BOTH') {
          // Price changes typically involve 5-20% adjustments
          const priceMultiplier = changedBy === 'CUSTOMER' 
            ? faker.number.float({ min: 0.8, max: 0.95 }) // Customers usually want lower prices
            : faker.number.float({ min: 0.95, max: 1.15 }); // Internal adjustments can go either way
          newUnitPrice = parseFloat((oldUnitPrice * priceMultiplier).toFixed(2));
        }
        
        // Generate realistic change reasons
        const changeReasons = {
          'PRICE_CHANGE': changedBy === 'CUSTOMER' ? [
            'Customer requested volume discount pricing',
            'Competitive pricing pressure from other suppliers',
            'Long-term contract pricing negotiation',
            'Price match request for existing customer',
            'Budget constraints requiring price reduction'
          ] : [
            'Updated pricing based on current market conditions',
            'Volume discount applied for increased quantities',
            'Promotional pricing for new product line',
            'Cost adjustment due to supplier price changes',
            'Strategic pricing to win long-term contract'
          ],
          'QUANTITY_CHANGE': [
            'Updated requirements based on actual needs',
            'Inventory optimization - adjusting order quantities',
            'Budget reallocation affecting quantity requirements',
            'Seasonal demand adjustment',
            'Project scope change requiring quantity modification',
            'Consolidating orders from multiple locations'
          ],
          'BOTH': [
            'Volume pricing tier adjustment with quantity increase',
            'Customer renegotiated both price and quantity for better terms',
            'Project rescoping affecting both pricing and quantities',
            'Annual contract renegotiation with updated volumes',
            'Market conditions requiring comprehensive pricing review'
          ]
        };
        
        const changeReason = getRandomElement(changeReasons[changeType]);
        
        // Create change record with realistic timestamp
        const changeDate = relatedCommunication 
          ? new Date(relatedCommunication.communicationDate.getTime() + faker.number.int({ min: 1800000, max: 86400000 })) // 30 minutes to 1 day after communication
          : new Date(Date.now() - faker.number.int({ min: 86400000, max: 2592000000 })); // 1 day to 30 days ago
        
        skuNegotiationHistoryData.push({
          rfqId: rfqId,
          skuId: item.internalProductId,
          versionId: relatedVersion?.id || null,
          communicationId: relatedCommunication?.id || null,
          changeType: changeType as any,
          oldQuantity: changeType === 'PRICE_CHANGE' ? null : oldQuantity,
          newQuantity: changeType === 'PRICE_CHANGE' ? null : newQuantity,
          oldUnitPrice: changeType === 'QUANTITY_CHANGE' ? null : oldUnitPrice,
          newUnitPrice: changeType === 'QUANTITY_CHANGE' ? null : newUnitPrice,
          changeReason,
          changedBy: changedBy as any,
          enteredByUserId: user.id,
          createdAt: changeDate
        });
      }
    }
    
    const insertedSkuNegotiationHistory = await db.insert(schema.skuNegotiationHistory).values(skuNegotiationHistoryData).returning();
    console.log(`Inserted ${insertedSkuNegotiationHistory.length} SKU negotiation history records`);

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