import { Check, Tv, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: string;
  screens: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 0,01',
    screens: 1,
    features: [
      '1 tela simultânea',
      'Qualidade Full HD',
      'Acesso a todo catálogo',
      'Filmes e Séries',
      'TV ao Vivo',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 1,00',
    screens: 2,
    popular: true,
    features: [
      '2 telas simultâneas',
      'Qualidade Ultra HD 4K',
      'Acesso a todo catálogo',
      'Filmes, Séries e Kids',
      'TV ao Vivo',
      'Conteúdo exclusivo',
    ],
  },
];

interface PlanSelectorProps {
  selected: string;
  onSelect: (planId: string) => void;
}

const PlanSelector = ({ selected, onSelect }: PlanSelectorProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className={cn(
            "relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all duration-300 group",
            selected === plan.id
              ? "border-foreground bg-foreground/10 shadow-lg shadow-foreground/10 scale-[1.02]"
              : "border-border bg-card hover:border-muted-foreground/40 hover:bg-secondary/50"
          )}
        >
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
              Mais Popular
            </span>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className={cn(
              "text-lg font-bold transition-colors",
              selected === plan.id ? "text-primary" : "text-foreground"
            )}>
              {plan.name}
            </h3>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              selected === plan.id ? "border-primary bg-primary" : "border-muted-foreground/50"
            )}>
              {selected === plan.id && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-2xl font-black text-foreground">{plan.price}</span>
            <span className="text-muted-foreground text-sm">/mês</span>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            {plan.screens === 1 ? (
              <><Smartphone className="w-4 h-4" /> ou <Tv className="w-4 h-4" /></>
            ) : (
              <><Tv className="w-4 h-4" /><span>+</span><Smartphone className="w-4 h-4" /></>
            )}
            <span>{plan.screens} {plan.screens === 1 ? 'tela' : 'telas'}</span>
          </div>

          <ul className="space-y-2 flex-1">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className={cn(
                  "w-4 h-4 flex-shrink-0",
                  selected === plan.id ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
};

export { plans };
export default PlanSelector;
