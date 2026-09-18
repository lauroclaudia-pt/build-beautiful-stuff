import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import { activeRoles, ROLE_LABEL, type Role } from "@/lib/pessoas";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

export const Route = createFileRoute("/backoffice/admin")({
  head: () => ({
    meta: [
      { title: "Painel de administração — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Painel de administração da plataforma de recrutamento do IPMA: pessoas e responsabilidades, gestão do site, procedimentos concursais.",
      },
      { property: "og:title", content: "Painel de administração — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Gestão de pessoas, responsabilidades e configuração do site do IPMA, I.P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <Admin />
    </RequireRole>
  ),
});

function Admin() {
  const { pessoas, vagas, applicants, currentUser } = useStore();

  const ativos = pessoas.filter((p) => activeRoles(p).length > 0).length;

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <section className="animate-rise">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Administração
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Painel de administração</h1>
          <p className="mt-3 max-w-[60ch] text-[15px] text-muted-foreground text-pretty">
            Gestão de pessoas e responsabilidades, configuração visual e de conteúdos do site e
            acesso aos procedimentos concursais.
          </p>
          {currentUser && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              Sessão: {currentUser.name} ·{" "}
              {activeRoles(currentUser).map((r) => ROLE_LABEL[r]).join(" · ")}
            </p>
          )}
        </section>

        <div className="mt-8 grid animate-rise gap-4 [animation-delay:80ms] sm:grid-cols-4">
          <Kpi label="Pessoas" value={pessoas.length} />
          <Kpi label="Com responsabilidade ativa" value={ativos} />
          <Kpi label="Procedimentos" value={vagas.length} />
          <Kpi label="Candidaturas" value={applicants.length} />
        </div>

        <div className="mt-8 grid animate-rise gap-4 [animation-delay:120ms] md:grid-cols-2 xl:grid-cols-4">
          <Cartao
            to="/backoffice/dashboard"
            titulo="Dashboard"
            desc="Indicadores dos procedimentos e das candidaturas: evolução mensal, estados, prazos a terminar, fases em curso e classificações médias."
            accao="Ver dashboard"
          />
          <Cartao
            to="/backoffice/pessoas"
            titulo="Pessoas e responsabilidades"
            desc="Criar pessoas, atribuir logins e gerir responsabilidades (Gestor de RH, Gestão, Administrador, Candidato, Júri) com datas de início, fim e estado."
            accao="Abrir dados"
          />
          <Cartao
            to="/backoffice/site"
            titulo="Gestão do site"
            desc="Alterar o ícone das páginas e o favicon, as cores dos botões e dos títulos, o título e o texto de entrada da página inicial e os filtros apresentados."
            accao="Gerir site"
          />
          <Cartao
            to="/backoffice/dados"
            titulo="Gestão de dados"
            desc="Listar e gerir os valores de todas as listas de escolha dos formulários, com data de início, data de fim e estado ativo ou inativo."
            accao="Gerir dados"
          />
          <Cartao
            to="/backoffice/faq"
            titulo="Perguntas frequentes"
            desc="Criar, editar, reordenar e remover as perguntas e respostas apresentadas na página de apoio ao candidato."
            accao="Gerir perguntas"
          />
          <Cartao
            to="/backoffice/notificacoes"
            titulo="Notificações (emails)"
            desc="Editar o assunto e o texto das mensagens enviadas aos candidatos em cada fase do procedimento e ativar ou desativar cada envio."
            accao="Gerir notificações"
          />
          <Cartao
            to="/backoffice/email"
            titulo="Correio eletrónico"
            desc="Configurar a caixa de correio remetente e o envio de emails da aplicação, com estado do serviço de envio."
            accao="Configurar email"
          />
          <Cartao
            to="/backoffice/documentos"
            titulo="Documentos e atas"
            desc="Editar os modelos das atas e grelhas geradas em cada fase do procedimento, com nome do ficheiro e conteúdo."
            accao="Gerir documentos"
          />
          <Cartao
            to="/backoffice/contactos"
            titulo="Contactos"
            desc="Editar a designação e o valor de cada contacto apresentado nas páginas públicas, por exemplo «Divisão: Recursos Humanos»."
            accao="Gerir contactos"
          />
        </div>
      </main>
    </PageShell>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Cartao({
  to,
  titulo,
  desc,
  accao,
}: {
  to:
    | "/backoffice/dashboard"
    | "/backoffice/pessoas"
    | "/backoffice/site"
    | "/backoffice/dados"
    | "/backoffice/faq"
    | "/backoffice/notificacoes"
    | "/backoffice/email"
    | "/backoffice/documentos"
    | "/backoffice/contactos";
  titulo: string;
  desc: string;
  accao: string;
}) {
  return (
    <div className="glass flex flex-col rounded-xl p-6">
      <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
      <p className="mt-2 flex-1 text-[13px] text-muted-foreground text-pretty">{desc}</p>
      <Link
        to={to}
        className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-center text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {accao}
      </Link>
    </div>
  );
}
