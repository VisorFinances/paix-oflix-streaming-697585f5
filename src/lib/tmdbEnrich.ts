const TMDB_API_KEY = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface TMDBDetails {
  poster: string;
  backdrop: string;
  description: string;
  genres: string[];
  year: string;
  rating: string;
}

const cache = new Map<string, TMDBDetails>();

export async function enrichFromTMDB(tmdbId: string, type: 'movie' | 'tv'): Promise<TMDBDetails | null> {
  const key = `${type}-${tmdbId}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(
      `${TMDB_BASE}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const details: TMDBDetails = {
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w600_and_h900_face${data.poster_path}` : '',
      backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
      description: data.overview || '',
      genres: (data.genres || []).map((g: any) => g.name),
      year: (data.release_date || data.first_air_date || '').slice(0, 4),
      rating: (data.vote_average || 0).toFixed(1),
    };

    cache.set(key, details);
    return details;
  } catch {
    return null;
  }
}
