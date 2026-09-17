import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import {
  ROLES,
  ROLE_LABEL,
  isResponsabilidadeAtiva,
  type Role,
} from "@/lib/pessoas";
import { formatDate } from "@/lib/recrutamento";

export const Route = createFileRoute("/backoffice/pessoas")({
  head: () => ({
    meta: [
      { title: "Pessoas e responsabilidades — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Gestão de pessoas, logins e responsabilidades (Gestor de RH, Gestão, Administrador, Candidato, Júri) com datas de início, de fim e estado.",
      },
      { property: "og:title", content: "Pessoas e responsabilidades — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Atribuição de responsabilidades com data de início, data de fim e estado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireRole roles={["ADMIN", "GESTOR_RH", "GESTAO"]}>
        <Pessoas />
      </RequireRole>
    </PageShell>
  ),
});

const hoje = () => new Date().toISOString().slice(0, 10);

function Pessoas() {
  const { pessoas, addPessoa, updatePessoa, addResponsabilidade, removeResponsabilidade } =
    useStore();
  const [nova, setNova] = useState({ name: "", email: "", phone: "", nif: "", password: "ipma" });
  const [resp, setResp] = useState<Record<string, { role: Role; start: string; end: string }>>({});

  function campos(id: string) {
    return resp[id] ?? { role: "JURI" as Role, start: hoje(), end: "" };
  }

  return (
    <main className="mx-auto max-w-[1200px] space-y-8 px-6 py-10">
      <header className="glass rounded-2xl p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Administração
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pessoas e responsabilidades</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Cada pessoa tem um único login e pode acumular várias responsabilidades. Uma
          responsabilidade está ativa quando a data de início já passou e a data de fim ainda não
          chegou (ou não está definida).
        </p>
      </header>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Nova pessoa
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            className="input-ipma"
            placeholder="Nome"
            value={nova.name}
            onChange={(e) => setNova({ ...nova, name: e.target.value })}
          />
          <input
            className="input-ipma"
            placeholder="Email"
            value={nova.email}
            onChange={(e) => setNova({ ...nova, email: e.target.value })}
          />
          <input
            className="input-ipma"
            placeholder="Telefone"
            value={nova.phone}
            onChange={(e) => setNova({ ...nova, phone: e.target.value })}
          />
          <input
            className="input-ipma"
            placeholder="NIF"
            value={nova.nif}
            onChange={(e) => setNova({ ...nova, nif: e.target.value })}
          />
          <button
            type="button"
            onClick={() => {
              if (!nova.name.trim() || !nova.email.trim()) {
                toast.error("Indique nome e email.");
                return;
              }
              if (
                pessoas.some((p) => p.email.toLowerCase() === nova.email.trim().toLowerCase())
              ) {
                toast.error("Já existe um login com esse email.");
                return;
              }
              addPessoa({
                name: nova.name.trim(),
                email: nova.email.trim(),
                phone: nova.phone.trim(),
                nif: nova.nif.trim(),
                hasLogin: true,
                password: nova.password || "ipma",
                responsabilidades: [],
              });
              setNova({ name: "", email: "", phone: "", nif: "", password: "ipma" });
              toast.success("Pessoa criada com login.");
            }}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Criar pessoa
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {pessoas.map((p) => {
          const c = campos(p.id);
          return (
            <article key={p.id} className="glass rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {p.email} · NIF {p.nif || "—"} · {p.phone || "—"}
                  </p>
                </div>
                <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={p.hasLogin}
                    onChange={(e) => updatePessoa(p.id, { hasLogin: e.target.checked })}
                  />
                  Login ativo
                </label>
              </div>

              <table className="mt-4 w-full text-left text-[13px]">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="py-2">Responsabilidade</th>
                    <th className="py-2">Início</th>
                    <th className="py-2">Fim</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {p.responsabilidades.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-muted-foreground">
                        Sem responsabilidades atribuídas.
                      </td>
                    </tr>
                  )}
                  {p.responsabilidades.map((r) => {
                    const ativa = isResponsabilidadeAtiva(r);
                    return (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="py-2">{ROLE_LABEL[r.role]}</td>
                        <td className="py-2 font-mono text-[11px]">{formatDate(r.startDate)}</td>
                        <td className="py-2 font-mono text-[11px]">
                          {r.endDate ? formatDate(r.endDate) : "sem termo"}
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                              ativa ? "bg-success/10 text-success" : "bg-neutral/15 text-neutral"
                            }`}
                          >
                            {ativa ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              removeResponsabilidade(p.id, r.id);
                              toast.success("Responsabilidade removida.");
                            }}
                            className="rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-foreground/5"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <select
                  className="input-ipma"
                  value={c.role}
                  onChange={(e) => setResp({ ...resp, [p.id]: { ...c, role: e.target.value as Role } })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="input-ipma"
                  value={c.start}
                  onChange={(e) => setResp({ ...resp, [p.id]: { ...c, start: e.target.value } })}
                />
                <input
                  type="date"
                  className="input-ipma"
                  value={c.end}
                  onChange={(e) => setResp({ ...resp, [p.id]: { ...c, end: e.target.value } })}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!c.start) {
                      toast.error("Indique a data de início.");
                      return;
                    }
                    if (c.end && c.end < c.start) {
                      toast.error("A data de fim não pode ser anterior à de início.");
                      return;
                    }
                    addResponsabilidade(p.id, {
                      role: c.role,
                      startDate: c.start,
                      endDate: c.end || null,
                    });
                    toast.success("Responsabilidade atribuída.");
                  }}
                  className="rounded-md border border-border px-4 py-2 text-[13px] hover:bg-foreground/5"
                >
                  Atribuir
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
