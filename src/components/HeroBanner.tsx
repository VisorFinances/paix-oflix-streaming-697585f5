import { Movie } from '@/types';
import { Play, Info } from 'lucide-react';

interface HeroBannerProps {
  movie: Movie | null;
  onPlay: (movie: Movie) => void;
}

const HeroBanner = ({ movie, onPlay }: HeroBannerProps) => {
  if (!movie) return null;

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      <img
        src={movie.backdrop || movie.image}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      
      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-12 pb-20 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-display tracking-wider mb-3 animate-slide-up">
          {movie.title}
        </h1>
        <p className="text-sm md:text-base text-secondary-foreground mb-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {movie.year} · {movie.genre.join(', ')} · {movie.rating}
        </p>
        <p className="text-sm md:text-base text-muted-foreground mb-6 line-clamp-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {movie.description}
        </p>
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => onPlay(movie)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-foreground text-background font-semibold hover:opacity-80 transition text-sm"
          >
            <Play className="w-5 h-5" /> Assistir
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-muted/60 text-foreground font-semibold hover:bg-muted transition text-sm">
            <Info className="w-5 h-5" /> Mais Informações
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
