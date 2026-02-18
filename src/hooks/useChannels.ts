import { useState, useEffect } from 'react';
import { Channel } from '@/types';
import { parseM3U } from '@/lib/m3uParser';

const M3U_URL = 'https://raw.githubusercontent.com/VisorFinances/tv.paixaoflix/main/data/canaisaovivo.m3u';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(M3U_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        try {
          setChannels(parseM3U(text));
        } catch {
          setChannels([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Canais ao vivo não disponíveis:', err.message);
        setChannels([]);
        setLoading(false);
      });
  }, []);

  return { channels, loading };
}
