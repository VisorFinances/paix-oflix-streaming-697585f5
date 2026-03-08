import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Loader2
} from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

const VideoPlayer = ({ url, autoPlay = true, onTimeUpdate, className = '' }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const retryCount = useRef(0);
  const loadTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lock to landscape on mobile when fullscreen
  useEffect(() => {
    const handleFs = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs && screen.orientation && 'lock' in screen.orientation) {
        (screen.orientation as any).lock?.('landscape').catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Setup HLS / source with timeout and retry
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setError(null);
    retryCount.current = 0;

    const cleanup = () => {
      clearTimeout(loadTimeout.current);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    const loadSource = () => {
      cleanup();

      // 8s loading timeout with more retries
      loadTimeout.current = setTimeout(() => {
        if (video.readyState < 2 && retryCount.current < 5) {
          retryCount.current++;
          console.log(`[Player] Retry ${retryCount.current}/5...`);
          loadSource();
        } else if (video.readyState < 2) {
          setError('Não foi possível carregar o vídeo. Tente novamente.');
          setIsLoading(false);
        }
      }, 8000);

      if (url.includes('.m3u8') && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          startLevel: -1, // auto quality
          capLevelToPlayerSize: true,
          enableWorker: true,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 15000,
          levelLoadingTimeOut: 15000,
          fragLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 4,
          manifestLoadingMaxRetry: 4,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          clearTimeout(loadTimeout.current);
          setIsLoading(false);
          if (autoPlay) video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retryCount.current < 3) {
              retryCount.current++;
              hls.startLoad();
            } else {
              setError('Erro ao carregar stream. Tentando novamente...');
              if (retryCount.current < 3) {
                retryCount.current++;
                setTimeout(loadSource, 2000);
              }
            }
          }
        });
      } else if (url.includes('.m3u8') && video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          clearTimeout(loadTimeout.current);
          setIsLoading(false);
          if (autoPlay) video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
        }, { once: true });
      } else {
        // MP4 / progressive
        video.preload = 'auto';
        video.src = url;
        video.addEventListener('canplay', () => {
          clearTimeout(loadTimeout.current);
          setIsLoading(false);
          if (autoPlay) video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
        }, { once: true });
      }

      video.addEventListener('error', () => {
        clearTimeout(loadTimeout.current);
        if (retryCount.current < 3) {
          retryCount.current++;
          setTimeout(loadSource, 2000);
        } else {
          setError('Não foi possível reproduzir este vídeo.');
          setIsLoading(false);
        }
      }, { once: true });
    };

    loadSource();
    return cleanup;
  }, [url, autoPlay]);

  // Controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(controlsTimer.current);
  }, [playing, resetControlsTimer]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); } else { v.pause(); }
  };

  const handleTimeUpdateEvent = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration || 0);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
    onTimeUpdate?.(v.currentTime, v.duration);
  };

  const seek = (time: number) => {
    const v = videoRef.current;
    if (v) { v.currentTime = time; setCurrentTime(time); }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seek(pct * duration);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setHoverTime(pct * duration);
    setHoverPos(e.clientX - rect.left);
  };

  const skip = (seconds: number) => {
    const v = videoRef.current;
    if (v) seek(Math.max(0, Math.min(v.currentTime + seconds, duration)));
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val === 0) { v.muted = true; setMuted(true); }
    else { v.muted = false; setMuted(false); }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard shortcuts (hotkeys)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); skip(-10); break;
        case 'ArrowRight': e.preventDefault(); skip(10); break;
        case 'ArrowUp': e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [volume, playing]);

  const changeRate = (rate: number) => {
    const v = videoRef.current;
    if (v) { v.playbackRate = rate; setPlaybackRate(rate); }
    setShowSettings(false);
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setError(null);
    retryCount.current = 0;
    const video = videoRef.current;
    if (video) {
      video.load();
      setIsLoading(true);
    }
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black group ${className}`}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        togglePlay();
      }}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdateEvent}
        onPlay={() => { setPlaying(true); setIsLoading(false); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) setDuration(v.duration);
        }}
        controlsList="nodownload"
        disablePictureInPicture={false}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading spinner */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80">
          <p className="text-foreground text-sm mb-4">{error}</p>
          <button
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-80 transition text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div
        data-controls
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%)' }}
      >
        {/* Progress bar */}
        <div
          className="relative mx-3 sm:mx-4 h-5 flex items-end cursor-pointer group/progress"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {hoverTime !== null && (
            <div
              className="absolute -top-8 px-2 py-0.5 bg-card text-foreground text-xs rounded pointer-events-none"
              style={{ left: `${hoverPos}px`, transform: 'translateX(-50%)' }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          <div className="w-full h-1 group-hover/progress:h-1.5 transition-all bg-foreground/20 rounded-full overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 group-hover/progress:h-1.5 bg-foreground/30 rounded-full transition-all" style={{ width: `${bufPct}%` }} />
            <div className="absolute bottom-0 left-0 h-1 group-hover/progress:h-1.5 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute bottom-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-primary rounded-full -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${pct}%`, transform: `translateX(-50%) translateY(25%)` }}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-foreground hover:text-primary transition p-1">
            {playing ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-foreground hover:text-primary transition p-1">
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-foreground hover:text-primary transition p-1">
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-1 group/vol">
            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-foreground hover:text-primary transition p-1">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
              className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-20 transition-all accent-primary h-1 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <span className="text-foreground text-[10px] sm:text-xs ml-1 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Settings */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="text-foreground hover:text-primary transition p-1"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {showSettings && (
              <div
                className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-muted-foreground px-2 py-1">Velocidade</p>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                  <button
                    key={r}
                    onClick={() => changeRate(r)}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition ${
                      playbackRate === r ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    {r === 1 ? 'Normal' : `${r}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-foreground hover:text-primary transition p-1">
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Big play button center */}
      {!playing && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-foreground/20 backdrop-blur flex items-center justify-center">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-foreground ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
