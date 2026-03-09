

## Plano de Correções PaixãoFlix

Este plano aborda todas as solicitações organizadas por prioridade.

---

### 1. Capas uniformes em 10% — sem exceção, não mexer no celular

O CSS atual já tem os breakpoints com +10%. Verificar que `grid-row .pv-card` e `kids-grid .pv-card` também usam `width: 100%` (OK). O problema é que `.grid-row` usa `grid-template-columns: repeat(5, 1fr)` no desktop e `repeat(3, 1fr)` no mobile — as capas já preenchem. Garantir que **nenhum** lugar use tamanhos menores que os definidos. Manter mobile inalterado.

**Arquivo:** `src/index.css` — verificar consistência dos tamanhos.

---

### 2. Banner/Trailer não funciona em lugar nenhum

O `HeroBanner` usa YouTube iframes para trailers. No desktop, o autoplay com `mute=1` deveria funcionar. Problema: o `youtubeUrl` só é gerado quando `!isMobile`, mas no desktop também pode falhar se `canPlayTrailer` foi setado como `false` por conexão lenta.

**Correções em `src/components/HeroBanner.tsx`:**
- Remover restrição de `!isMobile` para YouTube no desktop (manter para mobile)
- O banner precisa ser **específico por página** — já está (cada view passa movies filtrados)
- Garantir que o banner atualiza a cada reinício (já faz via `movies` prop change)
- Usar imagens TMDB em resolução `original` para backdrop no banner (já usa `original` em `tmdbSearch`)

---

### 3. Capas com imagem de alta qualidade no banner, sem corte

**Arquivo:** `src/components/HeroBanner.tsx`
- Usar `object-cover` com `object-position: center top` para não cortar rostos
- Já usa `object-cover` — OK

---

### 4. Metadados da expansão ficando atrás — z-index

**Arquivo:** `src/index.css`
- `.pv-card-meta` já tem `z-index: 110` — o problema é que cards adjacentes cobrem o meta
- Solução: quando `.pv-card-wrapper:hover`, dar `z-index: 200` ao wrapper inteiro (atualmente 100)

---

### 5. Tirar títulos das capas, deixar apenas ano, avaliação #f9ff00 e duração

**Arquivo:** `src/components/PreviewCard.tsx`
- No overlay de título (linhas 205-214), remover `movie.title`
- Mostrar apenas: ano, rating com cor `#f9ff00`, duração
- No metadata expandido (linhas 231-265), manter título

---

### 6. Player não funciona — instalar player alternativo

O `VideoPlayer.tsx` já usa HLS.js. O erro provavelmente é que `streamUrl` aponta para um diretório do Archive.org (termina com `/`) e não para um arquivo específico. O player recebe URL como `https://archive.org/download/IDENTIFIER/` sem um arquivo MP4.

**Correção em `src/components/VideoPlayer.tsx` e `src/hooks/useMovies.ts`:**
- Para URLs do Archive.org que terminam com `/`, tentar buscar o primeiro arquivo `.mp4` disponível via `https://archive.org/metadata/IDENTIFIER` API
- Adicionar lógica de resolução de URL do Archive antes de passar ao player
- Não é necessário instalar outro player — HLS.js já suporta tudo. O problema é a URL inválida.

---

### 7. Séries — mostrar todas as temporadas sem repetir capa da mesma temporada

**Arquivo:** `src/pages/Index.tsx` (função `genreCategories` para séries)
- Atualmente `deduplicateDbRows` remove temporadas duplicadas por título normalizado
- Mudar: NÃO deduplicar temporadas diferentes. Cada temporada deve aparecer como capa separada
- Deduplicar apenas quando o título + número de temporada são idênticos

---

### 8. Séries — categorias TMDB oficiais, sem "Lançamento", sem unificar gêneros

**Arquivo:** `src/pages/Index.tsx`
- Remover "Lançamento 2025" e "Lançamento 2026" da página de séries
- Cada série vai para o **primeiro gênero único** — não combinar (ex: "Ação & Aventura" → usar apenas "Ação")
- Separar gêneros compostos em `useMovies.ts`: "Sci-Fi & Fantasy" → adicionar tanto "Ficção Científica" quanto "Fantasia" como gêneros separados
- Não repetir série em mais de uma categoria

---

### 9. Barra de canais TV ao Vivo — mais clara, mais justa, player fixo, fullscreen esconde lista, 6 canais mobile

**Arquivo:** `src/components/LiveTV.tsx`
- Mudar `bg-card/30` para `bg-card/40` (levemente mais clara)
- Player fixo no desktop: já está com `md:relative md:h-screen` — mudar para `sticky top-0`
- Fullscreen: quando player está em fullscreen, esconder a lista de canais
- Mobile: `grid-cols-6` com categorias em scroll horizontal

---

### 10. Admin — escritas em branco, sem azul

**Arquivo:** `src/pages/Admin.tsx`
- Linha 120-121: `text-primary` no Shield e "Administrador" → `text-foreground`

---

### 11. Kids — 5 por linha desktop, 3 por mobile, sem scroll horizontal

**Arquivo:** `src/pages/Index.tsx` e `src/components/MovieRow.tsx`
- Na seção kids, usar `gridMode` (já está em `grid-row` que faz `repeat(5, 1fr)` desktop e `repeat(3, 1fr)` mobile)
- Adicionar `gridMode` prop às rows de Kids: `<MovieRow ... gridMode />`

---

### 12. Conexão resiliente com Supabase e Archive.org

**Arquivo:** `src/hooks/useMovies.ts`
- Já tem retry e auto-refresh a cada 7 min
- Para Archive.org: adicionar fallback para quando URL muda — usar `tmdb_id` como chave primária de lookup, não o nome do arquivo
- Adicionar `try/catch` com retry nas chamadas de metadata do Archive

---

### 13. Testar QR Code PIX

Verificar a edge function `create-pix-payment` com o token do Mercado Pago atualizado.

---

### Resumo dos arquivos

| Arquivo | Mudanças |
|---------|----------|
| `src/index.css` | z-index 200 no wrapper hover |
| `src/components/HeroBanner.tsx` | Fix trailer desktop, imagens alta qualidade |
| `src/components/PreviewCard.tsx` | Remover título, rating amarelo #f9ff00, só ano+rating+duração |
| `src/components/VideoPlayer.tsx` | Resolver URLs do Archive.org |
| `src/hooks/useMovies.ts` | Separar gêneros compostos, não deduplicar temporadas diferentes, resolver Archive URLs |
| `src/pages/Index.tsx` | Séries sem "Lançamento", genre único por série, Kids gridMode |
| `src/components/LiveTV.tsx` | Barra mais clara, player fixo, fullscreen esconde lista, 6 cols mobile |
| `src/pages/Admin.tsx` | text-primary → text-foreground |

