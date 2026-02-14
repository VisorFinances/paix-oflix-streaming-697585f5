import { Home, Search, Film, Tv, Radio, Baby, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface AppSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'cinema', label: 'Cinema', icon: Film },
  { id: 'series', label: 'Séries', icon: Tv },
  { id: 'live', label: 'TV ao Vivo', icon: Radio },
  { id: 'kids', label: 'Kids', icon: Baby },
  { id: 'mylist', label: 'Minha Lista', icon: Heart },
];

const AppSidebar = ({ activeView, onNavigate }: AppSidebarProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {expanded && (
        <div
          className="fixed inset-0 bg-background/60 z-40 md:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className={`sidebar-nav fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar border-r border-sidebar-border
          ${expanded ? 'w-56' : 'w-16'}`}
      >
        {/* Logo / Toggle */}
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
          {expanded ? (
            <div className="flex items-center justify-between w-full px-3">
              <img src="/images/logo.png" alt="PaixãoFlix" className="h-9" />
              <button onClick={() => setExpanded(false)} className="text-sidebar-foreground hover:text-foreground transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setExpanded(true)} className="text-sidebar-foreground hover:text-foreground transition">
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setExpanded(false); }}
                className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-md mx-2
                  ${isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {expanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
