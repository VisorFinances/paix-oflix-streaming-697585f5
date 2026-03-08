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

    // D-Pad / Arrow key navigation with row-aware spatial logic
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

      // Content: Row-aware navigation
      const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      
      if (direction === 'left' || direction === 'right') {
        // Horizontal: find items in the same row (similar Y position)
        const currentRect = current?.getBoundingClientRect();
        if (!currentRect) return;
        const cy = currentRect.top + currentRect.height / 2;
        
        // Items in the same row (within 40px vertically)
        const rowItems = contentItems.filter(el => {
          const r = el.getBoundingClientRect();
          return Math.abs((r.top + r.height / 2) - cy) < 40;
        }).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        
        const idx = rowItems.indexOf(current);
        if (idx === -1) {
          // Not found in row, use spatial
          const target = findSpatialNearest(current, contentItems, direction);
          if (target) { target.focus(); target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
          return;
        }
        
        let nextIdx: number;
        if (direction === 'right') {
          nextIdx = idx < rowItems.length - 1 ? idx + 1 : 0; // wrap
        } else {
          nextIdx = idx > 0 ? idx - 1 : rowItems.length - 1; // wrap
        }
        rowItems[nextIdx].focus();
        rowItems[nextIdx].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      } else {
        // Vertical: find the nearest item in the target direction
        // Group items by rows
        const rows = groupByRows(contentItems);
        const currentRect = current?.getBoundingClientRect();
        if (!currentRect) return;
        const cy = currentRect.top + currentRect.height / 2;
        const cx = currentRect.left + currentRect.width / 2;
        
        // Find which row the current element is in
        let currentRowIdx = -1;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].includes(current)) { currentRowIdx = i; break; }
        }
        
        let targetRowIdx: number;
        if (direction === 'down') {
          targetRowIdx = currentRowIdx < rows.length - 1 ? currentRowIdx + 1 : 0; // wrap
        } else {
          targetRowIdx = currentRowIdx > 0 ? currentRowIdx - 1 : rows.length - 1; // wrap
        }
        
        // In the target row, find the element closest horizontally
        const targetRow = rows[targetRowIdx];
        if (!targetRow || targetRow.length === 0) return;
        
        let bestEl = targetRow[0];
        let bestDist = Infinity;
        for (const el of targetRow) {
          const r = el.getBoundingClientRect();
          const dist = Math.abs((r.left + r.width / 2) - cx);
          if (dist < bestDist) {
            bestDist = dist;
            bestEl = el;
          }
        }
        
        bestEl.focus();
        bestEl.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
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

/** Group elements into rows based on vertical position */
function groupByRows(elements: HTMLElement[]): HTMLElement[][] {
  if (elements.length === 0) return [];
  
  const sorted = [...elements].sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return (ar.top + ar.height / 2) - (br.top + br.height / 2);
  });
  
  const rows: HTMLElement[][] = [];
  let currentRow: HTMLElement[] = [sorted[0]];
  let currentY = sorted[0].getBoundingClientRect().top + sorted[0].getBoundingClientRect().height / 2;
  
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i].getBoundingClientRect();
    const y = r.top + r.height / 2;
    if (Math.abs(y - currentY) < 40) {
      currentRow.push(sorted[i]);
    } else {
      // Sort the completed row by X
      currentRow.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      rows.push(currentRow);
      currentRow = [sorted[i]];
      currentY = y;
    }
  }
  currentRow.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  rows.push(currentRow);
  
  return rows;
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
