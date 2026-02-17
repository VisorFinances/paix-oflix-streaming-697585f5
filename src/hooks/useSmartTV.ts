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

      // Sidebar → Content: pressing Right from sidebar goes to first content item
      if (isSidebar && e.key === 'ArrowRight') {
        if (contentItems.length > 0) {
          contentItems[0].focus();
          contentItems[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
      }

      // Content → Sidebar: pressing Left from first column goes to sidebar
      if (!isSidebar && e.key === 'ArrowLeft') {
        const currentRect = current?.getBoundingClientRect();
        // Check if we're roughly at the left edge of content
        const contentArea = document.querySelector('main');
        if (contentArea && currentRect) {
          const contentLeft = contentArea.getBoundingClientRect().left;
          if (currentRect.left - contentLeft < 100) {
            // Go to sidebar - find closest sidebar item
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

      // Within sidebar: up/down only
      if (isSidebar) {
        const idx = sidebarItems.indexOf(current);
        if (e.key === 'ArrowDown') {
          const next = idx < sidebarItems.length - 1 ? idx + 1 : 0;
          sidebarItems[next].focus();
        } else if (e.key === 'ArrowUp') {
          const prev = idx > 0 ? idx - 1 : sidebarItems.length - 1;
          sidebarItems[prev].focus();
        }
        return;
      }

      // Content spatial navigation
      const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      const target = findSpatialNearest(current, contentItems, direction);
      if (target) {
        target.focus();
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
    // Weight: prefer items more aligned with the direction
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
