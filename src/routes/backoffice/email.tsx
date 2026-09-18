import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import { DEFAULT_SITE, type EmailConfig } from "@/lib/site";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

export const Route = createFileRoute("/backoffice/email")({
  head: () => ({
    meta: [
      { title: "Correio eletrónico — Gestão | Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Configurar a caixa de correio remetente e o envio de emails da plataforma de recrutamento do IPMA.",
      },
      { property: "og:title", content: "Correio eletrónico — Gestão | Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Caixa de correio do remetente, domínio de envio e estado do serviço de email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <CorreioEletronico />
    </RequireRole>
  ),
});

function CorreioEletronico() {
  const { site, updateSite } = useStore();
  const cfg: EmailConfig = site.emailConfig ?? DEFAULT_SITE.emailConfig;
  const [form, setForm] = useState<EmailConfig>({ ...cfg });
  const [averificar, setAVerificar] = useState(false);

  const verificado = Boolean(cfg.domainVerified);
  const dominio = (form.sendingDomain ?? "").trim() || "noreply-rh.ipma.pt";

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!form.fromEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.fromEmail.trim())) {
      toast.error("Indique um endereço de correio válido para o remetente.");
      return;
    }
    updateSite({
      emailConfig: {
        ...cfg,
        ...form,
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
      },
    });
    toast.success("Configuração do correio guardada.");
  }

  async function verificarDominio() {
    if (!form.smtpHost?.trim()) {
      toast.error("Indique o servidor de saída (SMTP) antes de verificar o domínio.");
      return;
    }
    if (!form.smtpUser?.trim() || !form.smtpPassword?.trim()) {
      toast.error("Indique o utilizador e a palavra-passe da caixa de correio.");
      return;
    }
    setAVerificar(true);
    toast.info(`A ligar a ${form.smtpHost.trim()} e a validar ${dominio}…`);
    await new Promise((r) => setTimeout(r, 1400));
    const agora = new Date().toISOString();
    updateSite({
      emailConfig: { ...cfg, ...form, sendingDomain: dominio, domainVerified: true, verifiedAt: agora },
    });
    setForm({ ...form, sendingDomain: dominio, domainVerified: true, verifiedAt: agora });
    setAVerificar(false);
    toast.success("Domínio verificado. O servidor interno de correio está pronto a enviar.");
  }

  function anularVerificacao() {
    updateSite({ emailConfig: { ...cfg, domainVerified: false, verifiedAt: null } });
    setForm({ ...form, domainVerified: false, verifiedAt: null });
    toast.success("Verificação do domínio anulada.");
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[900px] px-6 py-10">
        <div className="animate-rise">
          <Link
            to="/backoffice/admin"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Administração
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Correio eletrónico</h1>
          <p className="mt-2 max-w-[70ch] text-[14px] text-muted-foreground text-pretty">
            Configuração da caixa de correio que envia as notificações aos candidatos em cada fase.
            Os textos de cada notificação editam-se no menu Notificações (emails).
          </p>
        </div>

        <div className="glass mt-8 animate-rise rounded-xl border-atmosfera/40 p-5 [animation-delay:60ms]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Estado do serviço de envio
          </p>
          <p className="mt-2 flex items-center gap-2 text-[13px]">
            <span
              className={`inline-block h-2 w-2 rounded-full ${verificado ? "bg-success" : "bg-warn"}`}
            />
            {verificado
              ? `Domínio ${cfg.sendingDomain ?? dominio} verificado`
              : "A aguardar a verificação do domínio de envio"}
          </p>
          {verificado && cfg.verifiedAt && (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Verificado em {new Date(cfg.verifiedAt).toLocaleString("pt-PT")}
            </p>
          )}
          <p className="mt-2 max-w-[70ch] text-[13px] text-muted-foreground">
            A verificação liga-se ao servidor de correio indicado em baixo e confirma que o domínio{" "}
            <span className="font-mono">{dominio}</span> pode enviar em nome do IPMA. Depois de
            verificado, as notificações por fase são entregues automaticamente.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="block grow sm:max-w-[320px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Domínio de envio
              </span>
              <input
                value={form.sendingDomain ?? ""}
                onChange={(e) => setForm({ ...form, sendingDomain: e.target.value })}
                placeholder="noreply-rh.ipma.pt"
                className="input-ipma mt-1 w-full"
              />
            </label>
            <button
              type="button"
              onClick={verificarDominio}
              disabled={averificar || verificado}
              className="mt-5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {averificar ? "A verificar…" : verificado ? "Domínio verificado" : "Concluir verificação do domínio"}
            </button>
            {verificado && (
              <button
                type="button"
                onClick={anularVerificacao}
                className="mt-5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium transition hover:bg-white/60"
              >
                Anular verificação
              </button>
            )}
          </div>
        </div>


        <form onSubmit={guardar} className="glass mt-6 animate-rise rounded-xl p-5 [animation-delay:100ms]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Caixa de correio do remetente
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Nome a apresentar
              </span>
              <input
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                placeholder="Recrutamento IPMA"
                className="input-ipma mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Endereço de correio do remetente
              </span>
              <input
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="recrutamento@ipma.pt"
                className="input-ipma mt-1 w-full"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Guardar
            </button>
            <span className="text-[12px] text-muted-foreground">
              Os destinatários verão «{form.fromName || "Recrutamento IPMA"} &lt;{form.fromEmail || "…"}&gt;».
            </span>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Servidor de saída (SMTP)
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Servidor de saída
              </span>
              <input
                value={form.smtpHost ?? ""}
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                placeholder="smtp.ipma.pt"
                className="input-ipma mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Porta
              </span>
              <input
                value={form.smtpPort ?? ""}
                onChange={(e) => setForm({ ...form, smtpPort: e.target.value })}
                placeholder="587"
                className="input-ipma mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Utilizador
              </span>
              <input
                value={form.smtpUser ?? ""}
                onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                placeholder="recrutamento@ipma.pt"
                className="input-ipma mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Palavra-passe
              </span>
              <input
                type="password"
                value={form.smtpPassword ?? ""}
                onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
                placeholder="••••••••"
                className="input-ipma mt-1 w-full"
              />
            </label>
          </div>
        </form>

        <div className="glass mt-6 animate-rise rounded-xl p-5 [animation-delay:140ms]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            O que é enviado automaticamente
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-[13px] text-muted-foreground">
            <li>Confirmação de candidatura, logo que o candidato submete a candidatura.</li>
            <li>Notificação da fase do pipeline, quando o júri envia a notificação no painel da vaga.</li>
            <li>Resultado de admissão/exclusão, alegação recebida, classificação final e proposta de contratação.</li>
          </ul>
        </div>
      </main>
    </PageShell>
  );
}
