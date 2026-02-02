import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { AttachmentList } from '@/components/dashboard/AttachmentList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Loader2, 
  Clock, 
  MessageSquare, 
  Paperclip,
  AlertCircle
} from 'lucide-react';

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
  user_id: string;
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

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState<ProjectRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachmentRefreshKey, setAttachmentRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchRequest();
      fetchComments();
    }
  }, [id, user]);

  const fetchRequest = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('project_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching request:', error);
      navigate('/dashboard');
    } else {
      setRequest(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('comments')
      .select('id, comment, created_at, admin_id')
      .eq('request_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
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
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Request not found</h2>
          <p className="text-muted-foreground mb-4">
            This request doesn't exist or you don't have access to it.
          </p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[request.status] || statusConfig.pending;
  const canUpload = request.status === 'pending';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">{request.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Submitted {format(new Date(request.created_at), 'PPP')}
            </div>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>

        {/* Project Types */}
        <div className="flex flex-wrap gap-2">
          {request.project_types.map((type) => (
            <Badge key={type} variant="secondary">
              {typeLabels[type] || type}
            </Badge>
          ))}
          <Badge variant="outline" className="capitalize">
            {request.confidentiality_level}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {request.strategic_alignment && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Strategic Alignment</h4>
                    <p className="text-sm text-muted-foreground">
                      {request.strategic_alignment}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-2">Problem Statement</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.problem_statement}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Expected Outcomes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.expected_outcomes}
                  </p>
                </div>

                {request.estimated_duration && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Estimated Duration</h4>
                    <p className="text-sm text-muted-foreground">
                      {request.estimated_duration}
                    </p>
                  </div>
                )}

                {request.key_dependencies && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Key Dependencies</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.key_dependencies}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AttachmentList 
                  requestId={request.id} 
                  canDelete={canUpload}
                  refreshKey={attachmentRefreshKey}
                />
                
                {canUpload && (
                  <>
                    <Separator />
                    <FileUpload 
                      requestId={request.id}
                      onUploadComplete={() => setAttachmentRefreshKey(k => k + 1)}
                    />
                  </>
                )}
                
                {!canUpload && (
                  <p className="text-xs text-muted-foreground text-center">
                    Attachments can only be added while the request is pending.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Comments */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Admin Comments
                  {comments.length > 0 && (
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {comments.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No comments yet. You'll receive a notification when an admin responds.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg bg-muted/50 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{comment.admin_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
