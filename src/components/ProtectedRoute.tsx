import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import DeviceSelectionDialog from '@/components/DeviceSelectionDialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, isActive, needsDeviceSelection, updateSubscription } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const navigate = useNavigate();

  const loading = authLoading || subLoading || adminLoading;

  useEffect(() => {
    if (!loading && isActive && needsDeviceSelection) {
      setShowDeviceDialog(true);
    }
  }, [loading, isActive, needsDeviceSelection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[100px] w-auto object-contain animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If subscription is not active, show paywall
  if (!isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[100px] w-auto object-contain mx-auto" />
          <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Assinatura Necessária</h2>
            <p className="text-muted-foreground">
              Para acessar o conteúdo, você precisa ter uma assinatura ativa. 
              Escolha um plano para começar a assistir.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-12 text-base font-bold"
            >
              Escolher um Plano
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleDeviceSelect = async (deviceType: 'mobile' | 'smarttv') => {
    try {
      await updateSubscription({ device_type: deviceType });
    } catch (err) {
      console.error('Error updating device type:', err);
    }
  };

  return (
    <>
      <DeviceSelectionDialog
        open={showDeviceDialog}
        onSelect={handleDeviceSelect}
        onClose={() => setShowDeviceDialog(false)}
      />
      {children}
    </>
  );
};

export default ProtectedRoute;
