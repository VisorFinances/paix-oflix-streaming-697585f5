import { useState, useMemo } from 'react';
import { Movie, Channel } from '@/types';
import MovieCard from './MovieCard';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';

interface SearchViewProps {
  movies: Movie[];
  channels: Channel[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  favorites: string[];
  onBack: () => void;
  onPlayChannel: (channel: Channel) => void;
  onShowDetails?: (movie: Movie) => void;
}

const SearchView = ({ movies, channels, onPlay, onToggleFavorite, favorites, onBack, onPlayChannel, onShowDetails }: SearchViewProps) => {
  const [query, setQuery] = useState('');

  const filteredMovies = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return movies.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.genre.some(g => g.toLowerCase().includes(q))
    );
  }, [query, movies]);

  const filteredChannels = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return channels.filter(c => c.name.toLowerCase().includes(q));
  }, [query, channels]);

  return (
    <div className="min-h-screen px-4 md:px-12 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar filmes, séries, canais..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {filteredMovies.length > 0 && (
        <>
          <h3 className="text-xl font-display tracking-wider mb-4">Filmes & Séries</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {filteredMovies.map(m => (
              <MovieCard
                key={m.id}
                movie={m}
                onPlay={onPlay}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.includes(m.id)}
                onShowDetails={onShowDetails}
              />
            ))}
          </div>
        </>
      )}

      {filteredChannels.length > 0 && (
        <>
          <h3 className="text-xl font-display tracking-wider mb-4">Canais</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredChannels.map(ch => (
              <button
                key={ch.id}
                onClick={() => onPlayChannel(ch)}
                className="flex items-center gap-3 bg-card rounded-lg p-4 hover:bg-accent transition"
              >
                <img src={ch.logo} alt={ch.name} className="w-10 h-10 object-contain bg-foreground/10 rounded p-1" />
                <span className="font-medium text-sm">{ch.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {query && filteredMovies.length === 0 && filteredChannels.length === 0 && (
        <p className="text-center text-muted-foreground mt-20">Nenhum resultado para "{query}"</p>
      )}

      {!query && (
        <p className="text-center text-muted-foreground mt-20">Digite para buscar conteúdo</p>
      )}
    </div>
  );
};

export default SearchView;
