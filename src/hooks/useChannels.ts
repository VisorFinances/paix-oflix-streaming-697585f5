import { useState, useEffect } from 'react';
import { Channel } from '@/types';
import { parseM3U } from '@/lib/m3uParser';

const M3U_URL = 'https://raw.githubusercontent.com/VisorFinances/paix-oflix-streaming-697585f5/refs/heads/main/data/canais.m3u';
const KIDS_M3U_URL = 'https://raw.githubusercontent.com/VisorFinances/paix-oflix-streaming-697585f5/refs/heads/main/data/kids_canais.m3u';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [kidsChannels, setKidsChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchM3U = async (url: string): Promise<Channel[]> => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return parseM3U(text);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Canais não disponíveis (${url}):`, msg);
        return [];
      }
    };

    Promise.all([fetchM3U(M3U_URL), fetchM3U(KIDS_M3U_URL)]).then(([main, kids]) => {
      setChannels(main);
      setKidsChannels(kids);
      setLoading(false);
    });
  }, []);

  return { channels, kidsChannels, loading };
}
