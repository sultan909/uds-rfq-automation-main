import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponseFormFields } from './response-form-fields';
import { ResponseItemsTable } from './response-items-table';
import type { 
  QuotationVersionWithItems, 
  CreateQuotationResponseRequest,
  QuotationResponseStatus,
  ResponseItemStatus,
  CommunicationMethod
} from '@/lib/types/quotation-response';

interface QuotationResponseFormProps {
  quotationVersion: QuotationVersionWithItems;
  onSubmit: (data: CreateQuotationResponseRequest) => Promise<void>;
  onCancel: () => void;
}

export function QuotationResponseForm({
  quotationVersion,
  onSubmit,
  onCancel
}: QuotationResponseFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    overallStatus: 'PENDING' as QuotationResponseStatus,
    responseDate: new Date().toISOString().split('T')[0],
    customerContactPerson: '',
    communicationMethod: 'EMAIL' as CommunicationMethod,
    overallComments: '',
    requestedDeliveryDate: '',
    paymentTermsRequested: '',
    specialInstructions: '',
  });

  const [itemResponses, setItemResponses] = useState<Record<number, {
    itemStatus: ResponseItemStatus;
    requestedQuantity?: number;
    requestedUnitPrice?: number;
    itemSpecificComments?: string;
  }>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const responseItems = quotationVersion.items.map(item => ({
        quotationVersionItemId: item.id,
        skuId: item.skuId,
        itemStatus: itemResponses[item.id]?.itemStatus || 'PENDING',
        requestedQuantity: itemResponses[item.id]?.requestedQuantity,
        requestedUnitPrice: itemResponses[item.id]?.requestedUnitPrice,
        itemSpecificComments: itemResponses[item.id]?.itemSpecificComments,
      }));

      await onSubmit({ ...formData, responseItems });
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponseFormFields
            formData={formData}
            setFormData={setFormData}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SKU-Level Response</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponseItemsTable
            items={quotationVersion.items}
            itemResponses={itemResponses}
            setItemResponses={setItemResponses}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Recording...' : 'Record Response'}
        </Button>
      </div>
    </form>
  );
}
