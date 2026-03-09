import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o e-mail.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[80px] w-auto object-contain mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground">Esqueceu sua senha?</h1>
          <p className="text-muted-foreground mt-2">
            Digite seu e-mail para receber instruções de redefinição
          </p>
        </div>

        {sent ? (
          <div className="bg-card p-8 rounded-lg border border-border text-center space-y-4">
            <p className="text-foreground">
              Um e-mail foi enviado para <strong>{email}</strong> com instruções para redefinir sua senha.
            </p>
            <Link to="/login">
              <Button className="w-full">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6 bg-card p-8 rounded-lg border border-border">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar e-mail de redefinição'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Lembrou sua senha?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
