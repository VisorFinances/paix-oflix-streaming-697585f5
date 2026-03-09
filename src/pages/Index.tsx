import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Movie, Channel } from '@/types';
import { getSeasonalSections } from '@/lib/seasonalSections';
import { useMovies, pickRandom, shuffleArray } from '@/hooks/useMovies';
import { useChannels } from '@/hooks/useChannels';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSmartTV } from '@/hooks/useSmartTV';
import { useStreamingTop5, StreamingItem } from '@/hooks/useStreamingTop5';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import HeroBanner from '@/components/HeroBanner';
import MovieRow from '@/components/MovieRow';
import Top10Row from '@/components/Top10Row';
import StreamingRow from '@/components/StreamingRow';
import SkeletonRow from '@/components/SkeletonRow';
import CategoryGrid from '@/components/CategoryGrid';
import LiveTV from '@/components/LiveTV';
import SearchView from '@/components/SearchView';
import PlayerOverlay from '@/components/PlayerOverlay';
import MovieDetailModal from '@/components/MovieDetailModal';
import SeriesDetailModal from '@/components/SeriesDetailModal';

const ORDER_LIST = [
  'Lançamento 2026', 'Lançamento 2025', 'Ação', 'Aventura', 'Anime', 'Animação',
  'Comédia', 'Drama', 'Dorama', 'Clássicos', 'Crime', 'Policial', 'Família',
  'Musical', 'Documentário', 'Faroeste', 'Ficção', 'Ficção Científica', 'Ficção Científica & Fantasia',
  'Nacional', 'Religioso', 'Romance', 'Terror', 'Suspense', 'Negritude', 'Adulto',
];

/** Deduplicate series by title (e.g. remove "- S01E01") */
function deduplicateSeries(movies: Movie[]): Movie[] {
  const seen = new Map<string, Movie>();
  for (const m of movies) {
    if (m.type !== 'series') continue;
    const base = m.title.replace(/\s*-\s*\d+ª\s*Temporada/i, '').replace(/\s*Temporada\s*\d+/i, '').replace(/\s*-\s*Todos os episódios/i, '').replace(/\s*-\s*Completo/i, '').trim();
    if (!seen.has(base)) {
      seen.set(base, m);
    }
  }
  return Array.from(seen.values());
}

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

function isSabadoNoite(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const min = now.getMinutes();
  const timeVal = hour * 60 + min;
  if (day === 6 && timeVal >= 16 * 60 + 59) return true;
  if (day === 0 && timeVal < 12 * 60) return true;
  return false;
}

function getPersonalized(movies: Movie[], watchHistory: Record<string, number>): Movie[] {
  const watchedIds = Object.keys(watchHistory);
  if (watchedIds.length === 0) return pickRandom(movies, 5);
  const genreCount: Record<string, number> = {};
  const watchedMovies = movies.filter(m => watchedIds.includes(m.id));
  for (const m of watchedMovies) {
    for (const g of m.genre) {
      genreCount[g] = (genreCount[g] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  const candidates = movies.filter(m =>
    !watchedIds.includes(m.id) && m.genre.some(g => topGenres.some(tg => g.toLowerCase() === tg.toLowerCase()))
  );
  return pickRandom(candidates.length > 0 ? candidates : movies, 5);
}

function pickExcluding(movies: Movie[], count: number, usedIds: Set<string>): Movie[] {
  const available = movies.filter(m => !usedIds.has(m.id));
  const picked = pickRandom(available.length > 0 ? available : movies, count);
  picked.forEach(m => usedIds.add(m.id));
  return picked;
}

function getBaseSeriesTitle(title: string): string {
  return title.replace(/\s*-\s*\d+ª\s*Temporada/i, '').replace(/\s*Temporada\s*\d+/i, '').replace(/\s*-\s*Todos os episódios/i, '').replace(/\s*-\s*Completo/i, '').trim();
}

function getSeasonNumber(title: string): number {
  const match = title.match(/(\d+)ª\s*Temporada/i);
  if (match) return parseInt(match[1]);
  const match2 = title.match(/Temporada\s*(\d+)/i);
  if (match2) return parseInt(match2[1]);
  return 1;
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
  const [personalizedTs, setPersonalizedTs] = useLocalStorage<number>('paixaoflix-personalized-ts', 0);

  // Filter out items without cover images, then deduplicate
  const uniqueMovies = useMemo(() => deduplicateByTitle(movies.filter(m => m.image && m.image.length > 5)), [movies]);
  const { streamingData, trendingSeries, oscarNominees, top10Brazil } = useStreamingTop5(uniqueMovies);

  useSmartTV();

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
      id: channel.id, title: channel.name, description: '', image: channel.logo,
      year: 2025, genre: ['TV ao Vivo'], type: 'movie', streamUrl: channel.url, source: 'cinema',
    });
  };

  const handleStreamingPlay = (item: StreamingItem) => {
    if (item.localMovie) handlePlay(item.localMovie);
  };
  const handleStreamingDetails = (item: StreamingItem) => {
    if (item.localMovie) setDetailMovie(item.localMovie);
  };

  const continueWatchingMovies = useMemo(() => {
    const ids = Object.entries(continueWatching)
      .filter(([, p]) => p > 0 && p < 95)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    return movies.filter(m => ids.includes(m.id));
  }, [movies, continueWatching]);

  const favoriteMovies = useMemo(() => movies.filter(m => favorites.includes(m.id)), [movies, favorites]);

  const homeCategories = useMemo(() => {
    if (uniqueMovies.length === 0) return null;
    const usedIds = new Set<string>();

    // Add hero banner movie IDs to avoid duplicates
    const heroPool = uniqueMovies.filter(m => m.source !== 'filmeskids' && m.source !== 'serieskids' && m.image && m.description);
    heroPool.slice(0, 10).forEach(m => usedIds.add(m.id));

    const pick1Genre = (rx: RegExp) => {
      const candidates = uniqueMovies.filter(m => !usedIds.has(m.id) && m.genre.some(g => rx.test(g)));
      const picked = pickRandom(candidates, 1);
      picked.forEach(m => usedIds.add(m.id));
      return picked;
    };

    const lancamentos = pickExcluding(uniqueMovies.filter(m => m.year >= 2025), 5, usedIds);

    const sabadoList = [
      ...pick1Genre(/com[eé]dia/i), ...pick1Genre(/aventura/i), ...pick1Genre(/a[çc][aã]o/i),
      ...pick1Genre(/suspense/i), ...pick1Genre(/religi/i), ...pick1Genre(/terror/i),
      ...pick1Genre(/musical/i), ...pick1Genre(/fam[ií]lia/i), ...pick1Genre(/nacional/i),
    ];
    const sabado = sabadoList.length > 0
      ? sabadoList.concat(pickExcluding(uniqueMovies, Math.max(0, 10 - sabadoList.length), usedIds))
      : pickExcluding(uniqueMovies, 10, usedIds);

    const negritude = pickExcluding(uniqueMovies.filter(m => m.genre.some(g => /negritude/i.test(g))), 5, usedIds);
    const nacionais = pickExcluding(uniqueMovies.filter(m => m.genre.some(g => /nacional/i.test(g))), 5, usedIds);
    const animacoes = pickExcluding(uniqueMovies.filter(m => m.genre.some(g => /anima[çc][aã]o/i.test(g))), 5, usedIds);
    const romance = pickExcluding(uniqueMovies.filter(m => m.genre.some(g => /romance/i.test(g))), 5, usedIds);
    const novelas = pickExcluding(uniqueMovies.filter(m => m.type === 'novela' || m.genre.some(g => /novela/i.test(g))), 5, usedIds);
    const kids = pickExcluding(uniqueMovies.filter(m => m.kids), 5, usedIds);
    const nostalgia = pickExcluding(uniqueMovies.filter(m => m.genre.some(g => /cl[áa]ssic/i.test(g))), 5, usedIds);

    const shouldRefreshPersonalized = Date.now() - personalizedTs > 48 * 60 * 60 * 1000;
    const personalized = getPersonalized(uniqueMovies.filter(m => !usedIds.has(m.id)), continueWatching);
    personalized.forEach(m => usedIds.add(m.id));
    if (shouldRefreshPersonalized) setPersonalizedTs(Date.now());

    return { lancamentos, sabado, negritude, nacionais, animacoes, romance, novelas, kids, nostalgia, personalized };
  }, [uniqueMovies, continueWatching, personalizedTs]);

  const genreCategories = useMemo(() => {
    return (source: 'cinema' | 'series') => {
      const sourceFilter = source === 'cinema'
        ? (m: Movie) => m.source === 'cinema' || m.source === 'favoritos'
        : (m: Movie) => m.source === 'series' || m.source === 'serieskids';
      const sourceMovies = movies.filter(sourceFilter);

      if (source === 'series') {
        const seriesGroups = new Map<string, Movie[]>();
        for (const m of sourceMovies) {
          const base = getBaseSeriesTitle(m.title);
          if (!seriesGroups.has(base)) seriesGroups.set(base, []);
          seriesGroups.get(base)!.push(m);
        }
        for (const [, group] of seriesGroups) {
          group.sort((a, b) => getSeasonNumber(a.title) - getSeasonNumber(b.title));
        }
        const genreMap = new Map<string, Movie[]>();
        const assignedSeries = new Set<string>();
        const sortedGroups = Array.from(seriesGroups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));

        for (const [baseTitle, group] of sortedGroups) {
          if (assignedSeries.has(baseTitle)) continue;
          assignedSeries.add(baseTitle);
          const allGenres = group.flatMap(m => m.genre).filter(Boolean);
          const primaryGenre = allGenres[0] || 'Outros';
          if (!genreMap.has(primaryGenre)) genreMap.set(primaryGenre, []);
          genreMap.get(primaryGenre)!.push(...group);
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
      }

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

  const kidsFilmes = useMemo(() =>
    movies.filter(m => m.kids && m.type === 'movie').sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
    [movies]
  );

  const kidsSeries = useMemo(() => {
    const series = movies.filter(m => m.kids && m.type === 'series');
    const groups = new Map<string, Movie[]>();
    for (const m of series) {
      const base = getBaseSeriesTitle(m.title);
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(m);
    }
    const sorted: Movie[] = [];
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    for (const key of sortedKeys) {
      const group = groups.get(key)!;
      group.sort((a, b) => getSeasonNumber(a.title) - getSeasonNumber(b.title));
      sorted.push(...group);
    }
    return sorted;
  }, [movies]);

  const kidsMovies = useMemo(() =>
    movies.filter(m => m.kids).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
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
    <div className="min-h-screen bg-background text-foreground pb-16 sm:pb-0">
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
            <TopBar movies={movies} />
            <HeroBanner movies={uniqueMovies.filter(m => m.source !== 'filmeskids' && m.source !== 'serieskids')} onPlay={handlePlay} onShowDetails={setDetailMovie} />

            <div className="mt-4 relative z-10">

              {loading && (
                <>
                  <SkeletonRow title="Carregando..." />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}

              {continueWatchingMovies.length > 0 && (
                <MovieRow title="Continuar Assistindo" movies={continueWatchingMovies} continueWatching={continueWatching} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.lancamentos.length > 0 && (
                <MovieRow title="Lançamentos & Novidades" movies={homeCategories.lancamentos} gridMode {...sharedRowProps} />
              )}

              {trendingSeries.length > 0 && (
                <StreamingRow title="Séries em Alta" items={trendingSeries.slice(0, 5)} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}

              {!loading && homeCategories && homeCategories.negritude.length > 0 && (
                <MovieRow title="Negritude em destaque" movies={homeCategories.negritude} gridMode {...sharedRowProps} />
              )}

              {!loading && (() => {
                const seasonal = getSeasonalSections(uniqueMovies);
                const cofre = seasonal.filter(s => s.title.includes('Cofre'));
                const others = seasonal.filter(s => !s.title.includes('Cofre'));
                return (
                  <>
                    {cofre.map(s => (
                      <MovieRow key={s.title} title={s.title} movies={s.movies} {...sharedRowProps} />
                    ))}
                    {others.map(s => (
                      <MovieRow key={s.title} title={s.title} movies={s.movies} {...sharedRowProps} />
                    ))}
                  </>
                );
              })()}

              {oscarNominees.length > 0 && (
                <StreamingRow title="Indicados ao Oscar 25/26" items={oscarNominees.slice(0, 5)} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}

              {!loading && homeCategories && homeCategories.nacionais.length > 0 && (
                <MovieRow title="Cinema Nacional" movies={homeCategories.nacionais} gridMode {...sharedRowProps} />
              )}

              {!loading && showSabado && homeCategories && homeCategories.sabado.length > 0 && (
                <MovieRow title="Sábado à noite merece" subtitle="Comédia, aventura, ação, suspense, terror e muito mais" movies={homeCategories.sabado} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.animacoes.length > 0 && (
                <MovieRow title="Animações para a Família" movies={homeCategories.animacoes} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.romance.length > 0 && (
                <MovieRow title="Romances para se inspirar" movies={homeCategories.romance} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.kids.length > 0 && (
                <MovieRow title="As crianças amam" movies={homeCategories.kids} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.nostalgia.length > 0 && (
                <MovieRow title="Nostalgia que aquecem o coração" movies={homeCategories.nostalgia} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.personalized.length > 0 && (
                <MovieRow title="Indicações exclusiva para você" movies={homeCategories.personalized} {...sharedRowProps} />
              )}

              {/* Top 10 do Brasileiro - from TMDB trending */}
              {top10Brazil.length > 0 && (
                <Top10Row title="Top 10 do Brasileiro" items={top10Brazil} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}

              {streamingData.netflix && streamingData.netflix.length > 0 && (
                <StreamingRow title="Top 5 Netflix" items={streamingData.netflix} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}
              {streamingData.prime && streamingData.prime.length > 0 && (
                <StreamingRow title="Top 5 Prime Vídeo" items={streamingData.prime} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}
              {streamingData.globoplay && streamingData.globoplay.length > 0 && (
                <StreamingRow title="Top 5 Globoplay" items={streamingData.globoplay} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}
              {streamingData.disney && streamingData.disney.length > 0 && (
                <StreamingRow title="Top 5 Disney+" items={streamingData.disney} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}
              {streamingData.hbomax && streamingData.hbomax.length > 0 && (
                <StreamingRow title="Top 5 HBO Max" items={streamingData.hbomax} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}
              {streamingData.paramount && streamingData.paramount.length > 0 && (
                <StreamingRow title="Top 5 Paramount+" items={streamingData.paramount} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}
              {streamingData.appletv && streamingData.appletv.length > 0 && (
                <StreamingRow title="Top 5 Apple TV+" items={streamingData.appletv} onPlay={handleStreamingPlay} onShowDetails={handleStreamingDetails} />
              )}

              {favoriteMovies.length > 0 && (
                <MovieRow title="Minha Lista" movies={favoriteMovies} {...sharedRowProps} />
              )}

              {!loading && homeCategories && homeCategories.novelas.length > 0 && (
                <MovieRow title="Novela é sempre bom" movies={homeCategories.novelas} {...sharedRowProps} />
              )}

            </div>
          </>
        )}

        {/* ── CINEMA ── */}
        {activeView === 'cinema' && (
          <div className="min-h-screen animate-fade-in">
            <TopBar movies={movies} />
            <HeroBanner
              movies={uniqueMovies.filter(m => m.source === 'cinema' || m.source === 'favoritos')}
              onPlay={handlePlay}
              onShowDetails={setDetailMovie}
            />
            <div className="py-6">
              {loading && <><SkeletonRow /><SkeletonRow /></>}
              {genreCategories('cinema').map(([genre, genreMovies]) => (
                <MovieRow key={genre} title={genre} movies={genreMovies} {...sharedRowProps} />
              ))}
            </div>
          </div>
        )}

        {/* ── SÉRIES ── */}
        {activeView === 'series' && (
          <div className="min-h-screen animate-fade-in">
            <TopBar movies={movies} />
            <HeroBanner
              movies={movies.filter(m => m.source === 'series')}
              onPlay={handlePlay}
              onShowDetails={setDetailMovie}
            />
            <div className="py-6">
              {loading && <><SkeletonRow /><SkeletonRow /></>}
              {(() => {
                const cats = genreCategories('series');
                if (cats.length === 0) {
                  const allSeries = movies
                    .filter(m => m.source === 'series')
                    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
                  if (allSeries.length > 0) {
                    return <MovieRow title="Todas as Séries" movies={allSeries} {...sharedRowProps} />;
                  }
                  return <p className="text-center text-muted-foreground mt-20">Nenhuma série encontrada.</p>;
                }
                return cats.map(([genre, genreMovies]) => (
                  <MovieRow key={genre} title={genre} movies={genreMovies} {...sharedRowProps} />
                ));
              })()}
            </div>
          </div>
        )}

        {/* ── KIDS ── */}
        {activeView === 'kids' && (
          <div className="min-h-screen animate-fade-in">
            <TopBar movies={movies} />
            <HeroBanner
              movies={kidsMovies}
              onPlay={handlePlay}
              onShowDetails={setDetailMovie}
            />
            <div className="py-6">
              {loading && <><SkeletonRow /><SkeletonRow /></>}
              {kidsFilmes.length > 0 && (
                <MovieRow title="Filmes" movies={kidsFilmes} {...sharedRowProps} />
              )}
              {kidsSeries.length > 0 && (
                <MovieRow title="Séries" movies={kidsSeries} {...sharedRowProps} />
              )}
            </div>
          </div>
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
            title="Favoritos"
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
