import { useState, useEffect, useCallback } from 'react';
import { Movie } from '@/types';

const TMDB_API_KEY = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// TMDB Watch Provider IDs for BR
const PROVIDERS: Record<string, number> = {
  netflix: 8,
  prime: 119,
  globoplay: 307,
  disney: 337,
  hbomax: 619,
  paramount: 531,
  appletv: 350,
};

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: string;
}

export interface StreamingItem {
  tmdbTitle: string;
  posterUrl: string;
  overview: string;
  year: number;
  rating: string;
  localMovie: Movie | null;
  badge: 'em_breve' | 'novidade' | null;
  trailer?: string;
}

const CACHE_KEY = 'paixaoflix-streaming-top5';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours for fresher data

function normalizeTitle(t: string): string {
  return t.toLowerCase()
    .replace(/[^a-záàâãéêíóôõúç0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchLocal(tmdbTitle: string, movies: Movie[]): Movie | null {
  const norm = normalizeTitle(tmdbTitle);
  return movies.find(m => {
    const localNorm = normalizeTitle(m.title);
    return localNorm === norm || localNorm.includes(norm) || norm.includes(localNorm);
  }) || null;
}

// Global set to track used TMDB IDs across all providers (prevents repeats)
let globalUsedIds = new Set<number>();

async function fetchProviderTop5(providerId: number, usedIds: Set<number>): Promise<TMDBResult[]> {
  try {
    // Fetch more results to have room for deduplication
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&watch_region=BR&with_watch_providers=${providerId}&sort_by=popularity.desc&page=1`),
      fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&watch_region=BR&with_watch_providers=${providerId}&sort_by=popularity.desc&page=1`),
    ]);

    const movieData = movieRes.ok ? await movieRes.json() : { results: [] };
    const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

    const all = [
      ...(movieData.results || []).slice(0, 10).map((r: TMDBResult) => ({ ...r, media_type: 'movie' })),
      ...(tvData.results || []).slice(0, 10).map((r: TMDBResult) => ({ ...r, media_type: 'tv' })),
    ];

    // Sort by popularity (vote_average * some factor)
    all.sort((a: TMDBResult, b: TMDBResult) => (b.vote_average || 0) - (a.vote_average || 0));

    // Filter out already used across other providers
    const unique: TMDBResult[] = [];
    for (const item of all) {
      if (!usedIds.has(item.id) && unique.length < 5) {
        unique.push(item);
        usedIds.add(item.id);
      }
    }
    return unique;
  } catch {
    return [];
  }
}

export async function fetchTrendingSeries(): Promise<TMDBResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/trending/tv/week?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, 10);
  } catch {
    return [];
  }
}

export async function fetchOscarNominees(): Promise<TMDBResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&primary_release_date.gte=2024-06-01&primary_release_date.lte=2026-03-31&vote_average.gte=7.0&sort_by=vote_average.desc&with_keywords=293&page=1`
    );
    if (!res.ok) {
      const fallback = await fetch(
        `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&primary_release_date.gte=2024-06-01&vote_average.gte=7.5&sort_by=vote_average.desc&with_original_language=en&page=1`
      );
      if (!fallback.ok) return [];
      const data = await fallback.json();
      return (data.results || []).slice(0, 10);
    }
    const data = await res.json();
    return (data.results || []).slice(0, 10);
  } catch {
    return [];
  }
}

// Fetch Top 10 trending in Brazil
export async function fetchTop10Brazil(): Promise<TMDBResult[]> {
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`),
      fetch(`${TMDB_BASE}/trending/tv/week?api_key=${TMDB_API_KEY}&language=pt-BR`),
    ]);

    const movieData = movieRes.ok ? await movieRes.json() : { results: [] };
    const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

    const all = [
      ...(movieData.results || []).slice(0, 10).map((r: TMDBResult) => ({ ...r, media_type: 'movie' })),
      ...(tvData.results || []).slice(0, 10).map((r: TMDBResult) => ({ ...r, media_type: 'tv' })),
    ];
    all.sort((a: TMDBResult, b: TMDBResult) => (b.vote_average || 0) - (a.vote_average || 0));
    return all.slice(0, 10);
  } catch {
    return [];
  }
}

function tmdbToStreamingItem(r: TMDBResult, movies: Movie[]): StreamingItem {
  const title = r.title || r.name || '';
  const local = matchLocal(title, movies);
  const year = parseInt((r.release_date || r.first_air_date || '2024').substring(0, 4)) || 2024;

  let badge: 'em_breve' | 'novidade' | null = null;
  if (!local) {
    badge = 'em_breve';
  }

  return {
    tmdbTitle: title,
    posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : '',
    overview: r.overview || '',
    year,
    rating: r.vote_average ? r.vote_average.toFixed(1) : '',
    localMovie: local,
    badge,
    trailer: local?.trailer || undefined,
  };
}

export function useStreamingTop5(movies: Movie[]) {
  const [data, setData] = useState<Record<string, StreamingItem[]>>({});
  const [trendingSeries, setTrendingSeries] = useState<StreamingItem[]>([]);
  const [oscarNominees, setOscarNominees] = useState<StreamingItem[]>([]);
  const [top10Brazil, setTop10Brazil] = useState<StreamingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (movies.length === 0) return;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, providers, series, oscar, brazil } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_DURATION) {
          const rematched: Record<string, StreamingItem[]> = {};
          for (const [key, items] of Object.entries(providers as Record<string, StreamingItem[]>)) {
            rematched[key] = items.map(item => {
              const local = matchLocal(item.tmdbTitle, movies);
              return {
                ...item,
                localMovie: local,
                badge: local ? null : 'em_breve' as const,
                trailer: local?.trailer || undefined,
              };
            });
          }
          setData(rematched);
          setTrendingSeries((series as StreamingItem[]).map(s => {
            const local = matchLocal(s.tmdbTitle, movies);
            return { ...s, localMovie: local, badge: local ? null : 'em_breve' as const, trailer: local?.trailer || undefined };
          }));
          setOscarNominees((oscar as StreamingItem[]).map(o => {
            const local = matchLocal(o.tmdbTitle, movies);
            return { ...o, localMovie: local, badge: local ? null : 'em_breve' as const, trailer: local?.trailer || undefined };
          }));
          if (brazil) {
            setTop10Brazil((brazil as StreamingItem[]).map(b => {
              const local = matchLocal(b.tmdbTitle, movies);
              return { ...b, localMovie: local, badge: local ? null : 'em_breve' as const, trailer: local?.trailer || undefined };
            }));
          }
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    // Reset global deduplication set
    globalUsedIds = new Set<number>();

    const results: Record<string, StreamingItem[]> = {};
    const entries = Object.entries(PROVIDERS);

    // Fetch sequentially to ensure deduplication works across providers
    for (const [name, id] of entries) {
      const providerResults = await fetchProviderTop5(id, globalUsedIds);
      results[name] = providerResults.map(r => tmdbToStreamingItem(r, movies));
    }

    const [seriesResults, oscarResults, brazilResults] = await Promise.all([
      fetchTrendingSeries(),
      fetchOscarNominees(),
      fetchTop10Brazil(),
    ]);

    const series = seriesResults.map(r => tmdbToStreamingItem(r, movies));
    const oscar = oscarResults.map(r => tmdbToStreamingItem(r, movies));
    const brazil = brazilResults.map(r => tmdbToStreamingItem(r, movies));

    setData(results);
    setTrendingSeries(series);
    setOscarNominees(oscar);
    setTop10Brazil(brazil);
    setLoading(false);

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        providers: results,
        series,
        oscar,
        brazil,
      }));
    } catch { /* storage full */ }
  }, [movies]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { streamingData: data, trendingSeries, oscarNominees, top10Brazil, loading };
}
