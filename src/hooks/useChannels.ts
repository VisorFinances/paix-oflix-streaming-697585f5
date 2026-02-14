import { useState, useEffect } from 'react';
import { Channel } from '@/types';
import { parseM3U } from '@/lib/m3uParser';

const M3U_URL = 'https://raw.githubusercontent.com/VisorFinances/tv.paixaoflix/refs/heads/main/data/canaisaovivo.m3u8';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(M3U_URL)
      .then(res => res.text())
      .then(text => {
        setChannels(parseM3U(text));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { channels, loading };
}
