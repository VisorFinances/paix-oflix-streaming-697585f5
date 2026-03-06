import { Movie } from '@/types';
import PreviewCard from './PreviewCard';
import { ArrowLeft } from 'lucide-react';

interface CategoryGridProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  favorites: string[];
  onBack: () => void;
  onShowDetails?: (movie: Movie) => void;
  isKids?: boolean;
}

const CategoryGrid = ({ title, movies, onPlay, onToggleFavorite, favorites, onBack, onShowDetails, isKids }: CategoryGridProps) => {
  return (
    <div className="min-h-screen px-4 md:px-12 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition" data-nav="back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl md:text-4xl font-display tracking-wider">{title}</h1>
      </div>
      <div className="media-grid">
        {movies.map(movie => (
          <PreviewCard
            key={movie.id}
            movie={movie}
            onPlay={onPlay}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(movie.id)}
            onShowDetails={onShowDetails}
          />
        ))}
      </div>
      {movies.length === 0 && (
        <p className="text-center text-muted-foreground mt-20">Nenhum conteúdo encontrado.</p>
      )}
    </div>
  );
};

export default CategoryGrid;
