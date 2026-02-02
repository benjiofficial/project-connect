import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { FileText, Clock, Eye, MessageSquare, Loader2 } from 'lucide-react';

interface ProjectRequest {
  id: string;
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
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  admin_name?: string;
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

export function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('project_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const fetchComments = async (requestId: string) => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        comment,
        created_at,
        admin_id
      `)
      .eq('request_id', requestId)
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

  const handleViewDetails = async (request: ProjectRequest) => {
    setSelectedRequest(request);
    await fetchComments(request.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            You haven't submitted any project requests. Click on "New Request" to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => {
          const status = statusConfig[request.status] || statusConfig.pending;
          return (
            <Card key={request.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(request.created_at), 'PPP')}
                    </CardDescription>
                  </div>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.project_types.map((type) => (
                    <Badge key={type} variant="secondary">
                      {typeLabels[type] || type}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {request.problem_statement}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewDetails(request)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedRequest && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={statusConfig[selectedRequest.status]?.className}>
                    {statusConfig[selectedRequest.status]?.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Submitted {format(new Date(selectedRequest.created_at), 'PPP')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedRequest.project_types.map((type) => (
                    <Badge key={type} variant="secondary">
                      {typeLabels[type] || type}
                    </Badge>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  {selectedRequest.strategic_alignment && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Strategic Alignment</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.strategic_alignment}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-sm mb-1">Problem Statement</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.problem_statement}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-1">Expected Outcomes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.expected_outcomes}
                    </p>
                  </div>

                  {selectedRequest.estimated_duration && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Estimated Duration</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.estimated_duration}
                      </p>
                    </div>
                  )}

                  {selectedRequest.key_dependencies && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Key Dependencies</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedRequest.key_dependencies}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-sm mb-1">Confidentiality Level</h4>
                    <Badge variant="outline" className="capitalize">
                      {selectedRequest.confidentiality_level}
                    </Badge>
                  </div>
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
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No comments yet
                    </p>
                  ) : (
                    <div className="space-y-4">
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
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
