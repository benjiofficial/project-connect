-- Update the handle_new_user function to check for admin signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_signup BOOLEAN;
BEGIN
  -- Check if this is an admin signup from metadata
  is_admin_signup := COALESCE((NEW.raw_user_meta_data->>'is_admin_signup')::boolean, false);

  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign role based on signup type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin_signup THEN 'admin'::app_role ELSE 'user'::app_role END);
  
  RETURN NEW;
END;
$function$;