import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

interface CreateItemVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    estimatedPrice: number;
    finalPrice: number;
    status: string;
    changes: string;
  }) => void;
  currentPrice: number;
}

export function CreateItemVersionModal({
  isOpen,
  onClose,
  onSubmit,
  currentPrice,
}: CreateItemVersionModalProps) {
  const [estimatedPrice, setEstimatedPrice] = useState(currentPrice.toString());
  const [finalPrice, setFinalPrice] = useState(currentPrice.toString());
  const [status, setStatus] = useState('NEW');
  const [changes, setChanges] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!estimatedPrice || !finalPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const estimatedPriceNum = parseFloat(estimatedPrice);
    const finalPriceNum = parseFloat(finalPrice);

    if (isNaN(estimatedPriceNum) || isNaN(finalPriceNum)) {
      alert('Please enter valid prices');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        estimatedPrice: estimatedPriceNum,
        finalPrice: finalPriceNum,
        status,
        changes,
      });
      // Reset form
      setEstimatedPrice(currentPrice.toString());
      setFinalPrice(currentPrice.toString());
      setChanges('');
    } catch (error) {
      console.error('Error submitting version:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PRICED">Priced</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedPrice">Estimated Price</Label>
            <div className="relative">
              <Input
                id="estimatedPrice"
                type="number"
                step="0.01"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="pr-20"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {formatCurrency(parseFloat(estimatedPrice || '0'))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalPrice">Final Price</Label>
            <div className="relative">
              <Input
                id="finalPrice"
                type="number"
                step="0.01"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="pr-20"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {formatCurrency(parseFloat(finalPrice || '0'))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changes">Changes</Label>
            <Textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="Describe the changes in this version..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 