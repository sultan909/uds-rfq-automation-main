"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuotationHistoryTable } from "@/components/quotation-history-table";
import { VersionCreationModal } from "@/components/version-creation-modal";
import { CustomerResponseModal } from "@/components/customer-response-modal";
import { QuotationResponseModal } from "@/components/quotation-response-modal";
import type { QuotationVersionWithItems } from "@/lib/types/quotation";
import type { CreateQuotationResponseRequest } from "@/lib/types/quotation-response";

interface QuotationHistoryTabProps {
  quotationHistory: QuotationVersionWithItems[];
  items: any[];
  isVersionModalOpen: boolean;
  isResponseModalOpen: boolean;
  selectedVersion: QuotationVersionWithItems | null;
  onOpenVersionModal: () => void;
  onCloseVersionModal: () => void;
  onOpenResponseModal: (version: QuotationVersionWithItems) => void;
  onCloseResponseModal: () => void;
  onCreateVersion: (data: {
    entryType: any;
    notes?: string;
    items: any[];
  }) => Promise<void>;
  onRecordResponse: (data: {
    status: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
    comments: string;
    requestedChanges?: string;
  }) => Promise<void>;
  onRecordQuotationResponse?: (versionId: number, data: CreateQuotationResponseRequest) => Promise<void>;
  rfqId: string;
  customerEmail?: string;
}

export function QuotationHistoryTab({
  quotationHistory,
  items,
  isVersionModalOpen,
  isResponseModalOpen,
  selectedVersion,
  onOpenVersionModal,
  onCloseVersionModal,
  onOpenResponseModal,
  onCloseResponseModal,
  onCreateVersion,
  onRecordResponse,
  onRecordQuotationResponse,
  rfqId,
  customerEmail
}: QuotationHistoryTabProps) {
  const [isQuotationResponseModalOpen, setIsQuotationResponseModalOpen] = useState(false);
  const [selectedVersionForResponse, setSelectedVersionForResponse] = useState<QuotationVersionWithItems | null>(null);

  const handleOpenQuotationResponseModal = (version: QuotationVersionWithItems) => {
    setSelectedVersionForResponse(version);
    setIsQuotationResponseModalOpen(true);
  };

  const handleCloseQuotationResponseModal = () => {
    setIsQuotationResponseModalOpen(false);
    setSelectedVersionForResponse(null);
  };

  const handleSubmitQuotationResponse = async (data: CreateQuotationResponseRequest) => {
    if (selectedVersionForResponse && onRecordQuotationResponse) {
      await onRecordQuotationResponse(selectedVersionForResponse.id, data);
      handleCloseQuotationResponseModal();
    }
  };
  return (
    <div className="space-y-4 pt-6">
      <QuotationHistoryTable
        versions={quotationHistory}
        onRecordResponse={onOpenResponseModal}
        onRecordQuotationResponse={handleOpenQuotationResponseModal}
        onCreateVersion={onOpenVersionModal}
        rfqId={rfqId}
        customerEmail={customerEmail}
      />

      <VersionCreationModal
        isOpen={isVersionModalOpen}
        onClose={onCloseVersionModal}
        onSubmit={onCreateVersion}
        currentItems={items}
      />

      <CustomerResponseModal
        isOpen={isResponseModalOpen}
        onClose={onCloseResponseModal}
        onSubmit={onRecordResponse}
      />

      <QuotationResponseModal
        isOpen={isQuotationResponseModalOpen}
        onClose={handleCloseQuotationResponseModal}
        onSubmit={handleSubmitQuotationResponse}
        quotationVersion={selectedVersionForResponse}
      />
    </div>
  );
}
