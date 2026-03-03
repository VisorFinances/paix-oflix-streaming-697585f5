import { useState, useRef, useEffect, useCallback } from 'react';
import { Movie } from '@/types';
import { Play, Plus, Check, Info } from 'lucide-react';

interface PreviewCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
  onShowDetails?: (movie: Movie) => void;
}

const PreviewCard = ({
  movie,
  onPlay,
  onToggleFavorite,
  isFavorite,
  progress,
  onShowDetails,
}: PreviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerReady, setTrailerReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Direct video URL for inline trailer (not YouTube embeds)
  const trailerSrc = movie.streamUrl && !movie.streamUrl.includes('youtube') && !movie.streamUrl.includes('youtu.be')
    ? movie.streamUrl
    : '';

  const clearDwell = useCallback(() => {
    if (dwellRef.current) { clearTimeout(dwellRef.current); dwellRef.current = null; }
  }, []);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    if (!trailerSrc) return;
    dwellRef.current = setTimeout(() => setShowTrailer(true), 500);
  }, [trailerSrc]);

  const handleBlur = useCallback(() => {
    clearDwell();
    setIsExpanded(false);
    setShowTrailer(false);
    setTrailerReady(false);
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
  }, [clearDwell]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !trailerSrc) return;
    if (showTrailer) {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [showTrailer, trailerSrc]);

  useEffect(() => () => clearDwell(), [clearDwell]);

  const synopsis = movie.description
    ? movie.description.length > 80
      ? movie.description.slice(0, 80) + '…'
      : movie.description
    : '';

  return (
    <div
      ref={cardRef}
      className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
      data-nav="card"
      tabIndex={0}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleFocus}
      onTouchEnd={() => setTimeout(handleBlur, 3000)}
    >
      {/* Main card */}
      <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/40 cursor-pointer transition-transform duration-300"
        style={{ transform: isExpanded ? 'scale(1.05)' : 'scale(1)' }}
      >
        {/* Lazy image with skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-md" />
        )}
        <img
          src={movie.image}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showTrailer && trailerReady ? 'opacity-0' : imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onClick={() => onShowDetails?.(movie)}
          draggable={false}
        />

        {/* Inline video preview */}
        {trailerSrc && (
          <video
            ref={videoRef}
            src={showTrailer ? trailerSrc : undefined}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              showTrailer && trailerReady ? 'opacity-100' : 'opacity-0'
            }`}
            muted playsInline loop
            onCanPlay={() => setTrailerReady(true)}
            onError={() => { setShowTrailer(false); setTrailerReady(false); }}
          />
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-[5]">
            <div className="flex items-center justify-end px-1.5 pb-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold text-foreground/90">{progress}%</span>
            </div>
            <div className="h-1 bg-muted rounded-b-md">
              <div
                className="h-full rounded-b-md transition-all"
                style={{ width: `${progress}%`, background: 'hsl(var(--primary))' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded overlay — floats ABOVE other cards, fully visible */}
      {isExpanded && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[calc(100%-16px)] z-[60] w-[180px] sm:w-[200px] md:w-[240px] lg:w-[260px] bg-card rounded-b-lg shadow-2xl shadow-black/70 p-2.5 sm:p-3 pointer-events-auto animate-fade-in"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={handleBlur}
        >
          <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{movie.title}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {movie.year} · {movie.genre[0] || ''}
            {movie.rating ? ` · ★ ${movie.rating}` : ''}
          </p>

          {synopsis && (
            <p className="text-[10px] sm:text-[11px] text-muted-foreground/80 mt-1.5 leading-snug line-clamp-3">
              {synopsis}
            </p>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                movie.type === 'series' && onShowDetails ? onShowDetails(movie) : onPlay(movie);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-foreground text-background text-[10px] sm:text-xs font-semibold hover:opacity-80 transition"
              data-nav="card-action"
            >
              <Play className="w-3 h-3" /> Assistir
            </button>
            {movie.trailer && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowDetails?.(movie); }}
                className="flex items-center gap-1 px-2 py-1 rounded bg-muted/60 text-foreground text-[10px] sm:text-xs font-medium hover:bg-muted transition"
                data-nav="card-action"
              >
                <Play className="w-3 h-3" /> Trailer
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-muted-foreground/50 hover:border-foreground transition ml-auto"
              data-nav="card-action"
              title={isFavorite ? 'Remover da lista' : 'Adicionar à lista'}
            >
              {isFavorite
                ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                : <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              }
            </button>
            {onShowDetails && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
                className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-muted-foreground/50 hover:border-foreground transition"
                data-nav="card-action"
                title="Mais Informações"
              >
                <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewCard;
