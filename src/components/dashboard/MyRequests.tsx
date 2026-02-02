import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface ProjectRequest {
  id: string;
  title: string;
  project_types: string[];
  problem_statement: string;
  status: string;
  created_at: string;
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

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('project_requests')
      .select('id, title, project_types, problem_statement, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
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
              <Link to={`/request/${request.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
