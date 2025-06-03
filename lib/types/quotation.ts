// Types for SKU-Level Quotation + Negotiation History Feature

export type QuotationEntryType = 'internal_quote' | 'customer_feedback' | 'counter_offer';

export type QuotationVersionStatus = 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED';

export interface QuotationVersion {
  id: number;
  rfqId: number;
  versionNumber: number;
  entryType: QuotationEntryType;
  status: QuotationVersionStatus;
  estimatedPrice: number;
  finalPrice: number;
  changes?: string;
  notes?: string;
  createdBy: string;
  submittedByUserId?: number;
  createdAt: Date;
  updatedAt: Date;
  items?: QuotationItem[];
  customerResponse?: CustomerResponse;
}

export interface QuotationItem {
  id: number;
  versionId: number;
  skuId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  sku?: {
    id: number;
    sku: string;
    description: string;
    mpn: string;
    brand: string;
  };
}

export interface CustomerResponse {
  id: number;
  versionId: number;
  status: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
  comments?: string;
  requestedChanges?: string;
  respondedAt: Date;
}
export interface CreateQuotationRequest {
  entryType: QuotationEntryType;
  notes?: string;
  items: CreateQuotationItemRequest[];
}

export interface CreateQuotationItemRequest {
  skuId: number;
  quantity: number;
  unitPrice: number;
  comment?: string;
  // Display fields for UI (not sent to API)
  skuCode?: string;
  description?: string;
}

export interface QuotationHistoryResponse {
  versions: QuotationVersionWithItems[];
}

export interface QuotationVersionWithItems extends QuotationVersion {
  items: QuotationItem[];
}
