import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Paperclip } from "lucide-react";
import { ApplicantStateBadge, PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import {
  DOC_STATE_LABEL,
  OFFER_TYPE_LABEL,
  formatDate,
  type Applicant,
  type Vaga,
} from "@/lib/recrutamento";

const BACKOFFICE_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO", "JURI"];

export const Route = createFileRoute("/backoffice/candidatura/$applicantId")({
  head: () => ({
    meta: [
      { title: "Candidatura em consulta — Backoffice Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Consulta integral de uma candidatura submetida ao IPMA, com todos os dados declarados e os anexos entregues.",
      },
      { property: "og:title", content: "Candidatura em consulta — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Ficha completa da candidatura em modo de leitura, com acesso aos anexos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={BACKOFFICE_ROLES}>
      <ConsultaCandidatura />
    </RequireRole>
  ),
});

function abrirAnexo(nome: string, descricao: string | undefined, candidato: string) {
  const texto = [
    `Anexo da candidatura de ${candidato}`,
    `Ficheiro: ${nome}`,
    descricao ? `Descrição: ${descricao}` : null,
    "",
    "Pré-visualização do documento entregue pelo candidato.",
  ]
    .filter(Boolean)
    .join("\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function Campo({ label, value }: { label: string; value?: string | number | null | boolean | undefined }) {
  const texto =
    typeof value === "boolean" ? (value ? "Sim" : "Não") : value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="rounded-lg border border-border/70 bg-white/60 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed">{texto}</p>
    </div>
  );
}

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="glass mt-6 rounded-xl p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {titulo}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ConsultaCandidatura() {
  const { applicantId } = Route.useParams();
  const { vagas, applicants } = useStore();
  const a: Applicant | undefined = applicants.find((x: Applicant) => x.id === applicantId);
  const vaga: Vaga | undefined = a ? vagas.find((v: Vaga) => v.id === a.vagaId) : undefined;

  if (!a) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">Candidatura não encontrada.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Candidatura em modo de consulta
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{a.name}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {vaga ? `${vaga.title} · ${OFFER_TYPE_LABEL[vaga.offerType]}` : "Procedimento removido"}
            {" · "}
            Submetida a {formatDate(a.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApplicantStateBadge state={a.state} />
          {vaga && (
            <Link
              to="/backoffice/$vagaId"
              params={{ vagaId: vaga.id }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium transition hover:bg-white/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Painel do procedimento
            </Link>
          )}
        </div>
      </div>

      <Seccao titulo="A — Identificação do candidato">
        <Campo label="Nome completo" value={a.name} />
        <Campo label="Data de nascimento" value={a.birthDate} />
        <Campo label="Sexo" value={a.gender} />
        <Campo label="Nacionalidade" value={a.nationality} />
        <Campo label="Documento de identificação" value={a.idNumber} />
        <Campo label="NIF" value={a.nif} />
        <Campo label="Endereço postal" value={a.address} />
        <Campo label="Código postal" value={a.postalCode} />
        <Campo label="Localidade" value={a.locality} />
        <Campo label="Concelho de residência" value={a.municipality} />
        <Campo label="Endereço eletrónico" value={a.email} />
        <Campo label="Telefone" value={a.phone} />
        <Campo label="Telemóvel" value={a.mobile} />
      </Seccao>

      <Seccao titulo="B — Situação perante os requisitos de admissão">
        <Campo label="Nível habilitacional" value={a.education} />
        <Campo label="Pós-graduação / mestrado / doutoramento" value={a.postgradInfo} />
        <Campo label="Titular de RJEP" value={a.rjep} />
        <Campo label="Situação de RJEP" value={a.employmentSituation} />
        <Campo label="Órgão / serviço" value={a.lastEmployer} />
        <Campo label="Atividade exercida" value={a.lastActivity} />
        <Campo label="Avaliação de desempenho (3 anos)" value={a.performanceEvaluation} />
        <Campo label="Situação profissional" value={a.professionalSituation} />
        <Campo label="Funções relacionadas com o posto" value={a.motivation} />
        <Campo label="Outras funções e atividades" value={a.otherExperience} />
        <Campo label="Formação substitutiva de grau académico" value={a.alternativeQualification} />
      </Seccao>

      <Seccao titulo="C — Método de seleção e condições">
        <Campo label="Método pretendido" value={(a.selectionMethodsWanted ?? []).join(", ")} />
        <Campo label="Condições especiais" value={a.specialConditions} />
        <Campo label="Candidato com deficiência" value={a.deficiencia} />
      </Seccao>

      <Seccao titulo="D — Declarações">
        <Campo label="Declaração de veracidade" value={a.truthDeclaration} />
        <Campo label="Declaração de interesse na mobilidade" value={a.mobDeclaration} />
        <Campo label="Declaração da bolsa de investigação" value={a.grantDeclaration} />
      </Seccao>

      <section className="glass mt-6 rounded-xl p-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Anexos entregues
        </h2>
        <div className="mt-3 space-y-3">
          {(a.documents ?? []).map((d) => (
            <div key={d.id} className="rounded-lg border border-border/70 bg-white/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold">
                  {d.label}
                  {d.optional && (
                    <span className="ml-1 font-normal text-muted-foreground">(facultativo)</span>
                  )}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {DOC_STATE_LABEL[d.state]}
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {(d.uploads ?? []).length === 0 && (
                  <li className="text-[12px] text-muted-foreground">Sem ficheiros entregues.</li>
                )}
                {(d.uploads ?? []).map((u, i) => (
                  <li key={`${u.name}-${i}`} className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirAnexo(u.name, u.description, a.name)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-[12px] font-medium transition hover:bg-white/70"
                    >
                      <Paperclip className="h-3.5 w-3.5" /> {u.name}
                    </button>
                    {u.description && (
                      <span className="text-[12px] text-muted-foreground">{u.description}</span>
                    )}
                  </li>
                ))}
              </ul>
              {d.note && <p className="mt-2 text-[12px] text-muted-foreground">{d.note}</p>}
            </div>
          ))}
          {(a.attachments ?? []).length > 0 && (
            <div className="rounded-lg border border-border/70 bg-white/60 p-3">
              <p className="text-[13px] font-semibold">Outros anexos</p>
              <ul className="mt-2 space-y-1.5">
                {(a.attachments ?? []).map((n, i) => (
                  <li key={`${n}-${i}`}>
                    <button
                      type="button"
                      onClick={() => abrirAnexo(n, undefined, a.name)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-[12px] font-medium transition hover:bg-white/70"
                    >
                      <Paperclip className="h-3.5 w-3.5" /> {n}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {a.exclusionReason && (
        <section className="glass mt-6 rounded-xl p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Motivo de exclusão registado
          </h2>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed">
            {a.exclusionReason}
          </p>
        </section>
      )}
    </PageShell>
  );
}
