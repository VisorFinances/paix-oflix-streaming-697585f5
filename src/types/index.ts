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
  kids?: boolean;
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
