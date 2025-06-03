// Types for SKU-Level Quotation + Negotiation History Feature

export type QuotationEntryType = 'internal_quote' | 'customer_feedback' | 'counter_offer';

export type QuotationVersionStatus = 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED';

export type NegotiationCommunicationType = 'EMAIL' | 'PHONE_CALL' | 'MEETING' | 'INTERNAL_NOTE';

export type NegotiationDirection = 'OUTBOUND' | 'INBOUND';

export type SkuChangeType = 'PRICE_CHANGE' | 'QUANTITY_CHANGE' | 'BOTH';

export type ChangedBy = 'CUSTOMER' | 'INTERNAL';

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

// New Negotiation Types

export interface NegotiationCommunication {
  id: number;
  rfqId: number;
  versionId?: number;
  communicationType: NegotiationCommunicationType;
  direction: NegotiationDirection;
  subject?: string;
  content: string;
  contactPerson?: string;
  communicationDate: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpCompleted?: boolean;
  followUpCompletedAt?: Date;
  enteredByUserId: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  rfq?: any;
  version?: QuotationVersion;
  enteredByUser?: any;
}

export interface SkuNegotiationHistory {
  id: number;
  rfqId: number;
  skuId: number;
  versionId?: number;
  communicationId?: number;
  changeType: SkuChangeType;
  oldQuantity?: number;
  newQuantity?: number;
  oldUnitPrice?: number;
  newUnitPrice?: number;
  changeReason?: string;
  changedBy: ChangedBy;
  enteredByUserId: number;
  createdAt: Date;
  // Relations
  rfq?: any;
  sku?: {
    id: number;
    sku: string;
    description: string;
  };
  version?: QuotationVersion;
  communication?: NegotiationCommunication;
  enteredByUser?: any;
}

export interface CreateCommunicationRequest {
  rfqId: number;
  versionId?: number;
  communicationType: NegotiationCommunicationType;
  direction: NegotiationDirection;
  subject?: string;
  content: string;
  contactPerson?: string;
  communicationDate: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface CreateSkuChangeRequest {
  rfqId: number;
  skuId: number;
  versionId?: number;
  communicationId?: number;
  changeType: SkuChangeType;
  oldQuantity?: number;
  newQuantity?: number;
  oldUnitPrice?: number;
  newUnitPrice?: number;
  changeReason?: string;
  changedBy: ChangedBy;
}

export interface NegotiationSummary {
  totalCommunications: number;
  totalSkuChanges: number;
  pendingFollowUps: number;
  lastCommunicationDate?: Date;
  negotiationDuration: number; // days
}

export interface ItemWithNegotiationHistory {
  id: number;
  customerSku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  comment?: string;
  status?: string;
  inventory?: {
    id: number;
    sku: string;
    description: string;
  };
  negotiationHistory: SkuNegotiationHistory[];
  hasActiveNegotiation: boolean;
}
