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
  /** Se fornecido, habilita o preview de vídeo no hover */
  videoUrl?: string;
}

const PreviewCard = ({
  movie,
  onPlay,
  onToggleFavorite,
  isFavorite,
  progress,
  onShowDetails,
  videoUrl,
}: PreviewCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDwell = useCallback(() => {
    if (dwellRef.current) {
      clearTimeout(dwellRef.current);
      dwellRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!videoUrl) return;
    dwellRef.current = setTimeout(() => {
      setShowVideo(true);
    }, 1500);
  }, [videoUrl]);

  const handleMouseLeave = useCallback(() => {
    clearDwell();
    setShowVideo(false);
    setVideoLoaded(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, [clearDwell]);

  // Play/pause when showVideo toggles
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    if (showVideo) {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [showVideo, videoUrl]);

  // Cleanup on unmount
  useEffect(() => () => clearDwell(), [clearDwell]);

  return (
    <div
      className="movie-card group flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
      data-nav="card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/40">
        {/* Thumbnail */}
        <img
          src={movie.image}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showVideo && videoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          onClick={() => onShowDetails?.(movie)}
          draggable={false}
        />

        {/* Video preview */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={showVideo ? videoUrl : undefined}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              showVideo && videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
            loop
            onCanPlay={() => setVideoLoaded(true)}
            onError={() => { setShowVideo(false); setVideoLoaded(false); }}
          />
        )}

        {/* Bottom gradient shadow for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-md">
            <div
              className="h-full rounded-b-md transition-all"
              style={{ width: `${progress}%`, background: 'hsl(var(--primary))' }}
            />
          </div>
        )}

        {/* Card info overlay */}
        <div className="movie-card-info">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{movie.title}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {movie.year} · {movie.genre[0]}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 mb-[5px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                movie.type === 'series' && onShowDetails ? onShowDetails(movie) : onPlay(movie);
              }}
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
              {isFavorite
                ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'hsl(var(--primary))' }} />
                : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              }
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
              <span className="text-[9px] sm:text-[10px] border border-muted-foreground/40 px-1 rounded">
                {movie.rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
