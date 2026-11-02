-- Allow insertion into users table
DROP POLICY IF EXISTS "Users can insert profile" ON public.users;
CREATE POLICY "Users can insert profile" ON public.users FOR INSERT WITH CHECK (true);
