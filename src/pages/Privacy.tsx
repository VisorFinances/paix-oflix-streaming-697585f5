import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/images/logo.png" alt="PaixãoFlix" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 prose prose-invert max-w-none">
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="text-muted-foreground text-sm">Última atualização: 09 de março de 2026</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">1. Dados Coletados</h2>
        <p className="text-muted-foreground">
          Coletamos dados pessoais fornecidos por você (nome, e-mail), dados de uso (histórico de reprodução, preferências) e dados técnicos (endereço IP, tipo de dispositivo, navegador).
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. Finalidade do Tratamento</h2>
        <p className="text-muted-foreground">
          Utilizamos seus dados para: fornecer e personalizar o serviço, processar pagamentos, enviar comunicações sobre sua conta, melhorar a plataforma e cumprir obrigações legais.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Base Legal (LGPD)</h2>
        <p className="text-muted-foreground">
          O tratamento de dados é realizado com base no consentimento do titular, na execução do contrato de prestação de serviços e no legítimo interesse da PaixãoFlix, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Compartilhamento de Dados</h2>
        <p className="text-muted-foreground">
          Seus dados podem ser compartilhados com processadores de pagamento, serviços de infraestrutura em nuvem e autoridades competentes quando exigido por lei. Não vendemos seus dados pessoais.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">5. Armazenamento e Segurança</h2>
        <p className="text-muted-foreground">
          Os dados são armazenados em servidores seguros com criptografia. Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">6. Seus Direitos</h2>
        <p className="text-muted-foreground">
          Conforme a LGPD, você tem direito a: acessar seus dados, corrigir dados incompletos ou incorretos, solicitar a eliminação de dados, revogar o consentimento e solicitar a portabilidade dos dados.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">7. Cookies</h2>
        <p className="text-muted-foreground">
          Utilizamos cookies para melhorar sua experiência, manter sua sessão ativa e analisar o uso da plataforma. Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">8. Retenção de Dados</h2>
        <p className="text-muted-foreground">
          Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento, os dados serão mantidos por até 5 anos para fins legais e contábeis, conforme a legislação vigente.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">9. Encarregado de Dados (DPO)</h2>
        <p className="text-muted-foreground">
          Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato com nosso Encarregado de Proteção de Dados pelo e-mail: privacidade@paixaoflix.com.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">10. Alterações</h2>
        <p className="text-muted-foreground">
          Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas por e-mail ou aviso na plataforma.
        </p>
      </main>
    </div>
  );
};

export default Privacy;
