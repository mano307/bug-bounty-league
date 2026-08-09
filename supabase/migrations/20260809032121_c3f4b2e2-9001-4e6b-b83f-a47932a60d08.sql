ALTER TABLE public.profiles DROP COLUMN IF EXISTS college;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, register_number, email, department, year, section)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'register_number',''),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'department',''),
    COALESCE(NEW.raw_user_meta_data->>'year',''),
    COALESCE(NEW.raw_user_meta_data->>'section','')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'participant') ON CONFLICT DO NOTHING;

  INSERT INTO public.round_access (user_id, round, state) VALUES
    (NEW.id, 1, 'unlocked'), (NEW.id, 2, 'locked'), (NEW.id, 3, 'locked')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;