import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import { STAGE_LABEL, type StageCode } from "@/lib/recrutamento";
import { DEFAULT_DOC_TEMPLATES, TEMPLATE_FIELDS, docEstado, type DocTemplate } from "@/lib/site";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];
const STAGES = Object.keys(STAGE_LABEL) as StageCode[];

export const Route = createFileRoute("/backoffice/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos e atas — Gestão | Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Editar os modelos de documentos e atas a gerar em cada fase dos procedimentos concursais do IPMA.",
      },
      { property: "og:title", content: "Documentos e atas — Gestão | Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Nome, estado, data de início e data de fim dos documentos gerados em cada fase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <GestaoDocumentos />
    </RequireRole>
  ),
});

function GestaoDocumentos() {
  const { site, updateSite } = useStore();
  const lista = site.docTemplates ?? [];
  const [novo, setNovo] = useState<{ stage: StageCode; name: string }>({
    stage: "OPENING",
    name: "",
  });
  const [drafts, setDrafts] = useState<Record<string, Partial<DocTemplate>>>({});
  const hoje = new Date().toISOString().slice(0, 10);

  const draftOf = (t: DocTemplate): DocTemplate => ({ ...t, ...drafts[t.id] });

  const setDraft = (id: string, patch: Partial<DocTemplate>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  function guardar(next: DocTemplate[]) {
    updateSite({ docTemplates: next });
  }

  function criar(e: FormEvent) {
    e.preventDefault();
    if (!novo.name.trim()) {
      toast.error("Indique o nome do documento.");
      return;
    }
    guardar([
      ...lista,
      {
        id: `doc-${Date.now()}`,
        stage: novo.stage,
        name: novo.name.trim(),
        fileName: "ata-{{referencia}}.txt",
        body: "",
        enabled: true,
        startDate: hoje,
        endDate: null,
      },
    ]);
    setNovo({ stage: "OPENING", name: "" });
    toast.success("Documento criado.");
  }

  function guardarCartao(t: DocTemplate) {
    const d = draftOf(t);
    guardar(lista.map((x) => (x.id === t.id ? d : x)));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[t.id];
      return next;
    });
    toast.success("Alterações guardadas.");
  }

  function remover(t: DocTemplate) {
    guardar(
      lista.map((x) =>
        x.id === t.id ? { ...x, endDate: new Date().toISOString(), enabled: false } : x,
      ),
    );
    toast.success("Documento removido: data de fim marcada como agora e estado inativo.");
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="animate-rise">
          <Link
            to="/backoffice/admin"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Administração
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Documentos e atas</h1>
          <p className="mt-2 max-w-[70ch] text-[14px] text-muted-foreground text-pretty">
            Cada documento corresponde a uma fase do procedimento, com nome, estado, data de início e
            data de fim. O estado é ativo quando a data de início já chegou e a data de fim está vazia
            ou ainda não chegou. Guarde as alterações com o botão Guardar.
          </p>
          <p className="mt-3 flex flex-wrap gap-2">
            {TEMPLATE_FIELDS.map((c) => (
              <code
                key={c}
                className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {c}
              </code>
            ))}
          </p>
        </div>

        <form onSubmit={criar} className="glass mt-8 animate-rise rounded-xl p-5 [animation-delay:60ms]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Novo documento
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_auto]">
            <select
              value={novo.stage}
              onChange={(e) => setNovo({ ...novo, stage: e.target.value as StageCode })}
              className="input-ipma w-full"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              value={novo.name}
              onChange={(e) => setNovo({ ...novo, name: e.target.value })}
              placeholder="Nome do documento (ex.: Ata de abertura)"
              className="input-ipma w-full"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Adicionar
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          {lista.length === 0 && (
            <p className="glass rounded-xl p-5 text-[13px] text-muted-foreground">
              Não existem documentos configurados.
            </p>
          )}
          {lista.map((t) => {
            const d = draftOf(t);
            const estado = docEstado(d.startDate, d.endDate);
            return (
              <div key={t.id} className="glass animate-rise rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                    {STAGE_LABEL[t.stage]}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${
                      estado === "ATIVO"
                        ? "border-success/40 bg-success/5 text-success"
                        : "border-destructive/40 bg-destructive/5 text-destructive"
                    }`}
                  >
                    {estado}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]">
                  <select
                    value={d.stage}
                    onChange={(e) => setDraft(t.id, { stage: e.target.value as StageCode })}
                    className="input-ipma w-full"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <input
                    value={d.name}
                    onChange={(e) => setDraft(t.id, { name: e.target.value })}
                    className="input-ipma w-full font-semibold"
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Data de início
                    </span>
                    <input
                      type="date"
                      value={d.startDate ?? ""}
                      onChange={(e) => setDraft(t.id, { startDate: e.target.value })}
                      className="input-ipma mt-1 w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Data de fim (vazio = sem fim)
                    </span>
                    <input
                      type="date"
                      value={(d.endDate ?? "").slice(0, 10)}
                      onChange={(e) => setDraft(t.id, { endDate: e.target.value || null })}
                      className="input-ipma mt-1 w-full"
                    />
                  </label>
                </div>
                <input
                  value={d.fileName}
                  onChange={(e) => setDraft(t.id, { fileName: e.target.value })}
                  placeholder="Nome do ficheiro gerado"
                  className="input-ipma mt-3 w-full font-mono text-[12px]"
                />
                <textarea
                  value={d.body}
                  onChange={(e) => setDraft(t.id, { body: e.target.value })}
                  rows={9}
                  placeholder="Conteúdo da ata"
                  className="input-ipma mt-2 w-full font-mono text-[12px]"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => guardarCartao(t)}
                    className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(t)}
                    className="rounded-md border border-destructive/40 px-3 py-2 text-[12px] text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            guardar(DEFAULT_DOC_TEMPLATES.map((x) => ({ ...x })));
            setDrafts({});
            toast.success("Documentos repostos.");
          }}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-[13px] font-medium"
        >
          Repor modelos originais
        </button>
      </main>
    </PageShell>
  );
}
