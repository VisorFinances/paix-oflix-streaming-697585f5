import { useState, useEffect, useCallback } from 'react';
import { Movie } from '@/types';
import { enrichFromTMDB } from '@/lib/tmdbEnrich';

const BASE = 'https://raw.githubusercontent.com/VisorFinances/paix-oflix-streaming-697585f5/refs/heads/main/data';

// ─── Raw types ───────────────────────────────────────────────────────────────

interface RawFilme {
  titulo: string;
  url?: string;
  tmdb_id?: string;
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

interface RawSerie {
  titulo: string;
  identificador_archive?: string;
  url?: string;
  tmdb_id?: string;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function safeFetch(url: string): Promise<unknown[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) { console.warn(`Fetch failed: ${url} → HTTP ${res.status}`); return []; }
    const text = await res.text();
    if (text.trim().startsWith('<')) { console.warn(`HTML instead of JSON: ${url}`); return []; }
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`Error fetching ${url}:`, e);
    return [];
  }
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function parseGenres(raw: RawFilme | RawSerie): string[] {
  let genres: string[] = [];
  if (raw.categories && raw.categories.length > 0) {
    genres = raw.categories;
  } else if (raw.genero) {
    if (Array.isArray(raw.genero)) {
      genres = raw.genero;
    } else {
      genres = [raw.genero];
    }
  }
  return genres;
}

function normalizeFilme(raw: RawFilme, idx: number, source: 'cinema' | 'filmeskids'): Movie {
  const genres = parseGenres(raw);
  const isKids = !!raw.kids || source === 'filmeskids' ||
    genres.some(g => /kids|infantil|crian/i.test(g));

  return {
    id: `${source}-${idx}`,
    title: raw.titulo || '',
    description: raw.desc || '',
    image: raw.poster || '',
    year: parseInt(raw.year || '2024') || 2024,
    genre: genres,
    type: 'movie',
    rating: raw.rating || '',
    streamUrl: raw.url || '',
    trailer: raw.trailer || '',
    kids: isKids,
    source: isKids ? 'filmeskids' : 'cinema',
    tmdbId: raw.tmdb_id,
  };
}

function normalizeSerie(raw: RawSerie, idx: number, source: 'series' | 'serieskids'): Movie {
  const genres = parseGenres(raw);
  const isKids = !!raw.kids || source === 'serieskids' ||
    genres.some(g => /kids|infantil|crian/i.test(g));

  return {
    id: `${source}-${idx}`,
    title: raw.titulo || '',
    description: raw.desc || '',
    image: raw.poster || '',
    year: parseInt(raw.year || '2024') || 2024,
    genre: genres,
    type: 'series',
    rating: raw.rating || '',
    streamUrl: raw.identificador_archive
      ? `https://archive.org/download/${raw.identificador_archive}/`
      : (raw.url || ''),
    trailer: raw.trailer || '',
    kids: isKids,
    source: isKids ? 'serieskids' : 'series',
    tmdbId: raw.tmdb_id,
  };
}

// ─── TMDB Enrichment ─────────────────────────────────────────────────────────

async function enrichMovie(movie: Movie): Promise<Movie> {
  if (!movie.tmdbId) return movie;
  // Only enrich if missing poster or description
  if (movie.image && movie.description) return movie;

  const type = movie.type === 'series' ? 'tv' : 'movie';
  const details = await enrichFromTMDB(movie.tmdbId, type);
  if (!details) return movie;

  return {
    ...movie,
    image: movie.image || details.poster,
    backdrop: details.backdrop || movie.backdrop,
    description: movie.description || details.description,
    genre: movie.genre.length > 0 ? movie.genre : details.genres,
    year: movie.year || parseInt(details.year) || movie.year,
    rating: movie.rating || details.rating,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [filmesRaw, seriesRaw, kidsFilmesRaw, kidsSeriesRaw, favoritosRaw] = await Promise.all([
      safeFetch(`${BASE}/cinema.json`),
      safeFetch(`${BASE}/series.json`),
      safeFetch(`${BASE}/kids_filmes.json`),
      safeFetch(`${BASE}/kids_series.json`),
      safeFetch(`${BASE}/Favoritos.json`),
    ]);

    const all: Movie[] = [];

    if (Array.isArray(filmesRaw)) {
      filmesRaw.forEach((item, i) => {
        const raw = item as RawFilme;
        if (raw.titulo) all.push(normalizeFilme(raw, i, 'cinema'));
      });
    }

    if (Array.isArray(seriesRaw)) {
      seriesRaw.forEach((item, i) => {
        const raw = item as RawSerie;
        if (raw.titulo) all.push(normalizeSerie(raw, i, 'series'));
      });
    }

    if (Array.isArray(kidsFilmesRaw)) {
      kidsFilmesRaw.forEach((item, i) => {
        const raw = item as RawFilme;
        if (raw.titulo) all.push(normalizeFilme(raw, i, 'filmeskids'));
      });
    }

    if (Array.isArray(kidsSeriesRaw)) {
      kidsSeriesRaw.forEach((item, i) => {
        const raw = item as RawSerie;
        if (raw.titulo) all.push(normalizeSerie(raw, i, 'serieskids'));
      });
    }

    if (Array.isArray(favoritosRaw) && favoritosRaw.length > 0) {
      favoritosRaw.forEach((item, i) => {
        const raw = item as RawFilme;
        if (raw.titulo) {
          const m = normalizeFilme(raw, i, 'cinema');
          all.push({ ...m, id: `favoritos-${i}`, source: 'favoritos' });
        }
      });
    }

    // Enrich items that need TMDB data (missing poster/desc)
    const needsEnrich = all.filter(m => m.tmdbId && (!m.image || !m.description));
    if (needsEnrich.length > 0) {
      const enriched = await Promise.allSettled(
        needsEnrich.map(m => enrichMovie(m))
      );
      const enrichedMap = new Map<string, Movie>();
      enriched.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          enrichedMap.set(needsEnrich[i].id, result.value);
        }
      });

      for (let i = 0; i < all.length; i++) {
        const e = enrichedMap.get(all[i].id);
        if (e) all[i] = e;
      }
    }

    setMovies(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Re-fetch JSON every 27 minutes
    const id = setInterval(fetchData, 27 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { movies, loading };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffleArray(arr).slice(0, count);
}
