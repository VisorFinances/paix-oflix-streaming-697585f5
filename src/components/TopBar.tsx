import { useEffect, useState } from 'react';
import { Movie } from '@/types';
import UserMenu from './UserMenu';

interface TopBarProps {
  movies: Movie[];
}

const TopBar = ({ movies }: TopBarProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = movies.length;
    if (target === 0) return;
    
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [movies.length]);

  return (
    <div className="w-full bg-background/80 backdrop-blur-md z-50 relative">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-12 py-2 sm:py-3">
        {/* Logo left */}
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="PaixãoFlix"
            className="h-[75px] sm:h-[80px] w-auto object-contain"
          />
        </div>

        {/* Dynamic content counter center */}
        <div className="flex items-center justify-center">
          <span className="text-xs sm:text-sm md:text-base font-bold text-foreground tabular-nums text-center">
            Já temos {count.toLocaleString('pt-BR')} conteúdos
          </span>
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
};

export default TopBar;