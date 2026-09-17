import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/shell";
import { useStore } from "@/lib/store";
import {
  ROLE_LABEL,
  activeRoles,
  isResponsabilidadeAtiva,
  type Pessoa,
} from "@/lib/pessoas";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Autenticação na plataforma de recrutamento do IPMA, I.P. Cada pessoa tem um login e as responsabilidades ativas determinam o acesso.",
      },
      { property: "og:title", content: "Entrar — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Aceda ao portal do candidato ou ao backoffice de recrutamento do IPMA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const { pessoas, currentUser, login, logout, hydrated } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function destinoPara(p: Pessoa) {
    const roles = activeRoles(p);
    if (roles.some((r) => r !== "CANDIDATO")) return "/backoffice" as const;
    return "/candidato" as const;
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok || !res.pessoa) {
      setErro(res.message);
      toast.error(res.message);
      return;
    }
    setErro(null);
    toast.success(res.message);
    navigate({ to: destinoPara(res.pessoa) });
  }

  function entrarComo(p: Pessoa) {
    setEmail(p.email);
    setPassword(p.password ?? "");
    const res = login(p.email, p.password ?? "");
    if (res.ok && res.pessoa) {
      toast.success(res.message);
      navigate({ to: destinoPara(res.pessoa) });
    }
  }

  return (
    <PageShell>
      <main className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="glass rounded-2xl p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Autenticação
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Entrar na plataforma de recrutamento
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Cada pessoa tem um único login. O acesso depende das responsabilidades ativas
            associadas — Gestor de RH, Gestão, Administrador, Júri ou Candidato — cada uma com
            data de início, data de fim e estado.
          </p>

          {hydrated && currentUser ? (
            <div className="mt-8 rounded-xl border border-border bg-white/50 p-6">
              <p className="text-sm text-muted-foreground">Sessão iniciada como</p>
              <p className="mt-1 text-xl font-semibold">{currentUser.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{currentUser.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeRoles(currentUser).map((r) => (
                  <span
                    key={r}
                    className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary"
                  >
                    {ROLE_LABEL[r]}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={destinoPara(currentUser)}
                  className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Continuar
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    toast.success("Sessão terminada.");
                  }}
                  className="rounded-md border border-border px-4 py-2 text-[13px] hover:bg-foreground/5"
                >
                  Terminar sessão
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submeter} className="mt-8 max-w-md space-y-4">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@ipma.pt"
                  className="input-ipma mt-1 w-full"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Palavra-passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="input-ipma mt-1 w-full"
                />
              </div>
              {erro && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {erro}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Entrar
              </button>
              <p className="text-xs text-muted-foreground">
                Ainda não se candidatou? Consulte as{" "}
                <Link to="/" className="text-primary underline underline-offset-4">
                  vagas abertas
                </Link>{" "}
                — ao submeter a candidatura fica com acesso ao portal do candidato.
              </p>
            </form>
          )}
        </section>

        <aside className="glass-2 h-fit rounded-2xl p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Contas de demonstração
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Palavra-passe de todas as contas: <span className="font-mono">ipma</span>
          </p>
          <ul className="mt-4 space-y-3">
            {pessoas.slice(0, 6).map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-white/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => entrarComo(p)}
                    className="rounded-md border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-foreground/5"
                  >
                    Entrar
                  </button>
                </div>
                <ul className="mt-3 space-y-1">
                  {p.responsabilidades.map((r) => {
                    const ativa = isResponsabilidadeAtiva(r);
                    return (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground"
                      >
                        <span className="uppercase tracking-[0.1em]">{ROLE_LABEL[r.role]}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 uppercase tracking-[0.1em] ${
                            ativa ? "bg-success/10 text-success" : "bg-neutral/15 text-neutral"
                          }`}
                        >
                          {ativa ? "Ativo" : "Inativo"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </PageShell>
  );
}
