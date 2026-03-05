

# Plano: Corrigir Seções Vazias (Cinema, Séries, Kids) + PreviewCard Prime Video

## Diagnóstico

O banco de dados **tem dados**: 265 filmes, 133 séries, 99 kids. O problema é a **política RLS**:

A policy `"Anyone can read conteudos"` está configurada como **RESTRICTIVE** (`Permissive: No`). No PostgreSQL, se só existem policies restritivas e nenhuma permissiva, **todas as queries retornam 0 linhas**. É por isso que o app faz fallback ao GitHub JSON (que também pode falhar).

**Nota sobre tabelas separadas**: O usuário mencionou tabelas `filmes`, `series` e `kids`, mas essas **não existem**. Todos os dados já estão na tabela `conteudos` com campo `tipo` (movie/series) e `kids` (boolean). Vamos usar a tabela existente, que já funciona.

## Tarefas

### 1. Corrigir RLS Policy (Causa Raiz)
- Dropar a policy restritiva atual
- Criar uma nova policy **PERMISSIVA** de SELECT para leitura pública:
```sql
DROP POLICY "Anyone can read conteudos" ON public.conteudos;
CREATE POLICY "Public read conteudos" ON public.conteudos
  FOR SELECT TO anon, authenticated USING (true);
```

### 2. Otimizar `useMovies.ts`
- Aumentar limit para buscar todos os registros (`.select('*').order('titulo').limit(500)`)
- Melhorar logging de erros para diagnóstico
- Manter fallback GitHub como segurança

### 3. Refatorar `PreviewCard.tsx` (Estilo Prime Video)
- **Expansão**: Card expande com `position: absolute`, `z-index: 100`, `scale(1.15)` sobre vizinhos sem deslocar o layout
- **Trailer**: Após 500ms de foco, inicia trailer (YouTube embed ou HLS.js direto). Som mudo com ícone de volume visível. Singleton global (1 trailer ativo)
- **Conteúdo expandido**: Abaixo do vídeo no card expandido:
  - Sinopse com `line-clamp-3` (3 linhas exatas)
  - Botão grande "Assistir", botão redondo "+" (Minha Lista), botão "Trailer"
  - Metadados: rating, ano, classificação
- **Mobile**: 1º toque expande, 2º abre. Card expandido centralizado ou modal inferior
- **AbortController**: Cancela carregamento de trailer ao perder foco rápido
- **GPU acceleration**: `transform: translateZ(0)` e `will-change: transform`

### 4. Garantir Filtros de Cinema/Séries/Kids
- Cinema: filtra `source === 'cinema'` (tipo=movie, kids=false)
- Séries: filtra `source === 'series'` (tipo=series, kids=false)
- Kids: filtra `kids === true`
- Verificar que o mapper `conteudoToMovie` mapeia `tipo: 'series'` corretamente (incluindo variante `'serie'`)

### Arquivos Modificados
- `supabase/migrations/` — nova migration para fix RLS
- `src/hooks/useMovies.ts` — ajustes de query
- `src/components/PreviewCard.tsx` — refatoração completa Prime Video style

