// scripts/seed.ts

import { db, migrationClient } from '../db'; // Use migrationClient for seeding
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

type User = typeof schema.users.$inferSelect;

// Helper to get a random element or undefined
function getRandomElement<T>(arr: T[], probability = 1.0): T | undefined {
  if (arr.length === 0 || Math.random() > probability) {
    return undefined;
  }
  return faker.helpers.arrayElement(arr);
}

async function main() {
  console.log('Seeding database...');

  try {
    // Clear existing data (ensure correct order or use CASCADE)
    console.log('Truncating tables...');
    await db.execute(sql`TRUNCATE TABLE
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
      email_templates,
      settings,
      users
      RESTART IDENTITY CASCADE`); // Use RESTART IDENTITY and CASCADE
    console.log('Tables truncated.');

    // --- Seed Users ---
    console.log('Seeding users...');
    const userRoles = schema.userRoleEnum.enumValues;
    const departments = ['Administration', 'Procurement', 'Sales', 'Marketing', 'Engineering', 'Finance', 'HR'];
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const usersData: Omit<typeof schema.users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { email: 'admin@example.com', name: 'Admin User', password: hashedPassword, role: 'ADMIN', department: 'Administration' },
      { email: 'manager@example.com', name: 'Manager User', password: hashedPassword, role: 'MANAGER', department: 'Procurement' },
      { email: 'employee@example.com', name: 'Employee User', password: hashedPassword, role: 'EMPLOYEE', department: 'Sales' },
      ...Array(15).fill(null).map((_, index) => ({
        email: faker.internet.email({ firstName: `emp${index}` }),
        name: faker.person.fullName(),
        password: hashedPassword,
        role: faker.helpers.arrayElement(userRoles),
        department: faker.helpers.arrayElement(departments),
      }))
    ];
    const insertedUsers = await db.insert(schema.users).values(usersData).returning();
    console.log(`Inserted ${insertedUsers.length} users`);
    const adminUser = insertedUsers.find(u => u.role === 'ADMIN');
    const managerUser = insertedUsers.find(u => u.role === 'MANAGER');

    // --- Seed Vendors ---
    console.log('Seeding vendors...');
    const vendorCategories = ['IT', 'Office Supplies', 'Construction', 'Services', 'Manufacturing', 'Logistics'];
    const vendorsData: Omit<typeof schema.vendors.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = Array(30).fill(null).map(() => ({
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.stateAbbr()} ${faker.location.zipCode()}`,
      contactPerson: faker.person.fullName(),
      category: faker.helpers.arrayElement(vendorCategories),
      isActive: faker.datatype.boolean(0.9),
      quickbooksId: `QB-VEND-${faker.string.alphanumeric(8)}`
    }));
    const insertedVendors = await db.insert(schema.vendors).values(vendorsData).returning();
    console.log(`Inserted ${insertedVendors.length} vendors`);

    // --- Seed Inventory Items ---
    console.log('Seeding inventory items...');
    const inventoryItemsData: Omit<typeof schema.inventoryItems.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = Array(100).fill(null).map(() => {
       const costCad = parseFloat(faker.commerce.price({ min: 5, max: 1500 }));
       const stock = faker.number.int({ min: 0, max: 500 });
       const lowStockThreshold = faker.number.int({ min: 5, max: 25});
       return {
            sku: `${faker.commerce.productAdjective().substring(0,3).toUpperCase()}${faker.string.alphanumeric(5)}`.toUpperCase(),
            description: faker.commerce.productName() + ' - ' + faker.commerce.productDescription().substring(0, 50),
            stock: stock,
            costCad: costCad,
            costUsd: parseFloat((costCad * (0.7 + Math.random() * 0.1)).toFixed(2)), // Approximate USD cost
            lowStockThreshold: lowStockThreshold,
            lastSaleDate: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
            quickbooksItemId: `QB-ITEM-${faker.string.alphanumeric(8)}`,
        };
    });
    const insertedInventoryItems = await db.insert(schema.inventoryItems).values(inventoryItemsData).returning();
    console.log(`Inserted ${insertedInventoryItems.length} inventory items`);

    // --- Seed SKU Mappings & Variations ---
    console.log('Seeding SKU mappings and variations...');
    const skuMappingsData: Omit<typeof schema.skuMappings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const skuVariationsData: Omit<typeof schema.skuVariations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // Create mappings for a subset of inventory items
    const itemsToMap = faker.helpers.arrayElements(insertedInventoryItems, Math.floor(insertedInventoryItems.length * 0.4)); // Map 40% of items

    for (const item of itemsToMap) {
        skuMappingsData.push({
            standardSku: item.sku,
            standardDescription: item.description,
        });
    }
    const insertedSkuMappings = await db.insert(schema.skuMappings).values(skuMappingsData).returning();
    console.log(`Inserted ${insertedSkuMappings.length} SKU mappings`);

    for (const mapping of insertedSkuMappings) {
        const numVariations = faker.number.int({ min: 1, max: 4 });
        for (let i = 0; i < numVariations; i++) {
            const sourceVendor = getRandomElement(insertedVendors); // Use vendors as potential sources
            const variationSku = `${mapping.standardSku}-${faker.string.alpha(2).toUpperCase()}${i}`;
            skuVariationsData.push({
                mappingId: mapping.id, // This will be set after insertion
                variationSku: variationSku,
                source: sourceVendor ? sourceVendor.name : faker.company.name(),
            });
        }
    }
    // Batch insert variations (needs mappingId)
    const variationsToInsert = skuVariationsData.map(variation => ({
        ...variation,
        mappingId: insertedSkuMappings.find(m => m.standardSku === variation.variationSku.split('-')[0])?.id // Find mapping ID - adjust if SKU format differs
    })).filter(v => v.mappingId != null); // Filter out any potentially missed mappings

    if (variationsToInsert.length > 0) {
        const insertedSkuVariations = await db.insert(schema.skuVariations).values(variationsToInsert as any).returning(); // Cast needed because mappingId was potentially undefined
        console.log(`Inserted ${insertedSkuVariations.length} SKU variations`);
    } else {
         console.log('Inserted 0 SKU variations (check mapping logic if unexpected)');
    }


    // --- Seed RFQs ---
    console.log('Seeding RFQs...');
    const rfqStatuses = schema.rfqStatusEnum.enumValues;
    const rfqsData: Omit<typeof schema.rfqs.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = Array(50).fill(null).map(() => {
      const randomUser = getRandomElement(insertedUsers)!; // Assume at least one user
      const randomVendor = getRandomElement(insertedVendors, 0.8); // 80% chance of having a vendor initially
      const status = faker.helpers.arrayElement(rfqStatuses);
      const isApprovedOrCompleted = ['APPROVED', 'COMPLETED'].includes(status);
      const approver = isApprovedOrCompleted ? getRandomElement([adminUser, managerUser].filter(Boolean) as User[]) : undefined;

      return {
        title: `RFQ: ${faker.commerce.department()} Supplies - ${faker.string.uuid().substring(0, 8)}`,
        description: faker.lorem.paragraph(),
        requestorId: randomUser.id,
        vendorId: randomVendor?.id,
        status: status,
        dueDate: faker.date.between({ from: new Date(), to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }).toISOString().split('T')[0], // Within next 60 days
        attachments: faker.datatype.boolean(0.3) ? [faker.system.fileName({ extensionCount: 1 })] : [],
        totalBudget: faker.datatype.boolean(0.6) ? parseFloat(faker.finance.amount({ min: 500, max: 100000, dec: 2 })) : undefined,
        approvedBy: approver?.id,
        rejectionReason: status === 'REJECTED' ? faker.lorem.sentence() : undefined,
      };
    });
    const insertedRfqs = await db.insert(schema.rfqs).values(rfqsData).returning();
    console.log(`Inserted ${insertedRfqs.length} RFQs`);

    // --- Seed RFQ Items (linked to Inventory) ---
    console.log('Seeding RFQ items...');
    const rfqItemsData: Omit<typeof schema.rfqItems.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    for (const rfq of insertedRfqs) {
      const numItems = faker.number.int({ min: 1, max: 10 });
      const potentialItems = faker.helpers.arrayElements(insertedInventoryItems, numItems);
      for (const inventoryItem of potentialItems) {
        rfqItemsData.push({
          rfqId: rfq.id,
          // inventoryItemId: inventoryItem.id, // Link to inventory item
          name: inventoryItem.description, // Use inventory description as default name
          description: faker.lorem.sentence(5), // Can add more specific notes here
          quantity: faker.number.int({ min: 1, max: 200 }),
          unit: faker.helpers.arrayElement(['pcs', 'box', 'ea', 'unit']),
          estimatedPrice: parseFloat(faker.finance.amount({ min: inventoryItem.costCad!, max: inventoryItem.costCad! * 2, dec: 2 })), // Estimate based on cost
        });
      }
    }
    const insertedRfqItems = await db.insert(schema.rfqItems).values(rfqItemsData).returning();
    console.log(`Inserted ${insertedRfqItems.length} RFQ items`);

    // --- Seed Quotations ---
    console.log('Seeding quotations...');
    const quotationsData: Omit<typeof schema.quotations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    let selectedQuotationIds = new Set<number>(); // Track selected quotations per RFQ

    for (const rfq of insertedRfqs.filter(r => ['IN_REVIEW', 'APPROVED', 'COMPLETED'].includes(r.status))) {
      const numQuotations = faker.number.int({ min: 0, max: 5 }); // Some RFQs might not get quotes
      let hasSelectedQuote = false;
      for (let i = 0; i < numQuotations; i++) {
        const randomVendor = getRandomElement(insertedVendors)!; // Assume vendors exist
        // Only select one quotation if the RFQ is 'COMPLETED'
        const isSelected = !hasSelectedQuote && rfq.status === 'COMPLETED' && faker.datatype.boolean(0.8); // 80% chance the first quote for a completed RFQ is selected
        if (isSelected) {
          hasSelectedQuote = true;
          selectedQuotationIds.add(rfq.id); // Mark RFQ as having a selected quote
        }

        // Recalculate total based on potential items later
        const tempTotal = parseFloat(faker.finance.amount({ min: 500, max: rfq.totalBudget || 100000, dec: 2 }));

        quotationsData.push({
          rfqId: rfq.id,
          vendorId: randomVendor.id,
          totalAmount: tempTotal, // Will be updated after items are added
          deliveryTime: `${faker.number.int({ min: 1, max: 6 })} ${faker.helpers.arrayElement(['days', 'weeks'])}`,
          validUntil: faker.date.future({ years: 0.5 }).toISOString().split('T')[0], // Valid for up to 6 months
          termsAndConditions: faker.lorem.sentences(2),
          attachments: faker.datatype.boolean(0.4) ? [faker.system.fileName({ extensionCount: 1 })] : [],
          isSelected: isSelected,
        });
      }
    }
    const insertedQuotations = await db.insert(schema.quotations).values(quotationsData).returning();
    console.log(`Inserted ${insertedQuotations.length} quotations`);

    // --- Seed Quotation Items & Update Quotation Totals ---
    console.log('Seeding quotation items and updating totals...');
    const quotationItemsData: Omit<typeof schema.quotationItems.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const quotationTotalUpdates: { id: number, totalAmount: number }[] = [];

    for (const quotation of insertedQuotations) {
      const rfqItemsForQuote = insertedRfqItems.filter(item => item.rfqId === quotation.rfqId);
      let currentQuotationTotal = 0;

      for (const rfqItem of rfqItemsForQuote) {
        const quantity = rfqItem.quantity;
        // Price slightly different from estimate
        const unitPrice = parseFloat(faker.finance.amount({ min: rfqItem.estimatedPrice! * 0.8, max: rfqItem.estimatedPrice! * 1.2, dec: 2 }));
        const totalPrice = quantity * unitPrice;
        currentQuotationTotal += totalPrice;

        quotationItemsData.push({
          quotationId: quotation.id,
          rfqItemId: rfqItem.id,
          unitPrice: unitPrice,
          quantity: quantity,
          totalPrice: parseFloat(totalPrice.toFixed(2)),
          description: `Quoted price for ${rfqItem.name}`,
        });
      }
      // Store update for quotation total
      quotationTotalUpdates.push({ id: quotation.id, totalAmount: parseFloat(currentQuotationTotal.toFixed(2)) });
    }

    if (quotationItemsData.length > 0) {
      const insertedQuotationItems = await db.insert(schema.quotationItems).values(quotationItemsData).returning();
      console.log(`Inserted ${insertedQuotationItems.length} quotation items`);
    } else {
        console.log(`Inserted 0 quotation items`);
    }


    // Update quotation totals
    console.log(`Updating ${quotationTotalUpdates.length} quotation totals...`);
    for (const update of quotationTotalUpdates) {
      await db.update(schema.quotations)
        .set({ totalAmount: update.totalAmount, updatedAt: new Date() })
        .where(sql`${schema.quotations.id} = ${update.id}`);
    }
    console.log('Quotation totals updated.');


    // --- Seed Comments ---
    console.log('Seeding comments...');
    const commentsData: Omit<typeof schema.comments.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    for (const rfq of insertedRfqs) {
      const numComments = faker.number.int({ min: 0, max: 5 });
      for (let i = 0; i < numComments; i++) {
        const randomUser = getRandomElement(insertedUsers)!;
        commentsData.push({
          content: faker.lorem.paragraph(2),
          userId: randomUser.id,
          rfqId: rfq.id,
        });
      }
    }
     if (commentsData.length > 0) {
        const insertedComments = await db.insert(schema.comments).values(commentsData).returning();
        console.log(`Inserted ${insertedComments.length} comments`);
     } else {
        console.log(`Inserted 0 comments`);
     }

    // --- Seed Email Templates ---
    console.log('Seeding email templates...');
    const emailTemplatesData: Omit<typeof schema.emailTemplates.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'RFQ Created Notification', subject: 'New RFQ Created: {{rfq_title}}', body: '...', variables: ['rfq_title', 'requestor_name', 'due_date'], isActive: true },
      { name: 'RFQ Approval Request', subject: 'Approval Required for RFQ: {{rfq_title}}', body: '...', variables: ['rfq_title', 'rfq_id', 'approver_name'], isActive: true },
      { name: 'Quotation Request Sent', subject: 'Request for Quotation: {{rfq_title}}', body: '...', variables: ['vendor_name', 'rfq_title', 'due_date'], isActive: true },
      { name: 'Quotation Received Notification', subject: 'Quotation Received for RFQ: {{rfq_title}} from {{vendor_name}}', body: '...', variables: ['rfq_title', 'vendor_name', 'total_amount'], isActive: true },
    ];
    const insertedEmailTemplates = await db.insert(schema.emailTemplates).values(emailTemplatesData).returning();
    console.log(`Inserted ${insertedEmailTemplates.length} email templates`);

    // --- Seed Settings ---
    console.log('Seeding settings...');
    const settingsData: Omit<typeof schema.settings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { key: 'default_currency', value: 'CAD', description: 'Default system currency', updatedBy: adminUser?.id },
      { key: 'tax_rate_percent', value: '13', description: 'Default Tax Rate (%)', updatedBy: adminUser?.id },
      { key: 'quickbooks_sync_frequency_hours', value: '24', description: 'How often to sync with QuickBooks (in hours)', updatedBy: adminUser?.id },
      { key: 'marketplace_data_enabled', value: 'true', description: 'Enable fetching data from marketplaces', updatedBy: adminUser?.id },
      { key: 'email_parsing_enabled', value: 'true', description: 'Enable automatic parsing of RFQ emails', updatedBy: adminUser?.id },
    ];
    const insertedSettings = await db.insert(schema.settings).values(settingsData).returning();
    console.log(`Inserted ${insertedSettings.length} settings`);

    // --- Seed Audit Log (Example Entries) ---
    console.log('Seeding example audit log entries...');
    const auditLogData: Omit<typeof schema.auditLog.$inferInsert, 'id' | 'timestamp'>[] = [];
    const rfqsToLog = faker.helpers.arrayElements(insertedRfqs, 10); // Log for 10 RFQs

    for (const rfq of rfqsToLog) {
        const creator = insertedUsers.find(u => u.id === rfq.requestorId);
        // RFQ Created
        auditLogData.push({
            userId: rfq.requestorId,
            action: 'RFQ Created',
            entityType: 'RFQ',
            entityId: rfq.id,
            details: { title: rfq.title, requestor: creator?.name }
        });
        // Status Change Example
        if (rfq.status !== 'PENDING') {
             const updater = getRandomElement(insertedUsers)!;
             auditLogData.push({
                userId: updater.id,
                action: `Status changed to ${rfq.status}`,
                entityType: 'RFQ',
                entityId: rfq.id,
                details: { previousStatus: 'PENDING', newStatus: rfq.status, updatedBy: updater.name }
            });
        }
        // Approval Example
        if (rfq.approvedBy) {
            const approver = insertedUsers.find(u => u.id === rfq.approvedBy);
            auditLogData.push({
                userId: rfq.approvedBy,
                action: `RFQ Approved`,
                entityType: 'RFQ',
                entityId: rfq.id,
                details: { approver: approver?.name }
            });
        }
    }
    if (auditLogData.length > 0) {
        const insertedAuditLogs = await db.insert(schema.auditLog).values(auditLogData).returning();
        console.log(`Inserted ${insertedAuditLogs.length} audit log entries`);
    } else {
        console.log(`Inserted 0 audit log entries`);
    }


    console.log('Seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1); // Exit with error code
  } finally {
    console.log("Closing database connection...");
    await migrationClient.end(); // Ensure the connection is closed
    console.log("Database connection closed.");
  }
}

main(); // Run the seeding function







// import { db } from '../db';
// import * as schema from '../db/schema';
// import { sql } from 'drizzle-orm';
// import { faker } from '@faker-js/faker';
// import * as bcrypt from 'bcrypt';

// async function main() {
//   console.log('Seeding database...');

//   try {
//     // Clear existing data (in reverse order of dependencies)
//     await db.execute(sql`TRUNCATE TABLE 
//       comments, 
//       quotation_items, 
//       quotations, 
//       rfq_items, 
//       rfqs, 
//       vendors, 
//       email_templates, 
//       settings, 
//       users 
//       CASCADE`);
    
//     // Seed users
//     const userRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;
//     const departments = ['Administration', 'Procurement', 'Sales', 'Marketing', 'Engineering', 'Finance', 'HR'];
//     const hashedPassword = await bcrypt.hash('Password123!', 10);
    
//     const usersData: Omit<typeof schema.users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [
//       {
//         email: 'admin@example.com',
//         name: 'Admin User',
//         password: hashedPassword,
//         role: 'ADMIN' as typeof schema.userRoleEnum.enumValues[number],
//         department: 'Administration',
//       },
//       {
//         email: 'manager@example.com',
//         name: 'Manager User',
//         password: hashedPassword,
//         role: 'MANAGER' as typeof schema.userRoleEnum.enumValues[number],
//         department: 'Procurement',
//       },
//       ...Array(10).fill(null).map((_, index) => ({
//         email: `employee${index + 1}@example.com`,
//         name: faker.person.fullName(),
//         password: hashedPassword,
//         role: 'EMPLOYEE' as typeof schema.userRoleEnum.enumValues[number],
//         department: faker.helpers.arrayElement(departments),
//       }))
//     ];

//     const insertedUsers = await db.insert(schema.users).values(usersData).returning();
//     console.log(`Inserted ${insertedUsers.length} users`);

//     // Seed vendors
//     const vendorCategories = ['IT', 'Office Supplies', 'Construction', 'Services', 'Manufacturing'];
//     const vendorsData: Omit<typeof schema.vendors.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = Array(20).fill(null).map(() => ({
//       name: faker.company.name(),
//       email: faker.internet.email(),
//       phone: faker.phone.number(),
//       address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}, ${faker.location.zipCode()}`,
//       contactPerson: faker.person.fullName(),
//       category: faker.helpers.arrayElement(vendorCategories),
//       isActive: faker.datatype.boolean(0.8),
//       quickbooksId: faker.string.alphanumeric(10)
//     }));

//     const insertedVendors = await db.insert(schema.vendors).values(vendorsData).returning();
//     console.log(`Inserted ${insertedVendors.length} vendors`);

//     // Seed RFQs
//     const rfqStatuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'] as const;
//     const rfqsData: Omit<typeof schema.rfqs.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = Array(30).fill(null).map(() => {
//       const randomUser = faker.helpers.arrayElement(insertedUsers);
//       const randomVendor = faker.helpers.arrayElement(insertedVendors);
//       const status = faker.helpers.arrayElement(rfqStatuses);
//       return {
//         title: `RFQ for ${faker.commerce.productName()}`,
//         description: faker.lorem.paragraphs(2),
//         requestorId: randomUser.id,
//         vendorId: randomVendor.id,
//         status: status,
//         dueDate: faker.date.future().toISOString().split('T')[0],
//         attachments: [faker.system.fileName(), faker.system.fileName()],
//         totalBudget: parseFloat(faker.finance.amount(1000, 50000, 2)),
//         approvedBy: (status === 'APPROVED' || status === 'COMPLETED') ? insertedUsers.find(u => u.role === 'ADMIN' || u.role === 'MANAGER')?.id : undefined,
//         rejectionReason: status === 'REJECTED' ? faker.lorem.paragraph() : undefined,
//       };
//     });

//     const insertedRfqs = await db.insert(schema.rfqs).values(rfqsData).returning();
//     console.log(`Inserted ${insertedRfqs.length} RFQs`);

//     // Seed RFQ items
//     const rfqItemsData: Omit<typeof schema.rfqItems.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
//     for (const rfq of insertedRfqs) {
//       const numItems = faker.number.int({ min: 2, max: 8 });
//       for (let i = 0; i < numItems; i++) {
//         rfqItemsData.push({
//           rfqId: rfq.id,
//           name: faker.commerce.productName(),
//           description: faker.commerce.productDescription(),
//           quantity: faker.number.int({ min: 1, max: 100 }),
//           unit: faker.helpers.arrayElement(['pieces', 'kg', 'boxes', 'hours', 'units']),
//           estimatedPrice: parseFloat(faker.finance.amount(10, 5000, 2)),
//         });
//       }
//     }
//     const insertedRfqItems = await db.insert(schema.rfqItems).values(rfqItemsData).returning();
//     console.log(`Inserted ${insertedRfqItems.length} RFQ items`);

//     // Seed quotations
//     const quotationsData: Omit<typeof schema.quotations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
//     for (const rfq of insertedRfqs.filter(r => ['IN_REVIEW', 'APPROVED', 'COMPLETED'].includes(r.status))) {
//       const numQuotations = faker.number.int({ min: 1, max: 5 });
//       for (let i = 0; i < numQuotations; i++) {
//         const randomVendor = faker.helpers.arrayElement(insertedVendors);
//         const isSelected = i === 0 && rfq.status === 'COMPLETED';
//         quotationsData.push({
//           rfqId: rfq.id,
//           vendorId: randomVendor.id,
//           totalAmount: parseFloat(faker.finance.amount(1000, 60000, 2)),
//           deliveryTime: `${faker.number.int({ min: 1, max: 12 })} ${faker.helpers.arrayElement(['days', 'weeks', 'months'])}`,
//           validUntil: faker.date.future().toISOString().split('T')[0],
//           termsAndConditions: faker.lorem.paragraphs(1),
//           attachments: [faker.system.fileName()],
//           isSelected: isSelected,
//         });
//       }
//     }
//     const insertedQuotations = await db.insert(schema.quotations).values(quotationsData).returning();
//     console.log(`Inserted ${insertedQuotations.length} quotations`);

//     // Seed quotation items
//     const quotationItemsData: Omit<typeof schema.quotationItems.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
//     for (const quotation of insertedQuotations) {
//       const rfqItems = insertedRfqItems.filter(item => item.rfqId === quotation.rfqId);
//       for (const rfqItem of rfqItems) {
//         const quantity = rfqItem.quantity;
//         const unitPrice = parseFloat(faker.finance.amount(5, 2000, 2));
//         const totalPrice = quantity * unitPrice;
//         quotationItemsData.push({
//           quotationId: quotation.id,
//           rfqItemId: rfqItem.id,
//           unitPrice: unitPrice,
//           quantity: quantity,
//           totalPrice: totalPrice,
//           description: faker.lorem.sentence(),
//         });
//       }
//     }
//     const insertedQuotationItems = await db.insert(schema.quotationItems).values(quotationItemsData).returning();
//     console.log(`Inserted ${insertedQuotationItems.length} quotation items`);

//     // Seed comments
//     const commentsData: Omit<typeof schema.comments.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>[] = [];
//     for (const rfq of insertedRfqs) {
//       const numComments = faker.number.int({ min: 0, max: 8 });
//       for (let i = 0; i < numComments; i++) {
//         const randomUser = faker.helpers.arrayElement(insertedUsers);
//         commentsData.push({
//           content: faker.lorem.paragraph(),
//           userId: randomUser.id,
//           rfqId: rfq.id,
//         });
//       }
//     }
//     const insertedComments = await db.insert(schema.comments).values(commentsData).returning();
//     console.log(`Inserted ${insertedComments.length} comments`);

//     // Seed email templates
//     const emailTemplatesData = [
//       {
//         name: 'RFQ Created',
//         subject: 'New RFQ: {{rfq_title}} - Action Required',
//         body: `<p>Dear {{recipient_name}},</p>
//               <p>A new RFQ titled <strong>{{rfq_title}}</strong> has been created and requires your attention.</p>
//               <p>Details:</p>
//               <ul>
//                 <li>RFQ ID: {{rfq_id}}</li>
//                 <li>Created by: {{requestor_name}}</li>
//                 <li>Due date: {{due_date}}</li>
//               </ul>
//               <p>Please log in to the system to review the details.</p>
//               <p>Best regards,<br>RFQ Automation System</p>`,
//         variables: ['recipient_name', 'rfq_title', 'rfq_id', 'requestor_name', 'due_date'],
//         isActive: true
//       },
//       {
//         name: 'RFQ Approved',
//         subject: 'RFQ Approved: {{rfq_title}}',
//         body: `<p>Dear {{recipient_name}},</p>
//               <p>The RFQ titled <strong>{{rfq_title}}</strong> has been approved.</p>
//               <p>You can now proceed with sending this to vendors.</p>
//               <p>Best regards,<br>RFQ Automation System</p>`,
//         variables: ['recipient_name', 'rfq_title'],
//         isActive: true
//       },
//       {
//         name: 'RFQ Rejected',
//         subject: 'RFQ Rejected: {{rfq_title}}',
//         body: `<p>Dear {{recipient_name}},</p>
//               <p>The RFQ titled <strong>{{rfq_title}}</strong> has been rejected.</p>
//               <p>Reason: {{rejection_reason}}</p>
//               <p>Please revise and resubmit if necessary.</p>
//               <p>Best regards,<br>RFQ Automation System</p>`,
//         variables: ['recipient_name', 'rfq_title', 'rejection_reason'],
//         isActive: true
//       },
//       {
//         name: 'Quotation Received',
//         subject: 'New Quotation Received for {{rfq_title}}',
//         body: `<p>Dear {{recipient_name}},</p>
//               <p>A new quotation has been received for the RFQ titled <strong>{{rfq_title}}</strong>.</p>
//               <p>Vendor: {{vendor_name}}</p>
//               <p>Total Amount: {{total_amount}}</p>
//               <p>Please log in to the system to review the details.</p>
//               <p>Best regards,<br>RFQ Automation System</p>`,
//         variables: ['recipient_name', 'rfq_title', 'vendor_name', 'total_amount'],
//         isActive: true
//       }
//     ];

//     const insertedEmailTemplates = await db.insert(schema.emailTemplates).values(emailTemplatesData).returning();
//     console.log(`Inserted ${insertedEmailTemplates.length} email templates`);

//     // Seed settings
//     const settingsData = [
//       {
//         key: 'default_rfq_expiry_days',
//         value: '30',
//         description: 'Default number of days until an RFQ expires',
//         updatedBy: insertedUsers.find(u => u.role === 'ADMIN')?.id
//       },
//       {
//         key: 'notification_emails',
//         value: 'notifications@example.com',
//         description: 'Email address to send system notifications',
//         updatedBy: insertedUsers.find(u => u.role === 'ADMIN')?.id
//       },
//       {
//         key: 'quickbooks_integration_enabled',
//         value: 'false',
//         description: 'Whether QuickBooks integration is enabled',
//         updatedBy: insertedUsers.find(u => u.role === 'ADMIN')?.id
//       },
//       {
//         key: 'minimum_quotations_required',
//         value: '3',
//         description: 'Minimum number of quotations required for RFQ approval',
//         updatedBy: insertedUsers.find(u => u.role === 'ADMIN')?.id
//       }
//     ];

//     const insertedSettings = await db.insert(schema.settings).values(settingsData).returning();
//     console.log(`Inserted ${insertedSettings.length} settings`);

//     console.log('Seeding completed successfully');
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     throw error;
//   } finally {
//     // Close the database connection
//     await db.execute(sql`SELECT 1`).then(() => {
//       // Connection closed
//     });
//   }
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     process.exit(0);
//   });