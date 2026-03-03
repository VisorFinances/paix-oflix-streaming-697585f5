import { useState, useEffect, useMemo } from 'react';
import { Movie } from '@/types';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroBannerProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onShowDetails?: (movie: Movie) => void;
}

const HeroBanner = ({ movies, onPlay, onShowDetails }: HeroBannerProps) => {
  const heroMovies = useMemo(() =>
    movies.filter(m => m.image && m.description).slice(0, 8),
    [movies]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % heroMovies.length);
      setImgLoaded(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [heroMovies.length]);

  const movie = heroMovies[currentIndex];
  if (!movie) return null;

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <img
            src={movie.backdrop || movie.image}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            fetchPriority="high"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-12 pb-16 sm:pb-20 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display tracking-wider mb-2 sm:mb-3 drop-shadow-lg">
              {movie.title}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-secondary-foreground mb-1 drop-shadow">
              {movie.year} · {movie.genre.join(', ')} {movie.rating ? `· ★ ${movie.rating}` : ''}
            </p>
            <p className="text-xs sm:text-sm md:text-base text-foreground/80 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 drop-shadow max-w-lg">
              {movie.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onPlay(movie)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-md bg-foreground text-background font-semibold hover:opacity-80 transition text-xs sm:text-sm"
                data-nav="hero"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" /> Assistir
              </button>
              <button
                onClick={() => onShowDetails?.(movie)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-md bg-muted/60 text-foreground font-semibold hover:bg-muted transition text-xs sm:text-sm"
                data-nav="hero"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" /> Mais Informações
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      {heroMovies.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 z-10 flex gap-1.5">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setImgLoaded(false); }}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-foreground scale-125' : 'bg-foreground/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
