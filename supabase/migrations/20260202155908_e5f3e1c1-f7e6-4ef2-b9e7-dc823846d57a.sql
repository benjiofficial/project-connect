-- Drop the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only allow trigger-based inserts (no direct user inserts)
-- The trigger runs as SECURITY DEFINER so it bypasses RLS