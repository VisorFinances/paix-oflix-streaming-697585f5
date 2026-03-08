import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';

interface TMDBResult {
  id: number;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  genres?: { id: number; name: string }[];
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

async function searchTMDB(title: string, type: 'movie' | 'tv'): Promise<TMDBResult | null> {
  const clean = title
    .replace(/\s*-\s*\d+ª\s*Temporada/i, '')
    .replace(/\s*Temporada\s*\d+/i, '')
    .replace(/\s*-\s*Todos os episódios/i, '')
    .replace(/\s*-\s*Completo/i, '')
    .trim();

  try {
    const res = await fetch(
      `${TMDB_BASE}/search/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(clean)}&page=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const id = data.results?.[0]?.id;
    if (!id) return null;

    const detailRes = await fetch(
      `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!detailRes.ok) return null;
    return await detailRes.json();
  } catch {
    return null;
  }
}

async function enrichByTmdbId(tmdbId: string, type: 'movie' | 'tv'): Promise<TMDBResult | null> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { table = 'filmes', limit = 50 } = await req.json().catch(() => ({}));

    let query;
    if (table === 'series') {
      // Series: enrich all that have no poster
      query = sb.from('series').select('id, titulo, tmdb_id, tipo, poster').is('poster', null).limit(limit);
    } else if (table === 'kids_filmes') {
      query = sb.from('kids_filmes').select('id, titulo, tmdb_id, tipo, poster').is('poster', null).limit(limit);
    } else if (table === 'kids_series') {
      query = sb.from('kids_series').select('id, titulo, tipo, poster').is('poster', null).limit(limit);
    } else {
      query = sb.from('filmes').select('id, titulo, tmdb_id, tipo, poster, genero').limit(limit);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    // Filter rows that need enrichment
    const needsEnrich = (rows || []).filter((r: any) => !r.poster || r.poster === '');
    
    let enriched = 0;
    const errors: string[] = [];

    for (const row of needsEnrich) {
      const tipo = row.tipo === 'serie' || row.tipo === 'series' ? 'tv' : 'movie';
      
      let details: TMDBResult | null = null;
      if (row.tmdb_id) {
        details = await enrichByTmdbId(row.tmdb_id, tipo as 'movie' | 'tv');
      }
      if (!details) {
        details = await searchTMDB(row.titulo, tipo as 'movie' | 'tv');
      }

      if (details) {
        const update: Record<string, any> = {};
        if (details.poster_path) {
          update.poster = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        }
        if (details.backdrop_path && table !== 'kids_series') {
          update.backdrop = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
        }
        if (details.overview) {
          update.descricao = details.overview;
        }
        if (details.genres?.length) {
          const genreStr = details.genres.map(g => g.name).join(', ');
          update.genero = genreStr;
          if (table === 'filmes') {
            update.categories = details.genres.map(g => g.name);
          }
        }
        const dateStr = details.release_date || details.first_air_date;
        if (dateStr) {
          update.ano = dateStr.slice(0, 4);
        }
        if (details.vote_average) {
          update.rating = details.vote_average.toFixed(1);
        }
        if (!row.tmdb_id && details.id) {
          update.tmdb_id = String(details.id);
        }

        if (Object.keys(update).length > 0) {
          const { error: updateErr } = await sb.from(table).update(update).eq('id', row.id);
          if (updateErr) {
            errors.push(`${row.titulo}: ${updateErr.message}`);
          } else {
            enriched++;
          }
        }
      }

      // Rate limit: 250ms between requests
      await new Promise(r => setTimeout(r, 250));
    }

    return new Response(JSON.stringify({
      success: true,
      total: needsEnrich.length,
      enriched,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
