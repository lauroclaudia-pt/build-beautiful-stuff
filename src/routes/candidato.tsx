import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApplicantStateBadge, JobStateBadge, PageShell } from "@/components/shell";
import { finalGrade, useStore } from "@/lib/store";
import { ROLE_LABEL, activeRoles } from "@/lib/pessoas";
import {
  DEFAULT_DOCUMENTS,
  DOC_STATE_LABEL,
  STAGE_LABEL,
  daysUntil,
  formatDate,
  type DocState,
} from "@/lib/recrutamento";
import { FilePickButton } from "@/components/file-upload";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/candidato")({
  head: () => ({
    meta: [
      { title: "Portal do candidato — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Acompanhe as suas candidaturas ao IPMA: estado do procedimento, documentos entregues ou em falta, notas e alegações.",
      },
      { property: "og:title", content: "Portal do candidato — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Estado das candidaturas, documentos e alegações no recrutamento do IPMA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalCandidato,
});

const docTone: Record<DocState, string> = {
  PENDING: "bg-subsolo/20 text-[oklch(0.55_0.13_70)]",
  RECEIVED: "bg-atmosfera/20 text-primary",
  VALIDATED: "bg-success/10 text-success",
  MISSING: "bg-destructive/10 text-destructive",
};

function PortalCandidato() {
  const {
    hydrated,
    currentUser,
    vagas,
    applicants,
    setDocumentState,
    addDocumentUploads,
    addAppeal,
    notificacoes,
  } = useStore();
  const [appealText, setAppealText] = useState<Record<string, string>>({});
  const [docDesc, setDocDesc] = useState<Record<string, string>>({});

  const minhasNotificacoes = useMemo(() => {
    if (!currentUser) return [];
    return notificacoes
      .filter((n) => n.email.toLowerCase() === currentUser.email.toLowerCase())
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }, [notificacoes, currentUser]);

  const minhas = useMemo(() => {
    if (!currentUser) return [];
    return applicants
      .filter((a) => a.email.toLowerCase() === currentUser.email.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [applicants, currentUser]);

  const abertas = useMemo(
    () =>
      vagas.filter(
        (v) =>
          (v.state === "PUBLISHED" || v.state === "RUNNING") &&
          daysUntil(v.deadline) >= 0 &&
          !minhas.some((a) => a.vagaId === v.id),
      ),
    [vagas, minhas],
  );

  if (!hydrated) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1200px] px-6 py-16">
          <p className="font-mono text-xs text-muted-foreground">A carregar…</p>
        </main>
      </PageShell>
    );
  }

  if (!currentUser) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[720px] px-6 py-20 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Portal do candidato</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Inicie sessão para ver as suas candidaturas, o estado dos documentos e responder a
            novas vagas.
          </p>
          <Link
            to="/entrar"
            className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Entrar
          </Link>
        </main>
      </PageShell>
    );
  }

  const roles = activeRoles(currentUser);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] space-y-8 px-6 py-10">
        <header className="glass rounded-2xl p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Portal do candidato
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{currentUser.name}</h1>
          <p className="font-mono text-xs text-muted-foreground">
            {currentUser.email} · NIF {currentUser.nif}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((r) => (
              <span
                key={r}
                className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary"
              >
                {ROLE_LABEL[r]}
              </span>
            ))}
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Candidaturas", minhas.length],
              [
                "Em avaliação",
                minhas.filter((a) => ["UNDER_REVIEW", "ADMITTED", "UNDER_APPEAL"].includes(a.state))
                  .length,
              ],
              [
                "Documentos em falta",
                minhas.reduce(
                  (n, a) =>
                    n +
                    (a.documents ?? DEFAULT_DOCUMENTS).filter(
                      (d) => d.state === "PENDING" || d.state === "MISSING",
                    ).length,
                  0,
                ),
              ],
            ].map(([label, val]) => (
              <div key={String(label)} className="rounded-xl border border-border bg-white/50 p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{val}</dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            As minhas candidaturas
          </h2>
          {minhas.length === 0 && (
            <p className="glass rounded-xl p-6 text-sm text-muted-foreground">
              Ainda não submeteu candidaturas. Escolha uma vaga aberta em baixo.
            </p>
          )}
          {minhas.map((a) => {
            const vaga = vagas.find((v) => v.id === a.vagaId);
            const docs = a.documents ?? DEFAULT_DOCUMENTS;
            const nota = finalGrade(a);
            return (
              <article key={a.id} className="glass rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ApplicantStateBadge state={a.state} />
                      {vaga && <JobStateBadge state={vaga.state} />}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{vaga?.title ?? "Vaga"}</h3>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {vaga?.ref} · submetida a {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Classificação
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {nota === null ? "—" : nota.toFixed(2)}
                    </p>
                  </div>
                </div>

                {vaga && (
                  <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {vaga.stages.map((s) => (
                      <li
                        key={s.code}
                        className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] ${
                          s.state === "completed"
                            ? "border-success/40 bg-success/10 text-success"
                            : s.state === "active"
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-white/40 text-muted-foreground"
                        }`}
                      >
                        {STAGE_LABEL[s.code]}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Documentos
                    </p>
                    <ul className="mt-2 space-y-2">
                      {docs.map((d) => {
                        const descKey = `${a.id}:${d.id}`;
                        return (
                          <li
                            key={d.id}
                            className="rounded-lg border border-border bg-white/50 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="text-[13px]">{d.label}</span>
                              <span
                                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${docTone[d.state]}`}
                              >
                                {DOC_STATE_LABEL[d.state]}
                              </span>
                            </div>
                            {(d.uploads ?? []).length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {(d.uploads ?? []).map((u, i) => (
                                  <li
                                    key={`${u.name}-${i}`}
                                    className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"
                                  >
                                    <FileText className="size-3 shrink-0 text-primary" />
                                    <span className="truncate">{u.name}</span>
                                    {u.description && (
                                      <span className="truncate text-[10px] uppercase tracking-[0.08em]">
                                        · {u.description}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {(d.state === "PENDING" || d.state === "MISSING") && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <input
                                  value={docDesc[descKey] ?? ""}
                                  maxLength={120}
                                  placeholder="Descrição do documento (opcional)"
                                  onChange={(e) =>
                                    setDocDesc((prev) => ({
                                      ...prev,
                                      [descKey]: e.target.value,
                                    }))
                                  }
                                  className="input-ipma min-w-40 flex-1 !py-1 text-[12px]"
                                />
                                <FilePickButton
                                  small
                                  multiple
                                  accept=".pdf,.doc,.docx,image/*"
                                  label="Escolher ficheiros"
                                  onPick={(files) => {
                                    const desc = (docDesc[descKey] ?? "").trim();
                                    addDocumentUploads(
                                      a.id,
                                      d.id,
                                      files.map((f) => ({
                                        name: f.name,
                                        description: desc || undefined,
                                      })),
                                    );
                                    setDocDesc((prev) => ({ ...prev, [descKey]: "" }));
                                    toast.success(`${d.label} entregue.`);
                                  }}
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Audiência de interessados
                    </p>
                    {a.state === "EXCLUDED" && a.exclusionReason && (
                      <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                        Motivo de exclusão: {a.exclusionReason}
                      </p>
                    )}
                    {a.appeal ? (
                      <div className="mt-2 rounded-lg border border-border bg-white/50 p-3">
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Alegação submetida a {formatDate(a.appeal.createdAt)}
                        </p>
                        <p className="mt-1 text-[13px]">{a.appeal.text}</p>
                      </div>
                    ) : a.state === "EXCLUDED" ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={4}
                          value={appealText[a.id] ?? ""}
                          onChange={(e) =>
                            setAppealText((s) => ({ ...s, [a.id]: e.target.value }))
                          }
                          placeholder="Descreva os fundamentos da sua alegação…"
                          className="input-ipma w-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const text = (appealText[a.id] ?? "").trim();
                            if (text.length < 20) {
                              toast.error("A alegação deve ter pelo menos 20 caracteres.");
                              return;
                            }
                            addAppeal(a.id, text);
                            setAppealText((s) => ({ ...s, [a.id]: "" }));
                            toast.success("Alegação submetida ao júri.");
                          }}
                          className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Submeter alegação
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        Não há pronúncias pendentes nesta candidatura.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            As minhas notificações
          </h2>
          {minhasNotificacoes.length === 0 ? (
            <p className="glass rounded-xl p-6 text-sm text-muted-foreground">
              Ainda não recebeu notificações. Quando o júri o notificar, a mensagem fica aqui
              disponível para consulta.
            </p>
          ) : (
            <ul className="space-y-3">
              {minhasNotificacoes.map((n) => {
                const v = vagas.find((x) => x.id === n.vagaId);
                return (
                  <li key={n.id} className="glass rounded-xl p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {new Date(n.sentAt).toLocaleString("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                      {v ? ` · ${v.ref}` : ""} · {STAGE_LABEL[n.stage]}
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold">{n.assunto}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                      {n.texto}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Vagas abertas a que pode responder
          </h2>
          {abertas.length === 0 ? (
            <p className="glass rounded-xl p-6 text-sm text-muted-foreground">
              De momento não há vagas abertas sem candidatura sua.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {abertas.map((v) => (
                <li key={v.id} className="glass rounded-xl p-5">
                  <JobStateBadge state={v.state} />
                  <h3 className="mt-2 text-[15px] font-semibold">{v.title}</h3>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {v.ref} · prazo {formatDate(v.deadline)} ({daysUntil(v.deadline)} dias)
                  </p>
                  <Link
                    to="/vagas/$vagaId"
                    params={{ vagaId: v.id }}
                    className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Responder à vaga
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </PageShell>
  );
}
