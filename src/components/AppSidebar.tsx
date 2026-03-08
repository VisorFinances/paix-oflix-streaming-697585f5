import { Home, Search, Film, Tv, Radio, Baby, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface AppSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Pesquisa', icon: Search },
  { id: 'cinema', label: 'Cinema', icon: Film },
  { id: 'series', label: 'Séries', icon: Tv },
  { id: 'live', label: 'TV ao Vivo', icon: Radio },
  { id: 'kids', label: 'Kids', icon: Baby },
  { id: 'mylist', label: 'Favoritos', icon: Heart },
];

const AppSidebar = ({ activeView, onNavigate }: AppSidebarProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Mobile bottom nav — ALL 7 menus */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-border sm:hidden safe-area-bottom">
        <div className="flex justify-around py-1 px-0.5">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 transition-colors min-w-0 flex-shrink-0 rounded-lg active:scale-95 ${
                  isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground'
                }`}
                data-nav="sidebar"
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} />
                <span className="text-[9px] leading-tight whitespace-nowrap font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile overlay */}
      {expanded && (
        <div
          className="fixed inset-0 bg-background/60 z-40 hidden sm:block"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`sidebar-nav fixed top-0 left-0 h-full z-50 hidden sm:flex flex-col bg-sidebar border-r border-sidebar-border
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
            <button onClick={() => setExpanded(true)} className="text-sidebar-foreground hover:text-foreground transition" data-nav="sidebar">
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
                data-nav="sidebar"
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
