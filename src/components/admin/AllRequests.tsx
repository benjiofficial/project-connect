import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Eye, Loader2, Search, Filter } from 'lucide-react';
import { RequestDetailDialog } from './RequestDetailDialog';

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

export function AllRequests() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('project_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else if (data) {
      // Fetch submitter info for each request
      const requestsWithSubmitters = await Promise.all(
        data.map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', request.user_id)
            .single();
          return {
            ...request,
            submitter_name: profile?.full_name || 'Unknown',
            submitter_email: profile?.email || '',
          };
        })
      );
      setRequests(requestsWithSubmitters);
    }
    setLoading(false);
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    const validStatus = newStatus as "pending" | "in_review" | "approved" | "rejected";
    const { error } = await supabase
      .from('project_requests')
      .update({ status: validStatus })
      .eq('id', requestId);

    if (!error) {
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ));
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitter_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inReview: requests.filter(r => r.status === 'in_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-info">{stats.inReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const status = statusConfig[request.status] || statusConfig.pending;
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {request.title}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{request.submitter_name}</p>
                            <p className="text-xs text-muted-foreground">{request.submitter_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {request.project_types.slice(0, 2).map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {typeLabels[type] || type}
                              </Badge>
                            ))}
                            {request.project_types.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{request.project_types.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={request.status}
                            onValueChange={(value) => handleStatusChange(request.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <Badge className={status.className}>{status.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <RequestDetailDialog
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onStatusChange={handleStatusChange}
        onRefresh={fetchRequests}
      />
    </>
  );
}
