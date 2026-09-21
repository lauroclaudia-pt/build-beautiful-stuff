import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageShell, JobStateBadge, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import { hasActiveRole } from "@/lib/pessoas";
import { Eye } from "lucide-react";
import {
  JOB_STATE_LABEL,
  OFFER_TYPE_LABEL,
  daysUntil,
  defaultRemunerationNotes,
  departmentsOf,
  formatDate,
  nextRef,
  offerTypeRules,
  selectionMethodsFrom,
  stageCodesFor,
  STAGE_LABEL,
  type JobState,
  type OfferType,
} from "@/lib/recrutamento";

export const Route = createFileRoute("/backoffice/")({
  head: () => ({
    meta: [
      { title: "Backoffice — Gestão de procedimentos | Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Painel de gestão dos procedimentos concursais do IPMA: abertura de vagas, publicação, acompanhamento de etapas e candidaturas recebidas.",
      },
      { property: "og:title", content: "Backoffice — Gestão de procedimentos | Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Abertura, publicação e acompanhamento de procedimentos concursais do IPMA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole>
      <Backoffice />
    </RequireRole>
  ),
});

const STATES: JobState[] = ["DRAFT", "PUBLISHED", "RUNNING", "FINISHED", "CANCELLED", "DESERT"];

function Backoffice() {
  const { vagas, applicants, publishVaga, addVaga, currentUser } = useStore();
  const podeTudo = hasActiveRole(currentUser, "ADMIN", "GESTAO");
  const ehGestorRh = hasActiveRole(currentUser, "GESTOR_RH");
  const podeGerir = (v: (typeof vagas)[number]) =>
    podeTudo || (ehGestorRh && v.hrManagerId === currentUser?.id);
  const [filtro, setFiltro] = useState<JobState | "">("");
  const [q, setQ] = useState("");
  const [novo, setNovo] = useState(false);

  const lista = useMemo(
    () =>
      vagas.filter((v) => {
        if (filtro && v.state !== filtro) return false;
        if (q && !(`${v.title} ${v.ref}`.toLowerCase().includes(q.toLowerCase()))) return false;
        return true;
      }),
    [vagas, filtro, q],
  );

  const candidatosUnicos = useMemo(() => {
    const chaves = new Set(
      applicants.map((a) => (a.nif ? `nif:${a.nif}` : a.email ? `mail:${a.email.toLowerCase()}` : a.id)),
    );
    return chaves.size;
  }, [applicants]);

  const kpis = [
    ["Procedimentos", vagas.length],
    ["Publicados", vagas.filter((v) => v.state === "PUBLISHED").length],
    ["Em curso", vagas.filter((v) => v.state === "RUNNING").length],
    ["Candidaturas", applicants.length],
    ["Candidatos", candidatosUnicos],
    ["Por analisar", applicants.filter((a) => a.state === "SUBMITTED").length],
  ] as const;

  function publicar(id: string) {
    const r = publishVaga(id);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="flex animate-rise flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              Backoffice · Divisão de Recursos Humanos
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Painel de Recrutamento</h1>
          </div>
          <button
            onClick={() => setNovo((n) => !n)}
            className="rounded-md bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground ring-1 ring-black/5 hover:bg-primary/90"
          >
            {novo ? "Fechar formulário" : "Abrir novo procedimento"}
          </button>
        </div>

        <div className="mt-6 grid animate-rise grid-cols-2 gap-3 [animation-delay:80ms] md:grid-cols-3 lg:grid-cols-6">
          {kpis.map(([k, v]) => (
            <div key={k} className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {k}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-primary">{v}</p>
            </div>
          ))}
        </div>

        {novo && <NovaVaga onCreate={addVaga} onDone={() => setNovo(false)} />}

        <div className="mt-6 flex animate-rise flex-wrap items-center gap-3 [animation-delay:120ms]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar por título ou referência"
            className="input-ipma max-w-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filtro === ""} onClick={() => setFiltro("")}>
              Todos
            </Chip>
            {STATES.map((s) => (
              <Chip key={s} active={filtro === s} onClick={() => setFiltro(s)}>
                {JOB_STATE_LABEL[s]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="glass mt-4 animate-rise overflow-x-auto rounded-xl [animation-delay:160ms]">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Ref.</th>
                <th className="px-4 py-3">Procedimento</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Cands.</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((v) => {
                const n = applicants.filter((a) => a.vagaId === v.id).length;
                const dias = daysUntil(v.deadline);
                return (
                  <tr key={v.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3 font-mono text-[11px]">{v.ref}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={podeGerir(v) ? "/backoffice/$vagaId" : "/vagas/$vagaId"}
                        params={{ vagaId: v.id }}
                        className="font-medium hover:text-primary"
                      >
                        {v.title}
                      </Link>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {OFFER_TYPE_LABEL[v.offerType]}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{departmentsOf(v).join(" · ")}</td>
                    <td className="px-4 py-3">
                      <JobStateBadge state={v.state} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={dias <= 7 ? "font-medium text-warn" : ""}>
                        {formatDate(v.deadline)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{n}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {v.state === "DRAFT" && podeGerir(v) && (
                          <button
                            onClick={() => publicar(v.id)}
                            className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Publicar
                          </button>
                        )}
                        <Link
                          to="/vagas/$vagaId"
                          params={{ vagaId: v.id }}
                          title="Consultar"
                          aria-label="Consultar"
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/60 px-3 py-1.5 text-[12px] font-medium"
                        >
                          <Eye size={14} />
                          Consultar
                        </Link>
                        {podeGerir(v) && (
                          <Link
                            to="/backoffice/$vagaId"
                            params={{ vagaId: v.id }}
                            className="rounded-md border border-border bg-white/60 px-3 py-1.5 text-[12px] font-medium"
                          >
                            Gerir
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Sem procedimentos para os critérios selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </PageShell>
  );
}

function Chip({
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

function NovaVaga({
  onCreate,
  onDone,
}: {
  onCreate: ReturnType<typeof useStore>["addVaga"];
  onDone: () => void;
}) {
  const { opcoesDe, pessoas, currentUser, vagas } = useStore();
  const gestores = pessoas.filter((p) => hasActiveRole(p, "GESTOR_RH"));
  const departamentos = opcoesDe("DEPARTAMENTO");
  const locais = opcoesDe("LOCAL");
  const carreiras = opcoesDe("CARREIRA");
  const habilitacoes = opcoesDe("HABILITACAO");
  const vinculos = opcoesDe("VINCULO");
  const regimes = opcoesDe("REGIME");
  const refAuto = useMemo(() => nextRef(vagas), [vagas]);

  const [f, setF] = useState({
    title: "",
    offerType: "PROCEDIMENTO_CONCURSAL_COMUM" as OfferType,
    departments: departamentos[0] ? [departamentos[0]] : ([] as string[]),
    locations: locais[0] ? [locais[0]] : ([] as string[]),
    positions: 1,
    career: carreiras[0] ?? "",
    bond: vinculos[0] ?? "",
    regime: regimes[0] ?? "",
    remuneration: "",
    remunerationNotes: defaultRemunerationNotes("PROCEDIMENTO_CONCURSAL_COMUM"),
    educationLevel: habilitacoes[1] ?? habilitacoes[0] ?? "",
    requirements: "",
    description: "",
    juryPresident: "",
    hrManagerId: gestores.find((g) => g.id === currentUser?.id)?.id ?? gestores[0]?.id ?? "",
    juryMembers: "",
    bepCode: "",
    deadline: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    hasPc: true,
    hasAc: true,
    hasEac: false,
  });

  const rules = offerTypeRules(f.offerType);
  const hasPc = rules.pc ?? f.hasPc;
  const hasAc = rules.ac ?? f.hasAc;
  const hasEac = rules.eac ?? f.hasEac;
  const fases = stageCodesFor(f.offerType, { hasAc, hasEac });
  const metodosSelecionados = selectionMethodsFrom({ hasPc, hasAc, hasEac });
  const maxLocais = Math.max(1, rules.singlePosition ? 1 : Number(f.positions) || 1);

  function alternarLocal(d: string) {
    setF((prev) => {
      const on = prev.locations.includes(d);
      if (on) return { ...prev, locations: prev.locations.filter((x) => x !== d) };
      if (prev.locations.length >= maxLocais) return prev;
      return { ...prev, locations: [...prev.locations, d] };
    });
  }

  function mudarTipo(t: OfferType) {
    const r = offerTypeRules(t);
    setF((prev) => {
      // Mantém o texto se já foi editado; caso contrário, segue o predefinido do novo tipo.
      const notes = !prev.remunerationNotes.trim() || prev.remunerationNotes === defaultRemunerationNotes(prev.offerType)
        ? defaultRemunerationNotes(t)
        : prev.remunerationNotes;
      return {
        ...prev,
        offerType: t,
        remunerationNotes: notes,
        hasPc: r.pc ?? r.defaults.pc,
        hasAc: r.ac ?? r.defaults.ac,
        hasEac: r.eac ?? r.defaults.eac,
        positions: r.singlePosition ? 1 : prev.positions,
      };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) {
      toast.error("Indique o título do procedimento.");
      return;
    }
    if (f.departments.length === 0) {
      toast.error("Escolha pelo menos uma unidade orgânica.");
      return;
    }
    if (f.locations.length === 0) {
      toast.error("Escolha pelo menos um local de trabalho.");
      return;
    }
    if (f.locations.length > maxLocais) {
      toast.error(`Só pode escolher ${maxLocais} local(is) de trabalho.`);
      return;
    }
    onCreate({
      ...f,
      hasPc,
      hasAc,
      hasEac,
      ref: refAuto,
      title: f.title.trim(),
      department: f.departments[0] ?? "",
      location: f.locations[0] ?? "",
      selectionMethods: metodosSelecionados,
      positions: Number(f.positions) || 1,
      juryMembers: f.juryMembers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    toast.success("Procedimento criado como rascunho.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="glass mt-6 animate-rise grid gap-4 rounded-xl p-6 sm:grid-cols-3">
      <L label="Referência (automática)">
        <input value={refAuto} readOnly className="input-ipma bg-surface-2 text-muted-foreground" />
      </L>
      <L label="Data de publicação">
        <input
          value="Preenchida ao publicar"
          readOnly
          className="input-ipma bg-surface-2 text-muted-foreground"
        />
      </L>
      <div className="sm:col-span-2">
        <L label="Título">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="input-ipma" />
        </L>
      </div>
      <L label="Tipo de oferta">
        <select
          value={f.offerType}
          onChange={(e) => mudarTipo(e.target.value as OfferType)}
          className="input-ipma"
        >
          {Object.entries(OFFER_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </L>
      <div className="sm:col-span-3">
        <L label="Unidade(s) orgânica(s)">
          <div className="flex flex-wrap gap-2">
            {departamentos.map((d) => {
              const on = f.departments.includes(d);
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() =>
                    setF({
                      ...f,
                      departments: on
                        ? f.departments.filter((x) => x !== d)
                        : [...f.departments, d],
                    })
                  }
                  className={`rounded-md px-3 py-1.5 text-[12px] ${
                    on ? "bg-primary text-primary-foreground" : "border border-border bg-white/60"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </L>
      </div>
      <L label="Cargo / carreira">
        <select
          value={f.career}
          onChange={(e) => setF({ ...f, career: e.target.value })}
          className="input-ipma"
        >
          {carreiras.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </L>
      <L label="Vínculo">
        <select
          value={f.bond}
          onChange={(e) => setF({ ...f, bond: e.target.value })}
          className="input-ipma"
        >
          {vinculos.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </L>
      <L label="Regime">
        <select
          value={f.regime}
          onChange={(e) => setF({ ...f, regime: e.target.value })}
          className="input-ipma"
        >
          {regimes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </L>
      <div className="sm:col-span-3 rounded-lg border border-border bg-white/50 p-4">
        <L label={`Local de trabalho (máx. ${maxLocais} — n.º de postos)`}>
          <div className="flex flex-wrap gap-2">
            {locais.map((d) => {
              const on = f.locations.includes(d);
              const cheio = !on && f.locations.length >= maxLocais;
              return (
                <button
                  type="button"
                  key={d}
                  disabled={cheio}
                  onClick={() => alternarLocal(d)}
                  className={`rounded-md px-3 py-1.5 text-[12px] disabled:opacity-40 ${
                    on ? "bg-primary text-primary-foreground" : "border border-border bg-white/60"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </L>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Selecionados {f.locations.length} de {maxLocais} locais permitidos.
        </p>
      </div>
      <L label="Postos">
        <input
          type="number"
          min={1}
          value={rules.singlePosition ? 1 : f.positions}
          disabled={rules.singlePosition}
          onChange={(e) => {
            const n = Math.max(1, Number(e.target.value) || 1);
            setF((prev) => ({ ...prev, positions: n, locations: prev.locations.slice(0, n) }));
          }}
          className="input-ipma disabled:opacity-60"
        />
      </L>
      <L label="Habilitação mínima">
        <select
          value={f.educationLevel}
          onChange={(e) => setF({ ...f, educationLevel: e.target.value })}
          className="input-ipma"
        >
          {habilitacoes.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </L>
      <L label="Prazo de candidatura">
        <input
          type="date"
          value={f.deadline}
          onChange={(e) => setF({ ...f, deadline: e.target.value })}
          className="input-ipma"
        />
      </L>
      <L label="Remuneração">
        <input
          value={f.remuneration}
          onChange={(e) => setF({ ...f, remuneration: e.target.value })}
          className="input-ipma"
        />
      </L>
      <L label={<>Suplemento mensal{dirigente && <Req />}</>}>
        <input
          inputMode="decimal"
          placeholder="0,00 €"
          value={f.monthlySupplement}
          onChange={(e) => setF({ ...f, monthlySupplement: e.target.value })}
          className="input-ipma"
        />
      </L>
      <L label="Código BEP/Edital">
        <input value={f.bepCode} onChange={(e) => setF({ ...f, bepCode: e.target.value })} className="input-ipma" />
      </L>
      <L label="Gestor de RH responsável">
        <select
          value={f.hrManagerId}
          onChange={(e) => setF({ ...f, hrManagerId: e.target.value })}
          className="input-ipma"
        >
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </L>
      <L label="Presidente do júri">
        <input
          value={f.juryPresident}
          onChange={(e) => setF({ ...f, juryPresident: e.target.value })}
          className="input-ipma"
        />
      </L>
      <L label="Vogais (separados por vírgula)">
        <input
          value={f.juryMembers}
          onChange={(e) => setF({ ...f, juryMembers: e.target.value })}
          className="input-ipma"
        />
      </L>
      <div className="sm:col-span-3 rounded-lg border border-border bg-white/50 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Tramitação deste tipo de oferta
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {fases.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground">›</span>}
              <span className="rounded-md bg-primary/10 px-2 py-1 text-[12px] text-primary">
                {STAGE_LABEL[c]}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">{rules.nota}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          {([
            ["Prova de conhecimentos (PC)", hasPc, rules.pc !== null, (v: boolean) => setF({ ...f, hasPc: v })],
            ["Avaliação curricular (AC)", hasAc, rules.ac !== null, (v: boolean) => setF({ ...f, hasAc: v })],
            ["Entrevista (EAC)", hasEac, rules.eac !== null, (v: boolean) => setF({ ...f, hasEac: v })],
          ] as const).map(([label, val, locked, set]) => (
            <label key={label} className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={val}
                disabled={locked}
                onChange={(e) => set(e.target.checked)}
              />
              <span className={locked ? "text-muted-foreground" : ""}>
                {label}
                {locked ? " (imposto)" : ""}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-3">
        <L label="Métodos de seleção (definidos pela tramitação)">
          <div className="flex flex-wrap gap-2">
            {metodosSelecionados.length === 0 && (
              <span className="text-[12px] text-muted-foreground">
                Selecione acima as fases de avaliação (PC, AC, EAC).
              </span>
            )}
            {metodosSelecionados.map((m) => (
              <span key={m} className="rounded-md bg-primary px-3 py-1.5 text-[12px] text-primary-foreground">
                {m}
              </span>
            ))}
          </div>
        </L>
      </div>
      <div className="sm:col-span-3">
        <L label="Características da remuneração">
          <textarea
            rows={3}
            value={f.remunerationNotes}
            onChange={(e) => setF({ ...f, remunerationNotes: e.target.value })}
            placeholder="Posição e nível remuneratório, suplementos, subsídios e outras condições."
            className="input-ipma"
          />
        </L>
      </div>
      <div className="sm:col-span-3">
        <L label="Caracterização do posto">
          <textarea
            rows={3}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            className="input-ipma"
          />
        </L>
      </div>
      <div className="sm:col-span-3">
        <L label="Requisitos">
          <textarea
            rows={3}
            value={f.requirements}
            onChange={(e) => setF({ ...f, requirements: e.target.value })}
            className="input-ipma"
          />
        </L>
      </div>
      <div className="sm:col-span-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Guardar rascunho
        </button>
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
