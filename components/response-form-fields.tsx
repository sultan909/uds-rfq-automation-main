import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { 
  QuotationResponseStatus,
  CommunicationMethod
} from '@/lib/types/quotation-response';

interface ResponseFormFieldsProps {
  formData: {
    overallStatus: QuotationResponseStatus;
    responseDate: string;
    customerContactPerson: string;
    communicationMethod: CommunicationMethod;
    overallComments: string;
    requestedDeliveryDate: string;
    paymentTermsRequested: string;
    specialInstructions: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function ResponseFormFields({ formData, setFormData }: ResponseFormFieldsProps) {
  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="overallStatus">Overall Status</Label>
        <Select
          value={formData.overallStatus}
          onValueChange={(value) => updateField('overallStatus', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
            <SelectItem value="PARTIAL_ACCEPTED">Partial Accepted</SelectItem>
            <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="responseDate">Response Date</Label>
        <Input
          id="responseDate"
          type="date"
          value={formData.responseDate}
          onChange={(e) => updateField('responseDate', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerContactPerson">Customer Contact Person</Label>
        <Input
          id="customerContactPerson"
          value={formData.customerContactPerson}
          onChange={(e) => updateField('customerContactPerson', e.target.value)}
          placeholder="Enter contact person name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="communicationMethod">Communication Method</Label>
        <Select
          value={formData.communicationMethod}
          onValueChange={(value) => updateField('communicationMethod', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="PHONE">Phone</SelectItem>
            <SelectItem value="MEETING">Meeting</SelectItem>
            <SelectItem value="PORTAL">Portal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requestedDeliveryDate">Requested Delivery Date</Label>
        <Input
          id="requestedDeliveryDate"
          type="date"
          value={formData.requestedDeliveryDate}
          onChange={(e) => updateField('requestedDeliveryDate', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentTermsRequested">Payment Terms Requested</Label>
        <Input
          id="paymentTermsRequested"
          value={formData.paymentTermsRequested}
          onChange={(e) => updateField('paymentTermsRequested', e.target.value)}
          placeholder="e.g., Net 30"
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="overallComments">Overall Comments</Label>
        <Textarea
          id="overallComments"
          value={formData.overallComments}
          onChange={(e) => updateField('overallComments', e.target.value)}
          placeholder="Enter overall response comments..."
          rows={3}
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="specialInstructions">Special Instructions</Label>
        <Textarea
          id="specialInstructions"
          value={formData.specialInstructions}
          onChange={(e) => updateField('specialInstructions', e.target.value)}
          placeholder="Enter any special instructions..."
          rows={3}
        />
      </div>
    </div>
  );
}
