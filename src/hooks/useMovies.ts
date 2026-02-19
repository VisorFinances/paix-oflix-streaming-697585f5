import { useState, useEffect } from 'react';
import { Movie } from '@/types';

const BASE = 'https://raw.githubusercontent.com/VisorFinances/paix-oflix-streaming-697585f5/refs/heads/main/data';

// ─── Raw types ───────────────────────────────────────────────────────────────

interface RawFilme {
  titulo: string;
  url?: string;
  tmdb_id?: string;
  trailer?: string;
  genero?: string;
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
  genero?: string;
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
    const res = await fetch(url);
    if (!res.ok) { console.warn(`Fetch failed: ${url} → HTTP ${res.status}`); return []; }
    const text = await res.text();
    if (text.trim().startsWith('<')) { console.warn(`HTML instead of JSON: ${url}`); return []; }
    return JSON.parse(text);
  } catch (e) {
    console.warn(`Error fetching ${url}:`, e);
    return [];
  }
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeFilme(raw: RawFilme, idx: number, source: 'cinema' | 'filmeskids'): Movie {
  let genres: string[] = [];
  if (raw.categories && raw.categories.length > 0) {
    genres = raw.categories;
  } else if (raw.genero) {
    genres = [raw.genero];
  }

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
  };
}

function normalizeSerie(raw: RawSerie, idx: number, source: 'series' | 'serieskids'): Movie {
  let genres: string[] = [];
  if (raw.categories && raw.categories.length > 0) {
    genres = raw.categories;
  } else if (raw.genero) {
    genres = [raw.genero];
  }

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
    kids: isKids,
    source: isKids ? 'serieskids' : 'series',
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Session-stable shuffle seed (re-randomizes on each full page load)
  const [shuffleSeed] = useState(() => Math.random());

  useEffect(() => {
    Promise.all([
      safeFetch(`${BASE}/cinema.json`),
      safeFetch(`${BASE}/series.json`),
      safeFetch(`${BASE}/kids_filmes.json`),
      safeFetch(`${BASE}/kids_series.json`),
      safeFetch(`${BASE}/Favoritos.json`),
    ]).then(([filmesRaw, seriesRaw, kidsFilmesRaw, kidsSeriesRaw, favoritosRaw]) => {
      const all: Movie[] = [];

      // Cinema (filmes adultos)
      if (Array.isArray(filmesRaw)) {
        filmesRaw.forEach((item, i) => {
          const raw = item as RawFilme;
          if (raw.titulo && raw.poster) {
            all.push(normalizeFilme(raw, i, 'cinema'));
          }
        });
      }

      // Séries adultas
      if (Array.isArray(seriesRaw)) {
        seriesRaw.forEach((item, i) => {
          const raw = item as RawSerie;
          if (raw.titulo && raw.poster) {
            all.push(normalizeSerie(raw, i, 'series'));
          }
        });
      }

      // Kids filmes
      if (Array.isArray(kidsFilmesRaw)) {
        kidsFilmesRaw.forEach((item, i) => {
          const raw = item as RawFilme;
          if (raw.titulo && raw.poster) {
            all.push(normalizeFilme(raw, i, 'filmeskids'));
          }
        });
      }

      // Kids séries
      if (Array.isArray(kidsSeriesRaw)) {
        kidsSeriesRaw.forEach((item, i) => {
          const raw = item as RawSerie;
          if (raw.titulo && raw.poster) {
            all.push(normalizeSerie(raw, i, 'serieskids'));
          }
        });
      }

      // Favoritos
      if (Array.isArray(favoritosRaw)) {
        favoritosRaw.forEach((item, i) => {
          const raw = item as RawFilme;
          if (raw.titulo && raw.poster) {
            const m = normalizeFilme(raw, i, 'cinema');
            all.push({ ...m, id: `favoritos-${i}`, source: 'favoritos' });
          }
        });
      }

      setMovies(all);
      setLoading(false);
    });
  }, [shuffleSeed]);

  return { movies, loading };
}

// ─── Utility: pick random items ──────────────────────────────────────────────

export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffleArray(arr).slice(0, count);
}
