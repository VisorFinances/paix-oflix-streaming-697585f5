import { useState, useMemo } from 'react';
import { Movie, Channel } from '@/types';
import { useMovies } from '@/hooks/useMovies';
import { useChannels } from '@/hooks/useChannels';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppSidebar from '@/components/AppSidebar';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import MenuCards from '@/components/MenuCards';
import CategoryGrid from '@/components/CategoryGrid';
import LiveTV from '@/components/LiveTV';
import SearchView from '@/components/SearchView';
import PlayerOverlay from '@/components/PlayerOverlay';

const Index = () => {
  const { movies } = useMovies();
  const { channels } = useChannels();
  const [activeView, setActiveView] = useState('home');
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useLocalStorage<string[]>('paixaoflix-favorites', []);
  const [continueWatching, setContinueWatching] = useLocalStorage<Record<string, number>>('paixaoflix-progress', {});

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleTimeUpdate = (movieId: string, progress: number) => {
    setContinueWatching(prev => ({ ...prev, [movieId]: progress }));
  };

  const handlePlay = (movie: Movie) => {
    setPlayingMovie(movie);
  };

  const handlePlayChannel = (channel: Channel) => {
    setPlayingMovie({
      id: channel.id,
      title: channel.name,
      description: '',
      image: channel.logo,
      year: 2025,
      genre: ['TV ao Vivo'],
      type: 'movie',
      streamUrl: channel.url,
    });
  };

  // Derived data
  const heroMovie = movies[0] || null;

  const continueWatchingMovies = useMemo(() => {
    const ids = Object.entries(continueWatching)
      .filter(([, p]) => p > 0 && p < 95)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    return movies.filter(m => ids.includes(m.id));
  }, [movies, continueWatching]);

  const favoriteMovies = useMemo(() => movies.filter(m => favorites.includes(m.id)), [movies, favorites]);

  const categories = useMemo(() => {
    const action = movies.filter(m => m.genre.includes('Ação'));
    const animation = movies.filter(m => m.genre.includes('Animação'));
    const romance = movies.filter(m => m.genre.includes('Romance'));
    const nostalgia = movies.filter(m => m.year < 2010);
    const best2025 = movies.filter(m => m.year === 2025);
    const series = movies.filter(m => m.type === 'series');
    const novelas = movies.filter(m => m.type === 'novela');
    const mustWatch = movies.slice(0, 6);

    return { action, animation, romance, nostalgia, best2025, series, novelas, mustWatch };
  }, [movies]);

  // Category view data
  const categoryViewData = useMemo((): { title: string; movies: Movie[] } | null => {
    switch (activeView) {
      case 'cinema': return { title: 'Cinema', movies: movies.filter(m => m.type === 'movie' && !m.kids) };
      case 'series': return { title: 'Séries', movies: movies.filter(m => m.type === 'series' && !m.kids) };
      case 'kids': return { title: 'Kids', movies: movies.filter(m => m.kids) };
      case 'kids-movies': return { title: 'Filmes Kids', movies: movies.filter(m => m.type === 'movie' && m.kids) };
      case 'kids-series': return { title: 'Séries Kids', movies: movies.filter(m => m.type === 'series' && m.kids) };
      case 'mylist': return { title: 'Minha Lista', movies: favoriteMovies };
      default: return null;
    }
  }, [activeView, movies, favoriteMovies]);

  const sidebarOffset = 'ml-16';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />

      <main className={`${sidebarOffset} transition-all duration-300`}>
        {/* Player Overlay */}
        {playingMovie && (
          <PlayerOverlay
            movie={playingMovie}
            onClose={() => setPlayingMovie(null)}
            onTimeUpdate={handleTimeUpdate}
          />
        )}

        {/* Home View */}
        {activeView === 'home' && (
          <>
            <HeroBanner movie={heroMovie} onPlay={handlePlay} />
            
            <div className="-mt-20 relative z-10">
              {continueWatchingMovies.length > 0 && (
                <MovieRow
                  title="Continue Assistindo"
                  movies={continueWatchingMovies}
                  onPlay={handlePlay}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                  continueWatching={continueWatching}
                />
              )}

              {favoriteMovies.length > 0 && (
                <MovieRow
                  title="Minha Lista"
                  movies={favoriteMovies}
                  onPlay={handlePlay}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                />
              )}

              <MenuCards onNavigate={setActiveView} />

              <MovieRow title="Não deixe de ver" movies={categories.mustWatch} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="Sábado a noite merece" subtitle="Ação e adrenalina" movies={categories.action} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="As crianças amam" movies={categories.animation} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="Romances para inspirações" subtitle="Histórias que aceleram o coração..." movies={categories.romance} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="Nostalgias" movies={categories.nostalgia} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="Melhores de 2025" movies={categories.best2025} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="Prepare a pipoca" subtitle="Séries imperdíveis" movies={categories.series} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
              <MovieRow title="Novelas" movies={categories.novelas} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} />
            </div>
          </>
        )}

        {/* Live TV */}
        {activeView === 'live' && (
          <LiveTV channels={channels} onBack={() => setActiveView('home')} />
        )}

        {/* Search */}
        {activeView === 'search' && (
          <SearchView
            movies={movies}
            channels={channels}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onBack={() => setActiveView('home')}
            onPlayChannel={handlePlayChannel}
          />
        )}

        {/* Category Grid */}
        {categoryViewData && (
          <CategoryGrid
            title={categoryViewData.title}
            movies={categoryViewData.movies}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onBack={() => setActiveView('home')}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
