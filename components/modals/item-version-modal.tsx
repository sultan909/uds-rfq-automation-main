import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { QuotationVersion } from '@/types/rfq';
import { rfqApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface ItemVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqId: string;
  sku: string;
  onRecordResponse: (version: QuotationVersion) => void;
  onCreateVersion: () => void;
}

export function ItemVersionModal({
  isOpen,
  onClose,
  rfqId,
  sku,
  onRecordResponse,
  onCreateVersion,
}: ItemVersionModalProps) {
  const [versions, setVersions] = useState<QuotationVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && rfqId && sku) {
      fetchVersions();
    }
  }, [isOpen, rfqId, sku]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await rfqApi.getItemVersions(rfqId, sku);
      if (response.success && response.data) {
        setVersions(response.data);
      } else {
        toast.error('Failed to load versions');
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline'> = {
      NEW: 'default',
      DRAFT: 'outline',
      PRICED: 'default',
      SENT: 'default',
      ACCEPTED: 'default',
      DECLINED: 'destructive',
      NEGOTIATING: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Version History - {sku}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex justify-end">
          <Button onClick={onCreateVersion}>Create New Version</Button>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p>No versions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estimated Price</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Customer Response</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version, idx) => (
                  <TableRow
                    key={version.versionNumber}
                    className={idx % 2 === 0 ? 'bg-muted' : ''}
                  >
                    <TableCell>v{version.versionNumber}</TableCell>
                    <TableCell>{getStatusBadge(version.status)}</TableCell>
                    <TableCell>{formatCurrency(version.estimatedPrice)}</TableCell>
                    <TableCell>{formatCurrency(version.finalPrice)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={version.changes}>
                      {version.changes}
                    </TableCell>
                    <TableCell>{version.createdBy}</TableCell>
                    <TableCell>
                      {new Date(version.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {version.customerResponse ? (
                        <div className="space-y-1">
                          <Badge variant={version.customerResponse.status === 'ACCEPTED' ? 'default' : 'destructive'}>
                            {version.customerResponse.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {version.customerResponse.comments}
                          </div>
                          {version.customerResponse.requestedChanges && (
                            <div className="text-sm text-muted-foreground">
                              Changes: {version.customerResponse.requestedChanges}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No response</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!version.customerResponse && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRecordResponse(version)}
                          >
                            Record Response
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 