ALTER TABLE public.kids_filmes ADD COLUMN IF NOT EXISTS backdrop text;
ALTER TABLE public.kids_filmes ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}'::text[];