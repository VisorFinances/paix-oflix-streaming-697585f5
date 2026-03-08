

# Plano: Completar Upload + Visual Premium (Prime Video) + Hero com Trailers

## 1. Completar dados faltantes no banco

**Status atual do banco:**
| Tabela | No DB | No JSON | Ação |
|---|---|---|---|
| filmes | 47 | ~280 | Limpar e reinserir todos (~280) |
| series | 100 | ~107 | Limpar e reinserir todos |
| kids_filmes | 0 | ~46 | Inserir todos (~46) |
| kids_series | 15 | ~25 | Limpar e reinserir todos |

Usar a edge function `populate-tables` com `source_url` apontando para os JSON em `public/data/` (via GitHub raw URL) para popular todas as 4 tabelas.

---

## 2. Visual Premium das Capas (Inspiração Prime Video)

Redesign do `PreviewCard` e `MovieCard` para visual premium:

- **Aspect ratio 2:3** (poster cinematográfico) mantido
- **Cantos arredondados 8px** com sombra suave `0 4px 20px rgba(0,0,0,0.5)`
- **Hover/Focus**: escala 1.05 (sutil, sem exagero), borda luminosa `2px solid rgba(255,255,255,0.15)`
- **Gradiente inferior**: `linear-gradient(to top, #000 0%, transparent 60%)` — apenas título + metadados
- **Badge "NOVO"**: para `year >= 2025`, canto superior esquerdo, fundo azul Prime-style
- **Rating pill**: estrela + nota, fundo semitransparente
- **Tipografia**: título em `font-weight: 600`, 13px, max 2 linhas; meta em 11px, opacidade 70%
- **Remoção do expand on hover**: no Prime Video, cards não expandem — ao clicar abre modal. Manter expand apenas em desktop, desativar em mobile/TV.
- Aplicar em: Home, Cinema, Séries, Kids, Minha Lista, Busca — todos os locais que usam `PreviewCard` ou `MovieCard`

**CSS media-grid atualizado:**
- gap reduzido para 12px (Prime usa espaçamento apertado)
- Cards mais largos em TV (6 colunas)

---

## 3. Hero Banner com Trailers (todas as páginas exceto TV ao Vivo)

Redesign do `HeroBanner`:

- **Timing**: Capa aparece → após 300ms inicia trailer (sem som, muted) → trailer roda por 700ms → transição suave (crossfade 500ms) → próxima capa + trailer
- **Ciclo total por item**: 300ms espera + 700ms trailer + 500ms transição = ~1.5s por destaque
- **Sem som**: `muted` sempre no hero
- **Trailer source**: usar campo `movie.trailer` (YouTube embed ou direct video)
- **Fallback**: se trailer indisponível, mostrar capa estática por 1.5s e avançar
- **Páginas com Hero**: Home (filmes + séries + kids, exceto TV ao vivo), Cinema, Séries, Kids
- **Página sem Hero**: TV ao Vivo (mantém layout atual)

Implementação:
- No hero, usar `<video>` tag para trailers diretos e iframe para YouTube (com autoplay, muted, controls=0)
- Pré-carregar próximo trailer enquanto atual toca
- Para YouTube: usar embed URL com `&start=30` para pegar trecho mais interessante

---

## 4. Testes de Responsividade

Ajustes CSS para garantir funcionalidade em todos os dispositivos:

- **Smart TV LG WebOS / Samsung Tizen**: foco visível com borda dourada, navegação D-pad, cards 6 colunas
- **Android TV / TV Box / Fire Stick**: mesmos ajustes TV + performance (disable hover expand, reduce animations)
- **Mobile (< 640px)**: cards 2 colunas, hero height 40vh, touch-friendly (sem hover expand)
- **Tablet (640-1024px)**: cards 3 colunas, hero 50vh
- **Desktop (> 1024px)**: cards 5 colunas, hero 70vh, hover expand ativo
- **Internet lenta**: skeleton loading já existe; adicionar `loading="lazy"` em todas as imagens (já existe); limitar trailers do hero a conexões rápidas (checar `navigator.connection`)

Usar `prefers-reduced-motion` para desabilitar animações em dispositivos que solicitam.

---

## Arquivos a modificar

| Arquivo | Alteração |
|---|---|
| `src/components/PreviewCard.tsx` | Visual premium Prime Video |
| `src/components/MovieCard.tsx` | Alinhar visual com PreviewCard |
| `src/components/HeroBanner.tsx` | Adicionar trailers muted com timing 300ms/700ms |
| `src/components/CategoryGrid.tsx` | Ajustar grid gap |
| `src/components/MovieRow.tsx` | Ajustar gap e sizing |
| `src/index.css` | Atualizar `.media-grid`, `.movie-card`, variáveis |
| `src/pages/Index.tsx` | Adicionar HeroBanner nas views Cinema/Séries/Kids |
| `src/components/LiveTV.tsx` | Sem hero (manter como está) |

