
-- Create kids_filmes table
CREATE TABLE IF NOT EXISTS public.kids_filmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  url text,
  trailer text,
  genero text,
  ano text,
  rating text,
  descricao text,
  poster text,
  tipo text NOT NULL DEFAULT 'movie',
  tmdb_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.kids_filmes ENABLE ROW LEVEL SECURITY;

-- Fix all RLS policies to be PERMISSIVE (drop RESTRICTIVE ones and recreate)
DROP POLICY IF EXISTS "Public read filmes" ON public.filmes;
DROP POLICY IF EXISTS "Public read series" ON public.series;
DROP POLICY IF EXISTS "Public read kids_series" ON public.kids_series;
DROP POLICY IF EXISTS "Public read conteudos" ON public.conteudos;

CREATE POLICY "Allow public read filmes" ON public.filmes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read series" ON public.series FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read kids_series" ON public.kids_series FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read kids_filmes" ON public.kids_filmes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read conteudos" ON public.conteudos FOR SELECT TO anon, authenticated USING (true);
