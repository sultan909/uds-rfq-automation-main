// scripts/seed.ts

import { db, migrationClient } from '../db'; // Use migrationClient for seeding
import * as schema from '../db/schema';
import { sql, eq } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { type RfqStatus } from '../db/schema';

type CustomerResponseStatus = 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';

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
      quotation_response_items,
      quotation_responses,
      quotation_version_items,
      quotation_versions,
      customer_responses,
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
        email: 'orders@randmar.com',
        phone: '1-800-555-1234',
        address: '123 Business Ave, Toronto, ON M5V 2T6',
        contactPerson: 'John Smith',
        quickbooksId: 'QB-RAND2024',
        isActive: true,
        main_customer: true,
        annualVolume: 2500000,
        creditLimit: 500000,
        paymentTerms: 'Net 30'
      },
      {
        name: 'UGS',
        type: 'WHOLESALER',
        region: 'North America',
        email: 'purchasing@ugs.com',
        phone: '1-800-555-5678',
        address: '456 Enterprise Blvd, Vancouver, BC V6B 1A1',
        contactPerson: 'Sarah Johnson',
        quickbooksId: 'QB-UGS2024',
        isActive: true,
        main_customer: true,
        annualVolume: 1800000,
        creditLimit: 350000,
        paymentTerms: 'Net 45'
      },
      {
        name: 'DCS',
        type: 'WHOLESALER',
        region: 'North America',
        email: 'sales@dcs.com',
        phone: '1-800-555-9012',
        address: '789 Corporate Dr, Montreal, QC H3B 2Y5',
        contactPerson: 'Michael Chen',
        quickbooksId: 'QB-DCS2024',
        isActive: true,
        main_customer: true,
        annualVolume: 3200000,
        creditLimit: 600000,
        paymentTerms: 'Net 30'
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
    const productTypes = {
      TONER: ['High Yield Black', 'Standard Black', 'Cyan', 'Magenta', 'Yellow'],
      DRUM: ['Black Drum Unit', 'Color Drum Unit', 'Maintenance Kit'],
      INK: ['Black Ink', 'Color Ink Set', 'XL Black Ink', 'XL Color Ink'],
      PARTS: ['Fuser Unit', 'Transfer Belt', 'Pickup Roller', 'Separation Pad'],
      OTHER: ['Paper Tray', 'Document Feeder', 'Power Supply', 'Network Card']
    };
    
    const inventoryItemsData = Array(20).fill(null).map(() => {
      const brand = getRandomElement(brands);
      const category = getRandomElement(categories);
      const productType = getRandomElement(productTypes[category as keyof typeof productTypes]);
      
      // Randomly choose currency for cost (80% CAD, 20% USD to reflect North American business)
      const costCurrency = faker.datatype.boolean(0.8) ? 'CAD' : 'USD';
      const cost = parseFloat(faker.commerce.price({ 
        min: category === 'TONER' ? 50 : category === 'DRUM' ? 100 : category === 'INK' ? 30 : 40, 
        max: category === 'TONER' ? 200 : category === 'DRUM' ? 400 : category === 'INK' ? 150 : 300 
      }));
      
      // Generate more realistic SKUs
      const sku = `${brand.substring(0, 2).toUpperCase()}-${faker.string.alphanumeric(5).toUpperCase()}`;
      const mpn = `${brand.substring(0, 2)}${faker.string.alphanumeric(6).toUpperCase()}`;
      
      return {
        sku,
        mpn,
        brand,
        category,
        description: `${brand} ${productType} ${category === 'TONER' ? 'Toner Cartridge' : 
          category === 'DRUM' ? 'Drum Unit' : 
          category === 'INK' ? 'Ink Cartridge' : 
          category === 'PARTS' ? 'Replacement Part' : 'Accessory'}`,
        stock: faker.number.int({ min: 0, max: 100 }),
        cost,
        costCurrency,
        warehouseLocation: `Aisle ${faker.string.alpha(1).toUpperCase()}${faker.number.int({ min: 1, max: 20 })}-Shelf ${faker.number.int({ min: 1, max: 5 })}`,
        quantityOnHand: faker.number.int({ min: 0, max: 50 }),
        quantityReserved: faker.number.int({ min: 0, max: 10 }),
        lowStockThreshold: 5,
        lastSaleDate: getPastDate(faker.number.int({ min: 1, max: 30 })),
        quickbooksItemId: `QB-${faker.string.alphanumeric(8)}`,
        minOrderQuantity: category === 'TONER' ? 5 : category === 'DRUM' ? 2 : 1,
        leadTimeDays: faker.number.int({ min: 3, max: 14 }),
        reorderPoint: category === 'TONER' ? 20 : category === 'DRUM' ? 10 : 5,
        isDiscontinued: false,
        lastCostUpdate: getPastDate(faker.number.int({ min: 1, max: 90 }))
      };
    });
    
    const insertedInventoryItems = await db.insert(schema.inventoryItems).values(inventoryItemsData).returning();
    console.log(`Inserted ${insertedInventoryItems.length} inventory items`);

    // --- Seed SKU Mappings ---
    console.log('Seeding SKU mappings...');
    
    // Create SKU mappings for ALL inventory items
    const skuMappingsData = insertedInventoryItems.map(item => ({
      standardSku: item.sku,
      standardDescription: item.description
    }));
    
    const insertedSkuMappings = await db.insert(schema.skuMappings).values(skuMappingsData).returning();
    console.log(`Inserted ${insertedSkuMappings.length} SKU mappings`);

    // --- Seed SKU Variations ---
    console.log('Seeding SKU variations...');
    
    const skuVariationsData = [];
    // Create variations for ALL customers and ALL SKU mappings
    for (const mapping of insertedSkuMappings) {
      for (const customer of insertedCustomers) {
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
      // Create fewer RFQs per customer with different statuses
      const statusDistribution: { status: RfqStatus; count: number }[] = [
        { status: 'NEW', count: 3 },
        { status: 'DRAFT', count: 2 },
        { status: 'PRICED', count: 2 },
        { status: 'SENT', count: 2 },
        { status: 'NEGOTIATING', count: 3 },
        { status: 'ACCEPTED', count: 2 },
        { status: 'DECLINED', count: 1 },
        { status: 'PROCESSED', count: 1 }
      ];

      // Only create RFQs for main customers or randomly for other customers
      if (customer.main_customer || faker.datatype.boolean(0.3)) {
        for (const { status, count } of statusDistribution) {
          for (let i = 0; i < count; i++) {
            const requestor = getRandomElement(insertedUsers);
            const vendor = faker.datatype.boolean() ? getRandomElement(insertedVendors) : null;
            const dueDate = faker.datatype.boolean() ? getFutureDate(30) : null;
            const totalBudget = null; // Will be calculated after items are created
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
      unitPrice: number;
      currency: string;
      status: RfqStatus;
    }> = [];

    for (const rfq of insertedRfqs) {
      // Add 1-3 items per RFQ
      const usedItems = new Set();
      const itemCount = faker.number.int({ min: 1, max: 3 });
      
      // Get all inventory items that haven't been used in this RFQ
      const availableItems = insertedInventoryItems.filter(item => !usedItems.has(item.id));
      
      for (let i = 0; i < itemCount && i < availableItems.length; i++) {
        const inventoryItem = availableItems[i];
        usedItems.add(inventoryItem.id);
        
        if (!inventoryItem || inventoryItem.cost === null) continue;
        const cost = inventoryItem.cost as number;
        
        // Find the SKU variation for this customer and inventory item
        const skuVariation = insertedSkuVariations.find(
          sv => sv.customerId === rfq.customerId && 
               insertedSkuMappings.find(sm => sm.id === sv.mappingId)?.standardSku === inventoryItem.sku
        );

        // Calculate unit price based on cost with markup (10-50% above cost)
        const unitPrice = parseFloat(faker.commerce.price({ min: cost * 1.1, max: cost * 1.5 }));

        rfqItemsData.push({
          rfqId: rfq.id,
          name: inventoryItem.description,
          description: faker.lorem.sentence(),
          quantity: faker.number.int({ min: 1, max: 50 }),
          unit: 'pcs',
          customerSku: skuVariation?.variationSku || null,
          internalProductId: inventoryItem.id,
          unitPrice,
          currency: inventoryItem.costCurrency || 'CAD',
          status: rfq.status
        });
      }
    }
    
    const insertedRfqItems = await db.insert(schema.rfqItems).values(rfqItemsData).returning();
    console.log(`Inserted ${insertedRfqItems.length} RFQ items`);

    // --- Update RFQ Total Budgets ---
    console.log('Updating RFQ total budgets based on items...');
    for (const rfq of insertedRfqs) {
      // Calculate total budget from RFQ items
      const rfqItems = insertedRfqItems.filter(item => item.rfqId === rfq.id);
      const calculatedTotal = rfqItems.reduce((sum, item) => {
        // Use unitPrice for calculations
        const price = item.unitPrice || 0;
        return sum + (price * item.quantity);
      }, 0);

      // Update RFQ with calculated total budget (always update, even if 0)
      await db.update(schema.rfqs)
        .set({ totalBudget: parseFloat(calculatedTotal.toFixed(2)) })
        .where(eq(schema.rfqs.id, rfq.id));
      
      console.log(`Updated RFQ ${rfq.id} with total budget: ${calculatedTotal.toFixed(2)}`);
    }
    console.log('Updated RFQ total budgets');

    // --- Seed Quotations ---
    console.log('Seeding quotations...');
    
    // Fetch updated RFQs with calculated total budgets
    const updatedRfqs = await db.select().from(schema.rfqs);
    
    const quotationsData = updatedRfqs.map(rfq => {
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
      const rfq = updatedRfqs.find(r => r.id === quotation.rfqId);
      if (!rfq) return [];

      // Get all RFQ items for this RFQ
      const rfqItemsForRfq = insertedRfqItems.filter(item => item.rfqId === rfq.id);
      
      // Create quotation items for ALL RFQ items
      return rfqItemsForRfq.map(item => {
        if (!item.internalProductId) return null;
        
        // Ensure we have a valid unit price
        const unitPrice = item.unitPrice || 0;
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

    // --- Seed Customer Responses ---
    console.log('Seeding customer responses...');
    
    const customerResponsesData = [];
    for (const version of insertedQuotations) {
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
      const relatedQuotation = insertedQuotations.find(q => q.rfqId === rfq.id);
      
      for (let i = 0; i < numCommunications; i++) {
        const communicationType = getRandomElement(communicationTypes);
        const direction = getRandomElement(directions);
        const user = getRandomElement(insertedUsers.filter(u => ['SALES', 'MANAGER', 'ADMIN'].includes(u.role)));
        
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
          versionId: null,
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
    
    const changeTypes = ['PRICE_CHANGE', 'QUANTITY_CHANGE', 'BOTH'] as const;
    const changedByOptions = ['CUSTOMER', 'INTERNAL'] as const;
    
    const skuNegotiationHistoryData = [];
    
    // Create SKU changes for RFQs that have communications
    const rfqsWithCommunications = [...new Set(insertedNegotiationCommunications.map(comm => comm.rfqId))];
    
    for (const rfqId of rfqsWithCommunications) {
      const rfq = insertedRfqs.find(r => r.id === rfqId);
      if (!rfq) continue;
      
      const rfqItems = insertedRfqItems.filter(item => item.rfqId === rfqId);
      const user = getRandomElement(insertedUsers);

      for (const item of rfqItems) {
        if (!item.internalProductId) continue;

        const changeType = getRandomElement([...changeTypes]); // Convert readonly array to mutable array
        const changedBy = getRandomElement([...changedByOptions]); // Convert readonly array to mutable array
        let oldQuantity = item.quantity;
        let newQuantity = item.quantity;
                  let oldUnitPrice = item.unitPrice ?? 0;
        let newUnitPrice = oldUnitPrice;

        if (changeType === 'QUANTITY_CHANGE' || changeType === 'BOTH') {
          const quantityMultiplier = faker.number.float({ min: 0.5, max: 1.8 });
          newQuantity = Math.max(1, Math.round(oldQuantity * quantityMultiplier));
        }
        
        if (changeType === 'PRICE_CHANGE' || changeType === 'BOTH') {
          const priceMultiplier = changedBy === 'CUSTOMER' 
            ? faker.number.float({ min: 0.8, max: 0.95 })
            : faker.number.float({ min: 0.95, max: 1.15 });
          newUnitPrice = parseFloat((oldUnitPrice * priceMultiplier).toFixed(2));
        }

        // Generate realistic change reasons
        const changeReasons: Record<string, string[]> = {
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
        
        const changeReason = getRandomElement(changeReasons[changeType] || []);
        
        // Create change record with realistic timestamp
        const changeDate = new Date(Date.now() - faker.number.int({ min: 86400000, max: 2592000000 })); // 1 day to 30 days ago
        
        skuNegotiationHistoryData.push({
          rfqId,
          skuId: item.internalProductId,
          versionId: null,
          communicationId: null,
          changeType: changeType as string,
          oldQuantity,
          newQuantity,
          oldUnitPrice,
          newUnitPrice,
          changeReason: faker.lorem.sentence(),
          changedBy: changedBy as string,
          enteredByUserId: user.id,
          createdAt: new Date()
        });
      }
    }
    
    const insertedSkuNegotiationHistory = await db.insert(schema.skuNegotiationHistory).values(skuNegotiationHistoryData).returning();
    console.log(`Inserted ${insertedSkuNegotiationHistory.length} SKU negotiation history records`);

    // --- Seed Sales History ---
    console.log('Seeding sales history...');
    
    const salesHistoryData = [];
    
    // Create sales history for main customers (Randmar, UGS, DCS) over the past 2 years
    const mainCustomers = insertedCustomers.filter(c => c.main_customer);
    
    for (const customer of mainCustomers) {
      // Create 20-50 sales records per main customer
      const salesCount = faker.number.int({ min: 20, max: 50 });
      
      for (let i = 0; i < salesCount; i++) {
        // Random inventory item
        const product = getRandomElement(insertedInventoryItems);
        if (!product) continue;
        
        // Generate realistic sales data
        const quantity = faker.number.int({ min: 1, max: 100 });
        const cost = product.cost || 50;
        
        // Sales price should be 15-50% above cost for realistic margins
        const unitPrice = parseFloat(faker.commerce.price({ 
          min: cost * 1.15, 
          max: cost * 1.5 
        }));
        
        const extendedPrice = parseFloat((unitPrice * quantity).toFixed(2));
        
        // Random sale date within last 2 years
        const saleDate = faker.date.between({ 
          from: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), // 2 years ago
          to: new Date() 
        });
        
        salesHistoryData.push({
          invoiceNumber: `INV-${faker.string.numeric(6)}`,
          customerId: customer.id,
          productId: product.id,
          quantity,
          unitPrice,
          extendedPrice,
          currency: product.costCurrency || 'CAD',
          saleDate: formatDateToISOString(saleDate),
          quickbooksInvoiceId: `QB-INV-${faker.string.alphanumeric(8)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // Create fewer sales records for other customers
    const otherCustomers = insertedCustomers.filter(c => !c.main_customer);
    for (const customer of otherCustomers) {
      if (faker.datatype.boolean(0.6)) { // 60% chance of having sales history
        const salesCount = faker.number.int({ min: 2, max: 10 });
        
        for (let i = 0; i < salesCount; i++) {
          const product = getRandomElement(insertedInventoryItems);
          if (!product) continue;
          
          const quantity = faker.number.int({ min: 1, max: 25 });
          const cost = product.cost || 50;
          const unitPrice = parseFloat(faker.commerce.price({ 
            min: cost * 1.15, 
            max: cost * 1.5 
          }));
          const extendedPrice = parseFloat((unitPrice * quantity).toFixed(2));
          
          const saleDate = faker.date.between({ 
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
            to: new Date() 
          });
          
          salesHistoryData.push({
            invoiceNumber: `INV-${faker.string.numeric(6)}`,
            customerId: customer.id,
            productId: product.id,
            quantity,
            unitPrice,
            extendedPrice,
            currency: product.costCurrency || 'CAD',
            saleDate: formatDateToISOString(saleDate),
            quickbooksInvoiceId: `QB-INV-${faker.string.alphanumeric(8)}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    const insertedSalesHistory = await db.insert(schema.salesHistory).values(salesHistoryData).returning();
    console.log(`Inserted ${insertedSalesHistory.length} sales history records`);

    // --- Seed Purchase Orders ---
    console.log('Seeding purchase orders...');
    
    const poStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'];
    const purchaseOrdersData = [];
    
    // Create 10-15 purchase orders across all vendors
    for (const vendor of insertedVendors) {
      const poCount = faker.number.int({ min: 2, max: 4 });
      
      for (let i = 0; i < poCount; i++) {
        const status = getRandomElement(poStatuses);
        const orderDate = faker.date.between({ 
          from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
          to: new Date() 
        });
        
        // Expected arrival date should be after order date
        const expectedArrivalDate = status === 'CANCELLED' ? null : 
          formatDateToISOString(new Date(orderDate.getTime() + faker.number.int({ min: 7, max: 45 }) * 24 * 60 * 60 * 1000));
        
        // We'll calculate total amount after creating PO items
        purchaseOrdersData.push({
          poNumber: `PO-${faker.string.numeric(6)}`,
          vendorId: vendor.id,
          status,
          orderDate,
          expectedArrivalDate,
          totalAmount: 0, // Will be updated after PO items
          currency: 'CAD',
          quickbooksPoId: `QB-PO-${faker.string.alphanumeric(8)}`,
          createdAt: new Date(orderDate),
          updatedAt: new Date()
        });
      }
    }
    
    const insertedPurchaseOrders = await db.insert(schema.purchaseOrders).values(purchaseOrdersData).returning();
    console.log(`Inserted ${insertedPurchaseOrders.length} purchase orders`);

    // --- Seed Purchase Order Items ---
    console.log('Seeding purchase order items...');
    
    const poItemsData = [];
    const poTotals = new Map<number, number>();
    
    for (const po of insertedPurchaseOrders) {
      // Each PO has 2-6 items
      const itemCount = faker.number.int({ min: 2, max: 6 });
      const usedProducts = new Set<number>();
      let poTotal = 0;
      
      for (let i = 0; i < itemCount; i++) {
        // Get a random product that hasn't been used in this PO
        let product;
        let attempts = 0;
        do {
          product = getRandomElement(insertedInventoryItems);
          attempts++;
        } while (usedProducts.has(product.id) && attempts < 10);
        
        if (usedProducts.has(product.id)) continue; // Skip if we can't find a unique product
        usedProducts.add(product.id);
        
        const quantity = faker.number.int({ min: 5, max: 100 });
        const cost = product.cost || 50;
        
        // Unit cost should be slightly lower than our cost (wholesale pricing)
        const unitCost = parseFloat(faker.commerce.price({ 
          min: cost * 0.7, 
          max: cost * 0.9 
        }));
        
        const extendedCost = parseFloat((unitCost * quantity).toFixed(2));
        poTotal += extendedCost;
        
        poItemsData.push({
          poId: po.id,
          productId: product.id,
          quantity,
          unitCost,
          extendedCost,
          currency: 'CAD',
          createdAt: new Date(po.orderDate),
          updatedAt: new Date()
        });
      }
      
      poTotals.set(po.id, parseFloat(poTotal.toFixed(2)));
    }
    
    const insertedPoItems = await db.insert(schema.poItems).values(poItemsData).returning();
    console.log(`Inserted ${insertedPoItems.length} purchase order items`);

    // --- Update Purchase Order Totals ---
    console.log('Updating purchase order totals...');
    
    for (const [poId, total] of poTotals) {
      await db.update(schema.purchaseOrders)
        .set({ totalAmount: total })
        .where(eq(schema.purchaseOrders.id, poId));
    }
    console.log('Updated purchase order totals');

    // --- Seed Market Pricing ---
    console.log('Seeding market pricing...');
    
    const marketSources = [
      'Amazon Business',
      'Staples Business',
      'CDW',
      'Dell Direct',
      'HP Direct',
      'Canon Solutions',
      'Brother Business',
      'Lexmark Direct',
      'Wholesale Supplier A',
      'Wholesale Supplier B'
    ];
    
    const marketPricingData = [];
    
    // Add market pricing for most inventory items
    for (const product of insertedInventoryItems) {
      // Each product has 2-4 market price sources
      const sourceCount = faker.number.int({ min: 2, max: 4 });
      const usedSources = new Set<string>();
      
      for (let i = 0; i < sourceCount; i++) {
        let source;
        let attempts = 0;
        do {
          source = getRandomElement(marketSources);
          attempts++;
        } while (usedSources.has(source) && attempts < 10);
        
        if (usedSources.has(source)) continue;
        usedSources.add(source);
        
        const cost = product.cost || 50;
        
        // Market prices vary: some competitive (similar to our cost), others higher
        const priceVariation = faker.datatype.boolean(0.4) ? 
          faker.number.float({ min: 0.8, max: 1.2 }) :  // Competitive pricing
          faker.number.float({ min: 1.2, max: 1.8 });   // Higher retail pricing
        
        const marketPrice = parseFloat((cost * priceVariation).toFixed(2));
        
        // Random update time within last 30 days
        const lastUpdated = faker.date.between({ 
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date() 
        });
        
        marketPricingData.push({
          productId: product.id,
          source,
          price: marketPrice,
          currency: product.costCurrency || 'CAD',
          lastUpdated
        });
      }
    }
    
    const insertedMarketPricing = await db.insert(schema.marketPricing).values(marketPricingData).returning();
    console.log(`Inserted ${insertedMarketPricing.length} market pricing records`);

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