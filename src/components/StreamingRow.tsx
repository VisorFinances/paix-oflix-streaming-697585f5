import { useRef } from 'react';
import { StreamingItem } from '@/hooks/useStreamingTop5';
import { ChevronLeft, ChevronRight, Play, Info, Clock } from 'lucide-react';

interface StreamingRowProps {
  title: string;
  items: StreamingItem[];
  onPlay: (item: StreamingItem) => void;
  onShowDetails?: (item: StreamingItem) => void;
}

const StreamingRow = ({ title, items, onPlay, onShowDetails }: StreamingRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

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
        <div ref={scrollRef} className="category-row px-3 sm:px-4 md:px-12 gap-2 sm:gap-3">
          {items.slice(0, 5).map((item, idx) => (
            <div
              key={`${item.tmdbTitle}-${idx}`}
              className="movie-card group flex-shrink-0 w-[110px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
              data-nav="card"
            >
              <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/40">
                <img
                  src={item.localMovie?.image || item.posterUrl}
                  alt={item.tmdbTitle}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                  onClick={() => onShowDetails?.(item)}
                />

                {/* Badge */}
                {item.badge === 'em_breve' && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-muted/90 backdrop-blur-sm text-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm">
                    <Clock className="w-3 h-3" />
                    Em Breve
                  </div>
                )}
                {item.badge === 'novidade' && (
                  <div className="absolute top-2 left-2 z-20 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm">
                    Novidade
                  </div>
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Synopsis on card */}
                {item.overview && (
                  <p className="absolute bottom-12 left-2 right-2 text-[9px] sm:text-[10px] text-foreground/80 line-clamp-2 pointer-events-none">
                    {item.overview.slice(0, 50)}...
                  </p>
                )}

                {/* Overlay info */}
                <div className="movie-card-info">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.tmdbTitle}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {item.year} · {item.rating ? `★ ${item.rating}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 mb-[5px]">
                    {item.localMovie && item.badge !== 'em_breve' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPlay(item); }}
                        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-foreground text-background hover:opacity-80 transition"
                        data-nav="card-action"
                      >
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                      </button>
                    )}
                    {onShowDetails && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onShowDetails(item); }}
                        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-muted-foreground/50 hover:border-foreground transition"
                        data-nav="card-action"
                      >
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
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

export default StreamingRow;
