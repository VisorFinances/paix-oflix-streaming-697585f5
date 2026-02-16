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
    let timer: ReturnType<typeof setTimeout>;
    const hideCursor = () => {
      document.body.style.cursor = 'none';
    };
    const showCursor = () => {
      document.body.style.cursor = '';
      clearTimeout(timer);
      timer = setTimeout(hideCursor, 3000);
    };
    document.addEventListener('mousemove', showCursor);
    timer = setTimeout(hideCursor, 3000);

    // D-Pad / Arrow key navigation
    const handleDPad = (e: KeyboardEvent) => {
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button, a, [tabindex]:not([tabindex="-1"]), input, select'
        )
      ).filter(el => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const current = document.activeElement as HTMLElement;
      const idx = focusable.indexOf(current);

      if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const next = idx < focusable.length - 1 ? idx + 1 : 0;
        focusable[next].focus();
        focusable[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : focusable.length - 1;
        focusable[prev].focus();
        focusable[prev].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (e.key === 'Enter') {
        current?.click();
      }
    };

    document.addEventListener('keydown', handleDPad);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('mousemove', showCursor);
      document.removeEventListener('keydown', handleDPad);
      clearTimeout(timer);
      document.body.style.cursor = '';
    };
  }, []);
}
