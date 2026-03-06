

# Plano: Correções Críticas + Melhorias PaixãoFlix

## Esclarecimento Importante

Este projeto já está conectado ao **Lovable Cloud** (projeto `gyxwfeawqfklnnjwfktp`). Não é possível conectar a um projeto Supabase externo (`yiptyaaayfgakcueefeu`) enquanto o Cloud está ativo. Todas as tabelas e dados serão gerenciados no projeto Cloud existente, que já contém a tabela `conteudos` com ~400 itens.

---

## O que SERÁ implementado nesta iteração

### 1. Corrigir RLS (Causa raiz das seções vazias)
A policy `"Public read conteudos"` continua como **RESTRICTIVE**. Nova migration para dropar e recriar como PERMISSIVE.

### 2. Fix build error no Edge Function
`error` is of type `unknown` em `sync-content/index.ts` linha 215. Cast para `(error as Error).message`.

### 3. Corrigir PreviewCard: trailer vs conteúdo completo
**Bug crítico**: O campo `directSrc` está usando `movie.streamUrl` (conteúdo completo) como fallback quando deveria usar APENAS `movie.trailer`. Remover o fallback para `streamUrl` no preview. O campo `url`/`streamUrl` só deve ser usado ao clicar "Assistir".

### 4. Grid responsivo com breakpoints corretos
Atualizar `CategoryGrid.

<lov-plan>

# Plano: Correções Críticas + Melhorias PaixãoFlix

## Esclarecimento Importante

Este projeto já está conectado ao **Lovable Cloud** (projeto `gyxwfeawqfklnnjwfktp`). Não é possível conectar a um projeto Supabase externo (`yiptyaaayfgakcueefeu`). Todas as tabelas e dados continuam na tabela `conteudos` existente com ~400 itens.

---

## O que SERÁ implementado

### 1. Corrigir RLS (Causa raiz das seções vazias)
A policy `"Public read conteudos"` continua como **RESTRICTIVE** (visível na configuração). Nova migration para dropar e recriar como PERMISSIVE.

### 2. Fix build error no Edge Function
`(error as Error).message` em `sync-content/index.ts` linha 215.

### 3. Corrigir bug crítico: trailer vs conteúdo completo
No `PreviewCard.tsx` linha 61, o `directSrc` faz fallback para `movie.streamUrl` — isso reproduz o filme inteiro no preview. Remover esse fallback. Preview usa APENAS `movie.trailer`.

### 4. Trailer com áudio ativado
Mudar `isMuted` inicial para `false`. YouTube embed com `mute=0`.

### 5. Grid responsivo (CategoryGrid + MovieRow)
Atualizar `CategoryGrid` para grid `5col → 4col → 3col → 2col` com `gap-6`. Cards com `aspect-ratio: 2/3` e `width: 100%` (sem altura fixa). Sinopse com `font-size: 14px`, `line-clamp-3`, padding `18px`.

### 6. Hero Banner: imagem alinhada centro-direita
Alterar `object-cover` para `object-right-center` no `HeroBanner`.

### 7. Live TV mobile: player fixo no topo
Reestruturar `LiveTV.tsx` para mobile: player com `position: sticky; top: 0; z-index: 10` e lista de canais em grid com scroll vertical passando por baixo.

### 8. Seções dinâmicas sazonais
Criar helper `getSeasonalSections()` em `Index.tsx` que calcula datas:
- **Semana Santa**: Seg 06:01 antes da Páscoa → Seg 23:59 após. Filtra gênero "Religioso".
- **Dia das Mães**: Sex 08:00 antes → Seg 14:00. Filtra por keywords de mães.
- **Dia dos Pais**: Sex 07:00 antes → Seg 13:00. Keywords de pais.
- **Semana das Crianças**: 8/10 09:00 → 13/10 22:51. Filtra `kids: true`.
- **Natal**: Seg da semana do Natal 02:00 → 27/12 00:00. Filtra "Natal".
- **Cofre de Histórias $**: Dom 13:13 → Qua 12:47 semanal. Keywords financeiras.
Seções inseridas na posição 2 da home, colapsam sem espaço vago.

### 9. Navegação infinita (wrap-around)
- Horizontal: ao chegar na última capa, volta para a primeira sem scroll reverso.
- Vertical: ao chegar na última linha e pressionar ↓, volta para a primeira.
- Foco inicial sempre na primeira capa da primeira linha ao entrar em qualquer página.

### 10. Foco visível e scroll centralizado
Garantir `scrollIntoView({ block: 'center' })` ao navegar por teclado/controle. Foco nunca sai da viewport.

### 11. Breakpoints de capas por dispositivo
- TV: 6 por linha
- Desktop: 5
- Tablet: 3-4
- Mobile: 2

---

## O que NÃO será implementado (listar para configuração posterior)

1. **Shaka Player** — Incompatível com a arquitetura Vite/React atual (requer build nativo). O HLS.js existente já cobre HLS/MP4. DASH não está em uso nos conteúdos.
2. **MPEG-DASH (dash.js)** — Nenhum conteúdo no sistema usa DASH. Pode ser adicionado quando necessário.
3. **Webpack** — O projeto usa Vite. Migrar para Webpack é regressivo e desnecessário.
4. **Lottie Animations** — Pode ser adicionado posteriormente para splash/loading. Não é prioridade funcional.
5. **Adaptive Bitrate Streaming** — Já parcialmente coberto pelo HLS.js com `startLevel: -1` (auto quality). Shaka Player seria necessário para ABR completo com DASH.
6. **Artwork Personalization** (capas dinâmicas por perfil de usuário) — Requer sistema de perfis e ML. Fora do escopo atual.
7. **Dual audio / legendas** — Requer metadados de faixas de áudio nos arquivos de mídia. Não disponível nos conteúdos atuais.
8. **React e TypeScript** — Já instalados e configurados.
9. **Service Worker e PWA** — Já configurados via `vite-plugin-pwa`.

---

## Arquivos a serem modificados

| Arquivo | Alteração |
|---|---|
| `supabase/migrations/` | Nova migration: fix RLS permissiva |
| `supabase/functions/sync-content/index.ts` | Fix type error |
| `src/components/PreviewCard.tsx` | Fix trailer vs url, áudio, grid CSS |
| `src/components/CategoryGrid.tsx` | Grid responsivo 5→4→3→2 colunas |
| `src/components/LiveTV.tsx` | Player fixo mobile |
| `src/components/HeroBanner.tsx` | Imagem centro-direita |
| `src/components/MovieRow.tsx` | Wrap-around horizontal |
| `src/pages/Index.tsx` | Seções sazonais, navegação infinita vertical, foco inicial |
| `src/index.css` | Estilos do media-grid |
| `src/hooks/useSmartTV.ts` | Scroll centralizado, foco visível |

