import { useState, useEffect, useCallback } from 'react';
import { Movie } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffleArray(arr).slice(0, count);
}

// ─── Genre translation EN → PT-BR ──────────────────────────────────────────

const GENRE_TRANSLATION: Record<string, string> = {
  'action': 'Ação',
  'adventure': 'Aventura',
  'animation': 'Animação',
  'comedy': 'Comédia',
  'crime': 'Crime',
  'documentary': 'Documentário',
  'drama': 'Drama',
  'family': 'Família',
  'fantasy': 'Fantasia',
  'history': 'História',
  'horror': 'Terror',
  'music': 'Musical',
  'mystery': 'Mistério',
  'romance': 'Romance',
  'science fiction': 'Ficção Científica',
  'sci-fi': 'Ficção Científica',
  'sci-fi & fantasy': 'Ficção Científica',
  'action & adventure': 'Ação',
  'tv movie': 'Filme para TV',
  'thriller': 'Suspense',
  'war': 'Guerra',
  'western': 'Faroeste',
  'war & politics': 'Guerra & Política',
  'kids': 'Infantil',
  'reality': 'Reality',
  'soap': 'Novela',
  'talk': 'Talk Show',
  'news': 'Notícias',
};

function translateGenre(genre: string): string {
  const lower = genre.trim().toLowerCase();
  return GENRE_TRANSLATION[lower] || genre.trim();
}

// ─── TMDB client-side enrichment for missing posters (non-blocking) ─────────

const TMDB_API_KEY = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const ENRICH_CACHE_KEY = 'paixaoflix-tmdb-enrich';

interface EnrichCache {
  [titulo: string]: {
    poster?: string;
    backdrop?: string;
    year?: string;
    rating?: string;
    description?: string;
    genres?: string[];
  };
}

function loadEnrichCache(): EnrichCache {
  try {
    return JSON.parse(localStorage.getItem(ENRICH_CACHE_KEY) || '{}');
  } catch { return {}; }
}

function saveEnrichCache(cache: EnrichCache) {
  try {
    localStorage.setItem(ENRICH_CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full */ }
}

async function tmdbSearch(title: string, type: 'movie' | 'tv'): Promise<any | null> {
  const clean = title
    .replace(/\s*-\s*\d+ª\s*Temporada/i, '')
    .replace(/\s*Temporada\s*\d+/i, '')
    .replace(/\s*-\s*Todos os episódios/i, '')
    .replace(/\s*-\s*Completo/i, '')
    .trim();

  try {
    // First search
    const res = await fetch(
      `${TMDB_BASE}/search/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(clean)}&page=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const firstResult = data.results?.[0];
    if (!firstResult) return null;
    
    // Get full details with genres
    const detailRes = await fetch(
      `${TMDB_BASE}/${type}/${firstResult.id}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();
    
    return {
      poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : undefined,
      backdrop: detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : undefined,
      year: (detail.release_date || detail.first_air_date || '').slice(0, 4),
      rating: detail.vote_average ? detail.vote_average.toFixed(1) : undefined,
      description: detail.overview || undefined,
      genres: detail.genres?.map((g: any) => translateGenre(g.name)) || undefined,
    };
  } catch { return null; }
}

async function enrichMoviesWithTMDB(movies: Movie[], setMovies: React.Dispatch<React.SetStateAction<Movie[]>>) {
  const cache = loadEnrichCache();
  const needsEnrich = movies.filter(m => (!m.image || m.image.length < 5) && !cache[m.title]);
  
  // Apply cached enrichments immediately
  const withCache = movies.map(m => {
    const enriched = cache[m.title];
    if (!enriched) return m;
    return {
      ...m,
      image: m.image || enriched.poster || '',
      backdrop: m.backdrop || enriched.backdrop || undefined,
      description: m.description || enriched.description || '',
      year: m.year === 2024 && enriched.year ? parseInt(enriched.year) || m.year : m.year,
      rating: m.rating || enriched.rating || '',
      genre: enriched.genres && enriched.genres.length > 0 && m.genre.length === 0 ? enriched.genres : m.genre,
    };
  });
  
  if (withCache.some((m, i) => m.image !== movies[i].image)) {
    setMovies(withCache);
  }

  // Enrich missing in background (15 at a time)
  const batch = needsEnrich.slice(0, 15);
  if (batch.length === 0) return;
  
  for (const m of batch) {
    const type = m.type === 'series' ? 'tv' : 'movie';
    const result = await tmdbSearch(m.title, type);
    cache[m.title] = result || {};
    await new Promise(r => setTimeout(r, 250));
  }
  
  saveEnrichCache(cache);
  
  // Apply new enrichments
  setMovies(prev => prev.map(m => {
    const enriched = cache[m.title];
    if (!enriched) return m;
    return {
      ...m,
      image: m.image || enriched.poster || '',
      backdrop: m.backdrop || enriched.backdrop || undefined,
      description: m.description || enriched.description || '',
      year: m.year === 2024 && enriched.year ? parseInt(enriched.year) || m.year : m.year,
      rating: m.rating || enriched.rating || '',
      genre: enriched.genres && enriched.genres.length > 0 && m.genre.length === 0 ? enriched.genres : m.genre,
    };
  }));
}

// ─── DB Row → Movie mapper ──────────────────────────────────────────────────

interface DbRow {
  id: string;
  titulo: string;
  tipo?: string;
  tmdb_id?: string | null;
  url?: string | null;
  identificador_archive?: string | null;
  trailer?: string | null;
  genero?: string | string[] | null;
  categories?: string[] | null;
  ano?: string | null;
  rating?: string | null;
  descricao?: string | null;
  poster?: string | null;
  backdrop?: string | null;
  kids?: boolean | null;
}

function dbRowToMovie(row: DbRow, sourceOverride: string): Movie {
  const genreArr: string[] = [];
  if (row.genero) {
    if (Array.isArray(row.genero)) genreArr.push(...row.genero.map(translateGenre));
    else {
      row.genero.split(',').forEach(g => genreArr.push(translateGenre(g)));
    }
  }
  if (row.categories) genreArr.push(...row.categories.map(translateGenre));
  
  // Remove "Outros" — always use real genre
  const uniqueGenres = [...new Set(genreArr.filter(g => g && g.toLowerCase() !== 'outros'))];

  const isKids = !!row.kids || sourceOverride.includes('kids') || uniqueGenres.some(g => /kids|infantil|crian/i.test(g));
  const tipo = (row.tipo === 'series' || row.tipo === 'serie') ? 'series' : 'movie';

  // Filter out .ia URLs
  let streamUrl = row.identificador_archive
    ? `https://archive.org/download/${row.identificador_archive}/`
    : (row.url || '');
  
  if (streamUrl.endsWith('.ia') || streamUrl.includes('.ia.mp4')) {
    streamUrl = row.identificador_archive
      ? `https://archive.org/download/${row.identificador_archive}/`
      : '';
  }

  return {
    id: row.id,
    title: row.titulo,
    description: row.descricao || '',
    image: row.poster || '',
    backdrop: row.backdrop || undefined,
    year: parseInt(row.ano || '2024') || 2024,
    genre: uniqueGenres,
    type: tipo as Movie['type'],
    rating: row.rating || '',
    streamUrl,
    trailer: row.trailer || '',
    kids: isKids,
    source: sourceOverride as Movie['source'],
    tmdbId: row.tmdb_id || undefined,
  };
}

// ─── Deduplicate series by tmdb_id or normalized title ──────────────────────

function normalizeSeriesTitle(title: string): string {
  return title
    .replace(/\s*-\s*\d+ª\s*Temporada/i, '')
    .replace(/\s*Temporada\s*\d+/i, '')
    .replace(/\s*-\s*Todos os episódios/i, '')
    .replace(/\s*-\s*Completo/i, '')
    .replace(/\s*S\d+E\d+/i, '')
    .replace(/\s*\(\d{4}\)/i, '')
    .trim()
    .toLowerCase();
}

function deduplicateDbRows(rows: DbRow[]): DbRow[] {
  const seen = new Map<string, DbRow>();
  for (const row of rows) {
    const normalizedTitle = normalizeSeriesTitle(row.titulo);
    const key = row.tmdb_id 
      ? `tmdb:${row.tmdb_id}:${normalizedTitle}`
      : `title:${normalizedTitle}`;
    
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
    } else {
      const existingScore = (existing.trailer ? 1 : 0) + (existing.poster ? 1 : 0) + (existing.descricao ? 1 : 0);
      const newScore = (row.trailer ? 1 : 0) + (row.poster ? 1 : 0) + (row.descricao ? 1 : 0);
      if (newScore > existingScore) {
        seen.set(key, row);
      }
    }
  }
  return Array.from(seen.values());
}

// ─── Fetch from Lovable Cloud (4 separate tables) ───────────────────────────

async function fetchFromCloud(): Promise<Movie[]> {
  const all: Movie[] = [];

  const tableConfigs = [
    { table: 'filmes' as const, source: 'cinema' },
    { table: 'series' as const, source: 'series' },
    { table: 'kids_filmes' as const, source: 'filmeskids' },
    { table: 'kids_series' as const, source: 'serieskids' },
  ];

  const results = await Promise.all(
    tableConfigs.map(async ({ table, source }) => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('titulo')
          .limit(1000);
        if (!error && data && data.length > 0) {
          return { source, data: data as DbRow[] };
        }
      } catch { /* table might not exist */ }
      return null;
    })
  );

  for (const result of results) {
    if (result) {
      const deduplicated = deduplicateDbRows(result.data);
      deduplicated.forEach(row => all.push(dbRowToMovie(row, result.source)));
    }
  }

  if (all.length > 0) {
    console.log(`[useMovies] Loaded ${all.length} items from Lovable Cloud`);
  }
  return all;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const cloudMovies = await fetchFromCloud();
      if (cloudMovies.length > 0) {
        // Filter out movies without cover images (unless enrichment can fix them)
        setMovies(cloudMovies);
        setLoading(false);
        
        // Non-blocking TMDB enrichment for missing posters
        enrichMoviesWithTMDB(cloudMovies, setMovies);
        return;
      }

      console.warn('[useMovies] Cloud DB empty, no data available');
      setMovies([]);
    } catch (e) {
      console.error('Error fetching movies:', e);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 7 minutes
    const id = setInterval(fetchData, 7 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { movies, loading };
}