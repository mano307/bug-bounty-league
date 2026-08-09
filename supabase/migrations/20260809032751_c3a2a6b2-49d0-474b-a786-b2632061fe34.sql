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

  IF lower(COALESCE(NEW.email,'')) = 'mkgsar7@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'participant') ON CONFLICT DO NOTHING;

  INSERT INTO public.round_access (user_id, round, state) VALUES
    (NEW.id, 1, 'unlocked'), (NEW.id, 2, 'locked'), (NEW.id, 3, 'locked')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'mkgsar7@gmail.com'
ON CONFLICT DO NOTHING;