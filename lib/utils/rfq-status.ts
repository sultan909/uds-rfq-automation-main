// Business logic for RFQ status transitions and validation

export type RfqStatus = 'NEW' | 'DRAFT' | 'PRICED' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED';

export type QuotationEntryType = 'internal_quote' | 'customer_feedback' | 'counter_offer';

export interface StatusTransitionRules {
  canCreateVersion: boolean;
  canEdit: boolean;
  nextPossibleStatuses: RfqStatus[];
}

/**
 * Get the status transition rules for a given RFQ status
 */
export function getStatusTransitionRules(currentStatus: RfqStatus): StatusTransitionRules {
  switch (currentStatus) {
    case 'NEW':
      return {
        canCreateVersion: true,
        canEdit: true,
        nextPossibleStatuses: ['DRAFT', 'PRICED']
      };
    
    case 'DRAFT':
      return {
        canCreateVersion: true,
        canEdit: true,
        nextPossibleStatuses: ['PRICED', 'SENT']
      };
    
    case 'PRICED':
      return {
        canCreateVersion: true,
        canEdit: true,
        nextPossibleStatuses: ['SENT', 'DRAFT']
      };
    
    case 'SENT':
      return {
        canCreateVersion: true,
        canEdit: true,
        nextPossibleStatuses: ['NEGOTIATING', 'ACCEPTED', 'DECLINED']
      };
    
    case 'NEGOTIATING':
      return {
        canCreateVersion: true,
        canEdit: true,
        nextPossibleStatuses: ['SENT', 'ACCEPTED', 'DECLINED']
      };
    
    case 'ACCEPTED':
      return {
        canCreateVersion: false,
        canEdit: false,
        nextPossibleStatuses: ['PROCESSED']
      };
    
    case 'DECLINED':
      return {
        canCreateVersion: false,
        canEdit: false,
        nextPossibleStatuses: ['DRAFT'] // Allow re-working
      };
    
    case 'PROCESSED':
      return {
        canCreateVersion: false,
        canEdit: false,
        nextPossibleStatuses: [] // Final state
      };
    
    default:
      return {
        canCreateVersion: false,
        canEdit: false,
        nextPossibleStatuses: []
      };
  }
}

/**
 * Get display-friendly status descriptions
 */
export function getStatusDescription(status: RfqStatus): string {
  switch (status) {
    case 'NEW': return 'New RFQ received';
    case 'DRAFT': return 'Draft in progress';
    case 'PRICED': return 'Pricing completed';
    case 'SENT': return 'Sent to customer';
    case 'NEGOTIATING': return 'Under negotiation';
    case 'ACCEPTED': return 'Accepted by customer';
    case 'DECLINED': return 'Declined by customer';
    case 'PROCESSED': return 'Processed and completed';
    default: return status;
  }
}

/**
 * Get entry type descriptions
 */
export function getEntryTypeDescription(entryType: QuotationEntryType): string {
  switch (entryType) {
    case 'internal_quote': return 'Internal Quote';
    case 'customer_feedback': return 'Customer Feedback';
    case 'counter_offer': return 'Counter Offer';
    default: return entryType;
  }
}

/**
 * Determine the next RFQ status based on entry type and current status
 */
export function getNextRfqStatus(
  currentStatus: RfqStatus, 
  entryType: QuotationEntryType
): RfqStatus {
  // Status transitions based on entry type
  if (entryType === 'internal_quote') {
    if (currentStatus === 'SENT') {
      return 'NEGOTIATING'; // Internal quote on a sent RFQ starts negotiation
    }
    if (currentStatus === 'NEW' || currentStatus === 'DRAFT') {
      return 'PRICED'; // Internal quote on new/draft RFQ means it's priced
    }
  }
  
  if (entryType === 'customer_feedback') {
    if (currentStatus === 'SENT' || currentStatus === 'PRICED') {
      return 'NEGOTIATING'; // Customer feedback starts negotiation
    }
  }
  
  if (entryType === 'counter_offer') {
    return 'NEGOTIATING'; // Counter offers always result in negotiation
  }
  
  // Default: no status change
  return currentStatus;
}

/**
 * Validate if a version can be created for the current RFQ status
 */
export function canCreateVersion(rfqStatus: RfqStatus): boolean {
  const rules = getStatusTransitionRules(rfqStatus);
  return rules.canCreateVersion;
}

/**
 * Validate if items can be edited for the current RFQ status
 */
export function canEditItems(rfqStatus: RfqStatus): boolean {
  const rules = getStatusTransitionRules(rfqStatus);
  return rules.canEdit;
}