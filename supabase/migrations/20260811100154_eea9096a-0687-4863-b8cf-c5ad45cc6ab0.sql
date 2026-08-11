DROP POLICY IF EXISTS "settings readable" ON public.event_settings;
CREATE POLICY "settings readable to authenticated" ON public.event_settings FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.event_settings FROM anon;
GRANT SELECT ON public.event_settings TO authenticated;
GRANT ALL ON public.event_settings TO service_role;