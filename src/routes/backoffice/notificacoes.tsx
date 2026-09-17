import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import { STAGE_LABEL, type StageCode } from "@/lib/recrutamento";
import {
  DEFAULT_EMAIL_TEMPLATES,
  TEMPLATE_FIELDS,
  type EmailTemplate,
} from "@/lib/site";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];
const STAGES = Object.keys(STAGE_LABEL) as StageCode[];

export const Route = createFileRoute("/backoffice/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações por email — Gestão | Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Editar os modelos de email enviados aos candidatos em cada fase dos procedimentos concursais do IPMA.",
      },
      { property: "og:title", content: "Notificações por email — Gestão | Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Assunto, texto e ativação das notificações por fase do procedimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <GestaoNotificacoes />
    </RequireRole>
  ),
});

function GestaoNotificacoes() {
  const { site, updateSite } = useStore();
  const lista = site.emailTemplates ?? [];
  const [novo, setNovo] = useState<{ stage: StageCode; name: string }>({
    stage: "OPENING",
    name: "",
  });

  function guardar(next: EmailTemplate[]) {
    updateSite({ emailTemplates: next });
  }

  function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.name.trim()) {
      toast.error("Indique o nome da notificação.");
      return;
    }
    guardar([
      ...lista,
      {
        id: `mail-${Date.now()}`,
        stage: novo.stage,
        name: novo.name.trim(),
        subject: "",
        body: "",
        enabled: true,
      },
    ]);
    setNovo({ stage: "OPENING", name: "" });
    toast.success("Notificação criada.");
  }

  function editar(id: string, patch: Partial<EmailTemplate>) {
    guardar(lista.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function remover(id: string) {
    guardar(lista.filter((t) => t.id !== id));
    toast.success("Notificação removida.");
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
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Notificações por email</h1>
          <p className="mt-2 max-w-[70ch] text-[14px] text-muted-foreground text-pretty">
            Modelo de mensagem enviado ao candidato em cada fase do procedimento. Desligue a
            notificação para suspender o envio nessa fase.
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
            Nova notificação
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
              placeholder="Nome da notificação"
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
              Não existem notificações configuradas.
            </p>
          )}
          {lista.map((t) => (
            <div key={t.id} className="glass animate-rise rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                  {STAGE_LABEL[t.stage]}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={(e) => editar(t.id, { enabled: e.target.checked })}
                    />
                    Ativa
                  </label>
                  <button
                    type="button"
                    onClick={() => remover(t.id)}
                    className="rounded-md border border-destructive/40 px-2 py-1 text-[12px] text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]">
                <select
                  value={t.stage}
                  onChange={(e) => editar(t.id, { stage: e.target.value as StageCode })}
                  className="input-ipma w-full"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
                <input
                  value={t.name}
                  onChange={(e) => editar(t.id, { name: e.target.value })}
                  placeholder="Nome da notificação"
                  className="input-ipma w-full font-semibold"
                />
              </div>
              <input
                value={t.subject}
                onChange={(e) => editar(t.id, { subject: e.target.value })}
                placeholder="Assunto do email"
                className="input-ipma mt-3 w-full"
              />
              <textarea
                value={t.body}
                onChange={(e) => editar(t.id, { body: e.target.value })}
                rows={7}
                placeholder="Texto da mensagem"
                className="input-ipma mt-2 w-full font-mono text-[12px]"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            guardar(DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t })));
            toast.success("Notificações repostas.");
          }}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-[13px] font-medium"
        >
          Repor modelos originais
        </button>
      </main>
    </PageShell>
  );
}
