-- Create enum types
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.request_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
CREATE TYPE public.confidentiality_level AS ENUM ('public', 'internal', 'restricted');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create project_requests table
CREATE TABLE public.project_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  project_types TEXT[] NOT NULL DEFAULT '{}',
  strategic_alignment TEXT,
  problem_statement TEXT NOT NULL,
  expected_outcomes TEXT NOT NULL,
  estimated_duration TEXT,
  key_dependencies TEXT,
  confidentiality_level confidentiality_level NOT NULL DEFAULT 'internal',
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create comments table (admin comments on requests)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.project_requests(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.project_requests(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_project_requests_user_id ON public.project_requests(user_id);
CREATE INDEX idx_project_requests_status ON public.project_requests(status);
CREATE INDEX idx_comments_request_id ON public.comments(request_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to get request owner
CREATE OR REPLACE FUNCTION public.get_request_owner(_request_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.project_requests
  WHERE id = _request_id
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Project requests RLS policies
CREATE POLICY "Users can view own requests"
  ON public.project_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.project_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own requests"
  ON public.project_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON public.project_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update any request"
  ON public.project_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own pending requests"
  ON public.project_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Comments RLS policies
CREATE POLICY "Users can view comments on own requests"
  ON public.comments FOR SELECT
  USING (public.get_request_owner(request_id) = auth.uid());

CREATE POLICY "Admins can view all comments"
  ON public.comments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can update own comments"
  ON public.comments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can delete own comments"
  ON public.comments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Notifications RLS policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow system to insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to create notification when admin comments
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_owner_id UUID;
  admin_name TEXT;
  request_title TEXT;
BEGIN
  -- Get the request owner
  SELECT user_id, title INTO request_owner_id, request_title
  FROM public.project_requests
  WHERE id = NEW.request_id;
  
  -- Get admin name
  SELECT full_name INTO admin_name
  FROM public.profiles
  WHERE user_id = NEW.admin_id;
  
  -- Create notification for the request owner
  INSERT INTO public.notifications (user_id, request_id, comment_id, message)
  VALUES (
    request_owner_id,
    NEW.request_id,
    NEW.id,
    'Admin ' || COALESCE(admin_name, 'Unknown') || ' commented on your request: "' || request_title || '"'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- Trigger to update updated_at on project_requests
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_project_requests_updated_at
  BEFORE UPDATE ON public.project_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();