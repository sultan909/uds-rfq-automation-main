import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rfqApi } from "@/lib/api-client";

interface VersionStatusManagerProps {
  currentStatus: string;
  versionId: number;
  rfqId: string;
  onStatusChange: (newStatus: string) => void;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['DRAFT'],
  DRAFT: ['PRICED'],
  PRICED: ['SENT'],
  SENT: ['ACCEPTED', 'DECLINED', 'NEGOTIATING'],
  NEGOTIATING: ['SENT'],
};

export function VersionStatusManager({
  currentStatus,
  versionId,
  rfqId,
  onStatusChange,
}: VersionStatusManagerProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const response = await rfqApi.updateVersionStatus(rfqId, versionId, newStatus);
      if (response.success) {
        onStatusChange(newStatus);
        toast.success('Status updated successfully');
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating || allowedTransitions.length === 0}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatus}>
            {currentStatus}
          </SelectItem>
          {allowedTransitions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdating && <span className="text-sm text-muted-foreground">Updating...</span>}
    </div>
  );
} 