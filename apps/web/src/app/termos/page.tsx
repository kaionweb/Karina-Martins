import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço | Colégio Karina Martins",
  description: "Termos de Serviço da plataforma Colégio Karina Martins.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-cinema-bg font-body text-cinema-text">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display mb-2 text-3xl font-bold text-cinema-primary">
          Termos de Serviço
        </h1>
        <p className="mb-8 text-sm text-cinema-muted">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao criar uma conta e usar a plataforma do Colégio Karina Martins ("Plataforma"),
            você (responsável legal pela criança que utilizará o serviço) concorda com
            estes Termos de Serviço e com nossa Política de Privacidade.
          </p>
        </Section>

        <Section title="2. Quem pode usar a Plataforma">
          <p>
            A Plataforma é destinada ao uso por crianças, sob supervisão e mediante conta
            criada e gerenciada por um responsável legal maior de idade. O responsável é
            quem cria a conta principal, adiciona perfis de crianças, e é responsável por
            supervisionar o uso.
          </p>
        </Section>

        <Section title="3. Conta e responsabilidade">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Você é responsável por manter a confidencialidade das credenciais de acesso da conta</li>
            <li>Você é responsável pelo uso da conta, incluindo os perfis de crianças criados sob ela</li>
            <li>Informações fornecidas no cadastro devem ser verdadeiras e atualizadas</li>
          </ul>
        </Section>

        <Section title="4. Planos e pagamento">
          <p>
            A Plataforma pode oferecer um período de teste gratuito e planos pagos
            (mensal/anual). Os valores, formas de pagamento e política de cancelamento
            vigentes estão descritos na tela de assinatura dentro da Plataforma. Você pode
            cancelar a renovação automática a qualquer momento antes do próximo ciclo de
            cobrança.
          </p>
        </Section>

        <Section title="5. Conteúdo e propriedade intelectual">
          <p>
            Todo o conteúdo educacional disponibilizado (vídeos, lições, jogos, textos) é
            de titularidade do Colégio Karina Martins ou de seus licenciantes, e é
            disponibilizado exclusivamente para uso pessoal e não comercial dentro da
            Plataforma. É proibido copiar, redistribuir ou explorar comercialmente esse
            conteúdo sem autorização.
          </p>
        </Section>

        <Section title="6. Tutor de inteligência artificial">
          <p>
            A Plataforma oferece um recurso de conversação com um tutor baseado em
            inteligência artificial, com finalidade estritamente educacional e com
            salvaguardas para uso por crianças. As mensagens trocadas podem ser processadas
            por provedores de IA terceirizados, sob as regras descritas em nossa Política
            de Privacidade. O tutor de IA pode cometer erros ocasionais — ele é uma
            ferramenta de apoio ao aprendizado, não substitui supervisão adulta.
          </p>
        </Section>

        <Section title="7. Uso adequado">
          <p>Ao usar a Plataforma, você concorda em não:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Tentar acessar áreas ou dados de outros usuários sem autorização</li>
            <li>Utilizar a Plataforma para fins diferentes do uso educacional pretendido</li>
            <li>Tentar contornar limitações técnicas de acesso a conteúdo pago</li>
          </ul>
        </Section>

        <Section title="8. Disponibilidade do serviço">
          <p>
            Nos esforçamos para manter a Plataforma disponível, mas não garantimos
            funcionamento ininterrupto. Manutenções e eventuais interrupções podem ocorrer.
          </p>
        </Section>

        <Section title="9. Alterações nos termos">
          <p>
            Podemos atualizar estes Termos periodicamente. Mudanças significativas serão
            comunicadas por e-mail ou aviso na Plataforma antes de entrarem em vigor.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Dúvidas sobre estes Termos podem ser enviadas para:{" "}
            <a href="mailto:kaionweb14@gmail.com" className="font-bold text-cinema-primary underline">
              kaionweb14@gmail.com
            </a>
            .
          </p>
        </Section>

        <p className="mt-10 text-xs text-cinema-muted">
          Este documento é um modelo de base e não substitui orientação jurídica
          especializada.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display mb-2 text-lg font-bold text-cinema-text">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-cinema-text">{children}</div>
    </section>
  );
}
