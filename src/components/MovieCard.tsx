import { Movie } from '@/types';
import { Play, Plus, Check, Info } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
  onShowDetails?: (movie: Movie) => void;
}

const MovieCard = ({ movie, onPlay, onToggleFavorite, isFavorite, progress, onShowDetails }: MovieCardProps) => {
  return (
    <div className="movie-card group flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]" data-nav="card">
      <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/40">
        <img
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onClick={() => onShowDetails?.(movie)}
          draggable={false}
        />
        {/* Shadow overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-md">
            <div
              className="h-full bg-progress rounded-b-md transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="movie-card-info">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{movie.title}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{movie.year} · {movie.genre[0]}</p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 mb-[5px]">
            <button
              onClick={(e) => { e.stopPropagation(); movie.type === 'series' && onShowDetails ? onShowDetails(movie) : onPlay(movie); }}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-foreground text-background hover:opacity-80 transition"
              data-nav="card-action"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-muted-foreground/50 hover:border-foreground transition"
              data-nav="card-action"
            >
              {isFavorite ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            {onShowDetails && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-muted-foreground/50 hover:border-foreground transition"
                data-nav="card-action"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            {movie.rating && (
              <span className="text-[9px] sm:text-[10px] border border-muted-foreground/40 px-1 rounded">{movie.rating}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
