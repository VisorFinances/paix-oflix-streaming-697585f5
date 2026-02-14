import VideoPlayer from './VideoPlayer';
import { X } from 'lucide-react';
import { Movie } from '@/types';

interface PlayerOverlayProps {
  movie: Movie;
  onClose: () => void;
  onTimeUpdate: (movieId: string, progress: number) => void;
}

const PlayerOverlay = ({ movie, onClose, onTimeUpdate }: PlayerOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur">
        <h3 className="text-sm font-semibold truncate">{movie.title}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1">
        <VideoPlayer
          url={movie.streamUrl || ''}
          onTimeUpdate={(current, duration) => {
            if (duration > 0) {
              onTimeUpdate(movie.id, Math.round((current / duration) * 100));
            }
          }}
        />
      </div>
    </div>
  );
};

export default PlayerOverlay;
