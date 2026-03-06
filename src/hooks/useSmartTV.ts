import { useEffect } from 'react';

export function useSmartTV() {
  useEffect(() => {
    // Block context menu & dev tools
    const blockContext = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);

    // Hide cursor after 3s of inactivity
    let cursorTimer: ReturnType<typeof setTimeout>;
    const hideCursor = () => { document.body.style.cursor = 'none'; };
    const showCursor = () => {
      document.body.style.cursor = '';
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(hideCursor, 3000);
    };
    document.addEventListener('mousemove', showCursor);
    document.addEventListener('touchstart', showCursor);
    cursorTimer = setTimeout(hideCursor, 3000);

    // D-Pad / Arrow key navigation with spatial awareness
    const handleDPad = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      } else if (e.key === 'Enter') {
        (document.activeElement as HTMLElement)?.click();
        return;
      } else {
        return;
      }

      const allFocusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-nav], button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])'
        )
      ).filter(el => el.offsetParent !== null && el.offsetWidth > 0);

      if (allFocusable.length === 0) return;

      const current = document.activeElement as HTMLElement;
      const isSidebar = current?.closest('aside') !== null;
      const sidebarItems = allFocusable.filter(el => el.closest('aside'));
      const contentItems = allFocusable.filter(el => !el.closest('aside'));

      // Sidebar → Content
      if (isSidebar && e.key === 'ArrowRight') {
        if (contentItems.length > 0) {
          contentItems[0].focus();
          contentItems[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        return;
      }

      // Content → Sidebar
      if (!isSidebar && e.key === 'ArrowLeft') {
        const currentRect = current?.getBoundingClientRect();
        const contentArea = document.querySelector('main');
        if (contentArea && currentRect) {
          const contentLeft = contentArea.getBoundingClientRect().left;
          if (currentRect.left - contentLeft < 100) {
            if (sidebarItems.length > 0) {
              const closest = findSpatialNearest(current, sidebarItems, 'left');
              if (closest) {
                closest.focus();
                return;
              }
            }
          }
        }
      }

      // Within sidebar: up/down with wrap-around
      if (isSidebar) {
        const idx = sidebarItems.indexOf(current);
        if (e.key === 'ArrowDown') {
          const next = idx < sidebarItems.length - 1 ? idx + 1 : 0;
          sidebarItems[next].focus();
          sidebarItems[next].scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
          const prev = idx > 0 ? idx - 1 : sidebarItems.length - 1;
          sidebarItems[prev].focus();
          sidebarItems[prev].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        return;
      }

      // Content spatial navigation with wrap-around
      const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      let target = findSpatialNearest(current, contentItems, direction);
      
      // Wrap-around: if no target found, wrap to opposite end
      if (!target && contentItems.length > 0) {
        if (direction === 'right') target = contentItems[0];
        else if (direction === 'left') target = contentItems[contentItems.length - 1];
        else if (direction === 'down') target = contentItems[0];
        else if (direction === 'up') target = contentItems[contentItems.length - 1];
      }
      
      if (target) {
        target.focus();
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    };

    document.addEventListener('keydown', handleDPad);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('mousemove', showCursor);
      document.removeEventListener('touchstart', showCursor);
      document.removeEventListener('keydown', handleDPad);
      clearTimeout(cursorTimer);
      document.body.style.cursor = '';
    };
  }, []);
}

function findSpatialNearest(
  current: HTMLElement | null,
  candidates: HTMLElement[],
  direction: 'up' | 'down' | 'left' | 'right'
): HTMLElement | null {
  if (!current) return candidates[0] || null;

  const rect = current.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let best: HTMLElement | null = null;
  let bestDist = Infinity;

  for (const el of candidates) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2;

    const dx = ex - cx;
    const dy = ey - cy;

    let valid = false;
    switch (direction) {
      case 'right': valid = dx > 10; break;
      case 'left': valid = dx < -10; break;
      case 'down': valid = dy > 10; break;
      case 'up': valid = dy < -10; break;
    }

    if (!valid) continue;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const alignment = direction === 'left' || direction === 'right'
      ? Math.abs(dy) * 2
      : Math.abs(dx) * 2;
    const score = dist + alignment;

    if (score < bestDist) {
      bestDist = score;
      best = el;
    }
  }

  return best;
}
