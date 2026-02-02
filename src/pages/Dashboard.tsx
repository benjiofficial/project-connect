import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequestForm } from '@/components/dashboard/RequestForm';
import { MyRequests } from '@/components/dashboard/MyRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileText } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, loading, role, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Submit and manage your project requests
          </p>
        </div>

        <Tabs defaultValue="my-requests" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-requests" className="gap-2">
              <FileText className="h-4 w-4" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="new-request" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Request
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-requests" className="mt-6">
            <MyRequests />
          </TabsContent>
          
          <TabsContent value="new-request" className="mt-6">
            <RequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
