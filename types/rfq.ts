export interface QuotationVersion {
  versionNumber: number;
  status: 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
  estimatedPrice: number;
  finalPrice: number;
  changes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customerResponse?: {
    status: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
    comments: string;
    requestedChanges?: string;
    respondedAt: string;
  };
}

export interface RfqItem {
  id: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  customerSku?: string;
  inventory?: {
    sku: string;
    description: string;
    costCad: number;
    marketPrice: number;
    marketSource?: string;
    marketLastUpdated?: string;
    competitorPrice?: number;
    marketTrend?: 'up' | 'down' | 'neutral';
  };
} 