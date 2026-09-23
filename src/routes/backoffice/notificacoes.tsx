import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import { STAGE_LABEL, type StageCode } from "@/lib/recrutamento";
import {
  DEFAULT_EMAIL_TEMPLATES,
  RECIPIENT_CANDIDATE,
  TEMPLATE_FIELDS,
  docEstado,
  type EmailTemplate,
} from "@/lib/site";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];
const STAGES = Object.keys(STAGE_LABEL) as StageCode[];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

/** Estado recalculado a partir das datas de vigência da versão do texto. */
function estadoModelo(t: EmailTemplate) {
  return docEstado(t.startDate ?? "2000-01-01", t.endDate ?? null);
}

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
        content: "Destinatários, assunto, texto e vigência das notificações por fase.",
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
  const lista = useMemo(() => site.emailTemplates ?? [], [site.emailTemplates]);
  const [modo, setModo] = useState<{ tipo: "lista" | "ver" | "editar"; id?: string }>({
    tipo: "lista",
  });
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [novo, setNovo] = useState<{ stage: StageCode; name: string }>({
    stage: "OPENING",
    name: "",
  });

  const visiveis = lista.filter((t) => mostrarInativas || estadoModelo(t) === "ATIVO");
  const atual = lista.find((t) => t.id === modo.id);

  function guardar(next: EmailTemplate[]) {
    updateSite({ emailTemplates: next });
  }

  function editar(id: string, patch: Partial<EmailTemplate>) {
    guardar(lista.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.name.trim()) {
      toast.error("Indique o nome da notificação.");
      return;
    }
    const id = `mail-${Date.now()}`;
    guardar([
      ...lista,
      {
        id,
        stage: novo.stage,
        name: novo.name.trim(),
        subject: "",
        body: "",
        enabled: true,
        recipient: RECIPIENT_CANDIDATE,
        startDate: hoje(),
        endDate: null,
      },
    ]);
    setNovo({ stage: "OPENING", name: "" });
    setModo({ tipo: "editar", id });
    toast.success("Notificação criada.");
  }

  /** Remover = terminar a vigência da versão com a data de hoje. */
  function remover(id: string) {
    editar(id, { endDate: hoje() });
    toast.success("Notificação desativada (data de fim = hoje).");
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
            Lista das notificações configuradas. O estado é recalculado a partir das datas de
            vigência: ATIVO quando a data de fim é nula ou posterior a hoje.
          </p>
        </div>

        {modo.tipo === "lista" && (
          <>
            <div className="glass mt-8 animate-rise overflow-hidden rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Notificações {mostrarInativas ? "(todas)" : "ativas"}
                </p>
                <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={mostrarInativas}
                    onChange={(e) => setMostrarInativas(e.target.checked)}
                  />
                  Mostrar inativas
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-secondary/60 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Notificação</th>
                      <th className="px-4 py-2">Fase</th>
                      <th className="px-4 py-2">Destinatário</th>
                      <th className="px-4 py-2">Início</th>
                      <th className="px-4 py-2">Fim</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                          Não existem notificações a mostrar.
                        </td>
                      </tr>
                    )}
                    {visiveis.map((t) => {
                      const estado = estadoModelo(t);
                      return (
                        <tr key={t.id} className="border-t border-border/70">
                          <td className="px-4 py-2 font-medium">{t.name}</td>
                          <td className="px-4 py-2 text-muted-foreground">{STAGE_LABEL[t.stage]}</td>
                          <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">
                            {t.recipient || RECIPIENT_CANDIDATE}
                          </td>
                          <td className="px-4 py-2 font-mono text-[11px]">{t.startDate || "—"}</td>
                          <td className="px-4 py-2 font-mono text-[11px]">{t.endDate || "—"}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                                estado === "ATIVO"
                                  ? "bg-success/10 text-success"
                                  : "bg-neutral/15 text-neutral"
                              }`}
                            >
                              {estado}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                title="Consultar"
                                aria-label={`Consultar ${t.name}`}
                                onClick={() => setModo({ tipo: "ver", id: t.id })}
                                className="rounded-md border border-border px-2 py-1"
                              >
                                👁
                              </button>
                              <button
                                type="button"
                                title="Editar"
                                aria-label={`Editar ${t.name}`}
                                onClick={() => setModo({ tipo: "editar", id: t.id })}
                                className="rounded-md border border-border px-2 py-1"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                title="Remover (data de fim = hoje)"
                                aria-label={`Remover ${t.name}`}
                                onClick={() => remover(t.id)}
                                className="rounded-md border border-destructive/40 px-2 py-1 text-destructive"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <form
              onSubmit={criar}
              className="glass mt-6 animate-rise rounded-xl p-5 [animation-delay:60ms]"
            >
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
          </>
        )}

        {modo.tipo !== "lista" && atual && (
          <Detalhe
            key={atual.id}
            t={atual}
            somenteLeitura={modo.tipo === "ver"}
            onEditar={(patch) => editar(atual.id, patch)}
            onVoltar={() => setModo({ tipo: "lista" })}
            onModoEdicao={() => setModo({ tipo: "editar", id: atual.id })}
          />
        )}
      </main>
    </PageShell>
  );
}

function Detalhe({
  t,
  somenteLeitura,
  onEditar,
  onVoltar,
  onModoEdicao,
}: {
  t: EmailTemplate;
  somenteLeitura: boolean;
  onEditar: (patch: Partial<EmailTemplate>) => void;
  onVoltar: () => void;
  onModoEdicao: () => void;
}) {
  const estado = estadoModelo(t);
  return (
    <div className="glass mt-8 animate-rise rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="rounded-md border border-border px-3 py-1 text-[12px]"
          >
            ← Lista
          </button>
          <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
            {STAGE_LABEL[t.stage]}
          </span>
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
              estado === "ATIVO" ? "bg-success/10 text-success" : "bg-neutral/15 text-neutral"
            }`}
          >
            {estado}
          </span>
        </div>
        {somenteLeitura ? (
          <button
            type="button"
            onClick={onModoEdicao}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
          >
            Editar
          </button>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Em edição
          </span>
        )}
      </div>

      {!somenteLeitura && (
        <p className="mt-4 flex flex-wrap gap-2">
          {TEMPLATE_FIELDS.map((c) => (
            <code
              key={c}
              className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {c}
            </code>
          ))}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
        <select
          value={t.stage}
          disabled={somenteLeitura}
          onChange={(e) => onEditar({ stage: e.target.value as StageCode })}
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
          disabled={somenteLeitura}
          onChange={(e) => onEditar({ name: e.target.value })}
          placeholder="Nome da notificação"
          className="input-ipma w-full font-semibold"
        />
      </div>

      <label className="mt-4 block text-[12px] font-medium text-muted-foreground">
        E-mail do destinatário (lista de distribuição)
      </label>
      <input
        value={t.recipient ?? RECIPIENT_CANDIDATE}
        disabled={somenteLeitura}
        onChange={(e) => onEditar({ recipient: e.target.value })}
        placeholder={`${RECIPIENT_CANDIDATE}, rh@ipma.pt`}
        className="input-ipma mt-1 w-full font-mono text-[12px]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span>
          Personalizado por candidato:{" "}
          <code className="font-mono">{RECIPIENT_CANDIDATE}</code>
        </span>
        {!somenteLeitura && (
          <button
            type="button"
            onClick={() => onEditar({ recipient: RECIPIENT_CANDIDATE })}
            className="rounded-md border border-border px-2 py-1"
          >
            Usar email do candidato
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[12px] font-medium text-muted-foreground">
            Data de início da versão
          </label>
          <input
            type="date"
            value={t.startDate ?? ""}
            disabled={somenteLeitura}
            onChange={(e) => onEditar({ startDate: e.target.value })}
            className="input-ipma mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-muted-foreground">
            Data de fim (vazia = em vigor)
          </label>
          <input
            type="date"
            value={t.endDate ?? ""}
            disabled={somenteLeitura}
            onChange={(e) => onEditar({ endDate: e.target.value || null })}
            className="input-ipma mt-1 w-full"
          />
        </div>
      </div>

      <input
        value={t.subject}
        disabled={somenteLeitura}
        onChange={(e) => onEditar({ subject: e.target.value })}
        placeholder="Assunto do email"
        className="input-ipma mt-4 w-full"
      />
      <textarea
        value={t.body}
        disabled={somenteLeitura}
        onChange={(e) => onEditar({ body: e.target.value })}
        rows={10}
        placeholder="Texto da mensagem"
        className="input-ipma mt-2 w-full font-mono text-[12px]"
      />
    </div>
  );
}
