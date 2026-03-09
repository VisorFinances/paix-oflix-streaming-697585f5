import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/types';
import VideoPlayer from './VideoPlayer';
import { ArrowLeft, Radio } from 'lucide-react';

interface LiveTVProps {
  channels: Channel[];
  onBack: () => void;
}

const LiveTV = ({ channels, onBack }: LiveTVProps) => {
  const [selected, setSelected] = useState<Channel | null>(channels[0] || null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const groups = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
    (acc[ch.group] = acc[ch.group] || []).push(ch);
    return acc;
  }, {});

  // Listen for fullscreen changes to hide channel list
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row animate-fade-in">
      {/* Player - sticky on both mobile and desktop */}
      <div className="w-full md:flex-1 md:order-2">
        <div className="sticky top-0 z-10 bg-background p-2 sm:p-4 md:flex md:items-center md:justify-center md:h-screen">
          {selected ? (
            <div className="w-full max-w-5xl">
              <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-3 text-foreground">{selected.name}</h3>
              <div className="aspect-video rounded-lg overflow-hidden bg-card">
                <VideoPlayer url={selected.url} />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Selecione um canal</p>
          )}
        </div>
      </div>

      {/* Channel list — hidden when fullscreen */}
      {!isFullscreen && (
        <div className="w-full md:w-fit md:max-w-72 md:order-1 bg-card/40 backdrop-blur-xl border-r border-foreground/10 overflow-y-auto md:h-screen">
          <div className="flex items-center gap-3 p-4 border-b border-foreground/10">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Radio className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-display tracking-wider text-foreground">TV ao Vivo</h2>
          </div>
          {/* Mobile: 6 cols with horizontal category scroll, Desktop: list */}
          <div className="md:block">
            {Object.entries(groups).map(([group, chs]) => (
              <div key={group}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1">{group}</p>
                <div className="grid grid-cols-6 md:grid-cols-1 gap-1 px-1 md:px-0">
                  {chs.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelected(ch)}
                      className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-1 md:px-4 py-2 md:py-3 transition-colors rounded md:rounded-none
                        ${selected?.id === ch.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                    >
                      <img src={ch.logo} alt={ch.name} className="w-7 h-7 md:w-8 md:h-8 object-contain bg-foreground/10 rounded p-0.5" />
                      <span
                        className="text-[8px] md:text-sm font-medium text-center md:text-left w-full text-foreground leading-tight break-words"
                        style={{ maxWidth: '12ch', wordBreak: 'break-word' }}
                      >
                        {ch.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTV;
