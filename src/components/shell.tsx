import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/logo-ipma.png.asset.json";
import {
  APPLICANT_STATE_LABEL,
  JOB_STATE_LABEL,
  type ApplicantState,
  type JobState,
} from "@/lib/recrutamento";

export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute -top-40 right-[-10%] size-[520px] rounded-full bg-atmosfera/25 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] size-[560px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 size-[360px] rounded-full bg-subsolo/15 blur-3xl" />
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="glass-2 sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="IPMA — Instituto Português do Mar e da Atmosfera" className="h-9 w-auto" />
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
            Vagas
          </Link>
          <Link
            to="/backoffice"
            activeProps={{ className: "bg-foreground/5 text-foreground" }}
            className="rounded-md px-3 py-2 hover:bg-foreground/5"
          >
            Backoffice
          </Link>
          <Link
            to="/apoio"
            activeProps={{ className: "bg-foreground/5 text-foreground" }}
            className="rounded-md px-3 py-2 hover:bg-foreground/5"
          >
            Apoio
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-md border border-border bg-white/40 px-3 py-2 font-mono text-[11px] text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-atmosfera" /> Portal de recrutamento
          </span>
          <Link
            to="/backoffice"
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground ring-1 ring-black/5 transition-colors hover:bg-primary/90"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
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
