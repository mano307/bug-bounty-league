
DROP POLICY IF EXISTS "questions read" ON public.questions;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.questions FROM authenticated;
