import { useState, useMemo, useEffect, useCallback } from 'react';
import { Movie, Channel } from '@/types';
import { useMovies, pickRandom, shuffleArray } from '@/hooks/useMovies';
import { useChannels } from '@/hooks/useChannels';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSmartTV } from '@/hooks/useSmartTV';
import AppSidebar from '@/components/AppSidebar';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import Top10Row from '@/components/Top10Row';
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

// Top10 Brazil keyword patterns — matches titles/genres commonly trending in Brazil
const TOP10_BR_KEYWORDS = [
  /nacional/i, /brasil/i, /brasileir/i, /novela/i, /negritude/i,
  /dorama/i, /anime/i, /aventura/i, /comédia/i, /comedia/i,
];

/** Deduplicate by normalized title */
function deduplicateByTitle(movies: Movie[]): Movie[] {
  const seen = new Set<string>();
  return movies.filter(m => {
    const key = m.title.replace(/\s*[-–]\s*\d.*$/, '').replace(/\s*temporada\s*\d.*/i, '').trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Check if it is currently Saturday >= 16:59 and before Sunday 12:00 */
function isSabadoNoite(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  const min = now.getMinutes();
  const timeVal = hour * 60 + min;

  if (day === 6 && timeVal >= 16 * 60 + 59) return true;
  if (day === 0 && timeVal < 12 * 60) return true;
  return false;
}

const Index = () => {
  const { movies, loading } = useMovies();
  const { channels } = useChannels();
  const [activeView, setActiveView] = useState('home');
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useLocalStorage<string[]>('paixaoflix-favorites', []);
  const [continueWatching, setContinueWatching] = useLocalStorage<Record<string, number>>('paixaoflix-progress', {});
  const [showSabado, setShowSabado] = useState(isSabadoNoite());
  const [top10Movies, setTop10Movies] = useState<Movie[]>([]);

  useSmartTV();

  // Check Saturday section every minute
  useEffect(() => {
    const id = setInterval(() => setShowSabado(isSabadoNoite()), 60_000);
    return () => clearInterval(id);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleTimeUpdate = (movieId: string, progress: number) => {
    setContinueWatching(prev => ({ ...prev, [movieId]: progress }));
  };

  const handlePlay = (movie: Movie, episodeUrl?: string) => {
    setPlayingMovie(episodeUrl ? { ...movie, streamUrl: episodeUrl } : movie);
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

  // Unique movies (deduped)
  const uniqueMovies = useMemo(() => deduplicateByTitle(movies), [movies]);

  // Top 10 Brazil — recalculated every 5 min, picks films with BR-relevant genres
  const computeTop10 = useCallback(() => {
    if (uniqueMovies.length === 0) return;
    const pool = uniqueMovies.filter(m =>
      TOP10_BR_KEYWORDS.some(rx =>
        m.genre.some(g => rx.test(g)) || rx.test(m.title)
      )
    );
    const shuffled = shuffleArray(pool.length >= 10 ? pool : uniqueMovies);
    setTop10Movies(shuffled.slice(0, 10));
  }, [uniqueMovies]);

  useEffect(() => {
    computeTop10();
    const id = setInterval(computeTop10, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [computeTop10]);

  // Continue watching
  const continueWatchingMovies = useMemo(() => {
    const ids = Object.entries(continueWatching)
      .filter(([, p]) => p > 0 && p < 95)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
    return movies.filter(m => ids.includes(m.id));
  }, [movies, continueWatching]);

  const favoriteMovies = useMemo(() => movies.filter(m => favorites.includes(m.id)), [movies, favorites]);

  // ─── Home sections (picked randomly per session) ─────────────────────────
  const homeCategories = useMemo(() => {
    if (uniqueMovies.length === 0) return null;

    // "Não deixe de ver" — 6 random from high-rated or recent content
    const naoPerder = pickRandom(
      uniqueMovies.filter(m => m.year >= 2020 || parseFloat(m.rating || '0') >= 7),
      6
    );

    // "Sábado à noite merece" — 1 of each: comédia, aventura, ação, suspense, religioso, terror, musical, família, nacional
    const pick1Genre = (rx: RegExp) =>
      pickRandom(uniqueMovies.filter(m => m.genre.some(g => rx.test(g))), 1);

    const sabadoList = [
      ...pick1Genre(/com[eé]dia/i),
      ...pick1Genre(/aventura/i),
      ...pick1Genre(/a[çc][aã]o/i),
      ...pick1Genre(/suspense/i),
      ...pick1Genre(/religi/i),
      ...pick1Genre(/terror/i),
      ...pick1Genre(/musical/i),
      ...pick1Genre(/fam[ií]lia/i),
      ...pick1Genre(/nacional/i),
    ];
    // Fill to 9 if any genre is empty
    const sabado = sabadoList.length > 0
      ? sabadoList.concat(pickRandom(uniqueMovies.filter(m => !sabadoList.includes(m)), 9 - sabadoList.length))
      : pickRandom(uniqueMovies, 9);

    // "As crianças amam" — 6 kids movies/series
    const criancas = pickRandom(
      movies.filter(m => m.kids),
      6
    );

    // "Romances para se inspirar" — 6 romance
    const romance = pickRandom(
      uniqueMovies.filter(m => m.genre.some(g => /romance/i.test(g))),
      6
    );

    // "Negritude em destaque" — all (no limit)
    const negritude = uniqueMovies.filter(m =>
      m.genre.some(g => /negritude/i.test(g))
    );

    // "Nostalgia que aquecem o coração" — 6 clássico category
    const nostalgia = pickRandom(
      uniqueMovies.filter(m =>
        m.genre.some(g => /cl[aá]ssic/i.test(g)) || m.year < 2005
      ),
      6
    );

    // "Nacionais de sucesso" — 6 nacional
    const nacionais = pickRandom(
      uniqueMovies.filter(m => m.genre.some(g => /nacional/i.test(g))),
      6
    );

    // "Premiados pela mídia" — 6 with rating >= 8
    const premiados = pickRandom(
      uniqueMovies.filter(m => parseFloat(m.rating || '0') >= 8.0),
      6
    );

    // "Novela é sempre bom" — conditional: only if genre exists
    const novelas = pickRandom(
      uniqueMovies.filter(m =>
        m.type === 'novela' || m.genre.some(g => /novela/i.test(g))
      ),
      6
    );

    return { naoPerder, sabado, criancas, romance, negritude, nostalgia, nacionais, premiados, novelas };
  }, [uniqueMovies, movies]);

  // Genre-based categories for Cinema/Series views
  const genreCategories = useMemo(() => {
    return (source: 'cinema' | 'series') => {
      const sourceMovies = movies.filter(m => m.source === source);
      const genreMap = new Map<string, Movie[]>();

      for (const m of sourceMovies) {
        for (const g of m.genre) {
          const normalized = g.trim();
          if (!normalized) continue;
          if (!genreMap.has(normalized)) genreMap.set(normalized, []);
          genreMap.get(normalized)!.push(m);
        }
      }

      const launch2026 = sourceMovies.filter(m => m.year >= 2026);
      if (launch2026.length > 0) genreMap.set('Lançamento 2026', launch2026);
      const launch2025 = sourceMovies.filter(m => m.year === 2025);
      if (launch2025.length > 0) genreMap.set('Lançamento 2025', launch2025);

      return Array.from(genreMap.entries()).sort((a, b) => {
        const ia = ORDER_LIST.findIndex(o => o.toLowerCase() === a[0].toLowerCase());
        const ib = ORDER_LIST.findIndex(o => o.toLowerCase() === b[0].toLowerCase());
        return (ia >= 0 ? ia : 999) - (ib >= 0 ? ib : 999);
      });
    };
  }, [movies]);

  // Kids view
  const kidsMovies = useMemo(() =>
    movies.filter(m => m.kids).sort((a, b) => a.title.localeCompare(b.title)),
    [movies]
  );

  const sidebarOffset = 'sm:ml-16';

  const sharedRowProps = {
    onPlay: handlePlay,
    onToggleFavorite: toggleFavorite,
    favorites,
    onShowDetails: (m: Movie) => setDetailMovie(m),
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-14 sm:pb-0">
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

        {/* ── HOME ── */}
        {activeView === 'home' && (
          <>
            <HeroBanner movies={uniqueMovies} onPlay={handlePlay} onShowDetails={setDetailMovie} />

            <div className="mt-[94px] relative z-10">

              {/* Continuar Assistindo */}
              {continueWatchingMovies.length > 0 && (
                <MovieRow
                  title="Continuar Assistindo"
                  movies={continueWatchingMovies}
                  continueWatching={continueWatching}
                  {...sharedRowProps}
                />
              )}

              {/* Minha Lista */}
              {favoriteMovies.length > 0 && (
                <MovieRow title="Minha Lista" movies={favoriteMovies} {...sharedRowProps} />
              )}

              {/* Não deixe de ver */}
              {!loading && homeCategories && (
                <MovieRow
                  title="Não deixe de ver"
                  movies={homeCategories.naoPerder}
                  {...sharedRowProps}
                />
              )}

              {/* Top 10 do Brasileiro */}
              {!loading && top10Movies.length > 0 && (
                <Top10Row
                  title="Top 10 do Brasileiro"
                  movies={top10Movies}
                  {...sharedRowProps}
                />
              )}

              {/* Sábado à noite merece — only visible Sat 16:59 → Sun 11:59 */}
              {!loading && showSabado && homeCategories && homeCategories.sabado.length > 0 && (
                <MovieRow
                  title="Sábado à noite merece"
                  subtitle="Comédia, aventura, ação, suspense, terror e muito mais"
                  movies={homeCategories.sabado}
                  {...sharedRowProps}
                />
              )}

              {/* As crianças amam */}
              {!loading && homeCategories && homeCategories.criancas.length > 0 && (
                <MovieRow
                  title="As crianças amam"
                  movies={homeCategories.criancas}
                  {...sharedRowProps}
                />
              )}

              {/* Romances para se inspirar */}
              {!loading && homeCategories && homeCategories.romance.length > 0 && (
                <MovieRow
                  title="Romances para se inspirar"
                  movies={homeCategories.romance}
                  {...sharedRowProps}
                />
              )}

              {/* Negritude em destaque */}
              {!loading && homeCategories && homeCategories.negritude.length > 0 && (
                <MovieRow
                  title="Negritude em destaque"
                  movies={homeCategories.negritude}
                  {...sharedRowProps}
                />
              )}

              {/* Nostalgia que aquecem o coração */}
              {!loading && homeCategories && homeCategories.nostalgia.length > 0 && (
                <MovieRow
                  title="Nostalgia que aquecem o coração"
                  movies={homeCategories.nostalgia}
                  {...sharedRowProps}
                />
              )}

              {/* Nacionais de sucesso */}
              {!loading && homeCategories && homeCategories.nacionais.length > 0 && (
                <MovieRow
                  title="Nacionais de sucesso"
                  movies={homeCategories.nacionais}
                  {...sharedRowProps}
                />
              )}

              {/* Premiados pela mídia */}
              {!loading && homeCategories && homeCategories.premiados.length > 0 && (
                <MovieRow
                  title="Premiados pela mídia"
                  movies={homeCategories.premiados}
                  {...sharedRowProps}
                />
              )}

              {/* Novela é sempre bom — conditional */}
              {!loading && homeCategories && homeCategories.novelas.length > 0 && (
                <MovieRow
                  title="Novela é sempre bom"
                  movies={homeCategories.novelas}
                  {...sharedRowProps}
                />
              )}

            </div>
          </>
        )}

        {/* ── CINEMA / SERIES ── */}
        {(activeView === 'cinema' || activeView === 'series') && (
          <div className="min-h-screen py-8 animate-fade-in">
            <div className="px-4 md:px-12 mb-6 flex items-center gap-4">
              <button onClick={() => setActiveView('home')} className="text-muted-foreground hover:text-foreground transition" data-nav="back">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h1 className="text-3xl md:text-4xl font-display tracking-wider">
                {activeView === 'cinema' ? 'Cinema' : 'Séries'}
              </h1>
            </div>
            {genreCategories(activeView as 'cinema' | 'series').map(([genre, genreMovies]) => (
              <MovieRow key={genre} title={genre} movies={genreMovies} {...sharedRowProps} />
            ))}
          </div>
        )}

        {/* ── KIDS ── */}
        {activeView === 'kids' && (
          <CategoryGrid
            title="Kids"
            movies={kidsMovies}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onBack={() => setActiveView('home')}
            onShowDetails={(m) => setDetailMovie(m)}
            isKids
          />
        )}

        {/* ── LIVE TV ── */}
        {activeView === 'live' && (
          <LiveTV channels={channels} onBack={() => setActiveView('home')} />
        )}

        {/* ── SEARCH ── */}
        {activeView === 'search' && (
          <SearchView
            movies={movies}
            channels={channels}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onBack={() => setActiveView('home')}
            onPlayChannel={handlePlayChannel}
            onShowDetails={(m) => setDetailMovie(m)}
          />
        )}

        {/* ── MY LIST ── */}
        {activeView === 'mylist' && (
          <CategoryGrid
            title="Minha Lista"
            movies={favoriteMovies}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onBack={() => setActiveView('home')}
            onShowDetails={(m) => setDetailMovie(m)}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
