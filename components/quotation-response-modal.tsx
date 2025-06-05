import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QuotationResponseForm } from './quotation-response-form';
import type { 
  QuotationVersionWithItems, 
  CreateQuotationResponseRequest
} from '@/lib/types/quotation-response';

interface QuotationResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuotationResponseRequest) => Promise<void>;
  quotationVersion: QuotationVersionWithItems | null;
}

export function QuotationResponseModal({
  isOpen,
  onClose,
  onSubmit,
  quotationVersion
}: QuotationResponseModalProps) {
  if (!quotationVersion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Record Customer Response - Version {quotationVersion.versionNumber}
          </DialogTitle>
        </DialogHeader>
        
        <QuotationResponseForm
          quotationVersion={quotationVersion}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
