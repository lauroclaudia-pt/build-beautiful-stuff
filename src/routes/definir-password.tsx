import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { validarPassword } from "@/lib/auth";

export const Route = createFileRoute("/definir-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Definir palavra-passe — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Defina uma nova palavra-passe segura para aceder ao portal de recrutamento do IPMA, I.P.",
      },
      { property: "og:title", content: "Definir palavra-passe — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Página segura de definição de palavra-passe com requisitos de autenticação forte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DefinirPassword,
});

function DefinirPassword() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { pessoaDoToken, definirPasswordComToken, hydrated } = useStore();
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const valido = hydrated ? pessoaDoToken(token) : { ok: true, message: "" , pessoa: undefined };
  const forca = validarPassword(password, valido.pessoa?.email);

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (password !== confirmacao) {
      setErro("As palavras-passe não coincidem.");
      return;
    }
    const res = definirPasswordComToken(token, password);
    if (!res.ok) {
      setErro(res.message);
      return;
    }
    toast.success(res.message);
    navigate({ to: "/entrar" });
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[720px] px-6 py-12">
        <section className="glass rounded-2xl p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Autenticação forte
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Definir palavra-passe</h1>

          {hydrated && !valido.ok ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                {valido.message} Peça uma nova ligação.
              </p>
              <Link
                to="/recuperar"
                className="inline-block rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Pedir nova ligação
              </Link>
            </div>
          ) : (
            <form onSubmit={submeter} className="mt-6 max-w-md space-y-4">
              {valido.pessoa && (
                <p className="text-sm text-muted-foreground">
                  Conta:{" "}
                  <span className="font-mono text-[12px]">{valido.pessoa.email}</span>
                </p>
              )}
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Nova palavra-passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-ipma mt-1 w-full"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Confirmar palavra-passe
                </label>
                <input
                  type="password"
                  required
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  className="input-ipma mt-1 w-full"
                />
              </div>

              <div className="rounded-xl border border-border bg-white/50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Requisitos de segurança
                </p>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {[
                    "Pelo menos 12 caracteres",
                    "Uma letra maiúscula e uma minúscula",
                    "Um algarismo",
                    "Um caractere especial (ex.: ! @ # $)",
                  ].map((req) => (
                    <li key={req} className="text-muted-foreground">
                      • {req}
                    </li>
                  ))}
                </ul>
                {password && (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em]">
                    Força:{" "}
                    <span
                      className={
                        forca.nivel === "forte"
                          ? "text-success"
                          : forca.nivel === "media"
                            ? "text-warning"
                            : "text-destructive"
                      }
                    >
                      {forca.nivel}
                    </span>
                  </p>
                )}
                {password && !forca.ok && (
                  <ul className="mt-2 space-y-1 text-[12px] text-destructive">
                    {forca.erros.map((er) => (
                      <li key={er}>{er}</li>
                    ))}
                  </ul>
                )}
              </div>

              {erro && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {erro}
                </p>
              )}
              <button
                type="submit"
                disabled={!forca.ok || password !== confirmacao}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Guardar palavra-passe
              </button>
            </form>
          )}
        </section>
      </main>
    </PageShell>
  );
}
