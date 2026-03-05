
DROP POLICY IF EXISTS "Anyone can read conteudos" ON public.conteudos;
CREATE POLICY "Public read conteudos" ON public.conteudos
  FOR SELECT TO anon, authenticated USING (true);
