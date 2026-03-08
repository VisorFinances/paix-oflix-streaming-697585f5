import { Movie } from '@/types';
import PreviewCard from './PreviewCard';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
  progress?: number;
  onShowDetails?: (movie: Movie) => void;
}

const MovieCard = ({ movie, onPlay, onToggleFavorite, isFavorite, progress, onShowDetails }: MovieCardProps) => {
  return (
    <PreviewCard
      movie={movie}
      onPlay={onPlay}
      onToggleFavorite={onToggleFavorite}
      isFavorite={isFavorite}
      progress={progress}
      onShowDetails={onShowDetails}
    />
  );
};

export default MovieCard;
