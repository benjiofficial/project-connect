import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { AllRequests } from '@/components/admin/AllRequests';

export default function AdminDashboard() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/admin/login');
      } else if (role !== 'admin') {
        // User is logged in but not an admin
        navigate('/dashboard');
      }
    }
  }, [user, loading, role, navigate]);

  if (loading || !user || role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage and review all project requests
          </p>
        </div>
        <AllRequests />
      </div>
    </AdminDashboardLayout>
  );
}
