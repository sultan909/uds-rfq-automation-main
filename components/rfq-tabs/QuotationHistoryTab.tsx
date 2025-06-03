"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { QuotationHistoryTable } from "@/components/quotation-history-table";
import { VersionCreationModal } from "@/components/version-creation-modal";
import { CustomerResponseModal } from "@/components/customer-response-modal";
import type { QuotationVersionWithItems } from "@/lib/types/quotation";

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
  onRecordResponse
}: QuotationHistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quotation History</h3>
        <Button onClick={onOpenVersionModal}>
          Create New Version
        </Button>
      </div>
      
      <QuotationHistoryTable
        versions={quotationHistory}
        onRecordResponse={onOpenResponseModal}
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
    </div>
  );
}
