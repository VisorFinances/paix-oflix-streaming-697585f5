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

/** Convert YouTube URL to embed URL */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    } else if (url.includes('youtube.com/watch')) {
      videoId = new URL(url).searchParams.get('v') || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split(/[?&#]/)[0] || '';
    }
  } catch { return null; }
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
}

function isDirectVideo(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|m3u8|mpd|webm)(\?|$)/i.test(url) || (
    url.includes('archive.org') && !url.includes('youtube') && !url.includes('youtu.be')
  );
}

// Global singleton: only 1 trailer active at a time
let activeTrailerCardId: string | null = null;
const trailerListeners = new Set<(id: string | null) => void>();
function setActiveTrailer(id: string | null) {
  activeTrailerCardId = id;
  trailerListeners.forEach(fn => fn(id));
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
  const abortRef = useRef<AbortController | null>(null);
  const cardId = useRef(movie.id);

  const youtubeEmbedUrl = movie.trailer ? getYouTubeEmbedUrl(movie.trailer) : null;
  const directTrailerSrc = movie.trailer && isDirectVideo(movie.trailer) ? movie.trailer
    : (movie.streamUrl && isDirectVideo(movie.streamUrl || '') ? movie.streamUrl : '');

  const hasTrailer = !!youtubeEmbedUrl || !!directTrailerSrc;

  // Listen for singleton changes
  useEffect(() => {
    const listener = (id: string | null) => {
      if (id !== cardId.current && showTrailer) {
        setShowTrailer(false);
        setTrailerReady(false);
        const v = videoRef.current;
        if (v) { v.pause(); v.currentTime = 0; }
      }
    };
    trailerListeners.add(listener);
    return () => { trailerListeners.delete(listener); };
  }, [showTrailer]);

  const clearDwell = useCallback(() => {
    if (dwellRef.current) { clearTimeout(dwellRef.current); dwellRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
  }, []);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    if (!hasTrailer) return;
    // Check saveData for mobile
    const conn = (navigator as any).connection;
    if (conn?.saveData) return;

    dwellRef.current = setTimeout(() => {
      setActiveTrailer(cardId.current);
      abortRef.current = new AbortController();
      setShowTrailer(true);
    }, 500);
  }, [hasTrailer]);

  const handleBlur = useCallback(() => {
    clearDwell();
    setIsExpanded(false);
    setShowTrailer(false);
    setTrailerReady(false);
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
    if (activeTrailerCardId === cardId.current) setActiveTrailer(null);
  }, [clearDwell]);

  // Direct video autoplay
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !directTrailerSrc) return;
    if (showTrailer) {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [showTrailer, directTrailerSrc]);

  useEffect(() => () => clearDwell(), [clearDwell]);

  const synopsis = movie.description
    ? movie.description.length > 50
      ? movie.description.slice(0, 50) + '…'
      : movie.description
    : '';

  // Touch: 1st tap expands, 2nd tap opens
  const handleTouch = useCallback(() => {
    if (isExpanded) {
      onShowDetails?.(movie);
    } else {
      handleFocus();
    }
  }, [isExpanded, movie, onShowDetails, handleFocus]);

  return (
    <div
      className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
      style={{ transform: 'translateZ(0)' }}
      data-nav="card"
      tabIndex={0}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouch}
    >
      {/* Main card */}
      <div
        className="relative rounded-md overflow-hidden shadow-lg shadow-black/40 cursor-pointer transition-transform duration-300"
        style={{
          aspectRatio: '2/3',
          transform: isExpanded ? 'scale(1.15)' : 'scale(1)',
          zIndex: isExpanded ? 50 : 1,
        }}
      >
        {/* Skeleton */}
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

        {/* YouTube iframe trailer (lazy mounted) */}
        {showTrailer && youtubeEmbedUrl && !directTrailerSrc && (
          <iframe
            src={youtubeEmbedUrl}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${trailerReady ? 'opacity-100' : 'opacity-0'}`}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            onLoad={() => setTrailerReady(true)}
            style={{ border: 'none', pointerEvents: 'none' }}
          />
        )}

        {/* Direct video trailer */}
        {directTrailerSrc && (
          <video
            ref={videoRef}
            src={showTrailer ? directTrailerSrc : undefined}
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

      {/* Expanded overlay — floats ABOVE other cards */}
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
