import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';

interface ProjectRequest {
  id: string;
  user_id: string;
  title: string;
  project_types: string[];
  strategic_alignment: string | null;
  problem_statement: string;
  expected_outcomes: string;
  estimated_duration: string | null;
  key_dependencies: string | null;
  confidentiality_level: string;
  status: string;
  created_at: string;
  submitter_name?: string;
  submitter_email?: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  admin_name?: string;
}

interface RequestDetailDialogProps {
  request: ProjectRequest | null;
  onClose: () => void;
  onStatusChange: (requestId: string, newStatus: string) => void;
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'status-pending' },
  in_review: { label: 'In Review', className: 'status-in-review' },
  approved: { label: 'Approved', className: 'status-approved' },
  rejected: { label: 'Rejected', className: 'status-rejected' },
};

const typeLabels: Record<string, string> = {
  'research': 'Research',
  'threat-intelligence': 'Threat Intelligence',
  'prototype': 'Prototype / Tool',
  'advisory': 'Advisory',
  'training': 'Training',
  'other': 'Other',
};

export function RequestDetailDialog({ request, onClose, onStatusChange, onRefresh }: RequestDetailDialogProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (request) {
      fetchComments();
    }
  }, [request?.id]);

  const fetchComments = async () => {
    if (!request) return;
    
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select('id, comment, created_at, admin_id')
      .eq('request_id', request.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      // Fetch admin names for each comment
      const commentsWithNames = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', comment.admin_id)
            .single();
          return {
            ...comment,
            admin_name: profile?.full_name || 'Admin',
          };
        })
      );
      setComments(commentsWithNames);
    }
    setLoadingComments(false);
  };

  const handleSubmitComment = async () => {
    if (!request || !user || !newComment.trim()) return;

    setSubmittingComment(true);
    const { error } = await supabase.from('comments').insert({
      request_id: request.id,
      admin_id: user.id,
      comment: newComment.trim(),
    });

    if (error) {
      toast.error('Failed to add comment: ' + error.message);
    } else {
      toast.success('Comment added and notification sent to requester');
      setNewComment('');
      fetchComments();
    }
    setSubmittingComment(false);
  };

  const handleStatusChange = (newStatus: string) => {
    if (request) {
      onStatusChange(request.id, newStatus);
    }
  };

  if (!request) return null;

  const status = statusConfig[request.status] || statusConfig.pending;

  return (
    <Dialog open={!!request} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="pr-8">{request.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Submitter Info */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{request.submitter_name}</p>
                <p className="text-sm text-muted-foreground">{request.submitter_email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.created_at), 'PPP')}
                </p>
              </div>
            </div>

            {/* Status & Type */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Select value={request.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[140px]">
                    <Badge className={status.className}>{status.label}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {request.project_types.map((type) => (
                <Badge key={type} variant="secondary">
                  {typeLabels[type] || type}
                </Badge>
              ))}
            </div>

            <Separator />

            {/* Request Details */}
            <div className="space-y-4">
              {request.strategic_alignment && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Strategic Alignment</h4>
                  <p className="text-sm text-muted-foreground">
                    {request.strategic_alignment}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm mb-1">Problem Statement</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.problem_statement}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Expected Outcomes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.expected_outcomes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {request.estimated_duration && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Estimated Duration</h4>
                    <p className="text-sm text-muted-foreground">
                      {request.estimated_duration}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-1">Confidentiality Level</h4>
                  <Badge variant="outline" className="capitalize">
                    {request.confidentiality_level}
                  </Badge>
                </div>
              </div>

              {request.key_dependencies && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Key Dependencies</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.key_dependencies}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Comments Section */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4" />
                Admin Comments
              </h4>
              
              {loadingComments ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
                  No comments yet. Add a comment below.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg bg-muted/50 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.admin_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'PPp')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="space-y-3 pt-4 border-t">
                <Label htmlFor="new-comment">Add Comment</Label>
                <Textarea
                  id="new-comment"
                  placeholder="Write your comment here... The requester will be notified."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={!newComment.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
