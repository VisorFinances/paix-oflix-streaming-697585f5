import { useState, useEffect, useCallback } from 'react';
import { Movie } from '@/types';
import { SeriesGroup, EpisodeData, findSeriesGroup } from '@/lib/seriesUtils';
import { getArchiveFiles, getTrailerUrl } from '@/lib/tmdb';
import { X, Play, Plus, Check, ChevronDown, Star, Calendar, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SeriesDetailModalProps {
  movie: Movie;
  allMovies: Movie[];
  onClose: () => void;
  onPlay: (movie: Movie, episodeUrl?: string) => void;
  onToggleFavorite: (movieId: string) => void;
  isFavorite: boolean;
}

type TabType = 'episodes' | 'trailers' | 'suggestions';

const SeriesDetailModal = ({
  movie, allMovies, onClose, onPlay, onToggleFavorite, isFavorite,
}: SeriesDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('episodes');
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);

  const seriesGroup: SeriesGroup | null = findSeriesGroup(movie, allMovies);
  const seasons = seriesGroup?.seasons || [];
  const currentSeason = seasons[selectedSeason];

  // Fetch episodes from Archive.org
  const fetchEpisodes = useCallback(async () => {
    if (!currentSeason?.archiveId) {
      setEpisodes([]);
      return;
    }
    setLoadingEpisodes(true);
    try {
      const files = await getArchiveFiles(currentSeason.archiveId);
      const eps: EpisodeData[] = files.map((f, i) => {
        const cleanName = f.name
          .replace(/\.(mp4|mkv|avi)$/i, '')
          .replace(/CONV_/g, '')
          .replace(/%20/g, ' ')
          .replace(/_/g, ' ');
        return {
          number: i + 1,
          title: cleanName || `Episódio ${i + 1}`,
          fileName: f.name,
          streamUrl: `https://archive.org/download/${currentSeason.archiveId}/${encodeURIComponent(f.name)}`,
          duration: f.length ? formatDuration(parseFloat(f.length)) : undefined,
        };
      });
      setEpisodes(eps);
    } catch {
      setEpisodes([]);
    }
    setLoadingEpisodes(false);
  }, [currentSeason?.archiveId]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  // Fetch trailer
  useEffect(() => {
    const title = seriesGroup?.title || movie.title;
    getTrailerUrl(title, 'tv').then(url => setTrailerUrl(url));
  }, [seriesGroup?.title, movie.title]);

  // Suggestions: same genre, different series
  const suggestions = allMovies
    .filter(m => m.type === 'series' && m.id !== movie.id && m.genre.some(g => movie.genre.includes(g)))
    .slice(0, 8);

  const displayTitle = seriesGroup?.title || movie.title;
  const displayDesc = seriesGroup?.description || movie.description;
  const displayPoster = seriesGroup?.poster || movie.image;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto py-8 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-4xl bg-card rounded-xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Hero Section */}
          <div className="relative w-full aspect-video overflow-hidden">
            {showTrailer && trailerUrl ? (
              <iframe
                src={trailerUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Trailer"
              />
            ) : (
              <img
                src={displayPoster}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Header Info */}
          <div className="px-6 -mt-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-display tracking-wider text-foreground mb-3">
              {displayTitle}
            </h2>

            {/* Actions */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  if (episodes.length > 0) {
                    onPlay(movie, episodes[0].streamUrl);
                  } else {
                    onPlay(movie);
                  }
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-foreground text-background font-semibold hover:opacity-80 transition text-sm"
              >
                <Play className="w-5 h-5" /> Assistir
              </button>

              {trailerUrl && (
                <button
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-muted/60 text-foreground font-semibold hover:bg-muted transition text-sm"
                >
                  <Play className="w-4 h-4" /> {showTrailer ? 'Fechar Trailer' : 'Trailer'}
                </button>
              )}

              <button
                onClick={() => onToggleFavorite(movie.id)}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-muted-foreground/50 hover:border-foreground transition"
              >
                {isFavorite ? <Check className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {seriesGroup?.year || movie.year}
              </span>
              {(seriesGroup?.rating || movie.rating) && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary" />
                  {seriesGroup?.rating || movie.rating}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Film className="w-4 h-4 text-primary" />
                {seasons.length} Temporada{seasons.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(seriesGroup?.genre || movie.genre).map(g => (
                <span key={g} className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-sm leading-relaxed text-muted-foreground mb-6">
              {displayDesc}
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-border">
            <div className="flex gap-6">
              {([
                { key: 'episodes', label: 'Episódios' },
                { key: 'trailers', label: 'Trailer e Mais' },
                { key: 'suggestions', label: 'Sugestões' },
              ] as { key: TabType; label: string }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 text-sm font-semibold transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="series-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Episodes Tab */}
              {activeTab === 'episodes' && (
                <motion.div
                  key="episodes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Season Selector */}
                  {seasons.length > 1 && (
                    <div className="relative mb-4">
                      <button
                        onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-sm font-medium text-secondary-foreground hover:bg-accent transition"
                      >
                        {seasons[selectedSeason]?.label || 'Temporada 1'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {seasonDropdownOpen && (
                        <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-md shadow-xl z-20 min-w-[180px]">
                          {seasons.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => { setSelectedSeason(i); setSeasonDropdownOpen(false); }}
                              className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition ${
                                i === selectedSeason ? 'text-primary font-semibold' : 'text-foreground'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Episode List */}
                  {loadingEpisodes ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : episodes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhum episódio encontrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {episodes.map(ep => (
                        <motion.button
                          key={ep.number}
                          onClick={() => onPlay(movie, ep.streamUrl)}
                          className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition group text-left"
                          whileHover={{ scale: 1.01 }}
                        >
                          {/* Episode Number */}
                          <span className="text-2xl font-display text-muted-foreground w-8 text-center flex-shrink-0">
                            {ep.number}
                          </span>

                          {/* Thumbnail */}
                          <div className="relative w-32 aspect-video rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={displayPoster}
                              alt={ep.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                              <Play className="w-8 h-8 text-foreground" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {ep.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {displayDesc.slice(0, 100)}...
                            </p>
                          </div>

                          {/* Duration */}
                          {ep.duration && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {ep.duration}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Trailers Tab */}
              {activeTab === 'trailers' && (
                <motion.div
                  key="trailers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {trailerUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        src={trailerUrl}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title="Trailer"
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum trailer disponível.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => onClose()}
                      className="group rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition"
                    >
                      <img
                        src={s.image}
                        alt={s.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      <div className="p-2 bg-card">
                        <p className="text-xs font-semibold truncate">{s.title}</p>
                      </div>
                    </button>
                  ))}
                  {suggestions.length === 0 && (
                    <p className="text-muted-foreground text-center py-8 col-span-full">
                      Nenhuma sugestão disponível.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}min`;
  }
  return `${m}min`;
}

export default SeriesDetailModal;
