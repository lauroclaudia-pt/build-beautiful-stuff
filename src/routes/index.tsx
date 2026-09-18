import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listJavaVagas, javaBase } from "@/lib/java-api";
import { PageShell, JobStateBadge } from "@/components/shell";
import { useStore } from "@/lib/store";
import {
  OFFER_TYPE_LABEL,
  daysUntil,
  formatDate,
  type OfferType,
} from "@/lib/recrutamento";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recrutamento IPMA — Vagas e procedimentos concursais" },
      {
        name: "description",
        content:
          "Consulte as ofertas de emprego, procedimentos concursais e bolsas do Instituto Português do Mar e da Atmosfera e candidate-se dentro do prazo.",
      },
      { property: "og:title", content: "Recrutamento IPMA — Vagas e procedimentos concursais" },
      {
        property: "og:description",
        content: "Ofertas de emprego, procedimentos concursais e bolsas do IPMA, I.P.",
      },
    ],
  }),
  component: Portal,
});

function Portal() {
  const { vagas, applicants, site, opcoesDe, hydrated, syncJavaVagas } = useStore();
  const [servidor, setServidor] = useState<"ok" | "indisponivel" | null>(null);
  const departamentos = opcoesDe("DEPARTAMENTO");
  const locaisDisponiveis = opcoesDe("LOCAL");
  const carreirasAtivas = opcoesDe("CARREIRA");
  const [tipo, setTipo] = useState<string>("");
  const [unidade, setUnidade] = useState<string>("");
  const [carreira, setCarreira] = useState<string>("");
  const [locais, setLocais] = useState<string[]>([]);
  const [prazo, setPrazo] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Sincroniza as vagas publicadas no servidor de recrutamento (backend Java).
  useEffect(() => {
    if (!hydrated) return;
    let ativo = true;
    listJavaVagas(javaBase(site.apiUrl)).then((lista) => {
      if (!ativo) return;
      if (!lista) {
        setServidor("indisponivel");
        return;
      }
      setServidor("ok");
      if (lista.length) syncJavaVagas(lista);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const publicas = useMemo(
    () => vagas.filter((v) => v.state === "PUBLISHED" || v.state === "RUNNING"),
    [vagas],
  );

  const algumFiltro =
    site.showTypeFilter || site.showDepartmentFilter || site.showCareerFilter || site.showLocationFilter;

  const carreiras = useMemo(
    () =>
      carreirasAtivas.filter((c) => publicas.some((v) => v.career === c)),
    [publicas, carreirasAtivas],
  );

  const lista = useMemo(() => {
    return publicas.filter((v) => {
      if (site.showTypeFilter && tipo && v.offerType !== tipo) return false;
      if (site.showDepartmentFilter && unidade && v.department !== unidade) return false;
      if (site.showCareerFilter && carreira && v.career !== carreira) return false;
      if (site.showLocationFilter && locais.length && !locais.includes(v.location)) return false;
      if (prazo && daysUntil(v.deadline) > prazo) return false;
      return true;
    });
  }, [publicas, tipo, unidade, carreira, locais, prazo, site]);

  const detalhe = lista.find((v) => v.id === selected) ?? lista[0];
  const aEncerrar = publicas.filter((v) => daysUntil(v.deadline) <= 7).length;
  const concluidos = vagas.filter((v) => v.state === "FINISHED").length;
  const emAnalise = vagas.filter(
    (v) =>
      v.state !== "PUBLISHED" &&
      v.state !== "RUNNING" &&
      v.state !== "FINISHED" &&
      v.state !== "CANCELLED",
  ).length;

  function toggleLocal(local: string) {
    setLocais((l) => (l.includes(local) ? l.filter((x) => x !== local) : [...l, local]));
  }

  function limpar() {
    setTipo("");
    setUnidade("");
    setCarreira("");
    setLocais([]);
    setPrazo(null);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <section className="animate-rise">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[46ch]">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Portal público · {new Date().getFullYear()}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
                {site.heroTitle}
              </h1>
              <p className="mt-3 max-w-[52ch] text-[15px] text-muted-foreground text-pretty">
                {site.heroLead}
              </p>
              {servidor === "indisponivel" && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-warn">
                  Servidor de recrutamento indisponível — a mostrar os dados locais
                </p>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
              <div className="glass min-w-0 rounded-lg border-l-4 border-l-primary px-4 py-3 sm:min-w-[120px] sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Abertas
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{publicas.length}</p>
              </div>
              <div className="glass min-w-0 rounded-lg border-l-4 border-l-subsolo px-4 py-3 sm:min-w-[120px] sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Em análise
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-warn">{emAnalise}</p>
              </div>
              <div className="glass min-w-0 rounded-lg border-l-4 border-l-neutral px-4 py-3 sm:min-w-[120px] sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Concluídos
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{concluidos}</p>
              </div>
              <div className="glass min-w-0 rounded-lg border-l-4 border-l-atmosfera px-4 py-3 sm:min-w-[120px] sm:px-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  A encerrar
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-primary">{aEncerrar}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-12 gap-6">
          {algumFiltro && (
          <aside className="col-span-12 animate-rise [animation-delay:80ms] lg:col-span-3">
            <div className="glass rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Filtros
              </p>
              <div className="mt-4 space-y-5">
                {site.showTypeFilter && (
                <div>
                  <label
                    htmlFor="tipo"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Tipo de procedimento
                  </label>
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-white/50 px-3 py-2 text-[13px]"
                  >
                    <option value="">Todos</option>
                    {(Object.keys(OFFER_TYPE_LABEL) as OfferType[]).map((t) => (
                      <option key={t} value={t}>
                        {OFFER_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                )}
                {site.showDepartmentFilter && (
                <div>
                  <label
                    htmlFor="unidade"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Unidade orgânica
                  </label>
                  <select
                    id="unidade"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-white/50 px-3 py-2 text-[13px]"
                  >
                    <option value="">Todas</option>
                    {departamentos.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                )}
                {site.showCareerFilter && (
                  <div>
                    <label
                      htmlFor="carreira"
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      Cargo / carreira
                    </label>
                    <select
                      id="carreira"
                      value={carreira}
                      onChange={(e) => setCarreira(e.target.value)}
                      className="mt-2 w-full rounded-md border border-border bg-white/50 px-3 py-2 text-[13px]"
                    >
                      <option value="">Todas</option>
                      {carreiras.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {site.showLocationFilter && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Local
                  </p>
                  <div className="mt-2 space-y-2 text-[13px]">
                    {locaisDisponiveis.map((l) => (
                      <label key={l} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={locais.includes(l)}
                          onChange={() => toggleLocal(l)}
                          className="size-3.5 rounded border-border accent-[var(--primary)]"
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
                )}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Prazo
                  </p>
                  <div className="mt-2 flex gap-1 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPrazo(prazo === 7 ? null : 7)}
                      className={`flex-1 rounded-md py-1.5 ${prazo === 7 ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                    >
                      7 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrazo(prazo === 30 ? null : 30)}
                      className={`flex-1 rounded-md py-1.5 ${prazo === 30 ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                    >
                      30 dias
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={limpar}
                className="mt-6 w-full rounded-md border border-border bg-white/40 py-2 text-[13px] font-medium transition-colors hover:bg-white/70"
              >
                Limpar filtros
              </button>
            </div>
          </aside>
          )}

          <div
            className={`col-span-12 space-y-4 ${algumFiltro ? "lg:col-span-6" : "lg:col-span-9"}`}
          >
            <div className="flex animate-rise items-center justify-between [animation-delay:120ms]">
              <p className="font-mono text-[11px] text-muted-foreground">
                {lista.length} {lista.length === 1 ? "vaga encontrada" : "vagas encontradas"}
              </p>
            </div>

            {lista.length === 0 && (
              <div className="glass rounded-xl p-8 text-center text-[13px] text-muted-foreground">
                Não há vagas que correspondam aos filtros selecionados.
              </div>
            )}

            {lista.map((v, i) => {
              const dias = daysUntil(v.deadline);
              const n = applicants.filter((a) => a.vagaId === v.id).length;
              return (
                <article
                  key={v.id}
                  onMouseEnter={() => setSelected(v.id)}
                  style={{ animationDelay: `${160 + i * 60}ms` }}
                  className="glass animate-rise rounded-xl p-5 ring-1 ring-black/5 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                          {OFFER_TYPE_LABEL[v.offerType]}
                        </span>
                        <JobStateBadge state={v.state} />
                      </div>
                      <h2 className="mt-3 text-lg font-semibold tracking-tight">{v.title}</h2>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        Ref. {v.ref} · {v.department} · {v.location}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Prazo
                      </p>
                      <p
                        className={`text-lg font-bold tracking-tight ${dias <= 7 ? "text-warn" : "text-primary"}`}
                      >
                        {dias > 0 ? `${dias} dias` : "Encerrado"}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        até {formatDate(v.deadline)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {n} {n === 1 ? "candidatura" : "candidaturas"} · {v.positions}{" "}
                      {v.positions === 1 ? "posto" : "postos"}
                    </p>
                    <Link
                      to="/vagas/$vagaId"
                      params={{ vagaId: v.id }}
                      className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Ver vaga
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="col-span-12 animate-rise [animation-delay:320ms] lg:col-span-3">
            {detalhe && (
              <div className="glass sticky top-24 rounded-xl p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Detalhe da vaga
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-balance">
                  {detalhe.title}
                </h3>
                <div className="mt-4 space-y-3 text-[13px]">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Carreira</span>
                    <span className="font-medium">{detalhe.career}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Habilitação</span>
                    <span className="font-medium">{detalhe.educationLevel}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Regime</span>
                    <span className="font-medium">{detalhe.regime}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Remuneração</span>
                    <span className="text-right font-medium">{detalhe.remuneration}</span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-border bg-white/40 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Requisitos
                  </p>
                  <p className="mt-1 text-[13px] text-pretty">{detalhe.requirements}</p>
                </div>
                <Link
                  to="/vagas/$vagaId"
                  params={{ vagaId: detalhe.id }}
                  className="mt-4 block w-full rounded-md bg-primary py-2.5 text-center text-[13px] font-medium text-primary-foreground ring-1 ring-black/5 transition-colors hover:bg-primary/90"
                >
                  Candidatar-se
                </Link>
                <div className="mt-4 flex items-center justify-center">
                  <span className="animate-stamp inline-block rounded border-2 border-primary/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    Registo {detalhe.ref}
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
