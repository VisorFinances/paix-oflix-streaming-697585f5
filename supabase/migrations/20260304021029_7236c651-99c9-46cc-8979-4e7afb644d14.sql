
-- Create content table for all movies/series
CREATE TABLE public.conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('movie', 'series')),
  tmdb_id TEXT,
  url TEXT,
  identificador_archive TEXT,
  trailer TEXT,
  genero TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  ano TEXT,
  rating TEXT,
  descricao TEXT,
  poster TEXT,
  backdrop TEXT,
  kids BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;

-- Public read access (content is public)
CREATE POLICY "Anyone can read conteudos"
ON public.conteudos FOR SELECT
USING (true);

-- Index for performance
CREATE INDEX idx_conteudos_tipo ON public.conteudos(tipo);
CREATE INDEX idx_conteudos_tmdb_id ON public.conteudos(tmdb_id);
CREATE INDEX idx_conteudos_kids ON public.conteudos(kids);
CREATE INDEX idx_conteudos_categories ON public.conteudos USING GIN(categories);
CREATE INDEX idx_conteudos_genero ON public.conteudos USING GIN(genero);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_conteudos_updated_at
BEFORE UPDATE ON public.conteudos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
