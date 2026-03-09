import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Search, Check, X, ArrowLeft } from 'lucide-react';

interface UserSub {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  max_screens: number;
  device_type: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<(UserSub & { profile?: Profile })[]>([]);
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  const loading = authLoading || adminLoading;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subs) {
        const userIds = subs.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        const merged = subs.map(s => ({
          ...s,
          profile: profiles?.find(p => p.id === s.user_id),
        }));
        setSubscriptions(merged as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleStatus = async (sub: UserSub) => {
    const newStatus = sub.status === 'active' ? 'pending' : 'active';
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: newStatus })
      .eq('id', sub.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Status alterado para ${newStatus}` });
      fetchData();
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src="/images/logo.png" alt="PaixãoFlix" className="h-[100px] w-auto object-contain animate-pulse" />
      </div>
    );
  }

  const filtered = subscriptions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.profile?.email?.toLowerCase().includes(q) ||
      s.profile?.display_name?.toLowerCase().includes(q) ||
      s.plan.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[100px] w-auto object-contain" />
          <div className="flex items-center gap-2 ml-auto">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Administrador</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" /> Gerenciar Assinaturas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{subscriptions.length} usuários cadastrados</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loadingData ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Usuário</th>
                  <th className="pb-3 pr-4">Plano</th>
                  <th className="pb-3 pr-4">Telas</th>
                  <th className="pb-3 pr-4">Dispositivo</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-foreground">{sub.profile?.display_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{sub.profile?.email || '—'}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 capitalize">{sub.plan}</td>
                    <td className="py-3 pr-4">{sub.max_screens}</td>
                    <td className="py-3 pr-4 capitalize">{sub.device_type || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {sub.status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {sub.status === 'active' ? 'Ativo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant={sub.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => toggleStatus(sub)}
                      >
                        {sub.status === 'active' ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
