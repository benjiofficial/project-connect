import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { UserAuthForm } from '@/components/auth/UserAuthForm';
import { FileText } from 'lucide-react';

export default function Auth() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <FileText className="h-6 w-6" />
            </div>
            <span className="font-display text-xl font-semibold">ProjectHub</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-display font-bold leading-tight">
              Streamline Your<br />Project Requests
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Submit proposals, track progress, and collaborate with administrators 
              all in one centralized platform.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-primary-foreground/70">Projects Submitted</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-primary-foreground/70">Satisfaction Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24h</div>
                <div className="text-sm text-primary-foreground/70">Avg Response Time</div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-primary-foreground/60">
            © 2024 ProjectHub. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Right Panel - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <UserAuthForm />
        </div>
      </div>
    </div>
  );
}
