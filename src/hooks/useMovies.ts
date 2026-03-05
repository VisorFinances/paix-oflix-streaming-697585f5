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

// ─── GitHub JSON fallback (when Supabase is empty) ─────────────────────────

const BASE = 'https://raw.githubusercontent.com/VisorFinances/paix-oflix-streaming-697585f5/refs/heads/main/data';

interface RawItem {
  titulo: string;
  tmdb_id?: string;
  url?: string;
  identificador_archive?: string;
  trailer?: string;
  genero?: string | string[];
  categories?: string[];
  year?: string;
  rating?: string;
  desc?: string;
  poster?: string;
  type?: string;
  kids?: boolean;
}

async function safeFetch(url: string): Promise<RawItem[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    if (text.trim().startsWith('<')) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseGenres(raw: RawItem): string[] {
  let genres: string[] = [];
  if (raw.categories?.length) genres = [...raw.categories];
  if (raw.genero) {
    if (Array.isArray(raw.genero)) genres = [...genres, ...raw.genero];
    else genres.push(raw.genero);
  }
  return [...new Set(genres)];
}

function normalizeRawItem(raw: RawItem, idx: number, source: string): Movie {
  const genres = parseGenres(raw);
  const tipo = raw.type === 'serie' || raw.type === 'series' ? 'series' : 'movie';
  const isKids = !!raw.kids || source.includes('kids') || genres.some(g => /kids|infantil|crian/i.test(g));

  return {
    id: `${source}-${idx}`,
    title: raw.titulo || '',
    description: raw.desc || '',
    image: raw.poster || '',
    year: parseInt(raw.year || '2024') || 2024,
    genre: genres,
    type: tipo as Movie['type'],
    rating: raw.rating || '',
    streamUrl: raw.identificador_archive
      ? `https://archive.org/download/${raw.identificador_archive}/`
      : (raw.url || ''),
    trailer: raw.trailer || '',
    kids: isKids,
    source: isKids ? (tipo === 'series' ? 'serieskids' : 'filmeskids') : (tipo === 'series' ? 'series' : 'cinema'),
    tmdbId: raw.tmdb_id,
  };
}

async function fetchFromGitHub(): Promise<Movie[]> {
  const [cinema, series, kidsFilmes, kidsSeries, favoritos] = await Promise.all([
    safeFetch(`${BASE}/cinema.json`),
    safeFetch(`${BASE}/series.json`),
    safeFetch(`${BASE}/kids_filmes.json`),
    safeFetch(`${BASE}/kids_series.json`),
    safeFetch(`${BASE}/Favoritos.json`),
  ]);

  const all: Movie[] = [];
  cinema.forEach((r, i) => r.titulo && all.push(normalizeRawItem(r, i, 'cinema')));
  series.forEach((r, i) => r.titulo && all.push(normalizeRawItem(r, i, 'series')));
  kidsFilmes.forEach((r, i) => r.titulo && all.push(normalizeRawItem(r, i, 'kids_filmes')));
  kidsSeries.forEach((r, i) => r.titulo && all.push(normalizeRawItem(r, i, 'kids_series')));
  favoritos.forEach((r, i) => {
    if (r.titulo) {
      const m = normalizeRawItem(r, i, 'cinema');
      all.push({ ...m, id: `favoritos-${i}`, source: 'favoritos' });
    }
  });
  return all;
}

// ─── Supabase → Movie mapper ─────────────────────────────────────────────────

interface ConteudoRow {
  id: string;
  titulo: string;
  tipo: string;
  tmdb_id: string | null;
  url: string | null;
  identificador_archive: string | null;
  trailer: string | null;
  genero: string[] | null;
  categories: string[] | null;
  ano: string | null;
  rating: string | null;
  descricao: string | null;
  poster: string | null;
  backdrop: string | null;
  kids: boolean | null;
}

function conteudoToMovie(row: ConteudoRow): Movie {
  const genres = [...(row.genero || []), ...(row.categories || [])].filter(Boolean);
  const uniqueGenres = [...new Set(genres)];
  const isKids = !!row.kids || uniqueGenres.some(g => /kids|infantil|crian/i.test(g));
  const tipo = row.tipo === 'series' ? 'series' : 'movie';

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
    source: isKids
      ? (tipo === 'series' ? 'serieskids' : 'filmeskids')
      : (tipo === 'series' ? 'series' : 'cinema'),
    tmdbId: row.tmdb_id || undefined,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('conteudos')
        .select('*')
        .order('titulo')
        .limit(500);

      if (!error && data && data.length > 0) {
        const mapped = (data as ConteudoRow[]).map(conteudoToMovie);
        setMovies(mapped);
        setLoading(false);
        return;
      }

      // Fallback to GitHub JSON if Supabase is empty
      console.warn('Supabase empty or error, falling back to GitHub JSON');
      const githubMovies = await fetchFromGitHub();
      setMovies(githubMovies);
    } catch (e) {
      console.error('Error fetching movies:', e);
      // Final fallback
      const githubMovies = await fetchFromGitHub();
      setMovies(githubMovies);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Re-fetch every 15 minutes
    const id = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { movies, loading };
}
