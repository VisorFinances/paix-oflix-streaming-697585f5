

# Plano: Popular tabelas do Supabase com os 4 arquivos JSON

## Resumo dos dados

| Arquivo | Tabela destino | ~Itens | Campos principais |
|---|---|---|---|
| `filmes.json` | `filmes` | ~286 | titulo, tmdb_id, url, trailer, categories (string ou array), year, rating, desc, poster |
| `séries.json` | `series` | ~84 | titulo, tmdb_id, trailer, identificador_archive |
| `filmeskids.json` | `kids_filmes` (nova) | ~46 | titulo, url, genero, year, rating, desc, poster, trailer |
| `serieskids.json` | `kids_series` | ~12 | titulo, identificador_archive, genero, year, rating, desc, poster |

O arquivo `tvaovivo.m3u` será copiado para `public/data/` e usado pelo hook `useChannels` existente.

---

## Passos

### 1. Migration: criar tabela `kids_filmes` + corrigir RLS

A tabela `kids_filmes` não existe. As policies RLS de todas as tabelas estão como **RESTRICTIVE** (bloqueando leitura). A migration vai:
- Criar `kids_filmes` (titulo, url, trailer, genero, year→ano, rating, descricao, poster, tipo, tmdb_id)
- Dropar e recriar policies de `filmes`, `series`, `kids_series` como **PERMISSIVE**
- Criar policy PERMISSIVE em `kids_filmes`

### 2. Atualizar edge function `populate-tables`

Adicionar mapeamento automático de campos JSON → colunas da tabela:
- `desc` → `descricao`
- `year` → `ano`
- `categories` (string) → `categories` (array)
- `genero` (string) → `genero`
- Remove campo `type` (coluna `tipo` tem default)

Adicionar suporte a parâmetro `source_url`: a function pode buscar o JSON de uma URL externa (GitHub raw) em vez de receber no body.

### 3. Copiar arquivos para `public/data/`

Copiar os 4 JSON e o M3U para `public/data/` para referência local e backup.

### 4. Popular as 4 tabelas

Usar `curl_edge_functions` para chamar `populate-tables` 4 vezes (uma por tabela), enviando os dados transformados. A function limpa a tabela antes de inserir.

### 5. Atualizar `useMovies.ts`

Garantir que o hook busca de `kids_filmes` além das 3 tabelas existentes no Lovable Cloud (não mais do Supabase externo).

---

## Arquivos a serem modificados

| Arquivo | Alteração |
|---|---|
| `supabase/migrations/` | Nova migration: kids_filmes + fix RLS PERMISSIVE |
| `supabase/functions/populate-tables/index.ts` | Mapeamento de campos + source_url |
| `public/data/filmes.json` | Cópia do upload |
| `public/data/series.json` | Cópia do upload |
| `public/data/filmeskids.json` | Cópia do upload |
| `public/data/serieskids.json` | Cópia do upload |
| `public/data/tvaovivo.m3u` | Cópia do upload |
| `src/hooks/useMovies.ts` | Adicionar `kids_filmes` nas tabelas consultadas |
| `src/lib/supabaseExternal.ts` | Remover (dados agora no Lovable Cloud) |

