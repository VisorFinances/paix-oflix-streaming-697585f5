import { useState, useEffect } from 'react';
import { Movie } from '@/types';

const BASE = 'https://raw.githubusercontent.com/VisorFinances/tv.paixaoflix/main/data';

// ─── Raw types from the actual repository ───────────────────────────────────

interface RawFilme {
  titulo: string;
  url?: string;
  tmdb_id?: string;
  trailer?: string;
  /** single genre string */
  genero?: string;
  /** OR multi-category array (includes launch labels) */
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

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeFilme(raw: RawFilme, idx: number): Movie {
  // Build genre list: prefer categories array, fall back to single genero
  let genres: string[] = [];
  if (raw.categories && raw.categories.length > 0) {
    genres = raw.categories;
  } else if (raw.genero) {
    genres = [raw.genero];
  }

  const isKids = !!raw.kids ||
    genres.some(g => /kids|infantil|crian/i.test(g));

  return {
    id: `filme-${idx}`,
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

function normalizeSerie(raw: RawSerie, idx: number): Movie {
  let genres: string[] = [];
  if (raw.categories && raw.categories.length > 0) {
    genres = raw.categories;
  } else if (raw.genero) {
    genres = [raw.genero];
  }

  const isKids = !!raw.kids ||
    genres.some(g => /kids|infantil|crian/i.test(g));

  return {
    id: `serie-${idx}`,
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

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/filmes`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${BASE}/series`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([filmesRaw, seriesRaw]: [RawFilme[], RawSerie[]]) => {
      const all: Movie[] = [];

      if (Array.isArray(filmesRaw)) {
        filmesRaw.forEach((item, i) => {
          // Skip entries without a poster or title (incomplete records)
          if (item.titulo && item.poster) {
            all.push(normalizeFilme(item, all.length));
          }
        });
      }

      if (Array.isArray(seriesRaw)) {
        seriesRaw.forEach((item, i) => {
          if (item.titulo && item.poster) {
            all.push(normalizeSerie(item, all.length));
          }
        });
      }

      setMovies(all);
      setLoading(false);
    });
  }, []);

  return { movies, loading };
}
