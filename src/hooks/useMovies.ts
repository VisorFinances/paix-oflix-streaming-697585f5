import { useState, useEffect } from 'react';
import { Movie } from '@/types';

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/cinema.json')
      .then(res => res.json())
      .then((data: Movie[]) => {
        setMovies(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { movies, loading };
}
