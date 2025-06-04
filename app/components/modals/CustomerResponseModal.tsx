import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomerResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    status: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING';
    comments: string;
    requestedChanges?: string;
  }) => void;
}

export function CustomerResponseModal({
  isOpen,
  onClose,
  onSubmit,
}: CustomerResponseModalProps) {
  const [status, setStatus] = useState<'ACCEPTED' | 'DECLINED' | 'NEGOTIATING'>('ACCEPTED');
  const [comments, setComments] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      status,
      comments,
      requestedChanges: requestedChanges || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Customer Response</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Response Status</Label>
            <Select value={status} onValueChange={(value: 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter customer's comments..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedChanges">Requested Changes</Label>
            <Textarea
              id="requestedChanges"
              value={requestedChanges}
              onChange={(e) => setRequestedChanges(e.target.value)}
              placeholder="Enter any changes requested by the customer..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Response</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 