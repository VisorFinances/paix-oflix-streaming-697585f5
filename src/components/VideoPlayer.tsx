import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings
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
  const progressRef = useRef<HTMLDivElement>(null);

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

  // Setup HLS / source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (hlsRef.current) hlsRef.current.destroy();

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
    } else {
      video.src = url;
      if (autoPlay) video.play().catch(() => {});
    }

    return () => { hlsRef.current?.destroy(); };
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

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdateEvent}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) setDuration(v.duration);
        }}
        controlsList="nodownload"
        disablePictureInPicture={false}
        playsInline
      />

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
          ref={progressRef}
          className="relative mx-3 sm:mx-4 h-5 flex items-end cursor-pointer group/progress"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 px-2 py-0.5 bg-card text-foreground text-xs rounded pointer-events-none"
              style={{ left: `${hoverPos}px`, transform: 'translateX(-50%)' }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          <div className="w-full h-1 group-hover/progress:h-1.5 transition-all bg-foreground/20 rounded-full overflow-hidden">
            {/* Buffered */}
            <div className="absolute bottom-0 left-0 h-1 group-hover/progress:h-1.5 bg-foreground/30 rounded-full transition-all" style={{ width: `${bufPct}%` }} />
            {/* Progress */}
            <div className="absolute bottom-0 left-0 h-1 group-hover/progress:h-1.5 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          {/* Scrub handle */}
          <div
            className="absolute bottom-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-primary rounded-full -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${pct}%`, transform: `translateX(-50%) translateY(25%)` }}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
          {/* Play/Pause */}
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-foreground hover:text-primary transition p-1">
            {playing ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Skip back */}
          <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-foreground hover:text-primary transition p-1 hidden sm:block">
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Skip forward */}
          <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-foreground hover:text-primary transition p-1 hidden sm:block">
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Volume */}
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

          {/* Time */}
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

          {/* Fullscreen */}
          <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-foreground hover:text-primary transition p-1">
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Big play button center */}
      {!playing && (
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
