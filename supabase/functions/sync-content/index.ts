import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://raw.githubusercontent.com/VisorFinances/paix-oflix-streaming-697585f5/refs/heads/main/data";

const TMDB_API_KEY = "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_BASE = "https://api.themoviedb.org/3";

interface RawItem {
  titulo: string;
  tmdb_id?: string;
  url?: string;
  identificador_archive?: string;
  trailer?: string;
  genero?: string | string[];
  categories?: string[];
  year?: string;
  rating?: string;
  desc?: string;
  poster?: string;
  type?: string;
  kids?: boolean;
}

async function safeFetch(url: string): Promise<RawItem[]> {
  try {
    const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
    if (!res.ok) return [];
    const text = await res.text();
    if (text.trim().startsWith("<")) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fetchTMDB(tmdbId: string, type: "movie" | "tv"): Promise<Partial<RawItem> | null> {
  try {
    const res = await fetch(`${TMDB_BASE}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      desc: data.overview || undefined,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w600_and_h900_face${data.poster_path}` : undefined,
      year: (data.release_date || data.first_air_date || "").slice(0, 4) || undefined,
      rating: data.vote_average ? data.vote_average.toFixed(1) : undefined,
      genero: (data.genres || []).map((g: any) => g.name),
    };
  } catch {
    return null;
  }
}

function ensureStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(v => typeof v === 'string' && v.trim()).map(v => String(v).trim());
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
}

function parseGenres(raw: RawItem): string[] {
  const cats = ensureStringArray(raw.categories);
  const gen = ensureStringArray(raw.genero);
  return [...new Set([...cats, ...gen])];
}

function isKids(raw: RawItem, source: string): boolean {
  if (raw.kids) return true;
  if (source === "kids_filmes" || source === "kids_series") return true;
  const genres = parseGenres(raw);
  return genres.some((g) => /kids|infantil|crian/i.test(g));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch all JSON sources in parallel
    const [cinema, series, kidsFilmes, kidsSeries, favoritos] = await Promise.all([
      safeFetch(`${BASE}/cinema.json`),
      safeFetch(`${BASE}/series.json`),
      safeFetch(`${BASE}/kids_filmes.json`),
      safeFetch(`${BASE}/kids_series.json`),
      safeFetch(`${BASE}/Favoritos.json`),
    ]);

    const allItems: Array<{
      titulo: string;
      tipo: string;
      tmdb_id: string | null;
      url: string | null;
      identificador_archive: string | null;
      trailer: string | null;
      genero: string[];
      categories: string[];
      ano: string | null;
      rating: string | null;
      descricao: string | null;
      poster: string | null;
      backdrop: string | null;
      kids: boolean;
    }> = [];

    const processItem = async (raw: RawItem, source: string) => {
      if (!raw.titulo) return null;

      const tipo = raw.type === "serie" || raw.type === "series" ? "series" : "movie";
      const genres = parseGenres(raw);
      const kids = isKids(raw, source);

      let desc = raw.desc || null;
      let poster = raw.poster || null;
      let year = raw.year || null;
      let rating = raw.rating || null;
      let backdrop: string | null = null;

      // Enrich from TMDB if tmdb_id exists and missing data
      if (raw.tmdb_id && (!poster || !desc)) {
        const tmdbType = tipo === "series" ? "tv" : "movie";
        const tmdb = await fetchTMDB(raw.tmdb_id, tmdbType);
        if (tmdb) {
          if (!desc && tmdb.desc) desc = tmdb.desc;
          if (!poster && tmdb.poster) poster = tmdb.poster;
          if (!year && tmdb.year) year = tmdb.year;
          if (!rating && tmdb.rating) rating = tmdb.rating;
          if (tmdb.genero && genres.length === 0) {
            genres.push(...(tmdb.genero as string[]));
          }
        }
      }

      return {
        titulo: raw.titulo,
        tipo,
        tmdb_id: raw.tmdb_id || null,
        url: raw.url || null,
        identificador_archive: raw.identificador_archive || null,
        trailer: raw.trailer || null,
        genero: genres,
        categories: raw.categories || [],
        ano: year,
        rating,
        descricao: desc,
        poster,
        backdrop,
        kids,
      };
    };

    // Process all items
    const sources: Array<[RawItem[], string]> = [
      [cinema, "cinema"],
      [series, "series"],
      [kidsFilmes, "kids_filmes"],
      [kidsSeries, "kids_series"],
      [favoritos, "favoritos"],
    ];

    for (const [items, source] of sources) {
      // Process in batches of 10 for TMDB rate limiting
      for (let i = 0; i < items.length; i += 10) {
        const batch = items.slice(i, i + 10);
        const results = await Promise.all(batch.map((item) => processItem(item, source)));
        for (const r of results) {
          if (r) allItems.push(r);
        }
      }
    }

    // Clear existing data and insert fresh
    await supabase.from("conteudos").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert in batches of 50
    let insertedCount = 0;
    for (let i = 0; i < allItems.length; i += 50) {
      const batch = allItems.slice(i, i + 50);
      const { error } = await supabase.from("conteudos").insert(batch);
      if (error) {
        console.error(`Insert error batch ${i}:`, error.message);
      } else {
        insertedCount += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: allItems.length,
        inserted: insertedCount,
        sources: {
          cinema: cinema.length,
          series: series.length,
          kids_filmes: kidsFilmes.length,
          kids_series: kidsSeries.length,
          favoritos: favoritos.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
