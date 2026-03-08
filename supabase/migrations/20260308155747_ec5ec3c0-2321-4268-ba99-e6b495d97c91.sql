
-- Table for movies (cinema.json)
CREATE TABLE public.filmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tmdb_id text,
  url text,
  trailer text,
  genero text,
  categories text[] DEFAULT '{}',
  ano text,
  rating text,
  descricao text,
  poster text,
  tipo text NOT NULL DEFAULT 'movie',
  created_at timestamptz DEFAULT now()
);

-- Table for series (series.json)
CREATE TABLE public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tmdb_id text,
  trailer text,
  identificador_archive text,
  tipo text NOT NULL DEFAULT 'serie',
  created_at timestamptz DEFAULT now()
);

-- Table for kids series (kids_series.json)
CREATE TABLE public.kids_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  identificador_archive text,
  genero text,
  ano text,
  rating text,
  descricao text,
  poster text,
  tipo text NOT NULL DEFAULT 'serie',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.filmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_series ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read filmes" ON public.filmes FOR SELECT USING (true);
CREATE POLICY "Public read series" ON public.series FOR SELECT USING (true);
CREATE POLICY "Public read kids_series" ON public.kids_series FOR SELECT USING (true);
