import { useState, useEffect } from 'react';
import { Movie, RawMovieItem, RawSeriesItem } from '@/types';

const BASE = 'https://raw.githubusercontent.com/VisorFinances/tv.paixaoflix/refs/heads/main/data';

const SOURCES = [
  { url: `${BASE}/cinema.json`, kind: 'movie' as const, kids: false },
  { url: `${BASE}/favoritos.json`, kind: 'movie' as const, kids: false },
  { url: `${BASE}/filmeskids.json`, kind: 'movie' as const, kids: true },
  { url: `${BASE}/s%C3%A9ries.json`, kind: 'series' as const, kids: false },
  { url: `${BASE}/s%C3%A9rieskids.json`, kind: 'series' as const, kids: true },
];

function normalizeMovie(raw: RawMovieItem, index: number, kind: 'movie' | 'series', kids: boolean): Movie {
  return {
    id: `${kind}-${kids ? 'k' : 'a'}-${index}`,
    title: raw.titulo,
    description: raw.desc || '',
    image: raw.poster || '',
    year: parseInt(raw.year) || 2024,
    genre: raw.genero ? [raw.genero] : [],
    type: kind,
    rating: raw.rating || '',
    streamUrl: raw.url || '',
    kids,
  };
}

function normalizeSeries(raw: RawSeriesItem, index: number, kids: boolean): Movie {
  return {
    id: `series-${kids ? 'k' : 'a'}-${index}`,
    title: raw.titulo,
    description: raw.desc || '',
    image: raw.poster || '',
    year: parseInt(raw.year) || 2024,
    genre: raw.genero ? [raw.genero] : [],
    type: 'series',
    rating: raw.rating || '',
    streamUrl: raw.identificador_archive
      ? `https://archive.org/download/${raw.identificador_archive}/`
      : '',
    kids,
  };
}

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      SOURCES.map(src =>
        fetch(src.url)
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      )
    ).then(results => {
      const all: Movie[] = [];

      results.forEach((data: any[], i) => {
        const src = SOURCES[i];
        if (!Array.isArray(data)) return;

        data.forEach((item, idx) => {
          if (item.identificador_archive !== undefined) {
            all.push(normalizeSeries(item, all.length + idx, src.kids));
          } else {
            all.push(normalizeMovie(item, all.length + idx, src.kind, src.kids));
          }
        });
      });

      setMovies(all);
      setLoading(false);
    });
  }, []);

  return { movies, loading };
}
