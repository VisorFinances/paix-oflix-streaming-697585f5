import { Movie } from '@/types';
import MovieCard from './MovieCard';
import { ArrowLeft } from 'lucide-react';

interface CategoryGridProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  favorites: string[];
  onBack: () => void;
  onShowDetails?: (movie: Movie) => void;
}

const CategoryGrid = ({ title, movies, onPlay, onToggleFavorite, favorites, onBack, onShowDetails }: CategoryGridProps) => {
  return (
    <div className="min-h-screen px-4 md:px-12 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl md:text-4xl font-display tracking-wider">{title}</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map(movie => (
          <MovieCard
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
