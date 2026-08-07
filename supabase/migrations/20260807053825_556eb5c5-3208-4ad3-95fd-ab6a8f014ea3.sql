
CREATE TYPE public.app_role AS ENUM ('admin','participant');
CREATE TYPE public.round_state AS ENUM ('locked','unlocked','in_progress','submitted','eliminated','qualified');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  register_number text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  college text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.event_settings (
  id int PRIMARY KEY DEFAULT 1,
  event_name text NOT NULL DEFAULT 'DebugX 2026',
  round1_minutes int NOT NULL DEFAULT 20,
  round2_minutes int NOT NULL DEFAULT 30,
  round3_minutes int NOT NULL DEFAULT 45,
  max_warnings int NOT NULL DEFAULT 3,
  auto_submit boolean NOT NULL DEFAULT true,
  negative_marking numeric NOT NULL DEFAULT 0,
  warning_penalty numeric NOT NULL DEFAULT 0,
  leaderboard_public boolean NOT NULL DEFAULT false,
  leaderboard_frozen boolean NOT NULL DEFAULT false,
  round1_status text NOT NULL DEFAULT 'not_started',
  round2_status text NOT NULL DEFAULT 'not_started',
  round3_status text NOT NULL DEFAULT 'not_started',
  results_published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.event_settings TO authenticated, anon;
GRANT INSERT, UPDATE ON public.event_settings TO authenticated;
GRANT ALL ON public.event_settings TO service_role;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.event_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.event_settings FOR UPDATE TO authenticated USING (public.is_admin());
INSERT INTO public.event_settings (id) VALUES (1);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round int NOT NULL,
  category text NOT NULL DEFAULT 'General',
  difficulty text NOT NULL DEFAULT 'Medium',
  title text NOT NULL DEFAULT '',
  prompt text NOT NULL,
  code text,
  language text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index int,
  marks numeric NOT NULL DEFAULT 1,
  sample_input text,
  sample_output text,
  expected_output text,
  constraints text,
  test_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions read" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions admin insert" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "questions admin update" ON public.questions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "questions admin delete" ON public.questions FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.round_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round int NOT NULL,
  state public.round_state NOT NULL DEFAULT 'locked',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, round)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.round_access TO authenticated;
GRANT ALL ON public.round_access TO service_role;
ALTER TABLE public.round_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access read" ON public.round_access FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "access admin insert" ON public.round_access FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "access admin update" ON public.round_access FOR UPDATE TO authenticated USING (public.is_admin());

CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round int NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  duration_seconds int,
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  wrong_count int NOT NULL DEFAULT 0,
  skipped_count int NOT NULL DEFAULT 0,
  warnings_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  language text,
  code text,
  ai_report jsonb,
  judge_remarks text,
  manual_score numeric,
  UNIQUE (user_id, round)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts read" ON public.attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "attempts insert" ON public.attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "attempts update" ON public.attempts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_index int,
  code text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers read" ON public.answers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "answers insert" ON public.answers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "answers update" ON public.answers FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round int NOT NULL,
  reason text NOT NULL,
  warning_number int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.warnings TO authenticated;
GRANT ALL ON public.warnings TO service_role;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warnings read" ON public.warnings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "warnings insert" ON public.warnings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name text NOT NULL DEFAULT '',
  register_number text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  round int,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity read" ON public.activity_log FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "activity insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated;
GRANT INSERT, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann admin insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "ann admin delete" ON public.announcements FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, register_number, email, department, year, college)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'register_number',''),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'department',''),
    COALESCE(NEW.raw_user_meta_data->>'year',''),
    COALESCE(NEW.raw_user_meta_data->>'college','')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'participant') ON CONFLICT DO NOTHING;

  INSERT INTO public.round_access (user_id, round, state) VALUES
    (NEW.id, 1, 'unlocked'), (NEW.id, 2, 'locked'), (NEW.id, 3, 'locked')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warnings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round_access;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
