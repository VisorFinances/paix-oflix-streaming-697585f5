import { useState, useCallback, useRef, useEffect } from 'react';
import { Movie } from '@/types';
import { Play, Plus, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PreviewCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
  onShowDetails?: (movie: Movie) => void;
}

/* YouTube embed URL helper */
function getYTEmbed(url: string): string | null {
  if (!url) return null;
  let vid = '';
  try {
    if (url.includes('youtu.be/')) vid = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    else if (url.includes('youtube.com/watch')) vid = new URL(url).searchParams.get('v') || '';
    else if (url.includes('youtube.com/embed/')) vid = url.split('embed/')[1]?.split(/[?&#]/)[0] || '';
  } catch { return null; }
  if (!vid) return null;
  return `https://www.youtube.com/embed/${vid}?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=30&enablejsapi=1`;
}

// Singleton: only one card can be playing trailer at a time
let activeCardId: string | null = null;
let activeCardCleanup: (() => void) | null = null;

const HOVER_DELAY = 500;

const PreviewCard = ({ movie, onPlay, onToggleFavorite, isFavorite, progress, onShowDetails }: PreviewCardProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [mobileTapState, setMobileTapState] = useState<'idle' | 'trailer'>('idle');
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  const isNew = movie.year >= 2025;
  const hasTrailer = !!movie.trailer;

  const startPreview = useCallback(() => {
    if (isMobile) return;
    setExpanded(true);
    if (hasTrailer) {
      hoverTimer.current = setTimeout(() => {
        if (activeCardId && activeCardId !== movie.id && activeCardCleanup) {
          activeCardCleanup();
        }
        activeCardId = movie.id;
        activeCardCleanup = () => {
          setShowTrailer(false);
          setExpanded(false);
        };
        setShowTrailer(true);
      }, HOVER_DELAY);
    }
  }, [isMobile, hasTrailer, movie.id]);

  const stopPreview = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setExpanded(false);
    setShowTrailer(false);
    if (activeCardId === movie.id) {
      activeCardId = null;
      activeCardCleanup = null;
    }
  }, [movie.id]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (activeCardId === movie.id) {
        activeCardId = null;
        activeCardCleanup = null;
      }
    };
  }, [movie.id]);

  // Mobile: 1st tap = trailer, 2nd tap = play (movie) or details (series)
  const handleClick = useCallback(() => {
    if (isMobile) {
      if (mobileTapState === 'idle' && hasTrailer) {
        // 1st tap: show trailer
        if (activeCardId && activeCardId !== movie.id && activeCardCleanup) {
          activeCardCleanup();
        }
        activeCardId = movie.id;
        activeCardCleanup = () => {
          setShowTrailer(false);
          setMobileTapState('idle');
        };
        setShowTrailer(true);
        setMobileTapState('trailer');
        return;
      }
      // 2nd tap (or no trailer): movie → play, series → details
      setShowTrailer(false);
      setMobileTapState('idle');
      if (activeCardId === movie.id) {
        activeCardId = null;
        activeCardCleanup = null;
      }
      if (movie.type === 'series') {
        onShowDetails?.(movie);
      } else {
        onPlay(movie);
      }
      return;
    }
    // Desktop: always open details
    onShowDetails?.(movie);
  }, [isMobile, mobileTapState, hasTrailer, movie, onShowDetails, onPlay]);

  const ytUrl = showTrailer ? getYTEmbed(movie.trailer!) : null;
  const posterSrc = movie.image && movie.image.length > 5 ? movie.image : '/placeholder.svg';
  const mobileShowingTrailer = isMobile && showTrailer;

  return (
    <div
      className="pv-card-wrapper"
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
    >
      {/* Main card */}
      <div
        className={`pv-card group ${expanded && !isMobile ? 'pv-card--expanded' : ''} ${mobileShowingTrailer ? 'ring-2 ring-primary' : ''}`}
        data-nav="card"
        tabIndex={0}
        onClick={handleClick}
        style={{ overflow: 'hidden' }}
      >
        {/* Skeleton */}
        {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />}

        {/* Poster */}
        <img
          src={posterSrc}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imgLoaded ? (showTrailer ? 'opacity-0' : 'opacity-100') : 'opacity-0'
          }`}
          loading="lazy"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('placeholder')) {
              target.src = '/placeholder.svg';
            }
            setImgLoaded(true);
          }}
        />

        {/* YouTube trailer — mobile + desktop */}
        {ytUrl && (
          <iframe
            src={ytUrl}
            className="absolute inset-0 w-full h-full z-[3]"
            allow="autoplay; encrypted-media"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
        )}

        {/* NEW badge */}
        {isNew && !showTrailer && (
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-[5] px-1 py-0.5 sm:px-1.5 rounded text-[8px] sm:text-xs font-bold uppercase tracking-wider bg-accent-blue text-white">
            Novo
          </div>
        )}

        {/* Rating pill */}
        {movie.rating && !showTrailer && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-[5] flex items-center gap-0.5 px-1 py-0.5 sm:px-1.5 rounded text-[8px] sm:text-xs font-semibold bg-black/60 text-foreground backdrop-blur-sm">
            ★ {movie.rating}
          </div>
        )}

        {/* Bottom gradient */}
        {!showTrailer && (
          <div
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.7) 20%, transparent 55%)',
            }}
          />
        )}

        {/* Mobile: "Toque para assistir" hint when trailer is playing */}
        {mobileShowingTrailer && (
          <div className="absolute bottom-0 left-0 right-0 z-[6] p-1.5 bg-background/80 backdrop-blur-sm">
            <p className="text-[9px] font-semibold text-center text-foreground">
              ▶ Toque para {movie.type === 'series' ? 'ver episódios' : 'assistir'}
            </p>
          </div>
        )}

        {/* Title overlay — visible when NOT showing trailer */}
        {!showTrailer && (isMobile || (!expanded)) && (
          <div className="absolute bottom-0 left-0 right-0 z-[4] p-1.5 sm:p-2.5 md:p-3">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground leading-tight line-clamp-2">
              {movie.title}
            </h3>
            <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
              {movie.year} {movie.genre[0] && `· ${movie.genre[0]}`}
            </p>
          </div>
        )}

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && !showTrailer && (
          <div className="absolute bottom-0 left-0 right-0 z-[5]">
            <div className="h-[2px] sm:h-[3px] bg-muted/50">
              <div
                className="h-full transition-all bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Metadata BELOW the card — desktop/TV only */}
      {expanded && !isMobile && (
        <div className="pv-card-meta">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {movie.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
            {movie.year} {movie.genre[0] && `· ${movie.genre[0]}`}
          </p>
          {movie.description && (
            <p className="text-[9px] sm:text-[11px] text-foreground/70 mt-1.5 line-clamp-3">
              {movie.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                movie.type === 'series' && onShowDetails ? onShowDetails(movie) : onPlay(movie);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-foreground text-background text-[10px] sm:text-xs font-semibold hover:opacity-80 transition"
              data-nav="card-action"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" /> Assistir
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
              className="flex items-center justify-center w-7 h-7 rounded-full border border-muted-foreground/40 hover:border-foreground bg-black/40 backdrop-blur-sm transition"
              data-nav="card-action"
              title={isFavorite ? 'Remover da lista' : 'Minha Lista'}
            >
              {isFavorite
                ? <Check className="w-3.5 h-3.5 text-primary" />
                : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewCard;
