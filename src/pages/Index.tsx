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
import MovieDetailModal from '@/components/MovieDetailModal';

const Index = () => {
  const { movies } = useMovies();
  const { channels } = useChannels();
  const [activeView, setActiveView] = useState('home');
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
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
      source: 'cinema',
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
    const used = new Set<string>();
    const pick = (list: Movie[], count: number) => {
      const result: Movie[] = [];
      for (const m of list) {
        if (!used.has(m.id) && result.length < count) {
          result.push(m);
          used.add(m.id);
        }
      }
      return result;
    };

    // Não deixe de ver: 3 filmes + 2 séries de Lançamento 2026
    const launch2026 = movies.filter(m => m.year === 2026 || m.genre.some(g => g.toLowerCase().includes('lançamento') && m.year >= 2026));
    const naoPerder = [
      ...pick(launch2026.filter(m => m.type === 'movie'), 3),
      ...pick(launch2026.filter(m => m.type === 'series'), 2),
    ];

    // Sábado a noite merece: 2 romance, 1 comédia, 1 nacional, 1 religioso
    const sabado = [
      ...pick(movies.filter(m => m.genre.some(g => /romance/i.test(g))), 2),
      ...pick(movies.filter(m => m.genre.some(g => /com[eé]dia/i.test(g))), 1),
      ...pick(movies.filter(m => m.genre.some(g => /nacional/i.test(g) || /drama/i.test(g))), 1),
      ...pick(movies.filter(m => m.genre.some(g => /religi/i.test(g))), 1),
    ];

    // As crianças amam: 3 filmes kids + 2 séries kids
    const criancas = [
      ...pick(movies.filter(m => m.source === 'filmeskids'), 3),
      ...pick(movies.filter(m => m.source === 'serieskids'), 2),
    ];

    // Romances para inspirações: 4 filmes + 1 série romance
    const romanceMovies = movies.filter(m => m.genre.some(g => /romance/i.test(g)) && m.type === 'movie');
    const romanceSeries = movies.filter(m => m.genre.some(g => /romance|drama/i.test(g)) && m.type === 'series');
    const romance = [
      ...pick(romanceMovies, 4),
      ...pick(romanceSeries, 1),
    ];

    // Nostalgias: 4 filmes + 1 série clássicos
    const classicMovies = movies.filter(m => m.genre.some(g => /cl[aá]ssic/i.test(g)) || m.year < 2000);
    const classicSeries = movies.filter(m => (m.genre.some(g => /cl[aá]ssic/i.test(g)) || m.year < 2000) && m.type === 'series');
    const nostalgia = [
      ...pick(classicMovies.filter(m => m.type === 'movie'), 4),
      ...pick(classicSeries, 1),
    ];

    // Melhores Lançamentos 2025: 4 filmes + 1 série
    const launch2025 = movies.filter(m => m.year === 2025 || m.genre.some(g => g.toLowerCase().includes('lançamento 2025')));
    const best2025 = [
      ...pick(launch2025.filter(m => m.type === 'movie'), 4),
      ...pick(launch2025.filter(m => m.type === 'series'), 1),
    ];

    // Prepare a pipoca: 5 séries sem repetir
    const pipoca = pick(movies.filter(m => m.type === 'series'), 5);

    // Novelas: só aparece se houver gênero novela
    const novelas = movies.filter(m => m.type === 'novela' || m.genre.some(g => /novela/i.test(g)));

    return { naoPerder, sabado, criancas, romance, nostalgia, best2025, pipoca, novelas };
  }, [movies]);

  // Category view data
  const categoryViewData = useMemo((): { title: string; movies: Movie[] } | null => {
    switch (activeView) {
      case 'cinema': return { title: 'Cinema', movies: movies.filter(m => m.source === 'cinema') };
      case 'series': return { title: 'Séries', movies: movies.filter(m => m.source === 'series') };
      case 'kids': return { title: 'Kids', movies: movies.filter(m => m.kids) };
      case 'kids-movies': return { title: 'Filmes Kids', movies: movies.filter(m => m.source === 'filmeskids') };
      case 'kids-series': return { title: 'Séries Kids', movies: movies.filter(m => m.source === 'serieskids') };
      case 'mylist': return { title: 'Minha Lista', movies: movies.filter(m => m.source === 'favoritos') };
      default: return null;
    }
  }, [activeView, movies]);

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

        {/* Detail Modal */}
        {detailMovie && (
          <MovieDetailModal
            movie={detailMovie}
            onClose={() => setDetailMovie(null)}
            onPlay={(m) => { setDetailMovie(null); handlePlay(m); }}
            onToggleFavorite={toggleFavorite}
            isFavorite={favorites.includes(detailMovie.id)}
          />
        )}

        {/* Home View */}
        {activeView === 'home' && (
          <>
            <HeroBanner movie={heroMovie} onPlay={handlePlay} onShowDetails={setDetailMovie} />
            
            <div className="-mt-20 relative z-10">
              {continueWatchingMovies.length > 0 && (
                <MovieRow
                  title="Continue Assistindo"
                  movies={continueWatchingMovies}
                  onPlay={handlePlay}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                  continueWatching={continueWatching}
                  onShowDetails={setDetailMovie}
                />
              )}

              {favoriteMovies.length > 0 && (
                <MovieRow
                  title="Minha Lista"
                  movies={favoriteMovies}
                  onPlay={handlePlay}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                  onShowDetails={setDetailMovie}
                />
              )}

              <MenuCards onNavigate={setActiveView} />

              <MovieRow title="Não deixe de ver" movies={categories.naoPerder} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Sábado a noite merece" subtitle="Ação e adrenalina" movies={categories.sabado} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="As crianças amam" movies={categories.criancas} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Romances para inspirações" subtitle="Histórias que aceleram o coração..." movies={categories.romance} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Nostalgias" movies={categories.nostalgia} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Melhores Lançamentos 2025" movies={categories.best2025} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Prepare a pipoca" subtitle="Séries imperdíveis" movies={categories.pipoca} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              {categories.novelas.length > 0 && (
                <MovieRow title="Novelas" movies={categories.novelas} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              )}
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
            onShowDetails={setDetailMovie}
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
            onShowDetails={setDetailMovie}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
