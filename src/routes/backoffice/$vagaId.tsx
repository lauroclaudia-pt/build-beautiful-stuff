import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { ApplicantStateBadge, JobStateBadge, PageShell, RequireRole } from "@/components/shell";
import { finalGrade, useStore } from "@/lib/store";
import { hasActiveRole } from "@/lib/pessoas";
import {
  AC_CRITERIA,
  APPLICANT_STATE_LABEL,
  DESEMPENHO_CONVERSION,
  EAC_CRITERIA,
  EAC_MAX,
  EAC_MIN,
  EMPTY_TRIAGEM,
  MOTIVOS_EXCLUSAO,
  OFFER_TYPE_LABEL,
  STAGE_LABEL,
  calcAcGrade,
  calcEacGrade,
  formatDate,
  triagemCriteriosDe,
  triagemEstado,
  type Applicant,
  type ApplicantState,
  type OfferType,
  type StageCode,
  type TriagemCriterios,
} from "@/lib/recrutamento";


export const Route = createFileRoute("/backoffice/$vagaId")({
  head: () => ({
    meta: [
      { title: "Gestão do procedimento — Backoffice Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Acompanhe as etapas do procedimento, faça a triagem de candidaturas, registe notas dos métodos de seleção e gere a ata do júri.",
      },
      { property: "og:title", content: "Gestão do procedimento — Backoffice Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Etapas, triagem de candidaturas, notas e ata do júri do IPMA, I.P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole>
      <GestaoVaga />
    </RequireRole>
  ),
});

type LinhaRegisto = {
  id: string;
  tipo: "FASE" | "NOTIFICACAO" | "OBSERVACAO";
  texto: string;
  when: string;
};

function formatDataHora(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
}

const REGISTO_TIPO_LABEL: Record<LinhaRegisto["tipo"], string> = {
  FASE: "Fase",
  NOTIFICACAO: "Notificação",
  OBSERVACAO: "Observação",
};

const TRIAGEM: ApplicantState[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ADMITTED",
  "EXCLUDED",
  "UNDER_APPEAL",
  "APPROVED",
  "HIRED",
  "REJECTED",
];

function GestaoVaga() {
  const { vagaId } = Route.useParams();
  const {
    vagas,
    applicants,
    updateVaga,
    publishVaga,
    advanceStage,
    concludeScreening,
    setApplicantState,
    setTriagem,
    setGrades,
    addVagaRegistro,
    addNotificacoes,
    notificacoes,
    site,
    currentUser,
  } = useStore();
  const vaga = vagas.find((v) => v.id === vagaId);
  const podeGerirVaga =
    hasActiveRole(currentUser, "ADMIN", "GESTAO") ||
    (hasActiveRole(currentUser, "GESTOR_RH") && vaga?.hrManagerId === currentUser?.id);
  const [filtro, setFiltro] = useState<ApplicantState | "">("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [ata, setAta] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [obs, setObs] = useState("");
  const [notifAberta, setNotifAberta] = useState<string | null>(null);

  const notifsVaga = useMemo(
    () =>
      notificacoes
        .filter((n) => n.vagaId === vagaId)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [notificacoes, vagaId],
  );

  const cands = useMemo(
    () =>
      applicants
        .filter((a) => a.vagaId === vagaId && (!filtro || a.state === filtro))
        .sort((a, b) => (finalGrade(b) ?? -1) - (finalGrade(a) ?? -1)),
    [applicants, vagaId, filtro],
  );

  const timeline = useMemo(() => {
    const fases = (vaga?.stages ?? []).flatMap((s) => {
      const linhas: LinhaRegisto[] = [];
      if (s.startedAt)
        linhas.push({
          id: `${s.code}-inicio`,
          tipo: "FASE",
          texto: `${STAGE_LABEL[s.code]} — fase iniciada`,
          when: s.startedAt,
        });
      if (s.endedAt)
        linhas.push({
          id: `${s.code}-fim`,
          tipo: "FASE",
          texto: `${STAGE_LABEL[s.code]} — fase concluída`,
          when: s.endedAt,
        });
      return linhas;
    });
    const registos: LinhaRegisto[] = (vaga?.registros ?? []).map((r) => ({
      id: r.id,
      tipo: r.tipo,
      texto: r.texto,
      when: r.createdAt,
    }));
    return [...registos, ...fases].sort((a, b) => (a.when < b.when ? 1 : -1));
  }, [vaga]);

  if (!vaga) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Procedimento não encontrado</h1>
          <Link to="/backoffice" className="mt-6 inline-block text-primary underline">
            Voltar ao painel
          </Link>
        </main>
      </PageShell>
    );
  }

  if (!podeGerirVaga) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[900px] px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Sem permissão para gerir este procedimento</h1>
          <p className="mt-3 text-muted-foreground">
            Só o Gestor de RH responsável por este procedimento o pode gerir. Pode consultá-lo na
            página pública.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/vagas/$vagaId"
              params={{ vagaId: vaga.id }}
              className="rounded-md bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground"
            >
              Consultar procedimento
            </Link>
            <Link to="/backoffice" className="rounded-md border border-border px-4 py-2.5 text-[13px]">
              Voltar ao painel
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const todos = applicants.filter((a) => a.vagaId === vaga.id);
  // Só se tramita para a fase seguinte quando todos estiverem admitidos/excluídos.
  const porTriar = todos.filter((a) => a.state !== "ADMITTED" && a.state !== "EXCLUDED");

  const etapaAtiva = vaga.stages.find((s) => s.state === "active");

  function notificarFase(code: StageCode) {
    const v = vaga!;
    const modelo = (site.emailTemplates ?? []).find((t) => t.stage === code && t.enabled);
    if (!modelo) {
      toast.error(
        `Não há notificação ativa para a fase “${STAGE_LABEL[code]}”. Configure-a em Administração → Notificações.`,
      );
      return;
    }
    if (!todos.length) {
      toast.error("Ainda não há candidatos para notificar neste procedimento.");
      return;
    }
    const data = formatDate(new Date().toISOString());
    const novas = todos.map((a) => {
      const nota = finalGrade(a);
      const preencher = (txt: string) =>
        txt
          .replaceAll("{{candidato}}", a.name)
          .replaceAll("{{email}}", a.email)
          .replaceAll("{{procedimento}}", v.title)
          .replaceAll("{{referencia}}", v.ref)
          .replaceAll("{{fase}}", STAGE_LABEL[code])
          .replaceAll("{{prazo}}", formatDate(v.deadline))
          .replaceAll("{{classificacao}}", nota != null ? nota.toFixed(1) : "—")
          .replaceAll("{{motivo}}", a.exclusionReason ?? "—")
          .replaceAll("{{data}}", data);
      return {
        vagaId: v.id,
        applicantId: a.id,
        destinatario: a.name,
        email: a.email,
        stage: code,
        nome: modelo.name,
        assunto: preencher(modelo.subject),
        texto: preencher(modelo.body),
      };
    });
    addNotificacoes(novas);
    addVagaRegistro(v.id, {
      tipo: "NOTIFICACAO",
      stage: code,
      texto: `Notificação “${modelo.name}” enviada a ${novas.length} ${novas.length === 1 ? "candidato" : "candidatos"}.`,
    });
    toast.success(`Notificação “${modelo.name}” enviada a ${novas.length} candidato(s).`);
  }

  function adicionarObservacao(e: FormEvent) {
    e.preventDefault();
    const texto = obs.trim();
    if (!texto) return;
    addVagaRegistro(vaga!.id, { tipo: "OBSERVACAO", texto });
    setObs("");
    toast.success("Observação registada.");
  }

  function gerarAta() {
    const v = vaga!;
    const ordenados = [...todos].sort((a, b) => (finalGrade(b) ?? -1) - (finalGrade(a) ?? -1));
    const linhas = [
      `ATA DO JÚRI — INSTITUTO PORTUGUÊS DO MAR E DA ATMOSFERA, I.P.`,
      `Procedimento ${v.ref} — ${v.title}`,
      `Tipo: ${OFFER_TYPE_LABEL[v.offerType]}`,
      `Unidade orgânica: ${v.department} · Local: ${v.location} · Postos: ${v.positions}`,
      `Código BEP/Edital: ${v.bepCode || "(por atribuir)"}`,
      `Data: ${new Date().toLocaleDateString("pt-PT")}`,
      ``,
      `COMPOSIÇÃO DO JÚRI`,
      `Presidente: ${v.juryPresident || "(por designar)"}`,
      ...(v.juryMembers.length ? v.juryMembers.map((m, i) => `Vogal ${i + 1}: ${m}`) : ["Vogais: (por designar)"]),
      ``,
      `MÉTODOS DE SELEÇÃO`,
      ...v.selectionMethods.map((m) => `- ${m}`),
      ``,
      `ETAPAS DO PROCEDIMENTO`,
      ...v.stages.map(
        (s) =>
          `- ${STAGE_LABEL[s.code]}: ${
            s.state === "completed" ? "concluída" : s.state === "active" ? "em curso" : "por iniciar"
          }`,
      ),
      ``,
      `LISTA ORDENADA DE CANDIDATOS (${ordenados.length})`,
      ...ordenados.map((a, i) => {
        const nf = finalGrade(a);
        return `${String(i + 1).padStart(2, "0")}. ${a.name} — ${APPLICANT_STATE_LABEL[a.state]}${
          nf !== null ? ` — classificação final ${nf.toFixed(2)} valores` : ""
        }${a.exclusionReason ? ` — motivo: ${a.exclusionReason}` : ""}`;
      }),
      ``,
      `Nada mais havendo a tratar, foi lavrada a presente ata, que vai ser assinada pelos membros do júri.`,
    ];
    setAta(linhas.join("\n"));
  }

  function descarregarAta() {
    if (!ata) return;
    const blob = new Blob([ata], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ata-${vaga!.ref.replace("/", "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ata descarregada.");
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <Link
          to="/backoffice"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Painel de vagas
        </Link>

        <div className="mt-5 flex animate-rise flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                Ref. {vaga.ref}
              </span>
              <JobStateBadge state={vaga.state} />
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{vaga.title}</h1>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {vaga.department} · {vaga.location} · prazo {formatDate(vaga.deadline)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEdit((e) => !e)}
              className="rounded-md border border-border bg-white/60 px-4 py-2 text-[13px] font-medium"
            >
              {edit ? "Fechar edição" : "Editar dados"}
            </button>
            {vaga.state === "DRAFT" ? (
              <button
                onClick={() => {
                  const r = publishVaga(vaga.id);
                  r.ok ? toast.success(r.message) : toast.error(r.message);
                }}
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Publicar no portal
              </button>
            ) : (
              <Link
                to="/vagas/$vagaId"
                params={{ vagaId: vaga.id }}
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ver publicação
              </Link>
            )}
          </div>
        </div>

        {edit && (
          <div className="glass mt-6 grid animate-rise gap-4 rounded-xl p-6 sm:grid-cols-3">
            <Campo label="Código BEP/Edital">
              <input
                value={vaga.bepCode}
                onChange={(e) => updateVaga(vaga.id, { bepCode: e.target.value })}
                className="input-ipma"
              />
            </Campo>
            <Campo label="Presidente do júri">
              <input
                value={vaga.juryPresident}
                onChange={(e) => updateVaga(vaga.id, { juryPresident: e.target.value })}
                className="input-ipma"
              />
            </Campo>
            <Campo label="Vogais (vírgula)">
              <input
                value={vaga.juryMembers.join(", ")}
                onChange={(e) =>
                  updateVaga(vaga.id, {
                    juryMembers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="input-ipma"
              />
            </Campo>
            <Campo label="Prazo">
              <input
                type="date"
                value={vaga.deadline}
                onChange={(e) => updateVaga(vaga.id, { deadline: e.target.value })}
                className="input-ipma"
              />
            </Campo>
            <Campo label="Postos">
              <input
                type="number"
                min={1}
                value={vaga.positions}
                onChange={(e) => updateVaga(vaga.id, { positions: Number(e.target.value) || 1 })}
                className="input-ipma"
              />
            </Campo>
            <Campo label="Estado">
              <select
                value={vaga.state}
                onChange={(e) => updateVaga(vaga.id, { state: e.target.value as typeof vaga.state })}
                className="input-ipma"
              >
                {(["DRAFT", "PUBLISHED", "RUNNING", "FINISHED", "CANCELLED", "DESERT"] as const).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </Campo>
          </div>
        )}

        {/* Pipeline */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:80ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Pipeline de etapas</h2>
            <div className="flex flex-wrap items-center gap-2">
              {etapaAtiva?.code === "ADMISSION" && porTriar.length > 0 && (
                <span className="rounded-md border border-warn/50 bg-warn/10 px-3 py-1.5 text-[12px]">
                  Faltam triar {porTriar.length} candidatura(s)
                </span>
              )}
              {etapaAtiva?.code === "ADMISSION" && (
                <button
                  disabled={porTriar.length > 0}
                  onClick={() => {
                    const r = concludeScreening(vaga.id);
                    r.ok ? toast.success(r.message) : toast.error(r.message);
                  }}
                  className="rounded-md border border-border bg-white/60 px-4 py-2 text-[13px] font-medium disabled:opacity-40"
                >
                  Concluir triagem provisória
                </button>
              )}
              <button
                disabled={etapaAtiva?.code === "ADMISSION" && porTriar.length > 0}
                onClick={() => {
                  advanceStage(vaga.id);
                  toast.success("Etapa avançada.");
                }}
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                Avançar etapa
              </button>
            </div>

          </div>
          <ol className="mt-5 grid gap-2 md:grid-cols-6">
            {vaga.stages.map((s, i) => (
              <li
                key={s.code}
                className={`rounded-lg border p-3 ${
                  s.state === "active"
                    ? "border-atmosfera bg-atmosfera/10"
                    : s.state === "completed"
                      ? "border-success/40 bg-success/5"
                      : "border-border bg-white/40"
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[13px] font-medium">{STAGE_LABEL[s.code]}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {s.state === "completed" ? "concluída" : s.state === "active" ? "em curso" : "por iniciar"}
                </p>
                {(s.startedAt || s.endedAt) && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {s.startedAt ? `início ${formatDate(s.startedAt)}` : ""}
                    {s.startedAt && s.endedAt ? " · " : ""}
                    {s.endedAt ? `fim ${formatDate(s.endedAt)}` : ""}
                  </p>
                )}
                <button
                  onClick={() => notificarFase(s.code)}
                  className="mt-2 w-full rounded-md border border-border bg-white/60 px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-atmosfera hover:text-foreground"
                >
                  Notificar
                </button>
              </li>
            ))}
          </ol>
          {etapaAtiva && (
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">
              Etapa atual: {STAGE_LABEL[etapaAtiva.code]}
            </p>
          )}
        </section>

        {/* Registos e observações */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:120ms]">
          <h2 className="text-lg font-semibold tracking-tight">Registos e observações</h2>
          <form onSubmit={adicionarObservacao} className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Observação ao procedimento (ex.: reunião do júri, pedido de esclarecimento)"
              className="input-ipma min-w-[260px] flex-1"
            />
            <button className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
              Adicionar registo
            </button>
          </form>
          {timeline.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Ainda não existem registos neste procedimento.
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {timeline.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-white/40 p-3"
                >
                  <span className="mt-0.5 whitespace-nowrap rounded border border-border bg-white/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {REGISTO_TIPO_LABEL[r.tipo]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px]">{r.texto}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatDataHora(r.when)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notificações enviadas */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:110ms]">
          <h2 className="text-lg font-semibold tracking-tight">
            Notificações enviadas{" "}
            <span className="font-mono text-[12px] font-normal text-muted-foreground">
              ({notifsVaga.length})
            </span>
          </h2>
          {notifsVaga.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Ainda não foram enviadas notificações neste procedimento. Use o botão “Notificar” de
              cada fase.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="pb-2 pr-3">Data de envio</th>
                    <th className="pb-2 pr-3">Nome</th>
                    <th className="pb-2 pr-3">Assunto</th>
                    <th className="pb-2 text-right">Texto</th>
                  </tr>
                </thead>
                <tbody>
                  {notifsVaga.map((n) => (
                    <Fragment key={n.id}>
                      <tr className="border-t border-border/60">
                        <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">
                          {formatDataHora(n.sentAt)}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="font-medium">{n.destinatario}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            {n.nome}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{n.assunto}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            title="Consultar o texto enviado"
                            aria-label="Consultar o texto enviado"
                            onClick={() => setNotifAberta(notifAberta === n.id ? null : n.id)}
                            className="rounded-md border border-border p-2 transition hover:bg-foreground/5"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                      {notifAberta === n.id && (
                        <tr className="border-t border-border/40 bg-white/40">
                          <td colSpan={4} className="px-3 py-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              Para {n.email}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed">
                              {n.texto}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Candidaturas recebidas */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:100ms]">
          <h2 className="text-lg font-semibold tracking-tight">
            Candidaturas recebidas{" "}
            <span className="font-mono text-[12px] font-normal text-muted-foreground">
              ({todos.length})
            </span>
          </h2>
          {todos.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Ainda não foram recebidas candidaturas neste procedimento.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="pb-2 pr-3">Nome</th>
                    <th className="pb-2 pr-3">Data</th>
                    <th className="pb-2 pr-3">Estado</th>
                    <th className="pb-2">Triagem</th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((a) => (
                    <LinhaCandidatura
                      key={a.id}
                      a={a}
                      offerType={vaga.offerType}
                      onState={setApplicantState}
                      onTriagem={setTriagem}
                    />
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Triagem */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:120ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Triagem de candidaturas{" "}
              <span className="font-mono text-[12px] font-normal text-muted-foreground">
                ({todos.length})
              </span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <FiltroChip active={filtro === ""} onClick={() => setFiltro("")}>
                Todas
              </FiltroChip>
              {TRIAGEM.map((s) => (
                <FiltroChip key={s} active={filtro === s} onClick={() => setFiltro(s)}>
                  {APPLICANT_STATE_LABEL[s]}
                </FiltroChip>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {cands.length === 0 && (
              <p className="rounded-lg border border-border bg-white/40 p-6 text-center text-[13px] text-muted-foreground">
                Ainda não há candidaturas com este critério.
              </p>
            )}
            {cands.map((a) => (
              <CandidatoLinha
                key={a.id}
                a={a}
                aberto={aberto === a.id}
                onToggle={() => setAberto(aberto === a.id ? null : a.id)}
                onState={setApplicantState}
                onGrades={setGrades}
              />
            ))}
          </div>
        </section>

        {/* Ata */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:160ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Ata do júri</h2>
            <div className="flex gap-2">
              <button
                onClick={gerarAta}
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Gerar ata
              </button>
              {ata && (
                <button
                  onClick={descarregarAta}
                  className="rounded-md border border-border bg-white/60 px-4 py-2 text-[13px] font-medium"
                >
                  Descarregar .txt
                </button>
              )}
            </div>
          </div>
          {ata ? (
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-border bg-white/60 p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
              {ata}
            </pre>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">
              A ata reúne o júri, os métodos de seleção, as etapas e a lista ordenada de candidatos com
              a classificação final.
            </p>
          )}
        </section>
      </main>
    </PageShell>
  );
}

const TODOS_ESTADOS = Object.keys(APPLICANT_STATE_LABEL) as ApplicantState[];

function LinhaCandidatura({
  a,
  offerType,
  onState,
  onTriagem,
}: {
  a: Applicant;
  offerType: OfferType;
  onState: ReturnType<typeof useStore>["setApplicantState"];
  onTriagem: ReturnType<typeof useStore>["setTriagem"];
}) {
  const [aberto, setAberto] = useState(false);
  const [crit, setCrit] = useState<TriagemCriterios>({ ...EMPTY_TRIAGEM, ...(a.triagem ?? {}) });

  const criterios = triagemCriteriosDe(offerType);
  const motivos = crit.motivos ?? [];
  const motivo = (crit.motivo ?? "").trim();
  const estadoAuto = triagemEstado(crit, offerType);
  const porPreencher = criterios
    .filter((c) => !c.informativo && (crit[c.key] === null || crit[c.key] === undefined))
    .map((c) => c.label);

  function alternarMotivo(m: string) {
    setCrit({
      ...crit,
      motivos: motivos.includes(m) ? motivos.filter((x) => x !== m) : [...motivos, m],
    });
  }

  function guardar() {
    if (!estadoAuto) {
      toast.error(`Falta responder Sim ou Não a ${porPreencher.length} requisito(s).`);
      return;
    }
    const fundamentacao = [...motivos, motivo].filter(Boolean).join("\n");
    if (estadoAuto === "EXCLUDED" && !fundamentacao) {
      toast.error("Indique pelo menos um motivo de exclusão.");
      return;
    }
    onTriagem(a.id, { ...crit, motivos, motivo });
    onState(a.id, estadoAuto, estadoAuto === "EXCLUDED" ? fundamentacao : undefined);
    toast.success(`Candidatura de ${a.name}: ${APPLICANT_STATE_LABEL[estadoAuto]}.`);
  }

  return (
    <>
      <tr className="border-t border-border/60">
        <td className="py-2 pr-3 font-medium">{a.name}</td>
        <td className="py-2 pr-3 font-mono text-[12px] text-muted-foreground">
          {formatDate(a.createdAt)}
        </td>
        <td className="py-2 pr-3">
          <ApplicantStateBadge state={a.state} />
        </td>
        <td className="py-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAberto(!aberto)}
              className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium transition hover:bg-white/60"
            >
              {aberto ? "Fechar triagem" : "Triagem"}
            </button>
            {estadoAuto && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                resultado: {APPLICANT_STATE_LABEL[estadoAuto]}
              </span>
            )}
          </div>
        </td>
      </tr>
      {aberto && (
        <tr className="border-t border-border/40 bg-white/40">
          <td colSpan={4} className="px-1 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Verificação dos requisitos
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {criterios.map((c) => (
                <fieldset key={c.key} className="rounded-lg border border-border bg-white/70 p-3">
                  <legend className="px-1 text-[12px] font-semibold">
                    {c.label}
                    {c.informativo && (
                      <span className="ml-1 font-normal text-muted-foreground">(informativo)</span>
                    )}
                  </legend>
                  <div className="mt-1 flex gap-4">
                    {[
                      { v: true, l: "Sim" },
                      { v: false, l: "Não" },
                    ].map((o) => (
                      <label key={o.l} className="flex items-center gap-1.5 text-[12px]">
                        <input
                          type="radio"
                          name={`${c.key}-${a.id}`}
                          checked={crit[c.key] === o.v}
                          onChange={() => setCrit({ ...crit, [c.key]: o.v })}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        {o.l}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Motivo de exclusão
            </p>
            <div className="mt-2 space-y-1.5">
              {MOTIVOS_EXCLUSAO.map((m) => (
                <label key={m} className="flex items-start gap-2 text-[12px] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={motivos.includes(m)}
                    onChange={() => alternarMotivo(m)}
                    className="mt-0.5 h-3.5 w-3.5 accent-primary"
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
            <textarea
              value={crit.motivo ?? ""}
              onChange={(e) => setCrit({ ...crit, motivo: e.target.value })}
              rows={2}
              placeholder="Outro motivo ou fundamentação adicional."
              className="input-ipma mt-2 w-full"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={guardar}
                className="rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Guardar triagem
              </button>
              <p className="text-[12px] text-muted-foreground">
                {estadoAuto
                  ? `Estado calculado: ${APPLICANT_STATE_LABEL[estadoAuto]}.`
                  : `Falta responder: ${porPreencher.join(" · ")}`}
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}



function CandidatoLinha({
  a,
  aberto,
  onToggle,
  onState,
  onGrades,
}: {
  a: Applicant;
  aberto: boolean;
  onToggle: () => void;
  onState: ReturnType<typeof useStore>["setApplicantState"];
  onGrades: ReturnType<typeof useStore>["setGrades"];
}) {
  const [motivo, setMotivo] = useState(a.exclusionReason ?? "");
  const nf = finalGrade(a);

  function nota(k: "pcGrade" | "acGrade" | "eacGrade", v: string) {
    const n = v === "" ? null : Math.max(0, Math.min(20, Number(v)));
    onGrades(a.id, {
      pcGrade: a.pcGrade ?? null,
      acGrade: a.acGrade ?? null,
      eacGrade: a.eacGrade ?? null,
      [k]: n,
    } as never);
  }

  return (
    <div className="rounded-lg border border-border bg-white/50">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button onClick={onToggle} className="flex-1 text-left">
          <p className="text-[14px] font-medium">{a.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {a.email} · {a.education} · submetida {formatDate(a.createdAt)}
          </p>
        </button>
        <ApplicantStateBadge state={a.state} />
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Class. final
          </p>
          <p className="text-[15px] font-semibold text-primary">{nf !== null ? nf.toFixed(2) : "—"}</p>
        </div>
        <select
          value={a.state}
          onChange={(e) => {
            const s = e.target.value as ApplicantState;
            onState(a.id, s, s === "EXCLUDED" ? motivo : undefined);
            toast.success(`Estado alterado para ${APPLICANT_STATE_LABEL[s]}.`);
          }}
          className="input-ipma max-w-[190px]"
        >
          {TRIAGEM.map((s) => (
            <option key={s} value={s}>
              {APPLICANT_STATE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {aberto && (
        <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Motivação
            </p>
            <p className="mt-1 text-[13px] text-pretty">{a.motivation}</p>
          </div>
          {a.state !== "ADMITTED" && (
            <p className="sm:col-span-3 rounded-lg border border-border bg-white/60 p-4 text-[13px] text-muted-foreground">
              A avaliação curricular, a prova de conhecimentos e a entrevista só estão disponíveis
              para candidatos admitidos. Conclua a triagem desta candidatura.
            </p>
          )}
          {a.state === "ADMITTED" && (
          <>
          <Campo label="Prova de Conhecimentos (0-20)">


            <input
              type="number"
              step="0.1"
              min={0}
              max={20}
              value={a.pcGrade ?? ""}
              onChange={(e) => nota("pcGrade", e.target.value)}
              className="input-ipma"
            />
          </Campo>
          <div className="sm:col-span-3 rounded-lg border border-border bg-white/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Grelha de Avaliação Curricular — critérios com pesos
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {AC_CRITERIA.map((c) => (
                <div key={c.id}>
                  <label className="flex items-baseline justify-between text-[12px] font-medium">
                    <span>{c.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{c.weight}%</span>
                  </label>
                  {c.id === "desempenho" ? (
                    <select
                      value={a.acDesempenho ?? ""}
                      onChange={(e) => onGrades(a.id, { acDesempenho: e.target.value || null })}
                      className="input-ipma mt-1"
                    >
                      <option value="">— escolher menção —</option>
                      {DESEMPENHO_CONVERSION.map((d) => (
                        <option key={d.label} value={d.label}>
                          {d.label} ({d.grade} valores)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={20}
                      value={a.acScores?.[c.id] ?? ""}
                      onChange={(e) =>
                        onGrades(a.id, {
                          acScores: {
                            ...(a.acScores ?? {}),
                            [c.id]: e.target.value === "" ? null : Math.max(0, Math.min(20, Number(e.target.value))),
                          },
                        })
                      }
                      className="input-ipma mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px]">
              Nota AC ponderada:{" "}
              <strong className="text-primary">
                {(() => {
                  const n = calcAcGrade(a.acScores, a.acDesempenho);
                  return n != null ? n.toFixed(2) : "— (preencha todos os critérios)";
                })()}
              </strong>
            </p>
          </div>
          <div className="sm:col-span-3 rounded-lg border border-border bg-white/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Grelha de Entrevista (EAC) — escala {EAC_MIN}–{EAC_MAX}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {EAC_CRITERIA.map((c) => (
                <div key={c.id}>
                  <label className="flex items-baseline justify-between text-[12px] font-medium">
                    <span>{c.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{c.weight}%</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={EAC_MIN}
                    max={EAC_MAX}
                    value={a.eacScores?.[c.id] ?? ""}
                    onChange={(e) =>
                      onGrades(a.id, {
                        eacScores: {
                          ...(a.eacScores ?? {}),
                          [c.id]:
                            e.target.value === ""
                              ? null
                              : Math.max(EAC_MIN, Math.min(EAC_MAX, Number(e.target.value))),
                        },
                      })
                    }
                    className="input-ipma mt-1"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px]">
              Nota da entrevista ponderada:{" "}
              <strong className="text-primary">
                {(() => {
                  const n = calcEacGrade(a.eacScores);
                  return n != null ? n.toFixed(2) : `— (preencha todos os critérios, ${EAC_MIN}–${EAC_MAX})`;
                })()}
              </strong>
            </p>
          </div>
          <Campo label="Avaliação Curricular — nota manual (opcional)">
            <input
              type="number"
              step="0.1"
              min={0}
              max={20}
              value={a.acGrade ?? ""}
              onChange={(e) => nota("acGrade", e.target.value)}
              className="input-ipma"
            />
          </Campo>
          <Campo label="Entrevista EAC — nota manual (opcional)">
            <input
              type="number"
              step="0.1"
              min={0}
              max={20}
              value={a.eacGrade ?? ""}
              onChange={(e) => nota("eacGrade", e.target.value)}
              className="input-ipma"
            />
          </Campo>
          <div className="sm:col-span-2">
            <Campo label="Motivo de exclusão">
              <input
                value={motivo}
                maxLength={300}
                onChange={(e) => setMotivo(e.target.value)}
                className="input-ipma"
              />
            </Campo>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                if (!motivo.trim()) {
                  toast.error("Indique o motivo da exclusão.");
                  return;
                }
                onState(a.id, "EXCLUDED", motivo.trim());
                toast.success("Candidato excluído com motivo registado.");
              }}
              className="w-full rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-[13px] font-medium text-destructive"
            >
              Excluir candidato
            </button>
          </div>
          {a.appeal && (
            <div className="sm:col-span-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                Alegação em audiência de interessados · {formatDate(a.appeal.createdAt)}
              </p>
              <p className="mt-1 text-[13px] text-pretty">{a.appeal.text}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    onState(a.id, "ADMITTED");
                    toast.success("Alegação deferida — candidato admitido.");
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground"
                >
                  Deferir
                </button>
                <button
                  onClick={() => {
                    onState(a.id, "EXCLUDED", a.exclusionReason ?? "Alegação indeferida pelo júri.");
                    toast.success("Alegação indeferida.");
                  }}
                  className="rounded-md border border-border bg-white/60 px-3 py-1.5 text-[12px] font-medium"
                >
                  Indeferir
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function FiltroChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
