import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, type ChangeEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import logo from "@/assets/logo-ipma.png";
import { useStore } from "@/lib/store";
import { COLOR_FIELDS } from "@/lib/site";
import { DEFAULT_JAVA_API_URL } from "@/lib/java-api";
import type { Role } from "@/lib/pessoas";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

export const Route = createFileRoute("/backoffice/site")({
  head: () => ({
    meta: [
      { title: "Gestão do site — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Configure o ícone e o favicon, as cores dos botões e dos títulos, o título e o texto de entrada da página inicial e os filtros do portal de recrutamento do IPMA.",
      },
      { property: "og:title", content: "Gestão do site — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Identidade visual, conteúdos e filtros do portal de recrutamento do IPMA, I.P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <GestaoSite />
    </RequireRole>
  ),
});

const MAX_BYTES = 400_000;

function GestaoSite() {
  const { site, updateSite, resetSite } = useStore();
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  function carregar(e: ChangeEvent<HTMLInputElement>, campo: "logoUrl" | "faviconUrl") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um ficheiro de imagem (PNG, JPG ou SVG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("A imagem é demasiado grande. Use um ficheiro com menos de 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSite({ [campo]: String(reader.result) });
      toast.success(campo === "logoUrl" ? "Ícone das páginas atualizado." : "Favicon atualizado.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <Link
          to="/backoffice/admin"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Painel de administração
        </Link>

        <div className="mt-5 flex animate-rise flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão do site</h1>
            <p className="mt-2 max-w-[60ch] text-[14px] text-muted-foreground text-pretty">
              As alterações são aplicadas de imediato em todas as páginas do portal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetSite();
              toast.success("Configuração reposta nos valores originais.");
            }}
            className="rounded-md border border-border bg-white/60 px-4 py-2 text-[13px] font-medium"
          >
            Repor predefinições
          </button>
        </div>

        {/* Imagens */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:60ms]">
          <h2 className="text-lg font-semibold tracking-tight">Ícone das páginas e favicon</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Ícone apresentado nas páginas
              </p>
              <div className="mt-3 flex items-center gap-4">
                <img
                  src={site.logoUrl ?? logo}
                  alt="Pré-visualização do ícone das páginas"
                  className="h-12 w-auto max-w-[160px] object-contain"
                />
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => carregar(e, "logoUrl")}
                  />
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Carregar ficheiro
                  </button>
                  {site.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateSite({ logoUrl: null })}
                      className="rounded-md border border-border px-4 py-1.5 text-[12px]"
                    >
                      Usar o original
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Favicon (separador do browser)
              </p>
              <div className="mt-3 flex items-center gap-4">
                <img
                  src={site.faviconUrl ?? "/favicon.png"}
                  alt="Pré-visualização do favicon"
                  className="size-10 rounded border border-border object-contain"
                />
                <div className="flex flex-col gap-2">
                  <input
                    ref={faviconRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => carregar(e, "faviconUrl")}
                  />
                  <button
                    type="button"
                    onClick={() => faviconRef.current?.click()}
                    className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Carregar ficheiro
                  </button>
                  {site.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => updateSite({ faviconUrl: null })}
                      className="rounded-md border border-border px-4 py-1.5 text-[12px]"
                    >
                      Usar o original
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cores */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:100ms]">
          <h2 className="text-lg font-semibold tracking-tight">Cores dos botões e dos títulos</h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Estas cores substituem as cores base do site em todas as páginas.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLOR_FIELDS.map((f) => (
              <div key={f.key} className="rounded-lg border border-border bg-white/50 p-4">
                <p className="text-[13px] font-medium">{f.label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{f.hint}</p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={f.label}
                    value={site[f.key]}
                    onChange={(e) => updateSite({ [f.key]: e.target.value })}
                    className="size-9 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <input
                    value={site[f.key]}
                    onChange={(e) => updateSite({ [f.key]: e.target.value })}
                    className="input-ipma font-mono uppercase"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-white/40 p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Pré-visualização
            </span>
            <h3 className="text-xl font-bold tracking-tight">Título principal</h3>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
            >
              Botão de ação
            </button>
            <span className="rounded bg-atmosfera/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
              Realce
            </span>
          </div>
        </section>

        {/* Conteúdos */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:140ms]">
          <h2 className="text-lg font-semibold tracking-tight">Página inicial</h2>
          <div className="mt-5 grid gap-4">
            <Campo label="Título principal">
              <input
                value={site.heroTitle}
                maxLength={90}
                onChange={(e) => updateSite({ heroTitle: e.target.value })}
                className="input-ipma"
              />
            </Campo>
            <Campo label="Texto de entrada (lead)">
              <textarea
                value={site.heroLead}
                maxLength={420}
                rows={4}
                onChange={(e) => updateSite({ heroLead: e.target.value })}
                className="input-ipma resize-y"
              />
            </Campo>
            <Campo label="Servidor de recrutamento (endereço da API)">
              <input
                value={site.apiUrl}
                placeholder={DEFAULT_JAVA_API_URL}
                onChange={(e) => updateSite({ apiUrl: e.target.value })}
                className="input-ipma font-mono text-[12px]"
              />
            </Campo>
          </div>
        </section>

        {/* Filtros */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:180ms]">
          <h2 className="text-lg font-semibold tracking-tight">Filtros da página inicial</h2>
          <div className="mt-5 space-y-3">
            <Interruptor
              checked={site.showTypeFilter}
              onChange={(v) => updateSite({ showTypeFilter: v })}
              label="Mostrar o filtro por tipo de procedimento"
              desc="Permite filtrar as vagas por tipo de procedimento (concurso, mobilidade, bolsa, etc.)."
            />
            <Interruptor
              checked={site.showDepartmentFilter}
              onChange={(v) => updateSite({ showDepartmentFilter: v })}
              label="Mostrar o filtro por unidade orgânica"
              desc="Permite filtrar as vagas pela unidade orgânica do IPMA."
            />
            <Interruptor
              checked={site.showCareerFilter}
              onChange={(v) => updateSite({ showCareerFilter: v })}
              label="Mostrar o filtro por cargo/carreira"
              desc="Permite filtrar as vagas por carreira (Técnico Superior, Assistente Técnico, etc.)."
            />
            <Interruptor
              checked={site.showLocationFilter}
              onChange={(v) => updateSite({ showLocationFilter: v })}
              label="Mostrar o filtro por local"
              desc="Permite filtrar as vagas pelo local de trabalho."
            />
          </div>
        </section>

        {/* Síntese do procedimento */}
        <section className="glass mt-6 animate-rise rounded-xl p-6 [animation-delay:200ms]">
          <h2 className="text-lg font-semibold tracking-tight">Síntese do procedimento</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Cartão lateral da página de cada vaga, com todos os dados do procedimento.
          </p>
          <div className="mt-5 space-y-3">
            <Interruptor
              checked={site.showSummaryPublic !== false}
              onChange={(v) => updateSite({ showSummaryPublic: v })}
              label="Mostrar no website público"
              desc="Visível para quem consulta as vagas sem sessão iniciada."
            />
            <Interruptor
              checked={site.showSummaryCandidate !== false}
              onChange={(v) => updateSite({ showSummaryCandidate: v })}
              label="Mostrar no portal do candidato"
              desc="Visível para candidatos com sessão iniciada."
            />
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Interruptor({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 rounded border-border accent-[var(--primary)]"
      />
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[12px] text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}
