import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Colégio Karina Martins",
  description: "Política de Privacidade da plataforma Colégio Karina Martins.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cinema-bg font-body text-cinema-text">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display mb-2 text-3xl font-bold text-cinema-primary">
          Política de Privacidade
        </h1>
        <p className="mb-8 text-sm text-cinema-muted">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <Section title="1. Quem somos">
          <p>
            O Colégio Karina Martins opera esta plataforma educacional de ensino de inglês
            para crianças ("Plataforma"). Esta política explica quais dados coletamos, como
            usamos e como você pode exercer seus direitos sobre eles, em conformidade com a
            Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </Section>

        <Section title="2. Sobre dados de crianças">
          <p>
            Esta Plataforma é voltada a crianças. O cadastro e a criação de perfis de
            crianças só podem ser feitos por um responsável legal (pai, mãe ou responsável),
            que é o titular da conta principal e o único autorizado a fornecer consentimento
            para o tratamento dos dados da criança, conforme o Artigo 14 da LGPD.
          </p>
          <p>
            Não coletamos dados de crianças fora do necessário para o funcionamento
            educacional da Plataforma (nome do perfil, avatar escolhido, progresso nas
            lições, pontuação de jogos). Não usamos dados de crianças para publicidade
            direcionada.
          </p>
        </Section>

        <Section title="3. Quais dados coletamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Dados do responsável: nome, e-mail, e dados de login (incluindo login via Google, se essa opção for usada)</li>
            <li>Dados de perfis de crianças criados pelo responsável: nome ou apelido, avatar, idade/faixa etária</li>
            <li>Dados de uso: progresso em lições, pontuação em jogos, histórico de interação com o tutor de IA, tempo de uso</li>
            <li>Dados técnicos: endereço IP, tipo de dispositivo e navegador, para fins de segurança e funcionamento do serviço</li>
          </ul>
        </Section>

        <Section title="4. Como usamos os dados">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Fornecer e personalizar a experiência educacional (nível, progresso, recomendações de conteúdo)</li>
            <li>Processar pagamentos de planos pagos, quando aplicável</li>
            <li>Comunicar com o responsável sobre a conta, cobranças e atualizações do serviço</li>
            <li>Melhorar a Plataforma com base em métricas de uso agregadas</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>
            Não vendemos dados pessoais. Compartilhamos dados apenas com prestadores de
            serviço necessários ao funcionamento da Plataforma (provedores de hospedagem,
            processamento de pagamento, e serviços de IA usados no tutor virtual), sob
            obrigação contratual de confidencialidade, e apenas na medida necessária para
            prestar o serviço.
          </p>
        </Section>

        <Section title="6. Seus direitos">
          <p>
            Como titular dos dados (você, responsável, e por extensão os dados da criança
            sob sua responsabilidade), você pode a qualquer momento solicitar: confirmação
            de que tratamos seus dados, acesso aos dados, correção de dados incompletos ou
            desatualizados, exclusão dos dados, ou revogação do consentimento dado.
          </p>
        </Section>

        <Section title="7. Retenção e exclusão">
          <p>
            Mantemos os dados enquanto a conta estiver ativa. Ao solicitar exclusão da
            conta, os dados pessoais e de progresso são removidos, exceto quando a
            manutenção for exigida por lei (ex.: registros fiscais de pagamento).
          </p>
        </Section>

        <Section title="8. Contato">
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em
            contato pelo e-mail:{" "}
            <a href="mailto:kaionweb14@gmail.com" className="font-bold text-cinema-primary underline">
              kaionweb14@gmail.com
            </a>
            .
          </p>
        </Section>

        <p className="mt-10 text-xs text-cinema-muted">
          Este documento é um modelo de base e não substitui orientação jurídica
          especializada, especialmente dado que a Plataforma trata dados de crianças.
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
