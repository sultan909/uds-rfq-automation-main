import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().regex(/^\d+$/, 'ID must be a number').transform(Number);

export const emailSchema = z.string().email('Invalid email format');

export const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional();

export const currencySchema = z.enum(['CAD', 'USD'], { 
  errorMap: () => ({ message: 'Currency must be CAD or USD' })
});

export const statusSchema = z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED']);

export const dateSchema = z.string().refine((date) => !isNaN(Date.parse(date)), {
  message: 'Invalid date format',
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  sortField: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// RFQ validation schemas
export const rfqCreateSchema = z.object({
  requestNumber: z.string().min(1, 'Request number is required'),
  customerId: z.number().positive('Customer ID must be positive'),
  requestorId: z.number().positive('Requestor ID must be positive'),
  status: statusSchema.optional().default('PENDING'),
  requestDate: dateSchema.optional(),
  requiredDate: dateSchema.optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().optional(),
    customerSku: z.string().optional(),
    unitPrice: z.number().nonnegative('Unit price must be non-negative').optional(),
    currency: currencySchema.optional().default('CAD'),
  })).min(1, 'At least one item is required'),
});

export const rfqUpdateSchema = rfqCreateSchema.partial().omit({ items: true });

export const rfqItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
  customerSku: z.string().optional(),
  internalProductId: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  currency: currencySchema.optional().default('CAD'),
  status: statusSchema.optional().default('PENDING'),
});

// Customer validation schemas
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  type: z.enum(['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT']),
  region: z.string().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const customerUpdateSchema = customerCreateSchema.partial();

// Inventory validation schemas
export const inventoryCreateSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
  cost: z.number().nonnegative('Cost must be non-negative'),
  currency: currencySchema.optional().default('CAD'),
  quantityOnHand: z.number().nonnegative('Quantity on hand must be non-negative').optional().default(0),
  quantityReserved: z.number().nonnegative('Quantity reserved must be non-negative').optional().default(0),
  reorderPoint: z.number().nonnegative().optional(),
  reorderQuantity: z.number().positive().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const inventoryUpdateSchema = inventoryCreateSchema.partial();

// Quotation validation schemas
export const quotationCreateSchema = z.object({
  rfqId: z.number().positive('RFQ ID must be positive'),
  vendorId: z.number().positive('Vendor ID must be positive'),
  totalAmount: z.number().nonnegative('Total amount must be non-negative'),
  currency: currencySchema.optional().default('CAD'),
  deliveryTime: z.string().optional(),
  validUntil: dateSchema.optional(),
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
  status: statusSchema.optional().default('PENDING'),
});

export const quotationUpdateSchema = quotationCreateSchema.partial().omit({ rfqId: true, vendorId: true });

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.record(z.string()).optional(),
}).merge(paginationSchema);

// Generic validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.errors };
}

// Validation middleware for API routes
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<{ success: true; data: T } | { success: false; errors: z.ZodIssue[] }> => {
    try {
      const body = await request.json();
      return validateInput(schema, body);
    } catch (error) {
      return {
        success: false,
        errors: [{ code: 'invalid_type', expected: 'object', received: 'unknown', path: [], message: 'Invalid JSON in request body' }]
      };
    }
  };
}