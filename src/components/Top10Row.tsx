import { useRef } from 'react';
import { Movie } from '@/types';
import PreviewCard from './PreviewCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  // How much of the number peeks between cards
  // Mobile: smaller peek, Desktop: bigger peek
  const PEEK = isMobile ? 40 : 64;
  const FONT_SIZE = isMobile ? 'clamp(3.5rem, 14vw, 5rem)' : 'clamp(5rem, 8vw, 8rem)';
  const STROKE = isMobile ? '1.5px' : '2.5px';

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

        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-4"
          style={{ gap: 0 }}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div
              key={movie.id}
              className="relative flex-shrink-0 flex items-end"
              style={{
                // First item: no extra left space needed (number floats left of card)
                // Subsequent items: reserve PEEK px on the left so the number from
                // the previous slot doesn't overlap the card
                paddingLeft: index === 0 ? `${PEEK}px` : `${PEEK}px`,
              }}
            >
              {/* Big rank number — anchored to left edge, partially behind next card */}
              <span
                className="absolute bottom-0 z-0 font-black leading-none select-none pointer-events-none"
                style={{
                  // Position the number so its RIGHT edge aligns with the card's left edge
                  // giving the "peek" effect: number is mostly behind the card
                  right: '100%',
                  // Shift it back a little so it partially overlaps with the card
                  marginRight: `-${PEEK}px`,
                  fontSize: FONT_SIZE,
                  color: 'transparent',
                  WebkitTextStroke: `${STROKE} hsl(var(--foreground) / 0.6)`,
                  lineHeight: 1,
                  textShadow: `0 2px 20px hsl(var(--background) / 0.8)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {index + 1}
              </span>

              {/* Card — sits above the number */}
              <div className="relative z-10">
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
