import { useState } from 'react';
import { Channel } from '@/types';
import VideoPlayer from './VideoPlayer';
import { ArrowLeft, Radio } from 'lucide-react';

interface LiveTVProps {
  channels: Channel[];
  onBack: () => void;
}

const LiveTV = ({ channels, onBack }: LiveTVProps) => {
  const [selected, setSelected] = useState<Channel | null>(channels[0] || null);

  const groups = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
    (acc[ch.group] = acc[ch.group] || []).push(ch);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col md:flex-row animate-fade-in">
      {/* Channel list */}
      <div className="w-full md:w-80 bg-card border-r border-border overflow-y-auto md:h-screen">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Radio className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display tracking-wider">TV ao Vivo</h2>
        </div>
        {Object.entries(groups).map(([group, chs]) => (
          <div key={group}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">{group}</p>
            {chs.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelected(ch)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors
                  ${selected?.id === ch.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
              >
                <img src={ch.logo} alt={ch.name} className="w-8 h-8 object-contain bg-foreground/10 rounded p-0.5" />
                <span className="text-sm font-medium">{ch.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Player */}
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        {selected ? (
          <div className="w-full max-w-5xl">
            <h3 className="text-lg font-semibold mb-3">{selected.name}</h3>
            <div className="aspect-video rounded-lg overflow-hidden bg-card">
              <VideoPlayer url={selected.url} />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Selecione um canal</p>
        )}
      </div>
    </div>
  );
};

export default LiveTV;
