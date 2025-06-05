export type QuotationResponseStatus = 
  | 'PENDING'
  | 'ACCEPTED' 
  | 'DECLINED' 
  | 'PARTIAL_ACCEPTED' 
  | 'NEGOTIATING';

export type ResponseItemStatus = 
  | 'PENDING'
  | 'ACCEPTED' 
  | 'DECLINED' 
  | 'COUNTER_PROPOSED' 
  | 'NEEDS_CLARIFICATION';

export type CommunicationMethod = 
  | 'EMAIL' 
  | 'PHONE' 
  | 'MEETING' 
  | 'PORTAL';

export interface QuotationResponse {
  id: number;
  quotationVersionId: number;
  responseNumber: number;
  overallStatus: QuotationResponseStatus;
  responseDate: string;
  customerContactPerson?: string;
  communicationMethod: CommunicationMethod;
  overallComments?: string;
  requestedDeliveryDate?: string;
  paymentTermsRequested?: string;
  specialInstructions?: string;
  recordedByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationResponseItem {
  id: number;
  quotationResponseId: number;
  quotationVersionItemId: number;
  skuId: number;
  itemStatus: ResponseItemStatus;
  requestedQuantity?: number;
  requestedUnitPrice?: number;
  requestedTotalPrice?: number;
  customerSkuReference?: string;
  itemSpecificComments?: string;
  alternativeSuggestions?: string;
  deliveryRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationResponseWithItems extends QuotationResponse {
  responseItems: (QuotationResponseItem & {
    sku: {
      id: number;
      sku: string;
      description: string;
      mpn: string;
      brand: string;
    };
    quotationVersionItem: {
      id: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      comment?: string;
    };
  })[];
  recordedByUser: {
    id: number;
    name: string;
    email: string;
  };
}

// Request types for API endpoints
export interface CreateQuotationResponseRequest {
  overallStatus: QuotationResponseStatus;
  responseDate: string;
  customerContactPerson?: string;
  communicationMethod: CommunicationMethod;
  overallComments?: string;
  requestedDeliveryDate?: string;
  paymentTermsRequested?: string;
  specialInstructions?: string;
  responseItems: CreateQuotationResponseItemRequest[];
}

export interface CreateQuotationResponseItemRequest {
  quotationVersionItemId: number;
  skuId: number;
  itemStatus: ResponseItemStatus;
  requestedQuantity?: number;
  requestedUnitPrice?: number;
  customerSkuReference?: string;
  itemSpecificComments?: string;
  alternativeSuggestions?: string;
  deliveryRequirements?: string;
}
