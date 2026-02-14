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
    
    // Find the next non-comment, non-empty line as the URL
    let url = '';
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].startsWith('#')) {
        url = lines[j];
        break;
      }
    }
    if (!url) continue;
    
    const name = nameMatch?.[1] || '';
    if (!name) continue; // skip entries without a name
    
    channels.push({
      id: idMatch?.[1] || `ch-${channels.length}`,
      name,
      logo: logoMatch?.[1] || '',
      url,
      group: groupMatch?.[1] || 'Outros',
    });
  }
  
  return channels;
}
