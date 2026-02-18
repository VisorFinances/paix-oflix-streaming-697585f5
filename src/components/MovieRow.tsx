import { useRef } from 'react';
import { Movie } from '@/types';
import PreviewCard from './PreviewCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  favorites: string[];
  continueWatching?: Record<string, number>;
  onShowDetails?: (movie: Movie) => void;
}

const MovieRow = ({ title, subtitle, movies, onPlay, onToggleFavorite, favorites, continueWatching, onShowDetails }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8 animate-fade-in">
      <div className="px-3 sm:px-4 md:px-12 mb-2 sm:mb-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display tracking-wider text-foreground">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="relative group/row">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-20 w-8 sm:w-10 bg-gradient-to-r from-background/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center hidden sm:flex"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div ref={scrollRef} className="category-row px-3 sm:px-4 md:px-12 gap-2 sm:gap-3">
          {movies.map(movie => (
            <PreviewCard
              key={movie.id}
              movie={movie}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.includes(movie.id)}
              progress={continueWatching?.[movie.id]}
              onShowDetails={onShowDetails}
            />
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 w-8 sm:w-10 bg-gradient-to-l from-background/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center hidden sm:flex"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </section>
  );
};

export default MovieRow;
