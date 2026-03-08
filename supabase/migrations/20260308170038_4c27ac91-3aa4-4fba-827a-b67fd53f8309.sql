ALTER TABLE public.series ADD COLUMN IF NOT EXISTS poster text;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS genero text;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS ano text;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS rating text;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS backdrop text;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}'::text[];
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS kids boolean DEFAULT false;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS url text;