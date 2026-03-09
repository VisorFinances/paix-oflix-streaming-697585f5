

## Problema: Trailer do Banner não toca no mobile

### Causa raiz
O banner usa iframes do YouTube com `autoplay=1`, mas **navegadores mobile bloqueiam autoplay de iframes do YouTube** mesmo com `mute=1`. O resultado é que o banner troca para a fase "trailer", esconde a imagem de capa (`opacity-0`), mas o iframe não reproduz — ficando parado/preto.

Para vídeos diretos (`<video>`), o autoplay mudo funciona no mobile, mas para YouTube embeds não há garantia.

### Solução

1. **Desabilitar trailers do YouTube no mobile** — No `HeroBanner.tsx`, detectar mobile via `useIsMobile()` e setar `canPlayTrailer = false` quando for YouTube embed (manter para vídeos diretos que funcionam com `muted playsInline`)
2. **Aumentar o tempo de exibição da capa no mobile** — Como não haverá trailer, usar duração maior (6-7 segundos) para cada slide no mobile
3. **Adicionar swipe gesture** — Implementar suporte a swipe horizontal (touch) no mobile para que o usuário possa navegar manualmente entre os banners, tornando a experiência mais interativa

### Arquivos afetados
- `src/components/HeroBanner.tsx` — Importar `useIsMobile`, condicionar trailer YouTube, adicionar touch handlers (onTouchStart/onTouchEnd) para swipe, ajustar duração mobile

### Implementação resumida
```tsx
// HeroBanner.tsx
const isMobile = useIsMobile();

// Na lógica de hasTrailer:
const hasTrailer = canPlayTrailer && !isMobile && !!movie?.trailer;
// Ou para permitir vídeo direto no mobile:
const hasTrailer = canPlayTrailer && !!movie?.trailer && (!isMobile || isDirectVideo(movie.trailer!));

// Touch swipe:
const touchStartX = useRef(0);
<div onTouchStart={e => touchStartX.current = e.touches[0].clientX}
     onTouchEnd={e => {
       const diff = touchStartX.current - e.changedTouches[0].clientX;
       if (Math.abs(diff) > 50) diff > 0 ? advanceToNext() : goToPrev();
     }}>
```

