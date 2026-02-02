import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { AdminAuthForm } from '@/components/auth/AdminAuthForm';

export default function AdminLogin() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, loading, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <AdminAuthForm />
      </div>
    </div>
  );
}
