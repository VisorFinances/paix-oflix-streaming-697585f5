import { useState, useEffect } from 'react';
import { Channel } from '@/types';
import { parseM3U } from '@/lib/m3uParser';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/canaisaovivo.m3u')
      .then(res => res.text())
      .then(text => {
        setChannels(parseM3U(text));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { channels, loading };
}
