-- Create storage bucket for request attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-attachments',
  'request-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
);

-- Create request_attachments table
CREATE TABLE public.request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.project_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX idx_request_attachments_request_id ON public.request_attachments(request_id);

-- Enable RLS
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for request_attachments
CREATE POLICY "Users can view attachments on own requests"
  ON public.request_attachments FOR SELECT
  USING (public.get_request_owner(request_id) = auth.uid());

CREATE POLICY "Admins can view all attachments"
  ON public.request_attachments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert attachments on own requests"
  ON public.request_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.get_request_owner(request_id) = auth.uid());

CREATE POLICY "Users can delete own attachments on pending requests"
  ON public.request_attachments FOR DELETE
  USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.project_requests 
      WHERE id = request_id AND status = 'pending'
    )
  );

-- Storage policies for the bucket
CREATE POLICY "Users can upload to own request folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'request-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own request files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'request-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all request files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'request-attachments'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'request-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );