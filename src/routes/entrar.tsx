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
import { loginJava, mapJavaRoles, saveJavaAuth, javaBase } from "@/lib/java-api";
import { enviarCodigoAcesso } from "@/lib/emails.functions";
import { CODE_TTL_MIN } from "@/lib/auth";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Autenticação em dois passos na plataforma de recrutamento do IPMA, I.P. — palavra-passe e código de confirmação enviado por email.",
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
  const {
    pessoas,
    currentUser,
    logout,
    hydrated,
    site,
    addPessoa,
    iniciarAutenticacao,
    novoCodigoAcesso,
    confirmarCodigo,
  } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aEntrar, setAEntrar] = useState(false);
  const [pendente, setPendente] = useState<Pessoa | null>(null);
  const [codigo, setCodigo] = useState("");
  /** Código mostrado no ecrã apenas quando o envio por email não foi possível. */
  const [codigoFallback, setCodigoFallback] = useState<string | null>(null);

  function destinoPara(p: Pessoa) {
    const roles = activeRoles(p);
    if (roles.some((r) => r !== "CANDIDATO")) return "/backoffice" as const;
    return "/candidato" as const;
  }

  /** Envia o código de confirmação por email; devolve-o para exibição se o envio falhar. */
  async function enviarCodigo(pessoa: Pessoa, code: string) {
    setPendente(pessoa);
    setCodigo("");
    setCodigoFallback(null);
    try {
      const res = await enviarCodigoAcesso({
        data: {
          email: pessoa.email,
          nome: pessoa.name,
          codigo: code,
          minutos: CODE_TTL_MIN,
        },
      });
      if (res.ok) {
        toast.success(`Código de confirmação enviado para ${pessoa.email}.`);
        return;
      }
    } catch {
      /* segue para o modo alternativo */
    }
    setCodigoFallback(code);
    toast.warning("Não foi possível enviar o email. O código é apresentado no ecrã.");
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (aEntrar) return;
    setErro(null);
    setAEntrar(true);
    try {
      // As contas locais validam a palavra-passe e passam ao segundo nível de autenticação.
      const local = iniciarAutenticacao(email, password);
      if (local.ok && local.pessoa && local.codigo) {
        await enviarCodigo(local.pessoa, local.codigo);
        return;
      }

      // As restantes contas são validadas pelo servidor de recrutamento.
      const java = await loginJava(javaBase(site.apiUrl), email.trim(), password);
      if (java.ok && java.me) {
        saveJavaAuth(email.trim(), password);
        const emailNorm = java.me.email.trim().toLowerCase();
        let pessoa = pessoas.find((p) => p.email.trim().toLowerCase() === emailNorm);
        if (!pessoa) {
          const hoje = new Date().toISOString().slice(0, 10);
          pessoa = addPessoa({
            name: java.me.name || emailNorm,
            email: java.me.email,
            phone: "",
            nif: "",
            hasLogin: false,
            password: null,
            responsabilidades: mapJavaRoles(java.me.roles).map((role) => ({
              id: crypto.randomUUID(),
              role,
              startDate: hoje,
              endDate: null,
            })),
          });
        }
        const emitido = novoCodigoAcesso(pessoa.id);
        if (emitido.ok && emitido.codigo) {
          await enviarCodigo(pessoa, emitido.codigo);
          return;
        }
      }

      const msg =
        java.failure === "unreachable"
          ? local.message
          : `${local.message} (Servidor de recrutamento: ${java.message})`;
      setErro(msg);
      toast.error(local.message);
    } finally {
      setAEntrar(false);
    }
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!pendente || aEntrar) return;
    setAEntrar(true);
    setErro(null);
    try {
      const res = confirmarCodigo(pendente.id, codigo);
      if (!res.ok || !res.pessoa) {
        setErro(res.message);
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      await navigate({ to: destinoPara(res.pessoa) });
    } finally {
      setAEntrar(false);
    }
  }

  async function reenviar() {
    if (!pendente) return;
    const res = novoCodigoAcesso(pendente.id);
    if (res.ok && res.codigo) await enviarCodigo(pendente, res.codigo);
  }

  async function entrarComo(p: Pessoa) {
    setEmail(p.email);
    setPassword(p.password ?? "");
    const res = iniciarAutenticacao(p.email, p.password ?? "");
    if (res.ok && res.pessoa && res.codigo) await enviarCodigo(res.pessoa, res.codigo);
    else toast.error(res.message);
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
            O acesso exige autenticação forte em dois passos: palavra-passe e código de
            confirmação enviado por email. O perfil depende das responsabilidades ativas —
            Gestor de RH, Gestão, Administrador, Júri ou Candidato.
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
          ) : pendente ? (
            <form onSubmit={confirmar} className="mt-8 max-w-md space-y-4">
              <div className="rounded-xl border border-border bg-white/50 p-4">
                <p className="text-sm">
                  Enviámos um código de 6 dígitos para{" "}
                  <span className="font-mono text-[12px]">{pendente.email}</span>. O código expira
                  em {CODE_TTL_MIN} minutos.
                </p>
                {codigoFallback && (
                  <p className="mt-2 rounded bg-warning/10 px-3 py-2 font-mono text-sm text-foreground">
                    Código: <strong>{codigoFallback}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Código de confirmação
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="input-ipma mt-1 w-full text-center font-mono text-xl tracking-[0.5em]"
                />
              </div>
              {erro && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {erro}
                </p>
              )}
              <button
                type="submit"
                disabled={aEntrar || codigo.length !== 6}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {aEntrar ? "A confirmar…" : "Confirmar e entrar"}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={reenviar}
                  className="text-primary underline underline-offset-4"
                >
                  Reenviar código
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendente(null);
                    setCodigo("");
                    setCodigoFallback(null);
                    setErro(null);
                  }}
                  className="text-muted-foreground underline underline-offset-4"
                >
                  Usar outra conta
                </button>
              </div>
            </form>
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
                disabled={aEntrar}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                {aEntrar ? "A validar…" : "Continuar"}
              </button>
              <p className="text-xs text-muted-foreground">
                <Link to="/recuperar" className="text-primary underline underline-offset-4">
                  Criar ou recuperar palavra-passe
                </Link>{" "}
                — enviamos uma ligação segura para o seu email.
              </p>
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
            Palavra-passe de todas as contas: <span className="font-mono">ipma</span>. O código de
            confirmação é sempre pedido.
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
