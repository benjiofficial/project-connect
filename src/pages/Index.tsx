import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Shield, 
  Bell, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Users,
  Lock
} from 'lucide-react';
import logo from '@/assets/logo.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="e-Crime Bureau" className="h-10 w-10 object-contain" />
            <span className="font-display text-xl font-semibold">e-Crime Bureau</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8 animate-fade-in">
              <Zap className="h-4 w-4" />
              Streamlined Project Request Management
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 animate-slide-up">
              Submit, Track & Manage
              <br />
              <span className="gradient-text">Project Requests</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              A centralized platform for teams to submit project proposals, receive 
              expert feedback, and track approval status — all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth">
                <Button size="lg" className="gap-2 px-8">
                  Submit a Request
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  View My Requests
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete solution for managing project requests from submission to approval
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Structured Forms"
              description="Submit detailed project requests with all required information in a guided form."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Admin Review"
              description="Administrators can review, comment, and manage request status efficiently."
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Instant Notifications"
              description="Get notified when administrators respond to your requests."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Secure & Private"
              description="Your requests are visible only to you and authorized administrators."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Simple, streamlined process from request to approval
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Submit Request"
              description="Fill out the project request form with details about your proposal."
            />
            <StepCard
              number="2"
              title="Admin Review"
              description="Administrators review your request and provide feedback or questions."
            />
            <StepCard
              number="3"
              title="Get Approved"
              description="Receive notification when your request is approved or needs changes."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold mb-2">500+</div>
              <div className="text-primary-foreground/70">Projects Submitted</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold mb-2">24h</div>
              <div className="text-primary-foreground/70">Average Response Time</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold mb-2">98%</div>
              <div className="text-primary-foreground/70">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Create your account and submit your first project request today.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8">
                <Users className="h-4 w-4" />
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="e-Crime Bureau" className="h-8 w-8 object-contain" />
              <span className="font-display font-semibold">e-Crime Bureau</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 e-Crime Bureau. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/50 hover:shadow-lg transition-shadow">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default Index;
