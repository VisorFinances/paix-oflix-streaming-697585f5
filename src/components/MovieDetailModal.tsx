import { Movie } from '@/types';
import { Play, Plus, Check, X, Star, Calendar, Clock, Film } from 'lucide-react';

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
}

const MovieDetailModal = ({ movie, onClose, onPlay, onToggleFavorite, isFavorite }: MovieDetailModalProps) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-2xl animate-slide-up">
        {/* Hero image */}
        <div className="relative w-full aspect-video overflow-hidden rounded-t-xl">
          <img
            src={movie.backdrop || movie.image}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl md:text-5xl font-display tracking-wider text-foreground">
              {movie.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 px-8 py-3 rounded-md bg-foreground text-background font-semibold hover:opacity-80 transition text-sm"
            >
              <Play className="w-5 h-5" /> Assistir Agora
            </button>
            <button
              onClick={() => onToggleFavorite(movie.id)}
              className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-muted-foreground/50 hover:border-foreground transition"
              title={isFavorite ? 'Remover da lista' : 'Adicionar à lista'}
            >
              {isFavorite ? <Check className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              {movie.year}
            </span>
            {movie.rating && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-primary" />
                {movie.rating}
              </span>
            )}
            {movie.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                {movie.duration}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-primary" />
              {movie.type === 'series' ? 'Série' : movie.type === 'novela' ? 'Novela' : 'Filme'}
            </span>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {movie.genre.map((g) => (
              <span
                key={g}
                className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          {movie.description && (
            <div>
              <h3 className="text-lg font-display tracking-wider text-foreground mb-2">Sinopse</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {movie.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;
