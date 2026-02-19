import { useRef } from 'react';
import { Movie } from '@/types';
import PreviewCard from './PreviewCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Top10RowProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  favorites: string[];
  onShowDetails?: (movie: Movie) => void;
}

const Top10Row = ({ title, movies, onPlay, onToggleFavorite, favorites, onShowDetails }: Top10RowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8 animate-fade-in">
      <div className="px-3 sm:px-4 md:px-12 mb-2 sm:mb-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display tracking-wider text-foreground">{title}</h2>
      </div>
      <div className="relative group/row">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-20 w-8 sm:w-10 bg-gradient-to-r from-background/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide gap-0 px-3 sm:px-4 md:px-12 pb-2">
          {movies.slice(0, 10).map((movie, index) => (
            <div key={movie.id} className="relative flex-shrink-0 flex items-end" style={{ marginRight: index < 9 ? '-2rem' : '0' }}>
              {/* Big rank number behind the card */}
              <span
                className="absolute left-0 bottom-0 z-0 font-black leading-none select-none pointer-events-none"
                style={{
                  fontSize: 'clamp(5rem, 12vw, 9rem)',
                  color: 'transparent',
                  WebkitTextStroke: '2px hsl(var(--foreground) / 0.6)',
                  letterSpacing: '-0.05em',
                  lineHeight: 1,
                  transform: 'translateX(-35%)',
                  textShadow: '0 0 20px hsl(var(--background))',
                }}
              >
                {index + 1}
              </span>
              {/* Card pushed right to let number peek out */}
              <div className="relative z-10 ml-10 sm:ml-12">
                <PreviewCard
                  movie={movie}
                  onPlay={onPlay}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={favorites.includes(movie.id)}
                  onShowDetails={onShowDetails}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 w-8 sm:w-10 bg-gradient-to-l from-background/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </section>
  );
};

export default Top10Row;
