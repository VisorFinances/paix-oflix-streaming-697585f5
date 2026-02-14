import { Film, Tv, Radio, Baby, Clapperboard } from 'lucide-react';

interface MenuCardsProps {
  onNavigate: (category: string) => void;
}

const tiles = [
  { id: 'cinema', label: 'Cinema', icon: Film, gradient: 'from-blue-900 to-blue-700' },
  { id: 'series', label: 'Séries', icon: Tv, gradient: 'from-emerald-900 to-emerald-700' },
  { id: 'live', label: 'TV ao Vivo', icon: Radio, gradient: 'from-red-900 to-red-700' },
  { id: 'kids-movies', label: 'Filmes Kids', icon: Baby, gradient: 'from-purple-900 to-purple-700' },
  { id: 'kids-series', label: 'Séries Kids', icon: Clapperboard, gradient: 'from-amber-900 to-amber-700' },
];

const MenuCards = ({ onNavigate }: MenuCardsProps) => {
  return (
    <section className="px-4 md:px-12 mb-10">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map(tile => (
          <button
            key={tile.id}
            onClick={() => onNavigate(tile.id)}
            className={`menu-tile relative h-28 md:h-36 bg-gradient-to-br ${tile.gradient} flex flex-col items-center justify-center gap-2 rounded-lg border border-border/30`}
          >
            <tile.icon className="w-8 h-8 text-foreground/90" />
            <span className="font-display text-lg tracking-wider text-foreground">{tile.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default MenuCards;
