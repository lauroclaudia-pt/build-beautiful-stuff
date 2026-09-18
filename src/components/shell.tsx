import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo-ipma.png.asset.json";
import { useStore } from "@/lib/store";
import { BACKOFFICE_ROLES, ROLE_LABEL, activeRoles, hasActiveRole, type Role } from "@/lib/pessoas";
import {
  APPLICANT_STATE_LABEL,
  JOB_STATE_LABEL,
  type ApplicantState,
  type JobState,
} from "@/lib/recrutamento";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

/** Aplica as cores e o ícone definidos no painel de administração. */
function SiteTheme() {
  const { site, hydrated } = useStore();
  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--primary", site.buttonColor);
    root.style.setProperty("--primary-foreground", site.buttonTextColor);
    root.style.setProperty("--ring", site.buttonColor);
    root.style.setProperty("--accent", site.accentColor);
    root.style.setProperty("--atmosfera", site.accentColor);
    root.style.setProperty("--heading", site.titleColor);
    if (site.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = site.faviconUrl;
    }
  }, [site, hydrated]);
  return null;
}

export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 print:hidden">
      <div className="absolute -top-40 right-[-10%] size-[520px] rounded-full bg-atmosfera/25 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] size-[560px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 size-[360px] rounded-full bg-subsolo/15 blur-3xl" />
    </div>
  );
}

export function SiteHeader() {
  const { site, currentUser } = useStore();
  const podeAdministrar = hasActiveRole(currentUser, ...ADMIN_ROLES);
  const podeVerDashboard = hasActiveRole(currentUser, ...BACKOFFICE_ROLES);
  return (
    <header className="glass-2 sticky top-0 z-40 border-x-0 border-t-0 print:hidden">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={site.logoUrl ?? logo.url}
            alt="IPMA — Instituto Português do Mar e da Atmosfera"
            className="h-9 w-auto"
          />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
            Recrutamento
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-foreground/5 text-foreground" }}
            className="rounded-md px-3 py-2 hover:bg-foreground/5"
          >
            Home
          </Link>
          {podeVerDashboard && (
            <Link
              to="/backoffice/dashboard"
              activeProps={{ className: "bg-foreground/5 text-foreground" }}
              className="rounded-md px-3 py-2 hover:bg-foreground/5"
            >
              Dashboard
            </Link>
          )}
          <Link
            to="/backoffice"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-foreground/5 text-foreground" }}
            className="rounded-md px-3 py-2 hover:bg-foreground/5"
          >
            Procedimentos
          </Link>
          <Link
            to="/candidato"
            activeProps={{ className: "bg-foreground/5 text-foreground" }}
            className="rounded-md px-3 py-2 hover:bg-foreground/5"
          >
            Candidato
          </Link>
          {podeAdministrar && (
            <Link
              to="/backoffice/admin"
              activeProps={{ className: "bg-foreground/5 text-foreground" }}
              className="rounded-md px-3 py-2 hover:bg-foreground/5"
            >
              Administração
            </Link>
          )}
          <Link
            to="/apoio"
            activeProps={{ className: "bg-foreground/5 text-foreground" }}
            className="rounded-md px-3 py-2 hover:bg-foreground/5"
          >
            Apoio
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SessionArea />
        </div>
      </div>
    </header>
  );
}

function SessionArea() {
  const { currentUser, logout, hydrated } = useStore();
  if (!hydrated || !currentUser) {
    return (
      <Link
        to="/entrar"
        className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground ring-1 ring-black/5 transition-colors hover:bg-primary/90"
      >
        Entrar
      </Link>
    );
  }
  const roles = activeRoles(currentUser);
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-[13px] font-medium leading-tight">{currentUser.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          {roles.map((r) => ROLE_LABEL[r]).join(" · ") || "Sem responsabilidades ativas"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          logout();
          toast.success("Sessão terminada.");
        }}
        className="rounded-md border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-foreground/5"
      >
        Sair
      </button>
    </div>
  );
}

export function RequireRole({
  roles = BACKOFFICE_ROLES,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { currentUser, hydrated } = useStore();
  if (!hydrated) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1200px] px-6 py-16">
          <p className="font-mono text-xs text-muted-foreground">A carregar…</p>
        </main>
      </PageShell>
    );
  }
  if (!hasActiveRole(currentUser, ...roles)) {
    return (
      <PageShell>
      <main className="mx-auto max-w-[720px] px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Acesso reservado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta área exige uma responsabilidade ativa de {roles.map((r) => ROLE_LABEL[r]).join(", ")}.
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
  return <>{children}</>;
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 print:hidden">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-6">
        <p className="font-mono text-[11px] text-muted-foreground">
          IPMA, I.P. · Divisão de Recursos Humanos · Rua C do Aeroporto, Lisboa
        </p>
        <div className="flex gap-5 font-mono text-[11px] text-muted-foreground">
          <Link to="/apoio" className="hover:text-foreground">
            Acessibilidade
          </Link>
          <Link to="/apoio" className="hover:text-foreground">
            Dados pessoais
          </Link>
          <Link to="/apoio" className="hover:text-foreground">
            Contactos
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteTheme />
      <Backdrop />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

const jobTone: Record<JobState, string> = {
  DRAFT: "bg-subsolo/20 text-[oklch(0.55_0.13_70)]",
  PUBLISHED: "bg-success/10 text-success",
  RUNNING: "bg-primary/10 text-primary",
  FINISHED: "bg-neutral/15 text-neutral",
  CANCELLED: "bg-destructive/10 text-destructive",
  DESERT: "bg-neutral/15 text-neutral",
};

export function JobStateBadge({ state }: { state: JobState }) {
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${jobTone[state]}`}
    >
      {JOB_STATE_LABEL[state]}
    </span>
  );
}

const applicantTone: Record<ApplicantState, string> = {
  SUBMITTED: "bg-atmosfera/20 text-primary",
  UNDER_REVIEW: "bg-subsolo/20 text-[oklch(0.55_0.13_70)]",
  ADMITTED: "bg-success/10 text-success",
  EXCLUDED: "bg-destructive/10 text-destructive",
  UNDER_APPEAL: "bg-primary/10 text-primary",
  APPROVED: "bg-success/10 text-success",
  HIRED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-neutral/15 text-neutral",
};

export function ApplicantStateBadge({ state }: { state: ApplicantState }) {
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${applicantTone[state]}`}
    >
      {APPLICANT_STATE_LABEL[state]}
    </span>
  );
}
