import { Channel } from '@/types';

export function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF:')) continue;
    
    const nameMatch = line.match(/,(.+)$/);
    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
    const groupMatch = line.match(/group-title="([^"]+)"/);
    const idMatch = line.match(/tvg-id="([^"]+)"/);
    
    const url = lines[i + 1];
    if (!url || url.startsWith('#')) continue;
    
    channels.push({
      id: idMatch?.[1] || `ch-${channels.length}`,
      name: nameMatch?.[1] || 'Unknown',
      logo: logoMatch?.[1] || '',
      url,
      group: groupMatch?.[1] || 'Outros',
    });
  }
  
  return channels;
}
