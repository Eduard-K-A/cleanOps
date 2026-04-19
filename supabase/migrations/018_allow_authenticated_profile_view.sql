-- Allow basic profile information to be viewed by all authenticated users
-- This allows customers to see employee names/ratings and vice versa.

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
