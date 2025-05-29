import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/contexts/currency-context";

interface VersionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    estimatedPrice: number;
    finalPrice: number;
    changes: string;
  }) => void;
  currentPrice?: number | null;
}

export function VersionCreationModal({
  isOpen,
  onClose,
  onSubmit,
  currentPrice = 0,
}: VersionCreationModalProps) {
  const { formatCurrency } = useCurrency();
  const [estimatedPrice, setEstimatedPrice] = React.useState((currentPrice || 0).toString());
  const [finalPrice, setFinalPrice] = React.useState((currentPrice || 0).toString());
  const [changes, setChanges] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      estimatedPrice: parseFloat(estimatedPrice) || 0,
      finalPrice: parseFloat(finalPrice) || 0,
      changes,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedPrice">Estimated Price</Label>
            <Input
              id="estimatedPrice"
              type="number"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              placeholder="Enter estimated price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finalPrice">Final Price</Label>
            <Input
              id="finalPrice"
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="Enter final price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="changes">Changes</Label>
            <Textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="Describe the changes in this version"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Version</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 