import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Movie } from '@/types';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeroBannerProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onShowDetails?: (movie: Movie) => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    else if (url.includes('youtube.com/watch')) videoId = new URL(url).searchParams.get('v') || '';
    else if (url.includes('youtube.com/embed/')) videoId = url.split('embed/')[1]?.split(/[?&#]/)[0] || '';
  } catch { return null; }
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=10&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`;
}

function isDirectVideo(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|m3u8|mpd|webm)(\?|$)/i.test(url) || (url.includes('archive.org') && !url.includes('youtube'));
}

const COVER_DURATION = 3500;
const COVER_DURATION_MOBILE = 6500;
const TRAILER_DURATION = 10000;

const HeroBanner = ({ movies, onPlay, onShowDetails }: HeroBannerProps) => {
  const isMobile = useIsMobile();

  const heroMovies = useMemo(() => {
    const withTrailer = movies.filter(m => m.image && m.description && m.trailer);
    const withoutTrailer = movies.filter(m => m.image && m.description && !m.trailer);
    return [...withTrailer.slice(0, 8), ...withoutTrailer.slice(0, 2)].slice(0, 10);
  }, [movies]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [phase, setPhase] = useState<'cover' | 'trailer'>('cover');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canPlayTrailer, setCanPlayTrailer] = useState(true);
  const prevMoviesRef = useRef<Movie[]>(movies);
  const touchStartX = useRef(0);

  // Reset when movies list changes (view switch)
  useEffect(() => {
    if (prevMoviesRef.current !== movies) {
      prevMoviesRef.current = movies;
      setCurrentIndex(0);
      setImgLoaded(false);
      setPhase('cover');
      setIsTransitioning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [movies]);

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
      setCanPlayTrailer(false);
    }
  }, []);

  const movie = heroMovies[currentIndex];
  // On mobile, only allow direct video trailers (not YouTube iframes which don't autoplay)
  const hasTrailer = canPlayTrailer && !!movie?.trailer && (!isMobile || isDirectVideo(movie.trailer!));
  const youtubeUrl = hasTrailer && !isMobile ? getYouTubeEmbedUrl(movie.trailer!) : null;
  const directSrc = hasTrailer && isDirectVideo(movie.trailer!) ? movie.trailer! : '';

  const goToPrev = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + Math.max(heroMovies.length, 1)) % Math.max(heroMovies.length, 1));
      setImgLoaded(false);
      setPhase('cover');
      setTimeout(() => setIsTransitioning(false), 50);
    }, 400);
  }, [heroMovies.length]);

  const advanceToNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % Math.max(heroMovies.length, 1));
      setImgLoaded(false);
      setPhase('cover');
      setTimeout(() => setIsTransitioning(false), 50);
    }, 600);
  }, [heroMovies.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) advanceToNext();
      else goToPrev();
    }
  }, [advanceToNext, goToPrev]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (heroMovies.length === 0 || !movie || isTransitioning) return;

    if (phase === 'cover') {
      const duration = hasTrailer ? COVER_DURATION : (isMobile ? COVER_DURATION_MOBILE : 5000);
      timerRef.current = setTimeout(() => {
        if (hasTrailer) {
          setPhase('trailer');
        } else {
          advanceToNext();
        }
      }, duration);
    } else if (phase === 'trailer') {
      if (directSrc && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      timerRef.current = setTimeout(() => {
        advanceToNext();
      }, TRAILER_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, currentIndex, hasTrailer, directSrc, advanceToNext, heroMovies.length, movie, isTransitioning, isMobile]);

  if (!movie) return null;

  const showTrailer = phase === 'trailer' && hasTrailer && !isTransitioning;

  return (
    <div className="relative w-full h-[32vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh] overflow-hidden">
      {/* Background layer with crossfade */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        {/* Skeleton */}
        {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

        {/* Cover image — fills entire banner */}
        <img
          src={movie.backdrop || movie.image}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            imgLoaded ? (showTrailer ? 'opacity-0' : 'opacity-100') : 'opacity-0'
          }`}
          onLoad={() => setImgLoaded(true)}
          fetchPriority="high"
        />

        {/* Direct video trailer — covers entire banner */}
        {directSrc && (
          <video
            ref={videoRef}
            src={directSrc}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showTrailer ? 'opacity-100' : 'opacity-0'}`}
            muted
            playsInline
            preload="none"
          />
        )}

        {/* YouTube trailer — scaled massively to fill entire banner without black bars */}
        {youtubeUrl && !directSrc && showTrailer && (
          <div className="absolute inset-0 z-[2] overflow-hidden">
            <iframe
              src={youtubeUrl}
              className="absolute top-1/2 left-1/2 border-0"
              style={{
                width: '177.78vh', /* 16:9 ratio based on viewport height */
                height: '56.25vw', /* 16:9 ratio based on viewport width */
                minWidth: '100%',
                minHeight: '100%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
              allow="autoplay; encrypted-media"
              tabIndex={-1}
            />
          </div>
        )}
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 z-[3]" style={{ background: 'var(--hero-gradient)' }} />
      <div className="absolute inset-0 z-[3] bg-gradient-to-r from-background/80 via-background/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 z-10 flex flex-col justify-end h-full px-3 sm:px-4 md:px-12 max-w-2xl pb-8 sm:pb-12 md:pb-16">
        <div
          className="transition-all duration-500"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(16px)' : 'translateY(0)',
          }}
        >
          <h1 className="text-lg sm:text-3xl md:text-5xl lg:text-6xl font-display tracking-wider mb-1 sm:mb-2 drop-shadow-lg line-clamp-1 sm:line-clamp-none">
            {movie.title}
          </h1>
          <p className="text-[9px] sm:text-xs md:text-sm text-secondary-foreground mb-0.5 sm:mb-1 drop-shadow">
            {movie.year} · {movie.genre.slice(0, 2).join(', ')} {movie.rating ? `· ★ ${movie.rating}` : ''}
          </p>
          <p className="hidden sm:block text-[10px] sm:text-xs md:text-sm text-foreground/80 mb-3 sm:mb-5 drop-shadow max-w-lg line-clamp-2 sm:line-clamp-3">
            {movie.description}
          </p>
          <div className="flex gap-1.5 sm:gap-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-5 py-1 sm:py-2 rounded-md bg-foreground text-background font-semibold hover:opacity-80 transition text-[9px] sm:text-xs md:text-sm"
              data-nav="hero"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" /> Assistir
            </button>
            <button
              onClick={() => onShowDetails?.(movie)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-5 py-1 sm:py-2 rounded-md bg-muted/60 text-foreground font-semibold hover:bg-muted transition text-[9px] sm:text-xs md:text-sm backdrop-blur-sm"
              data-nav="hero"
            >
              <Info className="w-3 h-3 sm:w-4 sm:h-4" /> Info
            </button>
          </div>
        </div>
      </div>

      {/* Dots */}
      {heroMovies.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-5 right-4 sm:right-8 z-10 flex gap-1.5">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setImgLoaded(false);
                  setPhase('cover');
                  setTimeout(() => setIsTransitioning(false), 50);
                }, 400);
              }}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-foreground scale-125' : 'bg-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
