import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Phone, Mail, Users, FileText, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { CommunicationEntryModal } from '../communication-entry-modal';
import { CommunicationEditModal } from '../communication-edit-modal';
import { NegotiationSetup } from '../negotiation-setup';
import { negotiationApi } from '@/lib/api-client';
import { toast } from 'sonner';
import type { 
  NegotiationCommunication, 
  SkuNegotiationHistory, 
  QuotationVersionWithItems,
  CreateCommunicationRequest,
  NegotiationSummary 
} from '@/lib/types/quotation';

interface NegotiationTabProps {
  rfqId: number;
  rfqStatus: string;
  currentVersion?: QuotationVersionWithItems;
}

export function NegotiationTab({ rfqId, rfqStatus, currentVersion }: NegotiationTabProps) {
  const { formatCurrency } = useCurrency();
  const [communications, setCommunications] = useState<NegotiationCommunication[]>([]);
  const [skuHistory, setSkuHistory] = useState<SkuNegotiationHistory[]>([]);
  const [summary, setSummary] = useState<NegotiationSummary | null>(null);
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const [showEditCommunication, setShowEditCommunication] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<NegotiationCommunication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [hasDbError, setHasDbError] = useState(false);
  
  // NEW: Add refresh state management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // IMPROVED: Better data fetching with useCallback for optimization
  const fetchNegotiationData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Validate rfqId
      if (!rfqId || isNaN(rfqId)) {
        throw new Error('Invalid RFQ ID');
      }

      // Make API calls individually to better identify which one fails
      let commResponse, historyResponse, summaryResponse;
      
      try {
        commResponse = await negotiationApi.getCommunications(rfqId.toString());
      } catch (error) {
        console.error('Error fetching communications:', error);
        // Check if it's a database/table issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('relation') || errorMessage.includes('table') || errorMessage.includes('500')) {
          console.warn('Communications table may not exist, providing empty data');
          commResponse = { success: true, data: [] };
          setHasDbError(true);
        } else {
          commResponse = { success: false, data: [], error: 'Failed to fetch communications' };
        }
      }

      try {
        historyResponse = await negotiationApi.getSkuHistory(rfqId.toString());
      } catch (error) {
        console.error('Error fetching SKU history:', error);
        // Check if it's a database/table issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('relation') || errorMessage.includes('table') || errorMessage.includes('500')) {
          console.warn('SKU history table may not exist, providing empty data');
          historyResponse = { success: true, data: [] };
          setHasDbError(true);
        } else {
          historyResponse = { success: false, data: [], error: 'Failed to fetch SKU history' };
        }
      }

      try {
        summaryResponse = await negotiationApi.getNegotiationSummary(rfqId.toString());
      } catch (error) {
        console.error('Error fetching negotiation summary:', error);
        // Check if it's a database/table issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('relation') || errorMessage.includes('table') || errorMessage.includes('500')) {
          console.warn('Negotiation summary table may not exist, providing default data');
          summaryResponse = { 
            success: true, 
            data: {
              totalCommunications: 0,
              totalSkuChanges: 0,
              pendingFollowUps: 0,
              lastCommunicationDate: null,
              negotiationDuration: 0
            }
          };
          setHasDbError(true);
        } else {
          summaryResponse = { success: false, data: null, error: 'Failed to fetch summary' };
        }
      }

      // Update state with successful responses
      if (commResponse.success && Array.isArray(commResponse.data)) {
        setCommunications(commResponse.data);
      } else {
        setCommunications([]);
        console.warn('Communications API failed:', commResponse.error);
      }
      
      if (historyResponse.success && Array.isArray(historyResponse.data)) {
        setSkuHistory(historyResponse.data);
      } else {
        setSkuHistory([]);
        console.warn('SKU History API failed:', historyResponse.error);
      }
      
      // Type guard for NegotiationSummary
      const isNegotiationSummary = (data: any): data is NegotiationSummary => {
        return data &&
          typeof data.totalCommunications === 'number' &&
          typeof data.totalSkuChanges === 'number' &&
          typeof data.pendingFollowUps === 'number' &&
          typeof data.negotiationDuration === 'number';
      };
      if (summaryResponse.success && isNegotiationSummary(summaryResponse.data)) {
        setSummary(summaryResponse.data);
      } else {
        setSummary(null);
        console.warn('Summary API failed:', summaryResponse.error);
      }

      setLastRefresh(Date.now());

    } catch (error) {
      console.error('Error in fetchNegotiationData:', error);
      toast.error('Failed to load negotiation data');
      // Set default values
      setCommunications([]);
      setSkuHistory([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rfqId]);

  // Initial data fetch
  useEffect(() => {
    fetchNegotiationData();
  }, [fetchNegotiationData]);

  // NEW: Manual refresh function
  const handleRefresh = () => {
    fetchNegotiationData(true);
  };

  // IMPROVED: Better communication handling with auto-refresh
  const handleAddCommunication = async (data: CreateCommunicationRequest) => {
    try {
      const response = await negotiationApi.createCommunication(rfqId.toString(), data);
      if (response.success) {
        toast.success('Communication added successfully');
        await fetchNegotiationData(true); // Refresh data after adding
      } else {
        throw new Error(response.error || 'Failed to create communication');
      }
    } catch (error) {
      console.error('Error creating communication:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleEditCommunication = (communication: NegotiationCommunication) => {
    setSelectedCommunication(communication);
    setShowEditCommunication(true);
  };

  const handleUpdateCommunication = async () => {
    await fetchNegotiationData(true); // Refresh data after update
  };

  const handleDeleteCommunication = async () => {
    await fetchNegotiationData(true); // Refresh data after delete
  };

  const handleCompleteFollowUp = async (communicationId: number) => {
    try {
      const response = await negotiationApi.completeFollowUp(communicationId.toString(), true);
      if (response.success) {
        toast.success('Follow-up marked as completed');
        await fetchNegotiationData(true); // Refresh data
      } else {
        throw new Error(response.error || 'Failed to complete follow-up');
      }
    } catch (error) {
      console.error('Error completing follow-up:', error);
      toast.error('Failed to complete follow-up');
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'PHONE_CALL': return <Phone className="h-4 w-4" />;
      case 'MEETING': return <Users className="h-4 w-4" />;
      case 'INTERNAL_NOTE': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCommunicationTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'Email';
      case 'PHONE_CALL': return 'Phone Call';
      case 'MEETING': return 'Meeting';
      case 'INTERNAL_NOTE': return 'Internal Note';
      default: return type;
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'PRICE_CHANGE': return 'Price Change';
      case 'QUANTITY_CHANGE': return 'Quantity Change';
      case 'BOTH': return 'Price & Quantity';
      default: return changeType;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <div className="text-muted-foreground">Loading negotiation data...</div>
        </div>
      </div>
    );
  }

  // Show setup component if there are database errors
  if (hasDbError && !showSetup) {
    return (
      <div className="space-y-4">
        <NegotiationSetup onSetupComplete={() => {
          setHasDbError(false);
          setShowSetup(false);
          fetchNegotiationData(); // Retry fetching data
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Negotiation Management</h2>
          <p className="text-muted-foreground">
            Track communications and SKU changes for RFQ #{rfqId}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800">{summary?.totalCommunications || communications.length}</div>
                <div className="text-sm text-blue-600">Total Communications</div>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800">{summary?.totalSkuChanges || skuHistory.length}</div>
                <div className="text-sm text-green-600">SKU Changes</div>
              </div>
              <Edit className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-800">
                  {summary?.pendingFollowUps || communications.filter(c => c.followUpRequired && !c.followUpCompleted).length}
                </div>
                <div className="text-sm text-orange-600">Pending Follow-ups</div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {currentVersion ? `v${currentVersion.versionNumber}` : 'N/A'}
                </div>
                <div className="text-sm text-purple-600">Current Version</div>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Timeline */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Communication Timeline</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date(lastRefresh).toLocaleTimeString()}
              </div>
            </div>
            <Button onClick={() => setShowAddCommunication(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Communication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {communications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No communications recorded yet. Click "Add Communication" to start tracking negotiations.
              </div>
            ) : (
              communications
                .sort((a, b) => new Date(b.communicationDate).getTime() - new Date(a.communicationDate).getTime())
                .map((comm) => (
                  <div key={comm.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCommunicationIcon(comm.communicationType)}
                          <Badge variant={comm.direction === 'OUTBOUND' ? 'default' : 'secondary'}>
                            {comm.direction} {getCommunicationTypeLabel(comm.communicationType)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(comm.communicationDate).toLocaleString()}
                          </span>
                        </div>
                        {comm.subject && (
                          <div className="font-medium mb-1">{comm.subject}</div>
                        )}
                        <div className="text-gray-700 mb-1 whitespace-pre-wrap">{comm.content}</div>
                        {comm.contactPerson && (
                          <div className="text-sm text-gray-500">
                            Contact: {comm.contactPerson}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {comm.followUpRequired && (
                          <div className="flex items-center gap-2">
                            {comm.followUpCompleted ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                Follow-up completed: {comm.followUpCompletedAt ? new Date(comm.followUpCompletedAt).toLocaleDateString() : 'Recently'}
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="destructive" className="text-xs">
                                  Follow-up: {comm.followUpDate ? new Date(comm.followUpDate).toLocaleDateString() : 'TBD'}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleCompleteFollowUp(comm.id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Mark follow-up as completed"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEditCommunication(comm)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* SKU Changes Summary */}
      <Card>
        <CardHeader>
          <CardTitle>SKU-Level Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {skuHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No SKU changes recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Changed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skuHistory
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((change) => (
                    <TableRow key={change.id}>
                      <TableCell>
                        {new Date(change.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{change.sku?.sku || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getChangeTypeLabel(change.changeType)}</Badge>
                      </TableCell>
                      <TableCell>
                        {change.changeType.includes('QUANTITY') 
                          ? change.oldQuantity 
                          : formatCurrency(change.oldUnitPrice || 0)}
                      </TableCell>
                      <TableCell>
                        {change.changeType.includes('QUANTITY') 
                          ? change.newQuantity 
                          : formatCurrency(change.newUnitPrice || 0)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {change.changeReason || 'No reason provided'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={change.changedBy === 'CUSTOMER' ? 'secondary' : 'default'}>
                          {change.changedBy}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Communication Entry Modal */}
      <CommunicationEntryModal
        isOpen={showAddCommunication}
        onClose={() => setShowAddCommunication(false)}
        rfqId={rfqId}
        currentVersionId={currentVersion?.id}
        onSubmit={handleAddCommunication}
      />

      {/* Communication Edit Modal */}
      <CommunicationEditModal
        isOpen={showEditCommunication}
        onClose={() => {
          setShowEditCommunication(false);
          setSelectedCommunication(null);
        }}
        communication={selectedCommunication}
        onUpdate={handleUpdateCommunication}
        onDelete={handleDeleteCommunication}
      />
    </div>
  );
}