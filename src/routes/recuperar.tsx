import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { enviarLinkPassword } from "@/lib/emails.functions";
import { TOKEN_TTL_MIN, linkDefinirPassword } from "@/lib/auth";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Criar ou recuperar palavra-passe — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Peça uma ligação segura por email para criar ou recuperar a palavra-passe de acesso ao portal de recrutamento do IPMA, I.P.",
      },
      { property: "og:title", content: "Criar ou recuperar palavra-passe — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Enviamos uma ligação temporária para definir uma nova palavra-passe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Recuperar,
});

function Recuperar() {
  const { pedirTokenPassword } = useStore();
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState<"CRIAR" | "RECUPERAR">("RECUPERAR");
  const [aEnviar, setAEnviar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [linkFallback, setLinkFallback] = useState<string | null>(null);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (aEnviar) return;
    setAEnviar(true);
    try {
      const res = pedirTokenPassword(email, motivo);
      // Não revelamos se o email existe: a mensagem é sempre a mesma.
      setEnviado(true);
      if (!res.ok || !res.token || !res.pessoa) return;
      const link = linkDefinirPassword(res.token);
      try {
        const envio = await enviarLinkPassword({
          data: {
            email: res.pessoa.email,
            nome: res.pessoa.name,
            link,
            minutos: TOKEN_TTL_MIN,
            motivo,
          },
        });
        if (envio.ok) {
          toast.success("Ligação enviada por email.");
          return;
        }
      } catch {
        /* segue para o modo alternativo */
      }
      setLinkFallback(link);
      toast.warning("Não foi possível enviar o email. A ligação é apresentada no ecrã.");
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[720px] px-6 py-12">
        <section className="glass rounded-2xl p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Acesso seguro
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Criar ou recuperar palavra-passe
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Indique o seu endereço eletrónico. Enviamos uma ligação pessoal, válida durante{" "}
            {TOKEN_TTL_MIN} minutos, para definir uma nova palavra-passe com autenticação forte.
          </p>

          {enviado ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-border bg-white/50 p-5 text-sm">
                Se existir uma conta associada a{" "}
                <span className="font-mono text-[12px]">{email}</span>, receberá uma ligação para
                definir a palavra-passe. Verifique também a pasta de correio não solicitado.
              </div>
              {linkFallback && (
                <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                  <p className="font-medium">Ligação de definição de palavra-passe</p>
                  <a
                    href={linkFallback}
                    className="mt-1 block break-all font-mono text-[12px] text-primary underline underline-offset-4"
                  >
                    {linkFallback}
                  </a>
                </div>
              )}
              <Link to="/entrar" className="inline-block text-sm text-primary underline underline-offset-4">
                Voltar à autenticação
              </Link>
            </div>
          ) : (
            <form onSubmit={submeter} className="mt-8 max-w-md space-y-4">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Endereço eletrónico (e-mail)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.pt"
                  className="input-ipma mt-1 w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["RECUPERAR", "CRIAR"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotivo(m)}
                    className={`rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                      motivo === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-foreground/5"
                    }`}
                  >
                    {m === "RECUPERAR" ? "Recuperar palavra-passe" : "Criar palavra-passe"}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={aEnviar}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {aEnviar ? "A enviar…" : "Enviar ligação"}
              </button>
              <p className="text-xs text-muted-foreground">
                <Link to="/entrar" className="text-primary underline underline-offset-4">
                  Voltar à autenticação
                </Link>
              </p>
            </form>
          )}
        </section>
      </main>
    </PageShell>
  );
}
