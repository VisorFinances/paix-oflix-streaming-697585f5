import { useRef } from 'react';
import { StreamingItem } from '@/hooks/useStreamingTop5';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Top10RowProps {
  title: string;
  items: StreamingItem[];
  onPlay: (item: StreamingItem) => void;
  onShowDetails?: (item: StreamingItem) => void;
}

const Top10Row = ({ title, items, onPlay, onShowDetails }: Top10RowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  const CARD_W = isMobile ? 110 : 220;
  const NUM_W = isMobile ? 36 : 72;
  const FONT_SIZE = isMobile ? '3.5rem' : '7rem';
  const STROKE = isMobile ? '1.5px' : '3px';

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
          style={{ gap: isMobile ? '4px' : '8px' }}
        >
          {items.slice(0, 10).map((item, index) => (
            <div
              key={`${item.tmdbTitle}-${index}`}
              className="relative flex-shrink-0 flex items-end cursor-pointer"
              style={{ width: CARD_W + NUM_W, minWidth: CARD_W + NUM_W }}
              onClick={() => item.localMovie ? onShowDetails?.(item) : undefined}
              data-nav="card"
            >
              {/* Big rank number */}
              <div
                className="absolute bottom-0 left-0 z-0 flex items-end justify-center select-none pointer-events-none"
                style={{ width: NUM_W, height: '100%' }}
              >
                <span
                  className="font-black leading-none"
                  style={{
                    fontSize: index === 9 ? (isMobile ? '3.5rem' : '5.5rem') : FONT_SIZE,
                    color: 'transparent',
                    WebkitTextStroke: `${STROKE} hsl(var(--foreground) / 0.7)`,
                    textShadow: '0 2px 20px hsl(var(--background) / 0.8)',
                    lineHeight: 0.85,
                  }}
                >
                  {index + 1}
                </span>
              </div>

              {/* Card */}
              <div className="relative z-10 overflow-hidden rounded-md" style={{ marginLeft: NUM_W, width: CARD_W }}>
                <div className="relative aspect-[2/3]">
                  <img
                    src={item.localMovie?.image || item.posterUrl}
                    alt={item.tmdbTitle}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                  {/* Em Breve badge */}
                  {item.badge === 'em_breve' && (
                    <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-20 flex items-center gap-1 bg-muted/90 backdrop-blur-sm text-foreground text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                      <Clock className="w-2.5 h-2.5" />
                      Em Breve
                    </div>
                  )}
                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 z-[4]">
                    <h3 className="text-[9px] sm:text-xs font-semibold text-foreground leading-tight line-clamp-2">
                      {item.tmdbTitle}
                    </h3>
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

export default Top10Row;
