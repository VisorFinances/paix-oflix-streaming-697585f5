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
  /** Matched local movie, or null if "em breve" */
  localMovie: Movie | null;
  /** Badge: 'em_breve' | 'novidade' | null */
  badge: 'em_breve' | 'novidade' | null;
}

const CACHE_KEY = 'paixaoflix-streaming-top5';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for trending cache

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

async function fetchProviderTop5(providerId: number): Promise<TMDBResult[]> {
  try {
    // Try movies first
    const movieRes = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&watch_region=BR&with_watch_providers=${providerId}&sort_by=popularity.desc&page=1`
    );
    const movieData = movieRes.ok ? await movieRes.json() : { results: [] };
    
    // Then TV
    const tvRes = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&watch_region=BR&with_watch_providers=${providerId}&sort_by=popularity.desc&page=1`
    );
    const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

    // Merge & pick top 5 by popularity (already sorted)
    const all = [
      ...(movieData.results || []).slice(0, 5).map((r: TMDBResult) => ({ ...r, media_type: 'movie' })),
      ...(tvData.results || []).slice(0, 5).map((r: TMDBResult) => ({ ...r, media_type: 'tv' })),
    ];
    // Sort by vote_average desc, take 5
    all.sort((a: TMDBResult, b: TMDBResult) => (b.vote_average || 0) - (a.vote_average || 0));
    return all.slice(0, 5);
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
    // Use TMDB's curated lists or search for recent award-winning films
    const res = await fetch(
      `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&primary_release_date.gte=2024-01-01&vote_average.gte=7.5&sort_by=vote_average.desc&with_original_language=en&page=1`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, 10);
  } catch {
    return [];
  }
}

function tmdbToStreamingItem(r: TMDBResult, movies: Movie[]): StreamingItem {
  const title = r.title || r.name || '';
  const local = matchLocal(title, movies);
  const year = parseInt((r.release_date || r.first_air_date || '2024').substring(0, 4)) || 2024;
  
  // Check novidade badge (added within last 24h) from localStorage
  const novidadeKey = `novidade-${normalizeTitle(title)}`;
  const novidadeTs = localStorage.getItem(novidadeKey);
  let badge: 'em_breve' | 'novidade' | null = null;
  
  if (!local) {
    badge = 'em_breve';
  } else if (novidadeTs) {
    const elapsed = Date.now() - parseInt(novidadeTs);
    if (elapsed < 24 * 60 * 60 * 1000) {
      badge = 'novidade';
    } else {
      localStorage.removeItem(novidadeKey);
    }
  }

  // If local was just found (was previously em_breve), mark as novidade
  if (local) {
    const prevEmBreve = localStorage.getItem(`embreve-${normalizeTitle(title)}`);
    if (prevEmBreve) {
      localStorage.removeItem(`embreve-${normalizeTitle(title)}`);
      localStorage.setItem(novidadeKey, String(Date.now()));
      badge = 'novidade';
    }
  } else {
    localStorage.setItem(`embreve-${normalizeTitle(title)}`, '1');
  }

  return {
    tmdbTitle: title,
    posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : '',
    overview: r.overview || '',
    year,
    rating: r.vote_average ? r.vote_average.toFixed(1) : '',
    localMovie: local,
    badge,
  };
}

export function useStreamingTop5(movies: Movie[]) {
  const [data, setData] = useState<Record<string, StreamingItem[]>>({});
  const [trendingSeries, setTrendingSeries] = useState<StreamingItem[]>([]);
  const [oscarNominees, setOscarNominees] = useState<StreamingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (movies.length === 0) return;

    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, providers, series, oscar } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_DURATION) {
          // Re-match with current movies (they may have been updated)
          const rematched: Record<string, StreamingItem[]> = {};
          for (const [key, items] of Object.entries(providers as Record<string, StreamingItem[]>)) {
            rematched[key] = items.map(item => ({
              ...item,
              localMovie: matchLocal(item.tmdbTitle, movies),
              badge: matchLocal(item.tmdbTitle, movies) ? null : 'em_breve' as const,
            }));
          }
          setData(rematched);
          setTrendingSeries((series as StreamingItem[]).map(s => ({
            ...s,
            localMovie: matchLocal(s.tmdbTitle, movies),
            badge: matchLocal(s.tmdbTitle, movies) ? null : 'em_breve' as const,
          })));
          setOscarNominees((oscar as StreamingItem[]).map(o => ({
            ...o,
            localMovie: matchLocal(o.tmdbTitle, movies),
            badge: matchLocal(o.tmdbTitle, movies) ? null : 'em_breve' as const,
          })));
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    const results: Record<string, StreamingItem[]> = {};
    
    // Fetch all providers in parallel
    const entries = Object.entries(PROVIDERS);
    const providerResults = await Promise.all(
      entries.map(([, id]) => fetchProviderTop5(id))
    );
    
    entries.forEach(([name], idx) => {
      results[name] = providerResults[idx].map(r => tmdbToStreamingItem(r, movies));
    });

    const series = (await fetchTrendingSeries()).map(r => tmdbToStreamingItem(r, movies));
    const oscar = (await fetchOscarNominees()).map(r => tmdbToStreamingItem(r, movies));

    setData(results);
    setTrendingSeries(series);
    setOscarNominees(oscar);
    setLoading(false);

    // Cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        providers: results,
        series,
        oscar,
      }));
    } catch { /* storage full */ }
  }, [movies]);

  useEffect(() => {
    fetchAll();
    // Re-fetch every 10 minutes to keep updated
    const id = setInterval(fetchAll, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { streamingData: data, trendingSeries, oscarNominees, loading };
}
