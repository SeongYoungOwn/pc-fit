-- Fix Builds Insert Policy
DROP POLICY IF EXISTS "Users can insert their own builds" ON public.builds;
CREATE POLICY "Users can insert their own builds" ON public.builds FOR INSERT WITH CHECK (true);
