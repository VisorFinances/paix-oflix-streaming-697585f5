export type SourceFile = 'cinema' | 'favoritos' | 'filmeskids' | 'series' | 'serieskids';

export interface Movie {
  id: string;
  title: string;
  description: string;
  image: string;
  backdrop?: string;
  year: number;
  genre: string[];
  type: 'movie' | 'series' | 'novela';
  rating?: string;
  duration?: string;
  streamUrl?: string;
  trailer?: string;
  kids?: boolean;
  source: SourceFile;
}

// Raw shape from remote cinema/filmeskids JSON
export interface RawMovieItem {
  titulo: string;
  url: string;
  genero: string;
  year: string;
  rating: string;
  desc: string;
  poster: string;
  type: string;
}

// Raw shape from remote séries/sérieskids JSON
export interface RawSeriesItem {
  titulo: string;
  identificador_archive: string;
  genero: string;
  year: string;
  rating: string;
  desc: string;
  poster: string;
  type: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
}

export interface ContinueWatchingItem {
  movieId: string;
  progress: number; // 0-100
  timestamp: number;
}
