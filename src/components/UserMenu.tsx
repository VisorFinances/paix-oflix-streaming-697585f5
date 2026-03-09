import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch avatar from profile
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  if (!user) return null;

  const initials = (user.user_metadata?.display_name || user.email || '?')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayAvatar = avatarUrl || googleAvatar;

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      toast({ title: 'Até logo!', description: 'Você saiu da sua conta.' });
      navigate('/login');
    } catch {
      toast({ title: 'Erro ao sair', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-muted hover:bg-muted/80 transition-colors px-2 py-1"
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-card border border-border rounded-lg shadow-xl py-2">
            <div className="px-4 py-2 border-b border-border flex items-center gap-3">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.user_metadata?.display_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {loading ? 'Saindo...' : 'Sair da conta'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;