import { useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { X } from 'lucide-react';
import { Movie } from '@/types';

interface PlayerOverlayProps {
  movie: Movie;
  onClose: () => void;
  onTimeUpdate: (movieId: string, progress: number) => void;
}

const PlayerOverlay = ({ movie, onClose, onTimeUpdate }: PlayerOverlayProps) => {
  // Lock to landscape on mobile
  useEffect(() => {
    if (screen.orientation && 'lock' in screen.orientation) {
      (screen.orientation as any).lock?.('landscape').catch(() => {});
    }
    return () => {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock?.();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur absolute top-0 left-0 right-0 z-10">
        <h3 className="text-sm font-semibold truncate text-foreground">{movie.title}</h3>
        <button onClick={onClose} className="text-foreground/70 hover:text-foreground transition p-1">
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
