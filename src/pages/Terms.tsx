import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-[100px] w-auto object-contain cursor-pointer" onClick={() => navigate('/')} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 prose prose-invert max-w-none">
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="text-muted-foreground text-sm">Última atualização: 09 de março de 2026</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">1. Aceitação dos Termos</h2>
        <p className="text-muted-foreground">
          Ao acessar e utilizar a plataforma PaixãoFlix, você concorda com estes Termos de Uso. Caso não concorde, não utilize o serviço.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. Descrição do Serviço</h2>
        <p className="text-muted-foreground">
          A PaixãoFlix é uma plataforma de streaming de vídeo que oferece acesso a filmes, séries, conteúdo infantil e canais ao vivo mediante assinatura.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Cadastro e Conta</h2>
        <p className="text-muted-foreground">
          Para utilizar o serviço, é necessário criar uma conta com informações verdadeiras. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Planos e Pagamento</h2>
        <p className="text-muted-foreground">
          A PaixãoFlix oferece diferentes planos de assinatura. Os preços podem ser alterados com aviso prévio de 30 dias. O pagamento é recorrente e será cobrado automaticamente conforme o plano escolhido.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">5. Uso Permitido</h2>
        <p className="text-muted-foreground">
          O conteúdo disponibilizado é para uso pessoal e não comercial. É proibido copiar, distribuir, modificar, exibir publicamente ou criar obras derivadas do conteúdo sem autorização prévia.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">6. Cancelamento</h2>
        <p className="text-muted-foreground">
          Você pode cancelar sua assinatura a qualquer momento. O acesso permanecerá ativo até o final do período já pago. Não há reembolso proporcional.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">7. Propriedade Intelectual</h2>
        <p className="text-muted-foreground">
          Todo o conteúdo, marcas, logos e materiais disponíveis na plataforma são protegidos por direitos autorais e de propriedade intelectual.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">8. Limitação de Responsabilidade</h2>
        <p className="text-muted-foreground">
          A PaixãoFlix não garante disponibilidade ininterrupta do serviço e não se responsabiliza por danos indiretos decorrentes do uso da plataforma.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">9. Alterações nos Termos</h2>
        <p className="text-muted-foreground">
          Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">10. Contato</h2>
        <p className="text-muted-foreground">
          Para dúvidas sobre estes termos, entre em contato através do e-mail: contato@paixaoflix.com ou pelo telefone 0800 591 8942.
        </p>
      </main>
    </div>
  );
};

export default Terms;
