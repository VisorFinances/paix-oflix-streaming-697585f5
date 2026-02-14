import { useRef, useEffect } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

const VideoPlayer = ({ url, autoPlay = true, onTimeUpdate, className = '' }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

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

    return () => {
      hlsRef.current?.destroy();
    };
  }, [url, autoPlay]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && onTimeUpdate) {
      onTimeUpdate(video.currentTime, video.duration);
    }
  };

  return (
    <video
      ref={videoRef}
      className={`w-full h-full bg-background ${className}`}
      controls
      onTimeUpdate={handleTimeUpdate}
    />
  );
};

export default VideoPlayer;
