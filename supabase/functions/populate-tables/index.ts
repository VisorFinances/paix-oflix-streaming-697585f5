import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RawItem {
  titulo?: string;
  tmdb_id?: string;
  url?: string;
  identificador_archive?: string;
  trailer?: string;
  genero?: string | string[];
  categories?: string | string[];
  year?: string;
  rating?: string;
  desc?: string;
  poster?: string;
  type?: string;
  ano?: string;
  descricao?: string;
}

function mapItem(raw: RawItem): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  if (raw.titulo) mapped.titulo = raw.titulo;
  if (raw.tmdb_id) mapped.tmdb_id = raw.tmdb_id;
  if (raw.url) mapped.url = raw.url;
  if (raw.identificador_archive) mapped.identificador_archive = raw.identificador_archive;
  if (raw.trailer) mapped.trailer = raw.trailer;
  if (raw.poster) mapped.poster = raw.poster;
  if (raw.rating) mapped.rating = raw.rating;

  // desc → descricao (only if value exists)
  const descricao = raw.descricao || raw.desc;
  if (descricao) mapped.descricao = descricao;

  // year → ano (only if value exists)
  const ano = raw.ano || raw.year;
  if (ano) mapped.ano = ano;

  // genero: keep as string for tables that have text column
  if (raw.genero) {
    mapped.genero = Array.isArray(raw.genero) ? raw.genero.join(', ') : raw.genero;
  }

  // categories: ensure array for filmes table
  if (raw.categories) {
    if (Array.isArray(raw.categories)) {
      mapped.categories = raw.categories;
    } else {
      mapped.categories = [raw.categories];
    }
  }

  return mapped;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { table, source_url, append } = body;
    let { data } = body;

    if (!table) {
      return new Response(JSON.stringify({ error: "Missing table" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch from URL if source_url provided
    if (source_url && !data) {
      const res = await fetch(source_url);
      let text = await res.text();
      // Aggressive JSON cleanup for hand-edited files
      // 1. Remove BOM
      text = text.replace(/^\uFEFF/, '');
      // 2. Remove inline comments
      text = text.replace(/\/\/[^\n]*/g, '');
      // 3. Remove stray text after quoted values (corrupted entries)
      text = text.replace(/"([^"]*)",([^"\n{}\[\]]+)\n/g, '"$1"\n');
      // 4. Remove trailing commas before } or ]
      text = text.replace(/,(\s*[}\]])/g, '$1');
      // 5. Try parsing
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If still fails, try line-by-line object extraction
        const objects: Record<string, unknown>[] = [];
        const matches = text.matchAll(/\{[^{}]*\}/g);
        for (const m of matches) {
          try {
            let objText = m[0].replace(/,(\s*})/g, '$1');
            objects.push(JSON.parse(objText));
          } catch { /* skip malformed */ }
        }
        if (objects.length > 0) {
          data = objects;
        } else {
          throw new Error('JSON parse failed: ' + (e as Error).message);
        }
      }
    }

    if (!data || !Array.isArray(data)) {
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map fields
    const mappedData = data
      .filter((item: RawItem) => item.titulo)
      .map((item: RawItem) => mapItem(item));

    // Clear existing data (unless append mode)
    if (!append) {
      await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < mappedData.length; i += batchSize) {
      const batch = mappedData.slice(i, i + batchSize);
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted, total: mappedData.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
