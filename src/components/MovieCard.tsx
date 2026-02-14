import { Movie } from '@/types';
import { Play, Plus, Check } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
}

const MovieCard = ({ movie, onPlay, onToggleFavorite, isFavorite, progress }: MovieCardProps) => {
  return (
    <div className="movie-card group flex-shrink-0 w-[180px] md:w-[220px]">
      <div className="relative aspect-[2/3]">
        <img
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover rounded-md"
          loading="lazy"
        />
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-md">
            <div
              className="h-full bg-progress rounded-b-md transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="movie-card-info">
          <h3 className="text-sm font-semibold text-foreground truncate">{movie.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{movie.year} · {movie.genre[0]}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background hover:opacity-80 transition"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-muted-foreground/50 hover:border-foreground transition"
            >
              {isFavorite ? <Check className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4" />}
            </button>
            {movie.rating && (
              <span className="text-[10px] border border-muted-foreground/40 px-1 rounded">{movie.rating}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
