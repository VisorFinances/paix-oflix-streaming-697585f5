const TMDB_API_KEY = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  name: string;
}

export async function searchTMDB(title: string): Promise<number | null> {
  try {
    // Clean title - remove season indicators
    const cleanTitle = title
      .replace(/\s*-\s*\d+ª\s*Temporada/i, '')
      .replace(/\s*Temporada\s*\d+/i, '')
      .trim();

    const res = await fetch(
      `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(cleanTitle)}&page=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function getTMDBVideos(tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<TMDBVideo[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/${mediaType}/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) return [];
    const data = await res.json();
    let videos: TMDBVideo[] = data.results || [];

    // If no PT-BR videos, try English
    if (videos.length === 0) {
      const resEn = await fetch(
        `${TMDB_BASE}/${mediaType}/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
      );
      if (resEn.ok) {
        const dataEn = await resEn.json();
        videos = dataEn.results || [];
      }
    }

    return videos.filter(v => v.site === 'YouTube');
  } catch {
    return [];
  }
}

export async function getTrailerUrl(title: string, mediaType: 'movie' | 'tv' = 'movie'): Promise<string | null> {
  const tmdbId = await searchTMDB(title);
  if (!tmdbId) return null;

  const videos = await getTMDBVideos(tmdbId, mediaType);
  const trailer = videos.find(v => v.type === 'Trailer') || videos[0];
  return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
}

export interface ArchiveFile {
  name: string;
  size?: string;
  length?: string;
  format?: string;
}

export async function getArchiveFiles(identifier: string): Promise<ArchiveFile[]> {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!res.ok) return [];
    const data = await res.json();
    const files: ArchiveFile[] = data.files || [];
    return files.filter(f =>
      f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.avi')
    );
  } catch {
    return [];
  }
}
