import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { negotiationApi } from '@/lib/api-client';
import type { 
  NegotiationCommunication, 
  NegotiationCommunicationType, 
  NegotiationDirection 
} from "@/lib/types/quotation";

interface CommunicationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  communication: NegotiationCommunication | null;
  onUpdate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function CommunicationEditModal({
  isOpen,
  onClose,
  communication,
  onUpdate,
  onDelete,
}: CommunicationEditModalProps) {
  const [communicationType, setCommunicationType] = useState<NegotiationCommunicationType>('EMAIL');
  const [direction, setDirection] = useState<NegotiationDirection>('OUTBOUND');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [communicationDate, setCommunicationDate] = useState<Date>(new Date());
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form when communication prop changes
  useEffect(() => {
    if (communication) {
      setCommunicationType(communication.communicationType);
      setDirection(communication.direction);
      setSubject(communication.subject || '');
      setContent(communication.content);
      setContactPerson(communication.contactPerson || '');
      setCommunicationDate(new Date(communication.communicationDate));
      setFollowUpRequired(communication.followUpRequired);
      setFollowUpDate(communication.followUpDate ? new Date(communication.followUpDate) : undefined);
    }
  }, [communication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !communication) {
      toast.error('Please enter communication content');
      return;
    }

    if (followUpRequired && !followUpDate) {
      toast.error('Please select a follow-up date');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData = {
        communicationType,
        direction,
        subject: subject.trim() || undefined,
        content: content.trim(),
        contactPerson: contactPerson.trim() || undefined,
        communicationDate,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
      };

      const response = await negotiationApi.updateCommunication(communication.id.toString(), updateData);
      
      if (response.success) {
        toast.success('Communication updated successfully');
        await onUpdate();
        onClose();
      } else {
        throw new Error(response.error || 'Failed to update communication');
      }
    } catch (error) {
      console.error('Error updating communication:', error);
      toast.error('Failed to update communication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!communication) return;

    try {
      setIsDeleting(true);
      
      const response = await negotiationApi.deleteCommunication(communication.id.toString());
      
      if (response.success) {
        toast.success('Communication deleted successfully');
        await onDelete();
        onClose();
      } else {
        throw new Error(response.error || 'Failed to delete communication');
      }
    } catch (error) {
      console.error('Error deleting communication:', error);
      toast.error('Failed to delete communication. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getCommunicationTypeLabel = (type: NegotiationCommunicationType) => {
    switch (type) {
      case 'EMAIL': return 'Email';
      case 'PHONE_CALL': return 'Phone Call';
      case 'MEETING': return 'Meeting';
      case 'INTERNAL_NOTE': return 'Internal Note';
      default: return type;
    }
  };

  const getDirectionLabel = (dir: NegotiationDirection) => {
    switch (dir) {
      case 'OUTBOUND': return 'Outbound (Sent to Customer)';
      case 'INBOUND': return 'Inbound (Received from Customer)';
      default: return dir;
    }
  };

  if (!communication) return null;
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Edit Communication</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700"
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="communicationType">Communication Type</Label>
                <Select 
                  value={communicationType} 
                  onValueChange={(value: NegotiationCommunicationType) => setCommunicationType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="INTERNAL_NOTE">Internal Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="direction">Direction</Label>
                <Select 
                  value={direction} 
                  onValueChange={(value: NegotiationDirection) => setDirection(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTBOUND">Outbound (Sent to Customer)</SelectItem>
                    <SelectItem value="INBOUND">Inbound (Received from Customer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Customer contact name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="communicationDate">Communication Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !communicationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {communicationDate ? format(communicationDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={communicationDate}
                      onSelect={(date) => date && setCommunicationDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(communicationType === 'EMAIL' || communicationType === 'MEETING') && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Communication subject"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter communication details, notes, or conversation summary..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="followUpRequired"
                  checked={followUpRequired}
                  onCheckedChange={setFollowUpRequired}
                />
                <Label htmlFor="followUpRequired">Follow-up required</Label>
              </div>

              {followUpRequired && (
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !followUpDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpDate ? format(followUpDate, "PPP") : <span>Pick a follow-up date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        onSelect={setFollowUpDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? 'Updating...' : 'Update Communication'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Communication</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this communication? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
