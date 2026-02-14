import { useState, useEffect } from 'react';
import { Movie, RawMovieItem, RawSeriesItem } from '@/types';

const BASE = 'https://raw.githubusercontent.com/VisorFinances/tv.paixaoflix/refs/heads/main/data';

import { SourceFile } from '@/types';

const SOURCES: { url: string; kind: 'movie' | 'series'; kids: boolean; source: SourceFile }[] = [
  { url: `${BASE}/cinema.json`, kind: 'movie', kids: false, source: 'cinema' },
  { url: `${BASE}/favoritos.json`, kind: 'movie', kids: false, source: 'favoritos' },
  { url: `${BASE}/filmeskids.json`, kind: 'movie', kids: true, source: 'filmeskids' },
  { url: `${BASE}/s%C3%A9ries.json`, kind: 'series', kids: false, source: 'series' },
  { url: `${BASE}/s%C3%A9rieskids.json`, kind: 'series', kids: true, source: 'serieskids' },
];

function normalizeMovie(raw: RawMovieItem, index: number, kind: 'movie' | 'series', kids: boolean, source: SourceFile): Movie {
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
    source,
  };
}

function normalizeSeries(raw: RawSeriesItem, index: number, kids: boolean, source: SourceFile): Movie {
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
    source,
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
            all.push(normalizeSeries(item, all.length + idx, src.kids, src.source));
          } else {
            all.push(normalizeMovie(item, all.length + idx, src.kind, src.kids, src.source));
          }
        });
      });

      setMovies(all);
      setLoading(false);
    });
  }, []);

  return { movies, loading };
}
