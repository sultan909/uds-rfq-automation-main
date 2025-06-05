import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Eye, FileText } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { rfqApi } from '@/lib/api-client';
import { toast } from 'sonner';
import type { QuotationVersionWithItems } from '@/lib/types/quotation';
import type { QuotationResponse, QuotationResponseWithItems } from '@/lib/types/quotation-response';

interface QuotationHistoryTableProps {
  versions: QuotationVersionWithItems[];
  onRecordResponse: (version: QuotationVersionWithItems) => void;
  onRecordQuotationResponse?: (version: QuotationVersionWithItems) => void;
  onCreateVersion: () => void;
  rfqId: string;
}

export function QuotationHistoryTable({ 
  versions, 
  onRecordResponse,
  onRecordQuotationResponse,
  onCreateVersion,
  rfqId
}: QuotationHistoryTableProps) {
  const { formatCurrency } = useCurrency();
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [selectedVersion, setSelectedVersion] = useState<QuotationVersionWithItems | null>(null);
  const [quotationResponses, setQuotationResponses] = useState<QuotationResponseWithItems[]>([]);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [responseVersion, setResponseVersion] = useState<QuotationVersionWithItems | null>(null);

  const toggleExpanded = (versionId: number) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const loadQuotationResponses = async (version: QuotationVersionWithItems) => {
    setLoadingResponses(true);
    try {
      const response = await rfqApi.getQuotationResponses(rfqId, version.id.toString());
      
      if (response.success) {
        const responses = response.data || [];
        setQuotationResponses(responses);
        setResponseVersion(version);
        setIsResponseModalOpen(true);
      } else {
        toast.error(response.error || 'Failed to load quotation responses');
      }
    } catch (error) {
      console.error('Error loading quotation responses:', error);
      toast.error('Failed to load quotation responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  const getEntryTypeLabel = (entryType: string) => {
    switch (entryType) {
      case 'internal_quote': return 'Internal Quote';
      case 'customer_feedback': return 'Customer Feedback';
      case 'counter_offer': return 'Counter Offer';
      default: return entryType;
    }
  };

  const getEntryTypeBadge = (entryType: string) => {
    const variant = entryType === 'internal_quote' ? 'default' : 
                   entryType === 'customer_feedback' ? 'secondary' : 'outline';
    return (
      <Badge variant={variant}>
        {getEntryTypeLabel(entryType)}
      </Badge>
    );
  };
  
  const getStatusBadge = (status: string) => {
    const variant = status === 'ACCEPTED' ? 'default' :
                   status === 'DECLINED' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getResponseStatusBadge = (status: string) => {
    const variant = status === 'ACCEPTED' ? 'default' :
                   status === 'DECLINED' ? 'destructive' :
                   status === 'PARTIAL_ACCEPTED' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
  };

  // Check if a version has quotation responses by counting them
  const hasQuotationResponses = (version: QuotationVersionWithItems) => {
    // Show the button only if there are actual quotation responses
    return (version.quotationResponseCount || 0) > 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quotation History</CardTitle>
          <Button onClick={onCreateVersion}>
            Create New Version
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Entry Type</TableHead>
              {/* <TableHead>Status</TableHead> */}
              <TableHead>Total Amount</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              {/* <TableHead>Customer Response</TableHead> */}
              <TableHead>Detailed Response</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <React.Fragment key={version.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(version.id)}
                      className="p-0 h-6 w-6"
                    >
                      {expandedVersions.has(version.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                  </TableCell>
                  <TableCell>v{version.versionNumber}</TableCell>
                  <TableCell>{getEntryTypeBadge(version.entryType)}</TableCell>
                  {/* <TableCell>{getStatusBadge(version.status)}</TableCell> */}
                  <TableCell>{formatCurrency(version.finalPrice)}</TableCell>
                  <TableCell>{version.createdBy}</TableCell>
                  <TableCell>
                    {new Date(version.createdAt).toLocaleDateString()}
                  </TableCell>
                  {/* <TableCell>
                    {version.customerResponse ? (
                      <div className="space-y-1">
                        <Badge variant={
                          version.customerResponse.status === 'ACCEPTED' ? 'default' :
                          version.customerResponse.status === 'DECLINED' ? 'destructive' :
                          'secondary'
                        }>
                          {version.customerResponse.status}
                        </Badge>                        {version.customerResponse.comments && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {version.customerResponse.comments}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecordResponse(version)}
                      >
                        Record Response
                      </Button>
                    )}
                  </TableCell> */}
                  <TableCell>
                    <div className="flex gap-2">
                      {hasQuotationResponses(version) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadQuotationResponses(version)}
                          disabled={loadingResponses}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Response{(version.quotationResponseCount || 0) > 1 ? 's' : ''} ({version.quotationResponseCount})
                        </Button>
                      )}
                      {onRecordQuotationResponse ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRecordQuotationResponse(version)}
                        >
                          Record Detailed Response
                        </Button>
                      ) : (
                        !hasQuotationResponses(version) && (
                          <span className="text-muted-foreground text-sm">Not available</span>
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedVersions.has(version.id) && version.items && version.items.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <div className="bg-muted/30 p-4">
                        <h4 className="font-medium mb-2">
                          SKU Items (v{version.versionNumber}) - {version.items.length} items
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Comment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {version.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.sku?.sku || 'N/A'}</TableCell>
                                <TableCell>{item.sku?.description || 'N/A'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                                <TableCell>{item.comment || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>                        {version.notes && (
                          <div className="mt-3 p-3 bg-background rounded border">
                            <h5 className="font-medium text-sm mb-1">Notes:</h5>
                            <p className="text-sm text-muted-foreground">{version.notes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        {versions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No quotation versions found
          </div>
        )}

        {/* Version Details Modal */}
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Version {selectedVersion?.versionNumber} Details
              </DialogTitle>
            </DialogHeader>
            {selectedVersion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Entry Type:</strong> {getEntryTypeLabel(selectedVersion.entryType)}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedVersion.status}
                  </div>
                  <div>
                    <strong>Created By:</strong> {selectedVersion.createdBy}
                  </div>
                  <div>
                    <strong>Date:</strong> {new Date(selectedVersion.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Total Amount:</strong> {formatCurrency(selectedVersion.finalPrice)}
                  </div>
                </div>
                
                {selectedVersion.notes && (
                  <div>
                    <strong>Notes:</strong>
                    <p className="mt-1 text-muted-foreground">{selectedVersion.notes}</p>
                  </div>
                )}

                {selectedVersion.items && selectedVersion.items.length > 0 && (
                  <div>
                    <strong>Items:</strong>                    <Table className="mt-2">
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedVersion.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.sku?.sku || 'N/A'}</TableCell>
                            <TableCell>{item.sku?.description || 'N/A'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                            <TableCell>{item.comment || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedVersion.customerResponse && (
                  <div className="border rounded p-3 bg-muted/30">
                    <strong>Customer Response:</strong>
                    <div className="mt-2 space-y-2">
                      <div>Status: {getStatusBadge(selectedVersion.customerResponse.status)}</div>
                      {selectedVersion.customerResponse.comments && (
                        <div>
                          <strong>Comments:</strong>
                          <p className="text-muted-foreground">{selectedVersion.customerResponse.comments}</p>
                        </div>
                      )}
                      {selectedVersion.customerResponse.requestedChanges && (
                        <div>
                          <strong>Requested Changes:</strong>
                          <p className="text-muted-foreground">{selectedVersion.customerResponse.requestedChanges}</p>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Responded on: {new Date(selectedVersion.customerResponse.respondedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quotation Responses Modal */}
        <Dialog open={isResponseModalOpen} onOpenChange={() => {
          setIsResponseModalOpen(false);
          setResponseVersion(null);
        }}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Quotation Responses - Version {responseVersion?.versionNumber}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {loadingResponses ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  Loading responses...
                </div>
              ) : quotationResponses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg font-medium">No detailed responses found</p>
                  <p className="text-sm mt-2">This version doesn't have any detailed quotation responses yet.</p>
                </div>
              ) : (
                quotationResponses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Response #{response.responseNumber}</h4>
                      <div className="flex items-center gap-2">
                        {getResponseStatusBadge(response.overallStatus)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(response.responseDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {response.customerContactPerson && (
                        <div>
                          <strong>Contact Person:</strong> {response.customerContactPerson}
                        </div>
                      )}
                      <div>
                        <strong>Communication Method:</strong> {response.communicationMethod}
                      </div>
                      {response.requestedDeliveryDate && (
                        <div>
                          <strong>Requested Delivery:</strong> {new Date(response.requestedDeliveryDate).toLocaleDateString()}
                        </div>
                      )}
                      {response.paymentTermsRequested && (
                        <div>
                          <strong>Payment Terms:</strong> {response.paymentTermsRequested}
                        </div>
                      )}
                    </div>

                    {response.overallComments && (
                      <div>
                        <strong>Overall Comments:</strong>
                        <p className="mt-1 text-muted-foreground">{response.overallComments}</p>
                      </div>
                    )}

                    {response.specialInstructions && (
                      <div>
                        <strong>Special Instructions:</strong>
                        <p className="mt-1 text-muted-foreground">{response.specialInstructions}</p>
                      </div>
                    )}

                    {response.responseItems && response.responseItems.length > 0 && (
                      <div className="mt-4">
                        <strong>SKU-Level Responses:</strong>
                        <div className="mt-2 border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>v{responseVersion?.versionNumber} Qty</TableHead>
                                <TableHead>v{responseVersion?.versionNumber} Price</TableHead>
                                <TableHead>Response Status</TableHead>
                                <TableHead>Requested Qty</TableHead>
                                <TableHead>Requested Price</TableHead>
                                <TableHead>Comments</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {response.responseItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.sku?.sku || 'N/A'}</TableCell>
                                  <TableCell>{item.sku?.description || 'N/A'}</TableCell>
                                  <TableCell>{item.quotationVersionItem?.quantity || 'N/A'}</TableCell>
                                  <TableCell>{formatCurrency(item.quotationVersionItem?.unitPrice || 0)}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      item.itemStatus === 'ACCEPTED' ? 'default' :
                                      item.itemStatus === 'DECLINED' ? 'destructive' :
                                      item.itemStatus === 'COUNTER_PROPOSED' ? 'secondary' : 'outline'
                                    }>
                                      {item.itemStatus.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{item.requestedQuantity || '-'}</TableCell>
                                  <TableCell>{item.requestedUnitPrice ? formatCurrency(item.requestedUnitPrice) : '-'}</TableCell>
                                  <TableCell>
                                    <div className="max-w-xs">
                                      {item.itemSpecificComments && (
                                        <div className="text-sm">
                                          <strong>Comments:</strong> {item.itemSpecificComments}
                                        </div>
                                      )}
                                      {item.alternativeSuggestions && (
                                        <div className="text-sm mt-1">
                                          <strong>Alternatives:</strong> {item.alternativeSuggestions}
                                        </div>
                                      )}
                                      {item.deliveryRequirements && (
                                        <div className="text-sm mt-1">
                                          <strong>Delivery:</strong> {item.deliveryRequirements}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Created: {new Date(response.createdAt).toLocaleString()}
                      {response.updatedAt !== response.createdAt && (
                        <> • Updated: {new Date(response.updatedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
