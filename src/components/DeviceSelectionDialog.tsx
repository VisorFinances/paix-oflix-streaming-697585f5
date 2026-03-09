import { useState } from 'react';
import { Smartphone, Tv, Monitor, Download, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeviceSelectionDialogProps {
  open: boolean;
  onSelect: (deviceType: 'mobile' | 'smarttv') => void;
  onClose: () => void;
}

type Step = 'choose_device' | 'mobile_result' | 'smarttv_android_check' | 'smarttv_android' | 'smarttv_other';

const DeviceSelectionDialog = ({ open, onSelect, onClose }: DeviceSelectionDialogProps) => {
  const [step, setStep] = useState<Step>('choose_device');

  if (!open) return null;

  const handleDeviceChoice = (type: 'mobile' | 'smarttv') => {
    if (type === 'mobile') {
      onSelect('mobile');
      setStep('mobile_result');
    } else {
      setStep('smarttv_android_check');
    }
  };

  const handleAndroidChoice = (isAndroid: boolean) => {
    onSelect('smarttv');
    if (isAndroid) {
      setStep('smarttv_android');
    } else {
      setStep('smarttv_other');
    }
  };

  const handleClose = () => {
    setStep('choose_device');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-300">
        <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {step === 'choose_device' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Onde você vai assistir?</h2>
              <p className="text-muted-foreground mt-2">Selecione o tipo de dispositivo</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDeviceChoice('mobile')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-secondary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
              >
                <Smartphone className="w-12 h-12 text-primary" />
                <span className="font-semibold text-foreground">Dispositivo Móvel</span>
                <span className="text-xs text-muted-foreground text-center">Celular ou Tablet</span>
              </button>
              <button
                onClick={() => handleDeviceChoice('smarttv')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-secondary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
              >
                <Tv className="w-12 h-12 text-primary" />
                <span className="font-semibold text-foreground">Smart TV</span>
                <span className="text-xs text-muted-foreground text-center">TV ou TV Box</span>
              </button>
            </div>
          </div>
        )}

        {step === 'mobile_result' && (
          <div className="space-y-6 text-center">
            <Download className="w-16 h-16 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Instale o App</h2>
              <p className="text-muted-foreground mt-2">
                Acesse o link abaixo pelo navegador do seu celular para instalar o PaixãoFlix como aplicativo.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Abra no navegador do celular:</p>
              <a
                href="https://paixao-stream-hub.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline break-all text-lg"
              >
                paixao-stream-hub.lovable.app
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                No Chrome: Menu ⋮ → "Instalar aplicativo"<br />
                No Safari: Compartilhar → "Adicionar à Tela de Início"
              </p>
            </div>
            <Button onClick={handleClose} className="w-full h-12">Entendi</Button>
          </div>
        )}

        {step === 'smarttv_android_check' && (
          <div className="space-y-6">
            <div className="text-center">
              <Monitor className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Sua TV é Android?</h2>
              <p className="text-muted-foreground mt-2">
                TVs com sistema Android (Android TV, Google TV) ou TV Boxes com Android
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-16 text-lg"
                onClick={() => handleAndroidChoice(true)}
              >
                ✅ Sim, é Android
              </Button>
              <Button
                variant="outline"
                className="h-16 text-lg"
                onClick={() => handleAndroidChoice(false)}
              >
                ❌ Não é Android
              </Button>
            </div>
          </div>
        )}

        {step === 'smarttv_android' && (
          <div className="space-y-6 text-center">
            <Tv className="w-16 h-16 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">TV Android</h2>
              <p className="text-muted-foreground mt-2">
                Acesse o site abaixo pelo navegador da sua TV para baixar e instalar o aplicativo PaixãoFlix.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Abra no navegador da TV:</p>
              <a
                href="https://tvpremium.paixaoflix.vip"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline break-all text-xl"
              >
                tvpremium.paixaoflix.vip
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                Use o navegador da TV para acessar e fazer o download do sistema.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full h-12">Entendi</Button>
          </div>
        )}

        {step === 'smarttv_other' && (
          <div className="space-y-6 text-center">
            <Tv className="w-16 h-16 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Smart TV (WebOS / Tizen)</h2>
              <p className="text-muted-foreground mt-2">
                Acesse o PaixãoFlix diretamente pelo navegador da sua TV e faça login com sua conta.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Abra no navegador da TV:</p>
              <a
                href="https://paixao-stream-hub.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline break-all text-xl"
              >
                paixao-stream-hub.lovable.app
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                Faça login com seu e-mail e senha para começar a assistir.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full h-12">Entendi</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceSelectionDialog;
