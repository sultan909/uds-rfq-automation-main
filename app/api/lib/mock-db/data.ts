import { 
  Customer, 
  InventoryItem, 
  Rfq, 
  SkuMapping, 
  RfqStatus 
} from './models';

// Create mock customers
export const customers: Customer[] = [
  {
    id: '1',
    name: 'Tech Solutions Inc',
    type: 'Dealer',
    lastOrder: '4/22/2025',
    totalOrders: 42,
    totalSpentCAD: 24850.75,
    email: 'orders@techsolutions.com',
    phone: '555-123-4567',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2025-04-22T14:35:00Z'
  },
  {
    id: '2',
    name: 'ABC Electronics',
    type: 'Wholesaler',
    lastOrder: '4/20/2025',
    totalOrders: 128,
    totalSpentCAD: 156420.5,
    email: 'purchasing@abcelectronics.com',
    phone: '555-987-6543',
    createdAt: '2024-01-05T09:30:00Z',
    updatedAt: '2025-04-20T11:22:00Z'
  },
  {
    id: '3',
    name: 'Global Systems',
    type: 'Dealer',
    lastOrder: '4/18/2025',
    totalOrders: 18,
    totalSpentCAD: 8745.25,
    email: 'info@globalsystems.com',
    phone: '555-222-3333',
    createdAt: '2024-02-15T10:45:00Z',
    updatedAt: '2025-04-18T16:40:00Z'
  },
  {
    id: '4',
    name: 'Midwest Distributors',
    type: 'Dealer',
    lastOrder: '4/15/2025',
    totalOrders: 36,
    totalSpentCAD: 18320.0,
    email: 'orders@midwestdist.com',
    phone: '555-444-5555',
    createdAt: '2024-01-20T14:20:00Z',
    updatedAt: '2025-04-15T09:15:00Z'
  },
  {
    id: '5',
    name: 'IJS Globe',
    type: 'Wholesaler',
    lastOrder: '4/23/2025',
    totalOrders: 215,
    totalSpentCAD: 245780.25,
    email: 'purchasing@ijsglobe.com',
    phone: '555-777-8888',
    createdAt: '2023-11-10T11:30:00Z',
    updatedAt: '2025-04-23T13:45:00Z'
  }
];

// Create mock inventory items
export const inventoryItems: InventoryItem[] = [
  {
    id: '1',
    sku: 'CF226X',
    description: 'HP 26X High Yield Black Toner',
    stock: 24,
    costCAD: 89.5,
    lastSale: '4/15/2025',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2025-04-15T14:30:00Z'
  },
  {
    id: '2',
    sku: 'CE255X',
    description: 'HP 55X High Yield Black Toner',
    stock: 12,
    costCAD: 78.25,
    lastSale: '4/18/2025',
    createdAt: '2024-01-05T08:15:00Z',
    updatedAt: '2025-04-18T10:20:00Z'
  },
  {
    id: '3',
    sku: 'CE505X',
    description: 'HP 05X High Yield Black Toner',
    stock: 3,
    costCAD: 65.75,
    lastSale: '4/20/2025',
    lowStock: true,
    createdAt: '2024-01-05T08:30:00Z',
    updatedAt: '2025-04-20T15:45:00Z'
  },
  {
    id: '4',
    sku: 'Q2612A',
    description: 'HP 12A Black Toner',
    stock: 0,
    costCAD: 45.99,
    lastSale: '4/10/2025',
    outOfStock: true,
    createdAt: '2024-01-06T09:00:00Z',
    updatedAt: '2025-04-10T11:10:00Z'
  },
  {
    id: '5',
    sku: 'CC364X',
    description: 'HP 64X High Yield Black Toner',
    stock: 18,
    costCAD: 112.5,
    lastSale: '4/22/2025',
    createdAt: '2024-01-06T09:15:00Z',
    updatedAt: '2025-04-22T13:25:00Z'
  }
];

// Create mock RFQs
export const rfqs: Rfq[] = [
  {
    id: '1',
    rfqNumber: 'RFQ-2308',
    customerId: '2', // ABC Electronics
    date: '4/25/2025',
    source: 'Email',
    status: 'new',
    items: [
      {
        id: '1',
        sku: 'CF226X',
        description: 'HP 26X High Yield Black Toner',
        quantity: 5,
        price: 120.5
      },
      {
        id: '2',
        sku: 'CE255X',
        description: 'HP 55X High Yield Black Toner',
        quantity: 3,
        price: 95.75
      }
    ],
    subtotalCAD: 889.75,
    taxCAD: 115.67,
    totalCAD: 1005.42,
    createdAt: '2025-04-25T09:00:00Z',
    updatedAt: '2025-04-25T09:00:00Z'
  },
  {
    id: '2',
    rfqNumber: 'RFQ-2307',
    customerId: '1', // Tech Solutions Inc
    date: '4/24/2025',
    source: 'Phone',
    status: 'draft',
    items: [
      {
        id: '1',
        sku: 'CE505X',
        description: 'HP 05X High Yield Black Toner',
        quantity: 3,
        price: 68.5
      },
      {
        id: '2',
        sku: 'Q2612A',
        description: 'HP 12A Black Toner',
        quantity: 2,
        price: 48.99
      }
    ],
    subtotalCAD: 303.48,
    taxCAD: 39.45,
    totalCAD: 342.93,
    createdAt: '2025-04-24T11:30:00Z',
    updatedAt: '2025-04-24T14:15:00Z'
  },
  {
    id: '3',
    rfqNumber: 'RFQ-2306',
    customerId: '3', // Global Systems
    date: '4/24/2025',
    source: 'Email',
    status: 'priced',
    items: [
      {
        id: '1',
        sku: 'CC364X',
        description: 'HP 64X High Yield Black Toner',
        quantity: 3,
        price: 145.0
      }
    ],
    subtotalCAD: 435.0,
    taxCAD: 56.55,
    totalCAD: 491.55,
    createdAt: '2025-04-24T08:45:00Z',
    updatedAt: '2025-04-24T10:30:00Z'
  },
  {
    id: '4',
    rfqNumber: 'RFQ-2304',
    customerId: '2', // ABC Electronics
    date: '4/23/2025',
    source: 'Website',
    status: 'sent',
    items: [
      {
        id: '1',
        sku: 'CF226X',
        description: 'HP 26X High Yield Black Toner',
        quantity: 3,
        price: 119.5
      },
      {
        id: '2',
        sku: 'CE255X',
        description: 'HP 55X High Yield Black Toner',
        quantity: 2,
        price: 94.25
      },
      {
        id: '3',
        sku: 'Q2612A',
        description: 'HP 12A Black Toner',
        quantity: 1,
        price: 47.5
      }
    ],
    subtotalCAD: 547.0,
    taxCAD: 71.11,
    totalCAD: 618.11,
    createdAt: '2025-04-23T13:20:00Z',
    updatedAt: '2025-04-23T16:45:00Z'
  },
  {
    id: '5',
    rfqNumber: 'RFQ-2303',
    customerId: '1', // Tech Solutions Inc
    date: '4/23/2025',
    source: 'Email',
    status: 'negotiating',
    items: [
      {
        id: '1',
        sku: 'CE505X',
        description: 'HP 05X High Yield Black Toner',
        quantity: 2,
        price: 67.25
      },
      {
        id: '2',
        sku: 'CC364X',
        description: 'HP 64X High Yield Black Toner',
        quantity: 2,
        price: 142.75
      }
    ],
    subtotalCAD: 420.0,
    taxCAD: 54.6,
    totalCAD: 474.6,
    createdAt: '2025-04-23T10:15:00Z',
    updatedAt: '2025-04-23T15:30:00Z'
  },
  {
    id: '6',
    rfqNumber: 'RFQ-2302',
    customerId: '3', // Global Systems
    date: '4/22/2025',
    source: 'Email',
    status: 'declined',
    items: [
      {
        id: '1',
        sku: 'CF226X',
        description: 'HP 26X High Yield Black Toner',
        quantity: 4,
        price: 122.0
      },
      {
        id: '2',
        sku: 'CE255X',
        description: 'HP 55X High Yield Black Toner',
        quantity: 2,
        price: 96.5
      },
      {
        id: '3',
        sku: 'Q2612A',
        description: 'HP 12A Black Toner',
        quantity: 1,
        price: 48.0
      }
    ],
    subtotalCAD: 681.0,
    taxCAD: 88.53,
    totalCAD: 769.53,
    createdAt: '2025-04-22T09:30:00Z',
    updatedAt: '2025-04-22T14:45:00Z'
  },
  {
    id: '7',
    rfqNumber: 'RFQ-2301',
    customerId: '4', // Midwest Distributors
    date: '4/22/2025',
    source: 'Phone',
    status: 'accepted',
    items: [
      {
        id: '1',
        sku: 'CC364X',
        description: 'HP 64X High Yield Black Toner',
        quantity: 3,
        price: 142.5
      }
    ],
    subtotalCAD: 427.5,
    taxCAD: 55.58,
    totalCAD: 483.08,
    createdAt: '2025-04-22T11:20:00Z',
    updatedAt: '2025-04-22T16:10:00Z'
  },
  {
    id: '8',
    rfqNumber: 'RFQ-2299',
    customerId: '2', // ABC Electronics
    date: '4/21/2025',
    source: 'Email',
    status: 'processed',
    items: [
      {
        id: '1',
        sku: 'CF226X',
        description: 'HP 26X High Yield Black Toner',
        quantity: 3,
        price: 118.5
      },
      {
        id: '2',
        sku: 'CE255X',
        description: 'HP 55X High Yield Black Toner',
        quantity: 2,
        price: 93.75
      }
    ],
    subtotalCAD: 543.0,
    taxCAD: 70.59,
    totalCAD: 613.59,
    createdAt: '2025-04-21T10:30:00Z',
    updatedAt: '2025-04-21T13:45:00Z'
  }
];

// Create mock SKU mappings
export const skuMappings: SkuMapping[] = [
  {
    id: '1',
    standardSku: 'CF226X',
    standardDescription: 'HP 26X High Yield Black Toner Cartridge',
    variations: [
      { id: '1', sku: 'HP26X', source: 'Tech Solutions Inc' },
      { id: '2', sku: 'HP-26-X', source: 'ABC Electronics' },
      { id: '3', sku: 'CF-226-X', source: 'Global Systems' }
    ],
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2025-03-15T14:30:00Z'
  },
  {
    id: '2',
    standardSku: 'CE255X',
    standardDescription: 'HP 55X High Yield Black Toner Cartridge',
    variations: [
      { id: '4', sku: 'HP55X', source: 'Tech Solutions Inc' },
      { id: '5', sku: 'HP-55-X', source: 'Midwest Distributors' }
    ],
    createdAt: '2024-01-05T08:15:00Z',
    updatedAt: '2025-03-20T11:45:00Z'
  },
  {
    id: '3',
    standardSku: 'CC364X',
    standardDescription: 'HP 64X High Yield Black Toner Cartridge',
    variations: [
      { id: '6', sku: 'HP64X', source: 'Tech Solutions Inc' },
      { id: '7', sku: 'HP-64-X', source: 'ABC Electronics' },
      { id: '8', sku: 'CC-364-X', source: 'Global Systems' }
    ],
    createdAt: '2024-01-06T09:15:00Z',
    updatedAt: '2025-03-25T13:25:00Z'
  },
  {
    id: '4',
    standardSku: 'Q2612A',
    standardDescription: 'HP 12A Black Toner Cartridge',
    variations: [
      { id: '9', sku: 'HP12A', source: 'Tech Solutions Inc' },
      { id: '10', sku: 'HP-12-A', source: 'ABC Electronics' }
    ],
    createdAt: '2024-01-06T09:30:00Z',
    updatedAt: '2025-04-02T10:15:00Z'
  },
  {
    id: '5',
    standardSku: 'CE505X',
    standardDescription: 'HP 05X High Yield Black Toner Cartridge',
    variations: [
      { id: '11', sku: 'HP05X', source: 'Tech Solutions Inc' },
      { id: '12', sku: 'HP-05-X', source: 'Midwest Distributors' }
    ],
    createdAt: '2024-01-07T10:00:00Z',
    updatedAt: '2025-04-10T09:30:00Z'
  }
];

// Mock marketplace data (represents pricing from external sources)

export const marketplaceData = {
  'CF226X': [
    { source: 'Marketplace 1', priceCAD: 125.99 },
    { source: 'Marketplace 2', priceCAD: 129.5 },
    { source: 'Marketplace 3', priceCAD: 122.75 }
  ],
  'CE255X': [
    { source: 'Marketplace 1', priceCAD: 98.5 },
    { source: 'Marketplace 2', priceCAD: 102.25 },
    { source: 'Marketplace 3', priceCAD: 97.99 }
  ],
  'CC364X': [
    { source: 'Marketplace 1', priceCAD: 149.99 },
    { source: 'Marketplace 2', priceCAD: 152.5 },
    { source: 'Marketplace 3', priceCAD: 147.75 }
  ],
  'Q2612A': [
    { source: 'Marketplace 1', priceCAD: 50.99 },
    { source: 'Marketplace 2', priceCAD: 52.25 },
    { source: 'Marketplace 3', priceCAD: 49.99 }
  ],
  'CE505X': [
    { source: 'Marketplace 1', priceCAD: 70.5 },
    { source: 'Marketplace 2', priceCAD: 72.99 },
    { source: 'Marketplace 3', priceCAD: 69.75 }
  ]
};