
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS: content tables require authentication
DROP POLICY IF EXISTS "public_read_conteudos" ON public.conteudos;
CREATE POLICY "authenticated_read_conteudos"
  ON public.conteudos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_filmes" ON public.filmes;
CREATE POLICY "authenticated_read_filmes"
  ON public.filmes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_kids_filmes" ON public.kids_filmes;
CREATE POLICY "authenticated_read_kids_filmes"
  ON public.kids_filmes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_kids_series" ON public.kids_series;
CREATE POLICY "authenticated_read_kids_series"
  ON public.kids_series FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_series" ON public.series;
CREATE POLICY "authenticated_read_series"
  ON public.series FOR SELECT
  TO authenticated
  USING (true);
