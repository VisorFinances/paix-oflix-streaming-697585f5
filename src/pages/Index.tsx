import { useState, useMemo } from 'react';
import { Movie, Channel } from '@/types';
import { useMovies } from '@/hooks/useMovies';
import { useChannels } from '@/hooks/useChannels';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSmartTV } from '@/hooks/useSmartTV';
import AppSidebar from '@/components/AppSidebar';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import CategoryGrid from '@/components/CategoryGrid';
import LiveTV from '@/components/LiveTV';
import SearchView from '@/components/SearchView';
import PlayerOverlay from '@/components/PlayerOverlay';
import MovieDetailModal from '@/components/MovieDetailModal';
import SeriesDetailModal from '@/components/SeriesDetailModal';

const ORDER_LIST = [
  'Lançamento 2026', 'Lançamento 2025', 'Ação', 'Aventura', 'Anime', 'Animação',
  'Comédia', 'Drama', 'Dorama', 'Clássicos', 'Crime', 'Policial', 'Família',
  'Musical', 'Documentário', 'Faroeste', 'Ficção', 'Nacional', 'Religioso',
  'Romance', 'Terror', 'Suspense', 'Adulto',
];

/** Deduplicate by normalized title (handles different seasons of same show) */
function deduplicateByTitle(movies: Movie[]): Movie[] {
  const seen = new Set<string>();
  return movies.filter(m => {
    const key = m.title.replace(/\s*[-–]\s*\d.*$/, '').replace(/\s*temporada\s*\d.*/i, '').trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const Index = () => {
  const { movies } = useMovies();
  const { channels } = useChannels();
  const [activeView, setActiveView] = useState('home');
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useLocalStorage<string[]>('paixaoflix-favorites', []);
  const [continueWatching, setContinueWatching] = useLocalStorage<Record<string, number>>('paixaoflix-progress', {});

  useSmartTV();

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleTimeUpdate = (movieId: string, progress: number) => {
    setContinueWatching(prev => ({ ...prev, [movieId]: progress }));
  };

  const handlePlay = (movie: Movie, episodeUrl?: string) => {
    if (episodeUrl) {
      setPlayingMovie({ ...movie, streamUrl: episodeUrl });
    } else {
      setPlayingMovie(movie);
    }
  };

  const handleShowDetails = (movie: Movie) => {
    setDetailMovie(movie);
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

  // Deduplicated movies for home
  const uniqueMovies = useMemo(() => deduplicateByTitle(movies), [movies]);

  // Hero
  const heroMovie = uniqueMovies[0] || null;

  const continueWatchingMovies = useMemo(() => {
    const ids = Object.entries(continueWatching)
      .filter(([, p]) => p > 0 && p < 95)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    return movies.filter(m => ids.includes(m.id));
  }, [movies, continueWatching]);

  const favoriteMovies = useMemo(() => movies.filter(m => favorites.includes(m.id)), [movies, favorites]);

  // Home categories - no repetition across rows
  const homeCategories = useMemo(() => {
    const usedTitles = new Set<string>();
    const titleKey = (m: Movie) => m.title.replace(/\s*[-–]\s*\d.*$/, '').replace(/\s*temporada\s*\d.*/i, '').trim().toLowerCase();

    const pickUnique = (list: Movie[], count: number): Movie[] => {
      const result: Movie[] = [];
      for (const m of list) {
        const key = titleKey(m);
        if (!usedTitles.has(key) && result.length < count) {
          result.push(m);
          usedTitles.add(key);
        }
      }
      return result;
    };

    const naoPerder = pickUnique(
      uniqueMovies.filter(m => m.year >= 2026 || m.genre.some(g => g.toLowerCase().includes('lançamento 2026'))),
      5
    );

    const sabado = pickUnique([
      ...uniqueMovies.filter(m => m.genre.some(g => /romance/i.test(g))),
      ...uniqueMovies.filter(m => m.genre.some(g => /com[eé]dia/i.test(g))),
      ...uniqueMovies.filter(m => m.genre.some(g => /nacional|drama/i.test(g))),
      ...uniqueMovies.filter(m => m.genre.some(g => /religi/i.test(g))),
    ], 5);

    const criancas = pickUnique(
      [...uniqueMovies.filter(m => m.source === 'filmeskids'), ...uniqueMovies.filter(m => m.source === 'serieskids')]
        .sort((a, b) => a.title.localeCompare(b.title)),
      5
    );

    const romance = pickUnique(uniqueMovies.filter(m => m.genre.some(g => /romance/i.test(g))), 5);
    const nostalgia = pickUnique(uniqueMovies.filter(m => m.year < 2010), 5);
    const best2025 = pickUnique(
      uniqueMovies.filter(m => m.year === 2025 || m.genre.some(g => g.toLowerCase().includes('lançamento 2025'))),
      5
    );
    const pipoca = pickUnique(uniqueMovies.filter(m => m.type === 'series'), 5);
    const novelas = pickUnique(uniqueMovies.filter(m => m.type === 'novela' || m.genre.some(g => /novela/i.test(g))), 5);

    return { naoPerder, sabado, criancas, romance, nostalgia, best2025, pipoca, novelas };
  }, [uniqueMovies]);

  // Genre-based categories for Cinema/Series views
  const genreCategories = useMemo(() => {
    return (source: 'cinema' | 'series') => {
      const sourceMovies = movies.filter(m => m.source === source);
      const genreMap = new Map<string, Movie[]>();

      // Collect all genres
      for (const m of sourceMovies) {
        for (const g of m.genre) {
          const normalized = g.trim();
          if (!normalized) continue;
          if (!genreMap.has(normalized)) genreMap.set(normalized, []);
          genreMap.get(normalized)!.push(m);
        }
      }

      // Add year-based launch categories
      const launch2026 = sourceMovies.filter(m => m.year >= 2026);
      if (launch2026.length > 0) genreMap.set('Lançamento 2026', launch2026);
      const launch2025 = sourceMovies.filter(m => m.year === 2025);
      if (launch2025.length > 0) genreMap.set('Lançamento 2025', launch2025);

      // Sort by ORDER_LIST
      const sorted = Array.from(genreMap.entries()).sort((a, b) => {
        const ia = ORDER_LIST.findIndex(o => o.toLowerCase() === a[0].toLowerCase());
        const ib = ORDER_LIST.findIndex(o => o.toLowerCase() === b[0].toLowerCase());
        const pa = ia >= 0 ? ia : 999;
        const pb = ib >= 0 ? ib : 999;
        return pa - pb;
      });

      return sorted;
    };
  }, [movies]);

  // Kids view: alphabetical
  const kidsMovies = useMemo(() => {
    return movies
      .filter(m => m.kids)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [movies]);

  const sidebarOffset = 'ml-16';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />

      <main className={`${sidebarOffset} transition-all duration-300`}>
        {playingMovie && (
          <PlayerOverlay
            movie={playingMovie}
            onClose={() => setPlayingMovie(null)}
            onTimeUpdate={handleTimeUpdate}
          />
        )}

        {detailMovie && detailMovie.type === 'series' && (
          <SeriesDetailModal
            movie={detailMovie}
            allMovies={movies}
            onClose={() => setDetailMovie(null)}
            onPlay={(m, episodeUrl) => { setDetailMovie(null); handlePlay(m, episodeUrl); }}
            onToggleFavorite={toggleFavorite}
            isFavorite={favorites.includes(detailMovie.id)}
          />
        )}
        {detailMovie && detailMovie.type !== 'series' && (
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
                <MovieRow title="Continue Assistindo" movies={continueWatchingMovies} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} continueWatching={continueWatching} onShowDetails={setDetailMovie} />
              )}
              {favoriteMovies.length > 0 && (
                <MovieRow title="Minha Lista" movies={favoriteMovies} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              )}

              <MovieRow title="Não deixe de ver" movies={homeCategories.naoPerder} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Sábado a noite merece" subtitle="Romance, ação, adrenalina e comédia" movies={homeCategories.sabado} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="As crianças amam" movies={homeCategories.criancas} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Romances para inspirações" subtitle="Histórias que aceleram o coração..." movies={homeCategories.romance} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Nostalgias" movies={homeCategories.nostalgia} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Melhores Lançamentos 2025" movies={homeCategories.best2025} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              <MovieRow title="Prepare a pipoca" subtitle="Séries imperdíveis" movies={homeCategories.pipoca} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              {homeCategories.novelas.length > 0 && (
                <MovieRow title="Novelas" movies={homeCategories.novelas} onPlay={handlePlay} onToggleFavorite={toggleFavorite} favorites={favorites} onShowDetails={setDetailMovie} />
              )}
            </div>
          </>
        )}

        {/* Cinema / Series - genre-based */}
        {(activeView === 'cinema' || activeView === 'series') && (
          <div className="min-h-screen py-8 animate-fade-in">
            <div className="px-4 md:px-12 mb-6 flex items-center gap-4">
              <button onClick={() => setActiveView('home')} className="text-muted-foreground hover:text-foreground transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h1 className="text-3xl md:text-4xl font-display tracking-wider">
                {activeView === 'cinema' ? 'Cinema' : 'Séries'}
              </h1>
            </div>
            {genreCategories(activeView as 'cinema' | 'series').map(([genre, genreMovies]) => (
              <MovieRow
                key={genre}
                title={genre}
                movies={genreMovies}
                onPlay={handlePlay}
                onToggleFavorite={toggleFavorite}
                favorites={favorites}
                onShowDetails={setDetailMovie}
              />
            ))}
          </div>
        )}

        {/* Kids - alphabetical grid */}
        {activeView === 'kids' && (
          <CategoryGrid
            title="Kids"
            movies={kidsMovies}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onBack={() => setActiveView('home')}
            onShowDetails={setDetailMovie}
          />
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

        {/* My List */}
        {activeView === 'mylist' && (
          <CategoryGrid
            title="Minha Lista"
            movies={movies.filter(m => m.source === 'favoritos')}
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
