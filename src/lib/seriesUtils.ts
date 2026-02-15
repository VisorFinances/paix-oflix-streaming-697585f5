import { Movie } from '@/types';

export interface SeriesGroup {
  title: string;
  poster: string;
  description: string;
  year: number;
  rating: string;
  genre: string[];
  seasons: SeasonData[];
}

export interface SeasonData {
  number: number;
  label: string;
  archiveId: string;
  movie: Movie; // reference to the original movie entry
}

export interface EpisodeData {
  number: number;
  title: string;
  fileName: string;
  streamUrl: string;
  duration?: string;
  thumbnail?: string;
}

/**
 * Groups individual season entries into a single SeriesGroup
 */
export function groupSeriesByTitle(movies: Movie[]): SeriesGroup[] {
  const seriesOnly = movies.filter(m => m.type === 'series');
  const groups = new Map<string, Movie[]>();

  for (const m of seriesOnly) {
    // Extract base title (remove " - 1ª Temporada" etc.)
    const baseTitle = m.title
      .replace(/\s*-\s*\d+ª\s*Temporada/i, '')
      .replace(/\s*Temporada\s*\d+/i, '')
      .trim();

    if (!groups.has(baseTitle)) groups.set(baseTitle, []);
    groups.get(baseTitle)!.push(m);
  }

  const result: SeriesGroup[] = [];

  for (const [title, entries] of groups) {
    // Sort entries by season number extracted from title
    entries.sort((a, b) => {
      const aN = extractSeasonNumber(a.title);
      const bN = extractSeasonNumber(b.title);
      return aN - bN;
    });

    const first = entries[0];
    result.push({
      title,
      poster: first.image,
      description: first.description,
      year: first.year,
      rating: first.rating || '',
      genre: first.genre,
      seasons: entries.map((e, i) => ({
        number: extractSeasonNumber(e.title) || i + 1,
        label: `Temporada ${extractSeasonNumber(e.title) || i + 1}`,
        archiveId: e.streamUrl
          ? e.streamUrl.replace('https://archive.org/download/', '').replace(/\/$/, '')
          : '',
        movie: e,
      })),
    });
  }

  return result;
}

function extractSeasonNumber(title: string): number {
  const match = title.match(/(\d+)ª\s*Temporada/i);
  if (match) return parseInt(match[1]);
  const match2 = title.match(/Temporada\s*(\d+)/i);
  if (match2) return parseInt(match2[1]);
  // Try S01, S02 pattern from archive id
  const match3 = title.match(/s(\d+)/i);
  if (match3) return parseInt(match3[1]);
  return 1;
}

/**
 * Find the SeriesGroup for a given movie (if it's a series)
 */
export function findSeriesGroup(movie: Movie, allMovies: Movie[]): SeriesGroup | null {
  if (movie.type !== 'series') return null;
  const groups = groupSeriesByTitle(allMovies);
  return groups.find(g =>
    g.seasons.some(s => s.movie.id === movie.id)
  ) || null;
}
