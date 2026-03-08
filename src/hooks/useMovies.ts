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
      year: (result.release_date || result.first_air_date || '').slice(0, 4),
      rating: result.vote_average ? result.vote_average.toFixed(1) : undefined,
      description: result.overview || undefined,
    };
  } catch { return null; }
}

async function enrichMoviesWithTMDB(movies: Movie[], setMovies: React.Dispatch<React.SetStateAction<Movie[]>>) {
  const cache = loadEnrichCache();
  const needsEnrich = movies.filter(m => !m.image && !cache[m.title]);
  
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
    };
  });
  
  if (withCache.some((m, i) => m.image !== movies[i].image)) {
    setMovies(withCache);
  }

  // Enrich missing in background (10 at a time, no blocking)
  const batch = needsEnrich.slice(0, 10);
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
    if (Array.isArray(row.genero)) genreArr.push(...row.genero);
    else {
      row.genero.split(',').forEach(g => genreArr.push(g.trim()));
    }
  }
  if (row.categories) genreArr.push(...row.categories);
  const uniqueGenres = [...new Set(genreArr.filter(Boolean))];

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

// ─── Deduplicate series by tmdb_id (keep one with trailer, or first) ────────

function deduplicateDbRows(rows: DbRow[]): DbRow[] {
  const seen = new Map<string, DbRow>();
  for (const row of rows) {
    // Key by tmdb_id + titulo combo to catch duplicates
    const key = row.tmdb_id 
      ? `tmdb:${row.tmdb_id}:${row.titulo.toLowerCase()}`
      : `title:${row.titulo.toLowerCase()}`;
    
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
    } else {
      // Keep the one with more data (trailer, poster, etc.)
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
      // Deduplicate rows from DB before mapping
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
    const id = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { movies, loading };
}
