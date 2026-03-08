-- Fix RESTRICTIVE → PERMISSIVE RLS policies for all content tables
DROP POLICY IF EXISTS "Allow public read filmes" ON public.filmes;
DROP POLICY IF EXISTS "Allow public read series" ON public.series;
DROP POLICY IF EXISTS "Allow public read kids_filmes" ON public.kids_filmes;
DROP POLICY IF EXISTS "Allow public read kids_series" ON public.kids_series;
DROP POLICY IF EXISTS "Allow public read conteudos" ON public.conteudos;

CREATE POLICY "public_read_filmes" ON public.filmes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_series" ON public.series FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_kids_filmes" ON public.kids_filmes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_kids_series" ON public.kids_series FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_conteudos" ON public.conteudos FOR SELECT TO anon, authenticated USING (true);