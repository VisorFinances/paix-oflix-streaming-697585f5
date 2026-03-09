import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'basic',
    name: 'Padrão com anúncios',
    price: 'R$ 18,90',
    period: '/mês',
    quality: 'Full HD',
    resolution: '1080p',
    devices: 2,
    downloads: 2,
    ads: true,
    spatialAudio: false,
    netflixGames: true,
  },
  {
    id: 'standard',
    name: 'Padrão',
    price: 'R$ 39,90',
    period: '/mês',
    quality: 'Full HD',
    resolution: '1080p',
    devices: 2,
    downloads: 2,
    ads: false,
    spatialAudio: false,
    netflixGames: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 55,90',
    period: '/mês',
    quality: 'Ultra HD',
    resolution: '4K + HDR',
    devices: 4,
    downloads: 6,
    ads: false,
    spatialAudio: true,
    netflixGames: true,
    popular: true,
  },
];

const features = [
  {
    label: 'Preço mensal',
    key: 'price',
    render: (plan: typeof plans[0]) => (
      <span className="text-foreground font-semibold">{plan.price}<span className="text-muted-foreground text-xs font-normal">{plan.period}</span></span>
    ),
  },
  {
    label: 'Qualidade de vídeo e som',
    key: 'quality',
    render: (plan: typeof plans[0]) => (
      <span className="text-foreground">{plan.quality}</span>
    ),
  },
  {
    label: 'Resolução',
    key: 'resolution',
    render: (plan: typeof plans[0]) => (
      <span className="text-foreground">{plan.resolution}</span>
    ),
  },
  {
    label: 'Dispositivos onde você pode assistir ao mesmo tempo',
    key: 'devices',
    render: (plan: typeof plans[0]) => (
      <span className="text-foreground">{plan.devices}</span>
    ),
  },
  {
    label: 'Downloads',
    key: 'downloads',
    render: (plan: typeof plans[0]) => (
      <span className="text-foreground">{plan.downloads}</span>
    ),
  },
  {
    label: 'Sem anúncios',
    key: 'ads',
    render: (plan: typeof plans[0]) => (
      plan.ads ? (
        <X className="w-5 h-5 text-muted-foreground mx-auto" />
      ) : (
        <Check className="w-5 h-5 text-primary mx-auto" />
      )
    ),
  },
  {
    label: 'Áudio espacial (imersivo)',
    key: 'spatialAudio',
    render: (plan: typeof plans[0]) => (
      plan.spatialAudio ? (
        <Check className="w-5 h-5 text-primary mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground mx-auto" />
      )
    ),
  },
  {
    label: 'PaixãoFlix Games',
    key: 'games',
    render: (plan: typeof plans[0]) => (
      plan.netflixGames ? (
        <Check className="w-5 h-5 text-primary mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground mx-auto" />
      )
    ),
  },
];

const Plans = () => {
  const [selected, setSelected] = useState('premium');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[100px] w-auto object-contain cursor-pointer" onClick={() => navigate('/')} />
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Entrar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Title section */}
        <div className="mb-8 md:mb-12">
          <p className="text-muted-foreground text-sm mb-1">PASSO <strong className="text-foreground">1</strong> DE <strong className="text-foreground">3</strong></p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Escolha o plano ideal para você
          </h1>
          <ul className="space-y-2 mt-4">
            <li className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              Sem compromisso, cancele quando quiser.
            </li>
            <li className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              Tudo na PaixãoFlix por um preço acessível.
            </li>
            <li className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              Assista em qualquer dispositivo.
            </li>
          </ul>
        </div>

        {/* Plan Cards - Mobile */}
        <div className="md:hidden space-y-4 mb-8">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                "w-full rounded-xl p-4 text-left transition-all duration-200 border-2 relative",
                selected === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Mais popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                  <p className="text-foreground font-semibold mt-1">
                    {plan.price}<span className="text-muted-foreground text-sm font-normal">{plan.period}</span>
                  </p>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selected === plan.id ? "border-primary bg-primary" : "border-muted-foreground"
                )}>
                  {selected === plan.id && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{plan.quality}</span>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{plan.resolution}</span>
                {!plan.ads && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">Sem anúncios</span>}
                {plan.spatialAudio && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">Áudio espacial</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Comparison Table - Desktop */}
        <div className="hidden md:block mb-10">
          <div className="grid grid-cols-4 gap-0">
            {/* Header row */}
            <div className="p-4" />
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className="p-2 flex flex-col items-center"
              >
                <div className={cn(
                  "w-full rounded-xl p-5 text-center transition-all duration-300 relative border-2",
                  selected === plan.id
                    ? "border-primary bg-gradient-to-b from-primary/15 to-primary/5 shadow-lg shadow-primary/10"
                    : "border-transparent bg-card hover:bg-secondary"
                )}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Mais popular
                    </span>
                  )}
                  <h3 className={cn(
                    "font-bold text-lg transition-colors",
                    selected === plan.id ? "text-primary" : "text-foreground"
                  )}>{plan.name}</h3>
                  <p className="text-foreground font-bold text-2xl mt-2">
                    {plan.price}
                  </p>
                  <p className="text-muted-foreground text-sm">{plan.period}</p>
                </div>
              </button>
            ))}

            {/* Feature rows */}
            {features.map((feature, i) => (
              <>
                <div key={`label-${i}`} className={cn(
                  "p-4 flex items-center text-sm text-muted-foreground border-t border-border",
                  i === 0 && "border-t-0"
                )}>
                  {feature.label}
                </div>
                {plans.map((plan) => (
                  <div
                    key={`${plan.id}-${i}`}
                    className={cn(
                      "p-4 flex items-center justify-center text-sm border-t border-border transition-colors",
                      i === 0 && "border-t-0",
                      selected === plan.id && "bg-primary/5"
                    )}
                  >
                    {feature.render(plan)}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>

        {/* Mobile feature details for selected plan */}
        <div className="md:hidden mb-8">
          {(() => {
            const plan = plans.find(p => p.id === selected);
            if (!plan) return null;
            return (
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <h3 className="font-bold text-foreground text-lg mb-2">Detalhes do plano: {plan.name}</h3>
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <span className="text-sm text-muted-foreground">{feature.label}</span>
                    <span className="text-sm">{feature.render(plan)}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground mb-6 max-w-2xl">
          A disponibilidade de HD (720p), Full HD (1080p), Ultra HD (4K) e HDR está sujeita ao seu serviço de internet e às funcionalidades do dispositivo. Nem todo o conteúdo está disponível em todas as resoluções. Consulte nossos Termos de Uso para mais detalhes.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/signup')}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-4 px-12 rounded-md transition-colors"
        >
          Avançar
        </button>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <p className="text-muted-foreground text-sm mb-4">Dúvidas? Ligue 0800 591 8942</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <a href="#" className="hover:underline">Perguntas frequentes</a>
            <a href="#" className="hover:underline">Central de Ajuda</a>
            <a href="/terms" className="hover:underline">Termos de Uso</a>
            <a href="/privacy" className="hover:underline">Privacidade</a>
            <a href="#" className="hover:underline">Preferências de cookies</a>
            <a href="#" className="hover:underline">Informações corporativas</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Plans;
