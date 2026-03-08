import { useState, useCallback } from 'react';
import { Movie } from '@/types';
import { Play, Plus, Check } from 'lucide-react';

interface PreviewCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
  onShowDetails?: (movie: Movie) => void;
}

const PreviewCard = ({ movie, onPlay, onToggleFavorite, isFavorite, progress, onShowDetails }: PreviewCardProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [focused, setFocused] = useState(false);

  const isNew = movie.year >= 2025;

  const handleClick = useCallback(() => {
    if (movie.type === 'series' && onShowDetails) {
      onShowDetails(movie);
    } else {
      onShowDetails?.(movie);
    }
  }, [movie, onShowDetails]);

  return (
    <div
      className="pv-card group"
      data-nav="card"
      tabIndex={0}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={handleClick}
    >
      {/* Skeleton */}
      {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />}

      {/* Poster */}
      <img
        src={movie.image}
        alt={movie.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        draggable={false}
        onLoad={() => setImgLoaded(true)}
      />

      {/* NEW badge */}
      {isNew && (
        <div className="absolute top-2 left-2 z-[5] px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-accent-blue text-white">
          Novo
        </div>
      )}

      {/* Rating pill */}
      {movie.rating && (
        <div className="absolute top-2 right-2 z-[5] flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-black/60 text-foreground backdrop-blur-sm">
          ★ {movie.rating}
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.7) 20%, transparent 55%)',
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] p-2.5 sm:p-3">
        <h3 className="text-[11px] sm:text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
          {movie.title}
        </h3>
        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
          {movie.year} {movie.genre[0] && `· ${movie.genre[0]}`}
        </p>

        {/* Action buttons — show on hover/focus */}
        <div
          className="flex items-center gap-1.5 mt-2 transition-all duration-200"
          style={{ opacity: focused ? 1 : 0, transform: focused ? 'translateY(0)' : 'translateY(6px)' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              movie.type === 'series' && onShowDetails ? onShowDetails(movie) : onPlay(movie);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-foreground text-background text-[9px] sm:text-[11px] font-semibold hover:opacity-80 transition"
            data-nav="card-action"
          >
            <Play className="w-3 h-3" fill="currentColor" /> Assistir
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
            className="flex items-center justify-center w-6 h-6 rounded-full border border-muted-foreground/40 hover:border-foreground bg-black/40 backdrop-blur-sm transition"
            data-nav="card-action"
            title={isFavorite ? 'Remover da lista' : 'Minha Lista'}
          >
            {isFavorite
              ? <Check className="w-3 h-3 text-primary" />
              : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-[4]">
          <div className="h-[3px] bg-muted/50">
            <div
              className="h-full transition-all bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewCard;
