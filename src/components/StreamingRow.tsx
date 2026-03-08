import { useRef, useState, useCallback, useEffect } from 'react';
import { StreamingItem } from '@/hooks/useStreamingTop5';
import { ChevronLeft, ChevronRight, Play, Info, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StreamingRowProps {
  title: string;
  items: StreamingItem[];
  onPlay: (item: StreamingItem) => void;
  onShowDetails?: (item: StreamingItem) => void;
}

/* YouTube embed URL helper */
function getYTEmbed(url: string): string | null {
  if (!url) return null;
  let vid = '';
  try {
    if (url.includes('youtu.be/')) vid = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    else if (url.includes('youtube.com/watch')) vid = new URL(url).searchParams.get('v') || '';
    else if (url.includes('youtube.com/embed/')) vid = url.split('embed/')[1]?.split(/[?&#]/)[0] || '';
  } catch { return null; }
  if (!vid) return null;
  return `https://www.youtube.com/embed/${vid}?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=30&enablejsapi=1`;
}

// Singleton for streaming cards trailer
let activeStreamingCardId: string | null = null;
let activeStreamingCleanup: (() => void) | null = null;

const HOVER_DELAY = 500;

const StreamingCardItem = ({ item, idx, onPlay, onShowDetails }: {
  item: StreamingItem; idx: number;
  onPlay: (item: StreamingItem) => void;
  onShowDetails?: (item: StreamingItem) => void;
}) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [mobileTapState, setMobileTapState] = useState<'idle' | 'trailer'>('idle');
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();
  const cardId = `streaming-${item.tmdbTitle}-${idx}`;
  const trailer = item.trailer || item.localMovie?.trailer || '';
  const hasTrailer = !!trailer;

  const startPreview = useCallback(() => {
    if (isMobile || !hasTrailer) return;
    hoverTimer.current = setTimeout(() => {
      if (activeStreamingCardId && activeStreamingCardId !== cardId && activeStreamingCleanup) {
        activeStreamingCleanup();
      }
      activeStreamingCardId = cardId;
      activeStreamingCleanup = () => setShowTrailer(false);
      setShowTrailer(true);
    }, HOVER_DELAY);
  }, [isMobile, hasTrailer, cardId]);

  const stopPreview = useCallback(() => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setShowTrailer(false);
    if (activeStreamingCardId === cardId) { activeStreamingCardId = null; activeStreamingCleanup = null; }
  }, [cardId]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (activeStreamingCardId === cardId) { activeStreamingCardId = null; activeStreamingCleanup = null; }
    };
  }, [cardId]);

  const handleClick = useCallback(() => {
    if (isMobile && hasTrailer && mobileTapState === 'idle') {
      if (activeStreamingCardId && activeStreamingCardId !== cardId && activeStreamingCleanup) activeStreamingCleanup();
      activeStreamingCardId = cardId;
      activeStreamingCleanup = () => { setShowTrailer(false); setMobileTapState('idle'); };
      setShowTrailer(true);
      setMobileTapState('trailer');
      return;
    }
    setShowTrailer(false);
    setMobileTapState('idle');
    if (activeStreamingCardId === cardId) { activeStreamingCardId = null; activeStreamingCleanup = null; }
    if (item.localMovie) {
      onShowDetails?.(item);
    }
  }, [isMobile, hasTrailer, mobileTapState, cardId, item, onShowDetails]);

  const ytUrl = showTrailer ? getYTEmbed(trailer) : null;

  return (
    <div
      className="movie-card group flex-shrink-0 w-[110px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
      data-nav="card"
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/40">
        <img
          src={item.localMovie?.image || item.posterUrl}
          alt={item.tmdbTitle}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showTrailer ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          draggable={false}
        />

        {/* YouTube trailer */}
        {ytUrl && (
          <iframe
            src={ytUrl}
            className="absolute inset-0 w-full h-full z-[3]"
            allow="autoplay; encrypted-media"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
        )}

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
        {!showTrailer && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Mobile trailer hint */}
        {isMobile && showTrailer && (
          <div className="absolute bottom-0 left-0 right-0 z-[6] p-1.5 bg-background/80 backdrop-blur-sm">
            <p className="text-[9px] font-semibold text-center text-foreground">
              ▶ Toque para ver detalhes
            </p>
          </div>
        )}

        {/* Overlay info */}
        {!showTrailer && (
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
        )}
      </div>
    </div>
  );
};

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
            <StreamingCardItem
              key={`${item.tmdbTitle}-${idx}`}
              item={item}
              idx={idx}
              onPlay={onPlay}
              onShowDetails={onShowDetails}
            />
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
