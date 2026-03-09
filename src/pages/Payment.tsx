import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Loader2, QrCode, ArrowLeft, RefreshCw } from 'lucide-react';

const Payment = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isActive, refetch } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const plan = searchParams.get('plan') || 'pro';
  const amount = plan === 'pro' ? 1.00 : 0.01;
  const planName = plan === 'pro' ? 'Pro' : 'Básico';

  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isActive) {
      toast({ title: 'Pagamento confirmado!', description: 'Sua assinatura está ativa.' });
      navigate('/');
    }
  }, [isActive, navigate, toast]);

  // Poll for payment confirmation
  useEffect(() => {
    if (!pixCode || isActive) return;

    const interval = setInterval(async () => {
      await refetch();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [pixCode, isActive, refetch]);

  const generatePix = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: { plan, amount, email: user.email },
      });

      if (error) throw error;

      setPixCode(data.qr_code || '');
      setQrCodeBase64(data.qr_code_base64 || '');
    } catch (err: any) {
      console.error('Error generating PIX:', err);
      toast({
        title: 'Erro ao gerar PIX',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({ title: 'Código PIX copiado!' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleCheckPayment = async () => {
    setChecking(true);
    await refetch();
    setChecking(false);
    if (!isActive) {
      toast({ title: 'Pagamento ainda não confirmado', description: 'Aguarde alguns instantes após o pagamento.' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src="/images/logo.png" alt="PaixãoFlix" className="h-[80px] w-auto object-contain animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[80px] w-auto object-contain" />
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Pagamento via PIX</h1>
            <p className="text-muted-foreground mt-2">
              Plano {planName} — <span className="text-foreground font-semibold">R$ {amount.toFixed(2)}/mês</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {!pixCode ? (
              <div className="text-center space-y-4">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">
                  Clique abaixo para gerar seu QR Code PIX
                </p>
                <Button
                  onClick={generatePix}
                  disabled={loading}
                  className="w-full h-12 text-base font-bold"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando PIX...</>
                  ) : (
                    'Gerar QR Code PIX'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* QR Code */}
                {qrCodeBase64 && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl">
                      <img
                        src={`data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                )}

                {/* Copy PIX Code */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Ou copie o código PIX abaixo:
                  </p>
                  <div className="relative">
                    <div className="bg-secondary/50 border border-border rounded-lg p-3 pr-12 text-xs text-foreground break-all max-h-24 overflow-y-auto font-mono">
                      {pixCode}
                    </div>
                    <button
                      onClick={copyPixCode}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aguardando pagamento...</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCheckPayment}
                    disabled={checking}
                    className="w-full"
                  >
                    {checking ? (
                      <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Verificando...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Já paguei, verificar</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-x-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:underline">Termos de Uso</Link>
            <Link to="/privacy" className="hover:underline">Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
