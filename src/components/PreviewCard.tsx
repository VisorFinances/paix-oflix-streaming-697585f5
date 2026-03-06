import { useState, useRef, useEffect, useCallback } from 'react';
import { Movie } from '@/types';
import { Play, Plus, Check, Volume2, VolumeX } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface PreviewCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
  onShowDetails?: (movie: Movie) => void;
}

type CardState = 'IDLE' | 'FOCUSED' | 'TRAILER_WAIT' | 'TRAILER_PLAYING';

/* ── YouTube helpers ──────────────────────────────────────────────── */

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    else if (url.includes('youtube.com/watch')) videoId = new URL(url).searchParams.get('v') || '';
    else if (url.includes('youtube.com/embed/')) videoId = url.split('embed/')[1]?.split(/[?&#]/)[0] || '';
  } catch { return null; }
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
}

function isDirectVideo(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|m3u8|mpd|webm)(\?|$)/i.test(url) || (url.includes('archive.org') && !url.includes('youtube'));
}

/* ── ActiveTrailerManager singleton ───────────────────────────────── */

let activeTrailerId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

function setActiveTrailer(id: string | null) {
  activeTrailerId = id;
  listeners.forEach(fn => fn(id));
}

/* ── Component ────────────────────────────────────────────────────── */

const PreviewCard = ({ movie, onPlay, onToggleFavorite, isFavorite, progress, onShowDetails }: PreviewCardProps) => {
  const [state, setState] = useState<CardState>('IDLE');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [trailerReady, setTrailerReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardId = useRef(movie.id);

  const youtubeUrl = movie.trailer ? getYouTubeEmbedUrl(movie.trailer) : null;
  const directSrc = movie.trailer && isDirectVideo(movie.trailer) ? movie.trailer : '';
  const hasTrailer = !!youtubeUrl || !!directSrc;

  const isFocused = state !== 'IDLE';
  const showTrailer = state === 'TRAILER_PLAYING';

  // ── Singleton listener: stop if another card takes over ──
  useEffect(() => {
    const handler = (id: string | null) => {
      if (id !== cardId.current && state === 'TRAILER_PLAYING') {
        destroyTrailer();
      }
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [state]);

  const destroyTrailer = useCallback(() => {
    if (dwellRef.current) { clearTimeout(dwellRef.current); dwellRef.current = null; }
    const v = videoRef.current;
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    setState('IDLE');
    setTrailerReady(false);
    setIsMuted(true);
    if (activeTrailerId === cardId.current) setActiveTrailer(null);
  }, []);

  const handleFocus = useCallback(() => {
    setState('FOCUSED');

    if (!hasTrailer) return;
    const conn = (navigator as any).connection;
    if (conn?.saveData) return;

    dwellRef.current = setTimeout(() => {
      setActiveTrailer(cardId.current);
      setState('TRAILER_WAIT');
      // Transition to TRAILER_PLAYING happens when media is ready
    }, 500);
  }, [hasTrailer]);

  const handleBlur = useCallback(() => {
    destroyTrailer();
  }, [destroyTrailer]);

  // ── Direct video autoplay ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !directSrc) return;
    if (state === 'TRAILER_WAIT' || state === 'TRAILER_PLAYING') {
      v.src = directSrc;
      v.muted = isMuted;
      v.playsInline = true;
      v.loop = true;
      v.play().catch(() => {});
    }
  }, [state, directSrc, isMuted]);

  const onMediaReady = useCallback(() => {
    setTrailerReady(true);
    setState('TRAILER_PLAYING');
  }, []);

  useEffect(() => () => {
    if (dwellRef.current) clearTimeout(dwellRef.current);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
  }, []);

  // ── Touch: 1st tap expands, 2nd tap opens ──
  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (isFocused) {
      onShowDetails?.(movie);
    } else {
      e.preventDefault();
      handleFocus();
    }
  }, [isFocused, movie, onShowDetails, handleFocus]);

  return (
    <div
      className="media-card group"
      data-nav="card"
      tabIndex={0}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouch}
      style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'visible' }}
    >
      {/* media-inner: scales on focus, overlays neighbors */}
      <div
        className="media-inner rounded-md overflow-hidden shadow-lg shadow-black/40"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 150ms ease-out',
          transformOrigin: 'center',
          transform: isFocused ? 'scale(1.12) translateZ(0)' : 'translateZ(0)',
          zIndex: isFocused ? 20 : 1,
          willChange: isFocused ? 'transform' : undefined,
        }}
      >
        {/* Skeleton */}
        {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-md" />}

        {/* Poster */}
        <img
          src={movie.image}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onClick={() => onShowDetails?.(movie)}
        />

        {/* Trailer layer (behind text, inside card) */}
        {(state === 'TRAILER_WAIT' || state === 'TRAILER_PLAYING') && (
          <div className="absolute inset-0 z-[1]">
            {/* YouTube iframe */}
            {youtubeUrl && !directSrc && (
              <iframe
                src={youtubeUrl}
                className={`w-full h-full transition-opacity duration-500 ${trailerReady ? 'opacity-100' : 'opacity-0'}`}
                allow="autoplay; encrypted-media"
                allowFullScreen={false}
                onLoad={onMediaReady}
                style={{ border: 'none', pointerEvents: 'none' }}
              />
            )}
            {/* Direct video */}
            {directSrc && (
              <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity duration-500 ${trailerReady ? 'opacity-100' : 'opacity-0'}`}
                muted={isMuted}
                playsInline
                loop
                preload="none"
                onCanPlay={onMediaReady}
                onError={() => destroyTrailer()}
              />
            )}
          </div>
        )}

        {/* Dark overlay + content (always rendered, opacity transitions) */}
        <div
          className="media-overlay absolute inset-0 z-[2] flex flex-col justify-end"
          style={{
            background: isFocused
              ? 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1))'
              : 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%)',
            opacity: 1,
            transition: 'background 200ms ease',
          }}
        >
          <div className="media-content relative z-[3] p-2 sm:p-2.5">
            {/* Mute button */}
            {showTrailer && trailerReady && directSrc && (
              <button
                onClick={toggleMute}
                className="absolute top-1 right-1 z-[5] w-6 h-6 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-foreground transition"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            )}

            {/* Title (always visible at bottom) */}
            <h3 className="text-[10px] sm:text-xs font-semibold text-foreground truncate leading-tight">
              {movie.title}
            </h3>

            {/* Expanded info — only on focus */}
            {isFocused && (
              <div className="animate-fade-in">
                {/* Meta */}
                <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
                  {movie.year} {movie.rating && `• ★ ${movie.rating}`} {movie.genre[0] && `• ${movie.genre[0]}`}
                </p>

                {/* Synopsis — 3 lines */}
                {movie.description && (
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground/80 mt-1 leading-snug line-clamp-3">
                    {movie.description}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      movie.type === 'series' && onShowDetails ? onShowDetails(movie) : onPlay(movie);
                    }}
                    className="flex items-center gap-0.5 px-2 py-1 rounded bg-foreground text-background text-[8px] sm:text-[10px] font-semibold hover:opacity-80 transition"
                    data-nav="card-action"
                  >
                    <Play className="w-2.5 h-2.5" fill="currentColor" /> Assistir
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
                    className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-muted-foreground/50 hover:border-foreground transition"
                    data-nav="card-action"
                    title={isFavorite ? 'Remover da lista' : 'Minha Lista'}
                  >
                    {isFavorite
                      ? <Check className="w-2.5 h-2.5" style={{ color: 'hsl(var(--primary))' }} />
                      : <Plus className="w-2.5 h-2.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-[4]">
            <div className="h-1 bg-muted rounded-b-md">
              <div
                className="h-full rounded-b-md transition-all"
                style={{ width: `${progress}%`, background: 'hsl(var(--primary))' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewCard;
