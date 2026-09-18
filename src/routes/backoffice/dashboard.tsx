import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { PageShell, JobStateBadge, RequireRole } from "@/components/shell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useStore } from "@/lib/store";
import { hasActiveRole } from "@/lib/pessoas";
import {
  APPLICANT_STATE_LABEL,
  DOC_STATE_LABEL,
  JOB_STATE_LABEL,
  OFFER_TYPE_LABEL,
  STAGE_LABEL,
  daysUntil,
  formatDate,
  type ApplicantState,
  type DocState,
  type JobState,
  type StageCode,
} from "@/lib/recrutamento";

export const Route = createFileRoute("/backoffice/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Indicadores dos procedimentos concursais do IPMA: candidaturas, estados, prazos, fases em curso e classificações.",
      },
      { property: "og:title", content: "Dashboard — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Visão geral dos procedimentos e candidaturas do recrutamento do IPMA, I.P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole>
      <Dashboard />
    </RequireRole>
  ),
});

type Periodo = "tudo" | "30" | "90" | "365";
const PERIODOS: { id: Periodo; label: string; dias: number | null }[] = [
  { id: "tudo", label: "Tudo", dias: null },
  { id: "30", label: "30 dias", dias: 30 },
  { id: "90", label: "90 dias", dias: 90 },
  { id: "365", label: "12 meses", dias: 365 },
];

/** Escapa um valor para CSV (separador «;», compatível com o Excel em português). */
function csvCell(v: string | number): string {
  const t = String(v);
  return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

function descarregarCsv(nome: string, linhas: (string | number)[][]) {
  const corpo = linhas.map((l) => l.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + corpo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const JOB_STATES: JobState[] = ["DRAFT", "PUBLISHED", "RUNNING", "FINISHED", "CANCELLED", "DESERT"];

/** Ordem do funil: do primeiro contacto até ao desfecho. */
const APPLICANT_FUNNEL: ApplicantState[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ADMITTED",
  "UNDER_APPEAL",
  "APPROVED",
  "HIRED",
  "EXCLUDED",
  "REJECTED",
  "CANCELLED",
];

const STATE_COLOR: Record<ApplicantState, string> = {
  SUBMITTED: "var(--atmosfera)",
  UNDER_REVIEW: "var(--subsolo)",
  ADMITTED: "var(--success)",
  UNDER_APPEAL: "var(--primary)",
  APPROVED: "var(--success)",
  HIRED: "var(--success)",
  EXCLUDED: "var(--destructive)",
  REJECTED: "var(--destructive)",
  CANCELLED: "var(--neutral)",
};

const DOC_COLOR: Record<DocState, string> = {
  VALIDATED: "var(--success)",
  RECEIVED: "var(--atmosfera)",
  PENDING: "var(--subsolo)",
  MISSING: "var(--destructive)",
};

function mediaDe(valores: (number | null | undefined)[]): number | null {
  const v = valores.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (v.length === 0) return null;
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function ultimosMeses(n: number): { key: string; label: string }[] {
  const agora = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (n - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
    return { key, label };
  });
}

function Dashboard() {
  const { vagas, applicants, notificacoes, currentUser } = useStore();
  const ehGestorRh = hasActiveRole(currentUser, "GESTOR_RH");
  const veTudo = hasActiveRole(currentUser, "ADMIN", "GESTAO");
  const [ambito, setAmbito] = useState<"todos" | "meus">(veTudo || !ehGestorRh ? "todos" : "meus");

  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const [vagaSel, setVagaSel] = useState("");

  const vagasScope = useMemo(
    () =>
      ambito === "meus" && currentUser
        ? vagas.filter((v) => v.hrManagerId === currentUser.id)
        : vagas,
    [vagas, ambito, currentUser],
  );
  const vagasA = useMemo(
    () => (vagaSel ? vagasScope.filter((v) => v.id === vagaSel) : vagasScope),
    [vagasScope, vagaSel],
  );
  const idsVagas = useMemo(() => new Set(vagasA.map((v) => v.id)), [vagasA]);
  const limite = useMemo(() => {
    const dias = PERIODOS.find((p) => p.id === periodo)?.dias;
    return dias ? new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10) : null;
  }, [periodo]);
  const candA = useMemo(
    () =>
      applicants.filter(
        (a) => idsVagas.has(a.vagaId) && (!limite || (a.createdAt ?? "").slice(0, 10) >= limite),
      ),
    [applicants, idsVagas, limite],
  );
  const notifA = useMemo(
    () =>
      (notificacoes ?? []).filter(
        (n) => idsVagas.has(n.vagaId) && (!limite || n.sentAt.slice(0, 10) >= limite),
      ),
    [notificacoes, idsVagas, limite],
  );

  const candidatosUnicos = useMemo(() => {
    const chaves = new Set(
      candA.map((a) => (a.nif ? `nif:${a.nif}` : a.email ? `mail:${a.email.toLowerCase()}` : a.id)),
    );
    return chaves.size;
  }, [candA]);

  const abertas = vagasA.filter((v) => v.state === "PUBLISHED" || v.state === "RUNNING");
  const porAnalisar = candA.filter((a) => a.state === "SUBMITTED").length;
  const emAudiencia = candA.filter((a) => a.state === "UNDER_APPEAL").length;
  const prazosCurtos = vagasA
    .filter((v) => v.state === "PUBLISHED")
    .map((v) => ({ v, dias: daysUntil(v.deadline) }))
    .filter((x) => x.dias >= 0 && x.dias <= 7)
    .sort((a, b) => a.dias - b.dias);

  const kpis: { label: string; value: number; hint: string; tone?: "warn" | undefined }[] = [
    { label: "Procedimentos abertos", value: abertas.length, hint: `${vagasA.length} no total` },
    { label: "Candidaturas", value: candA.length, hint: `${candidatosUnicos} candidatos únicos` },
    {
      label: "Por analisar",
      value: porAnalisar,
      hint: "Estado «Submetida»",
      tone: porAnalisar > 0 ? "warn" : undefined,
    },
    { label: "Em audiência", value: emAudiencia, hint: "Audiência de interessados" },
    {
      label: "Prazos em 7 dias",
      value: prazosCurtos.length,
      hint: "Procedimentos publicados",
      tone: prazosCurtos.length > 0 ? "warn" : undefined,
    },
    { label: "Notificações enviadas", value: notifA.length, hint: "Por email" },
  ];

  // --- Séries dos gráficos ---
  const meses = ultimosMeses(6);
  const porMes = meses.map((m) => ({
    mes: m.label,
    candidaturas: candA.filter((a) => (a.createdAt ?? "").slice(0, 7) === m.key).length,
  }));

  const porEstadoCand = APPLICANT_FUNNEL.map((s) => ({
    estado: APPLICANT_STATE_LABEL[s],
    total: candA.filter((a) => a.state === s).length,
    fill: STATE_COLOR[s],
  })).filter((x) => x.total > 0);

  const porEstadoVaga = JOB_STATES.map((s) => ({
    estado: JOB_STATE_LABEL[s],
    total: vagasA.filter((v) => v.state === s).length,
  }));

  const porUnidade = Object.entries(
    vagasA.reduce<Record<string, number>>((acc, v) => {
      acc[v.department] = (acc[v.department] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([unidade, total]) => ({ unidade, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const porTipo = Object.entries(
    vagasA.reduce<Record<string, number>>((acc, v) => {
      acc[v.offerType] = (acc[v.offerType] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([tipo, total]) => ({
      tipo: OFFER_TYPE_LABEL[tipo as keyof typeof OFFER_TYPE_LABEL],
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const porFase = Object.entries(
    vagasA
      .filter((v) => v.state === "RUNNING" || v.state === "PUBLISHED")
      .reduce<Record<string, number>>((acc, v) => {
        const fase = v.stages.find((s) => s.state === "active")?.code;
        if (fase) acc[fase] = (acc[fase] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .map(([fase, total]) => ({ fase: STAGE_LABEL[fase as StageCode], total }))
    .sort((a, b) => b.total - a.total);

  const medias = [
    { label: "Prova de conhecimentos", sigla: "PC", valor: mediaDe(candA.map((a) => a.pcGrade)) },
    { label: "Avaliação curricular", sigla: "AC", valor: mediaDe(candA.map((a) => a.acGrade)) },
    { label: "Entrevista", sigla: "EAC", valor: mediaDe(candA.map((a) => a.eacGrade)) },
  ];

  const docs = candA.flatMap((a) => a.documents ?? []);
  const docsPorEstado = (["VALIDATED", "RECEIVED", "PENDING", "MISSING"] as DocState[]).map(
    (s) => ({
      estado: s,
      total: docs.filter((d) => d.state === s).length,
    }),
  );
  const totalDocs = docs.length;

  const recentes = [...notifA].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 5);

  const cfgMes: ChartConfig = { candidaturas: { label: "Candidaturas", color: "var(--primary)" } };
  const cfgTotal: ChartConfig = { total: { label: "Total", color: "var(--primary)" } };

  const periodoLabel = PERIODOS.find((p) => p.id === periodo)?.label ?? "Tudo";
  const ambitoLabel = ambito === "meus" ? "Os meus procedimentos" : "Todos os procedimentos";
  const vagaLabel = vagaSel ? (vagas.find((v) => v.id === vagaSel)?.ref ?? "") : "Todos";

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    const l: (string | number)[][] = [
      ["Dashboard — Recrutamento IPMA"],
      ["Gerado em", hoje],
      ["Âmbito", ambitoLabel],
      ["Período (candidaturas e notificações)", periodoLabel],
      ["Procedimento", vagaLabel],
      [],
      ["Indicador", "Valor"],
      ...kpis.map((k) => [k.label, k.value]),
      [],
      ["Estado das candidaturas", "Total"],
      ...porEstadoCand.map((x) => [x.estado, x.total]),
      [],
      ["Procedimentos por estado", "Total"],
      ...porEstadoVaga.map((x) => [x.estado, x.total]),
      [],
      ["Unidade orgânica", "Procedimentos"],
      ...porUnidade.map((x) => [x.unidade, x.total]),
      [],
      ["Fase atual", "Procedimentos"],
      ...porFase.map((x) => [x.fase, x.total]),
      [],
      ["Método de seleção", "Classificação média (0–20)"],
      ...medias.map((m) => [m.label, m.valor === null ? "" : m.valor.toFixed(2).replace(".", ",")]),
      [],
      ["Documentos", "Total"],
      ...docsPorEstado.map((d) => [DOC_STATE_LABEL[d.estado], d.total]),
      [],
      ["Referência", "Procedimento", "Estado", "Prazo", "Candidaturas", "Por analisar"],
      ...vagasA.map((v) => [
        v.ref,
        v.title,
        JOB_STATE_LABEL[v.state],
        v.deadline,
        candA.filter((a) => a.vagaId === v.id).length,
        candA.filter((a) => a.vagaId === v.id && a.state === "SUBMITTED").length,
      ]),
    ];
    descarregarCsv(`dashboard-recrutamento-${hoje}.csv`, l);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="flex animate-rise flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              Backoffice · Divisão de Recursos Humanos
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-3 max-w-[60ch] text-[15px] text-muted-foreground text-pretty">
              Visão geral dos procedimentos concursais, das candidaturas e do trabalho pendente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            {ehGestorRh && !veTudo && (
              <div className="flex gap-1.5">
                <Chip active={ambito === "meus"} onClick={() => setAmbito("meus")}>
                  Os meus procedimentos
                </Chip>
                <Chip active={ambito === "todos"} onClick={() => setAmbito("todos")}>
                  Todos
                </Chip>
              </div>
            )}
            <Link
              to="/backoffice"
              className="rounded-md bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground ring-1 ring-black/5 hover:bg-primary/90"
            >
              Painel de vagas
            </Link>
          </div>
        </div>

        <p className="mt-3 hidden font-mono text-[11px] text-muted-foreground print:block">
          {ambitoLabel} · Período: {periodoLabel} · Procedimento: {vagaLabel} · Gerado em{" "}
          {new Date().toLocaleDateString("pt-PT")}
        </p>

        <div className="glass mt-6 flex animate-rise flex-wrap items-center gap-4 rounded-xl p-4 print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Período
            </span>
            {PERIODOS.map((p) => (
              <Chip key={p.id} active={periodo === p.id} onClick={() => setPeriodo(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Procedimento
            </span>
            <select
              value={vagaSel}
              onChange={(e) => setVagaSel(e.target.value)}
              className="input-ipma max-w-[320px]"
            >
              <option value="">Todos</option>
              {vagasScope.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.ref} — {v.title}
                </option>
              ))}
            </select>
          </label>
          {(periodo !== "tudo" || vagaSel) && (
            <button
              onClick={() => {
                setPeriodo("tudo");
                setVagaSel("");
              }}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Limpar filtros
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={exportarCsv}
              className="rounded-md border border-border bg-white/60 px-3 py-2 text-[12px] font-medium hover:bg-white"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-md border border-border bg-white/60 px-3 py-2 text-[12px] font-medium hover:bg-white"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid animate-rise grid-cols-2 gap-3 [animation-delay:80ms] md:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {k.label}
              </p>
              <p
                className={`mt-1 text-3xl font-bold tracking-tight ${
                  k.tone === "warn" ? "text-warn" : "text-primary"
                }`}
              >
                {k.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{k.hint}</p>
            </div>
          ))}
        </div>

        {/* Evolução + estado das candidaturas */}
        <div className="mt-4 grid animate-rise gap-4 [animation-delay:120ms] lg:grid-cols-3">
          <Painel titulo="Candidaturas por mês" sub="Últimos 6 meses" className="lg:col-span-2">
            <ChartContainer config={cfgMes} className="aspect-auto h-[260px] w-full">
              <BarChart data={porMes} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="candidaturas" fill="var(--color-candidaturas)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="candidaturas" position="top" className="fill-foreground" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Painel>

          <Painel titulo="Estado das candidaturas" sub="Do primeiro contacto ao desfecho">
            {porEstadoCand.length === 0 ? (
              <Vazio />
            ) : (
              <ChartContainer config={cfgTotal} className="aspect-auto h-[260px] w-full">
                <BarChart
                  data={porEstadoCand}
                  layout="vertical"
                  margin={{ top: 0, right: 28, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="estado"
                    tickLine={false}
                    axisLine={false}
                    width={84}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="total" radius={4}>
                    <LabelList dataKey="total" position="right" className="fill-foreground" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </Painel>
        </div>

        {/* Procedimentos */}
        <div className="mt-4 grid animate-rise gap-4 [animation-delay:160ms] md:grid-cols-2 xl:grid-cols-3">
          <Painel titulo="Procedimentos por estado">
            <ChartContainer config={cfgTotal} className="aspect-auto h-[220px] w-full">
              <BarChart data={porEstadoVaga} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="estado"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  fontSize={10}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="total" position="top" className="fill-foreground" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Painel>

          <Painel titulo="Por unidade orgânica" sub="Top 6">
            {porUnidade.length === 0 ? (
              <Vazio />
            ) : (
              <ChartContainer config={cfgTotal} className="aspect-auto h-[220px] w-full">
                <BarChart
                  data={porUnidade}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="unidade"
                    tickLine={false}
                    axisLine={false}
                    width={130}
                    fontSize={10}
                    tickFormatter={(v: string) =>
                      v.replace(/^(Divisão|Departamento) (de |do |da )?/, "")
                    }
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4}>
                    <LabelList dataKey="total" position="right" className="fill-foreground" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </Painel>

          <Painel titulo="Fase atual" sub="Procedimentos publicados e em curso">
            {porFase.length === 0 ? (
              <Vazio />
            ) : (
              <ul className="space-y-2.5">
                {porFase.map((f) => {
                  const max = Math.max(...porFase.map((x) => x.total));
                  return (
                    <li key={f.fase}>
                      <div className="flex items-baseline justify-between text-[13px]">
                        <span>{f.fase}</span>
                        <span className="font-mono text-[12px] text-muted-foreground">
                          {f.total}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(f.total / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {porTipo.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Tipo de oferta
                </p>
                <ul className="mt-2 space-y-1 text-[12px]">
                  {porTipo.map((t) => (
                    <li key={t.tipo} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{t.tipo}</span>
                      <span className="font-mono">{t.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Painel>
        </div>

        {/* Atenção + classificações + documentos */}
        <div className="mt-4 grid animate-rise gap-4 [animation-delay:200ms] lg:grid-cols-3">
          <Painel
            titulo="Requer atenção"
            sub="Prazos a terminar nos próximos 7 dias"
            className="lg:col-span-2"
          >
            {prazosCurtos.length === 0 && porAnalisar === 0 && emAudiencia === 0 ? (
              <p className="text-[13px] text-muted-foreground">Sem ações pendentes.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <th className="py-2 pr-3">Procedimento</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Prazo</th>
                      <th className="px-3 py-2">Por analisar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vagasA
                      .filter(
                        (v) =>
                          (v.state === "PUBLISHED" &&
                            daysUntil(v.deadline) >= 0 &&
                            daysUntil(v.deadline) <= 7) ||
                          candA.some((a) => a.vagaId === v.id && a.state === "SUBMITTED"),
                      )
                      .slice(0, 8)
                      .map((v) => {
                        const dias = daysUntil(v.deadline);
                        const pend = candA.filter(
                          (a) => a.vagaId === v.id && a.state === "SUBMITTED",
                        ).length;
                        return (
                          <tr
                            key={v.id}
                            className="border-b border-border/60 last:border-0 hover:bg-surface-2"
                          >
                            <td className="py-2.5 pr-3">
                              <Link
                                to="/backoffice/$vagaId"
                                params={{ vagaId: v.id }}
                                className="font-medium hover:text-primary"
                              >
                                {v.title}
                              </Link>
                              <p className="font-mono text-[10px] text-muted-foreground">{v.ref}</p>
                            </td>
                            <td className="px-3 py-2.5">
                              <JobStateBadge state={v.state} />
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={dias >= 0 && dias <= 7 ? "font-medium text-warn" : ""}
                              >
                                {formatDate(v.deadline)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono">{pend}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </Painel>

          <Painel titulo="Classificação média" sub="Por método de seleção (0–20)">
            <div className="grid grid-cols-3 gap-3">
              {medias.map((m) => (
                <div
                  key={m.sigla}
                  className="rounded-lg border border-border bg-white/50 p-3 text-center"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {m.sigla}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                    {m.valor === null ? "—" : m.valor.toFixed(1).replace(".", ",")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Documentos das candidaturas
              </p>
              {totalDocs === 0 ? (
                <p className="mt-2 text-[13px] text-muted-foreground">Sem documentos registados.</p>
              ) : (
                <>
                  <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-foreground/10">
                    {docsPorEstado.map((d) => (
                      <div
                        key={d.estado}
                        title={`${DOC_STATE_LABEL[d.estado]}: ${d.total}`}
                        style={{
                          width: `${(d.total / totalDocs) * 100}%`,
                          background: DOC_COLOR[d.estado],
                        }}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                    {docsPorEstado.map((d) => (
                      <li key={d.estado} className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: DOC_COLOR[d.estado] }}
                        />
                        <span className="text-muted-foreground">{DOC_STATE_LABEL[d.estado]}</span>
                        <span className="ml-auto font-mono">{d.total}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Painel>
        </div>

        {/* Atividade recente */}
        <div className="mt-4 animate-rise [animation-delay:240ms]">
          <Painel titulo="Notificações recentes" sub="Últimos envios por email">
            {recentes.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Ainda não foram enviadas notificações.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentes.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-[13px]"
                  >
                    <div>
                      <span className="font-medium">{n.destinatario}</span>
                      <span className="text-muted-foreground"> · {n.assunto}</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {STAGE_LABEL[n.stage]} · {formatDate(n.sentAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Painel>
        </div>
      </main>
    </PageShell>
  );
}

function Painel({
  titulo,
  sub,
  className = "",
  children,
}: {
  titulo: string;
  sub?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`glass break-inside-avoid rounded-xl p-5 ${className}`}>
      <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
      {sub && (
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {sub}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Vazio() {
  return (
    <p className="py-8 text-center text-[13px] text-muted-foreground">Sem dados para mostrar.</p>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
