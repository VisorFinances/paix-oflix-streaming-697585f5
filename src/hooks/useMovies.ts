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

// ─── TMDB client-side enrichment for missing posters ────────────────────────

const TMDB_API_KEY = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const ENRICH_CACHE_KEY = 'paixaoflix-tmdb-enrich';

interface EnrichCache {
  [titulo: string]: {
    poster?: string;
    backdrop?: string;
    genres?: string[];
    year?: string;
    rating?: string;
    description?: string;
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
    const res = await fetch(
      `${TMDB_BASE}/search/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(clean)}&page=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;
    return {
      poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : undefined,
      backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : undefined,
      genres: [], // basic search doesn't return genre names
      year: (result.release_date || result.first_air_date || '').slice(0, 4),
      rating: result.vote_average ? result.vote_average.toFixed(1) : undefined,
      description: result.overview || undefined,
    };
  } catch { return null; }
}

async function enrichMoviesWithTMDB(movies: Movie[]): Promise<Movie[]> {
  const cache = loadEnrichCache();
  const needsEnrich = movies.filter(m => !m.image && !cache[m.title]);
  
  // Enrich up to 20 missing posters per load (to avoid rate limits)
  const batch = needsEnrich.slice(0, 20);
  
  for (const m of batch) {
    const type = m.type === 'series' ? 'tv' : 'movie';
    const result = await tmdbSearch(m.title, type);
    if (result) {
      cache[m.title] = result;
    } else {
      cache[m.title] = {}; // mark as searched to avoid re-fetching
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  if (batch.length > 0) saveEnrichCache(cache);
  
  // Apply cached enrichments
  return movies.map(m => {
    const enriched = cache[m.title];
    if (!enriched) return m;
    return {
      ...m,
      image: m.image || enriched.poster || '',
      backdrop: m.backdrop || enriched.backdrop || undefined,
      description: m.description || enriched.description || '',
      year: m.year === 2024 && enriched.year ? parseInt(enriched.year) || m.year : m.year,
      rating: m.rating || enriched.rating || '',
    };
  });
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
    if (Array.isArray(row.genero)) genreArr.push(...row.genero);
    else {
      // Handle comma-separated string
      row.genero.split(',').forEach(g => genreArr.push(g.trim()));
    }
  }
  if (row.categories) genreArr.push(...row.categories);
  const uniqueGenres = [...new Set(genreArr.filter(Boolean))];

  const isKids = !!row.kids || sourceOverride.includes('kids') || uniqueGenres.some(g => /kids|infantil|crian/i.test(g));
  const tipo = (row.tipo === 'series' || row.tipo === 'serie') ? 'series' : 'movie';

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
    streamUrl: row.identificador_archive
      ? `https://archive.org/download/${row.identificador_archive}/`
      : (row.url || ''),
    trailer: row.trailer || '',
    kids: isKids,
    source: sourceOverride as Movie['source'],
    tmdbId: row.tmdb_id || undefined,
  };
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
      result.data.forEach(row => all.push(dbRowToMovie(row, result.source)));
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
      let cloudMovies = await fetchFromCloud();
      if (cloudMovies.length > 0) {
        // First render with raw data
        setMovies(cloudMovies);
        setLoading(false);
        
        // Then enrich missing posters from TMDB (non-blocking)
        const enriched = await enrichMoviesWithTMDB(cloudMovies);
        setMovies(enriched);
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
    const id = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { movies, loading };
}
