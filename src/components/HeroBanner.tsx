import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Movie } from '@/types';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=30&enablejsapi=1`;
}

function isDirectVideo(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|m3u8|mpd|webm)(\?|$)/i.test(url) || (url.includes('archive.org') && !url.includes('youtube'));
}

const COVER_DURATION = 3000;
const TRAILER_DURATION = 7000;
const FADE_DURATION = 800;
const STATIC_DURATION = 5000;

const HeroBanner = ({ movies, onPlay, onShowDetails }: HeroBannerProps) => {
  const heroMovies = useMemo(() => {
    const withTrailer = movies.filter(m => m.image && m.description && m.trailer);
    const withoutTrailer = movies.filter(m => m.image && m.description && !m.trailer);
    return [...withTrailer.slice(0, 8), ...withoutTrailer.slice(0, 2)].slice(0, 10);
  }, [movies]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [phase, setPhase] = useState<'cover' | 'trailer' | 'fade'>('cover');
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canPlayTrailer, setCanPlayTrailer] = useState(true);
  const prevMoviesRef = useRef<Movie[]>(movies);

  // Reset when movies list changes (view switch)
  useEffect(() => {
    if (prevMoviesRef.current !== movies) {
      prevMoviesRef.current = movies;
      setCurrentIndex(0);
      setImgLoaded(false);
      setPhase('cover');
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
  const hasTrailer = canPlayTrailer && !!movie?.trailer;
  const youtubeUrl = hasTrailer ? getYouTubeEmbedUrl(movie.trailer!) : null;
  const directSrc = hasTrailer && isDirectVideo(movie.trailer!) ? movie.trailer! : '';

  const advanceToNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('fade');
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % heroMovies.length);
      setImgLoaded(false);
      setPhase('cover');
    }, FADE_DURATION);
  }, [heroMovies.length]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (heroMovies.length === 0 || !movie) return;
    if (heroMovies.length === 1 && !hasTrailer) return;

    if (phase === 'cover') {
      const duration = hasTrailer ? COVER_DURATION : STATIC_DURATION;
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
  }, [phase, currentIndex, hasTrailer, directSrc, advanceToNext, heroMovies.length, movie]);

  if (!movie) return null;

  const showTrailer = phase === 'trailer' && hasTrailer;

  return (
    <div className="relative w-full h-[28vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION / 1000 }}
        >
          {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <img
            src={movie.backdrop || movie.image}
            alt={movie.title}
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${
              imgLoaded ? (showTrailer ? 'opacity-0' : 'opacity-100') : 'opacity-0'
            }`}
            onLoad={() => setImgLoaded(true)}
            fetchPriority="high"
          />

          {directSrc && (
            <video
              ref={videoRef}
              src={directSrc}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showTrailer ? 'opacity-100' : 'opacity-0'}`}
              muted
              playsInline
              preload="none"
            />
          )}

          {youtubeUrl && !directSrc && showTrailer && (
            <iframe
              src={youtubeUrl}
              className="absolute inset-0 w-full h-full z-[2]"
              allow="autoplay; encrypted-media"
              style={{ border: 'none', pointerEvents: 'none', width: '100%', height: '100%' }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients — hide during trailer so nothing covers it */}
      {!showTrailer && (
        <>
          <div className="absolute inset-0 z-[1]" style={{ background: 'var(--hero-gradient)' }} />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </>
      )}

      {/* Content — FULLY LEFT, hidden during trailer */}
      {!showTrailer && (
        <div className="absolute bottom-0 left-0 z-10 flex flex-col justify-end h-full px-3 sm:px-4 md:px-12 max-w-2xl pb-8 sm:pb-12 md:pb-16">
          {/* Bottom gradient for readability */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] z-[-1]" style={{
            background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 40%, transparent 100%)',
          }} />

          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
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
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Dots */}
      {heroMovies.length > 1 && !showTrailer && (
        <div className="absolute bottom-3 sm:bottom-5 right-4 sm:right-8 z-10 flex gap-1.5">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setImgLoaded(false); setPhase('cover'); }}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-foreground scale-125' : 'bg-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Thin progress line (subtle, no color) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-[2px] bg-foreground/10">
        <motion.div
          key={`progress-${currentIndex}-${phase}`}
          className="h-full bg-foreground/30"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: phase === 'cover'
              ? (hasTrailer ? COVER_DURATION : STATIC_DURATION) / 1000
              : phase === 'trailer'
              ? TRAILER_DURATION / 1000
              : FADE_DURATION / 1000,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );
};

export default HeroBanner;
