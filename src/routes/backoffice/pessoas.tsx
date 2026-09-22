import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { Req, hojeISO } from "@/components/req";
import { FilePickButton } from "@/components/file-upload";
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
    <RequireRole roles={["ADMIN", "GESTOR_RH", "GESTAO"]}>
      <PageShell>
        <Pessoas />
      </PageShell>
    </RequireRole>
  ),
});

const hoje = hojeISO;

function Pessoas() {
  const { pessoas, addPessoa, updatePessoa, addResponsabilidade, removeResponsabilidade, opcoesDe } =
    useStore();
  const departamentos = opcoesDe("DEPARTAMENTO");
  const [nova, setNova] = useState({
    name: "",
    email: "",
    phone: "",
    nif: "",
    department: "",
    hasLogin: true,
    password: "ipma",
  });
  const [resp, setResp] = useState<Record<string, { role: Role; start: string; end: string }>>({});

  function campos(id: string) {
    return resp[id] ?? { role: "JURI" as Role, start: hoje(), end: "" };
  }

  /** Importa nomes, emails e departamentos a partir de um ficheiro Excel ou CSV. */
  async function importar(file: File) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName = wb.SheetNames[0];
    const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
    if (!sheet) {
      toast.error("O ficheiro não tem dados.");
      return;
    }
    const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const valor = (l: Record<string, unknown>, ...chaves: string[]) => {
      for (const [k, v] of Object.entries(l)) {
        const key = k.trim().toLowerCase();
        if (chaves.some((c) => key === c || key.startsWith(c))) return String(v ?? "").trim();
      }
      return "";
    };
    let criadas = 0;
    let ignoradas = 0;
    for (const l of linhas) {
      const name = valor(l, "nome", "name");
      const email = valor(l, "email", "e-mail");
      if (!name || !email) {
        ignoradas += 1;
        continue;
      }
      if (pessoas.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
        ignoradas += 1;
        continue;
      }
      addPessoa({
        name,
        email,
        phone: valor(l, "telefone", "phone"),
        nif: valor(l, "nif"),
        department: valor(l, "departamento", "unidade", "department") || null,
        hasLogin: false,
        password: null,
        responsabilidades: [],
      });
      criadas += 1;
    }
    toast.success(`${criadas} pessoa(s) importada(s).${ignoradas ? ` ${ignoradas} ignorada(s).` : ""}`);
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
        <p className="mt-1 text-[12px] text-muted-foreground">
          Os campos assinalados com <Req /> são de preenchimento obrigatório.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Nome
              <Req />
            </span>
            <input
              className="input-ipma mt-1"
              placeholder="Nome"
              required
              value={nova.name}
              onChange={(e) => setNova({ ...nova, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Email
              <Req />
            </span>
            <input
              className="input-ipma mt-1"
              placeholder="Email"
              required
              value={nova.email}
              onChange={(e) => setNova({ ...nova, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Telefone
            </span>
            <input
              className="input-ipma mt-1"
              placeholder="Telefone"
              value={nova.phone}
              onChange={(e) => setNova({ ...nova, phone: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              NIF
            </span>
            <input
              className="input-ipma mt-1"
              placeholder="NIF"
              value={nova.nif}
              onChange={(e) => setNova({ ...nova, nif: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Departamento
            </span>
            <select
              className="input-ipma mt-1"
              value={nova.department}
              onChange={(e) => setNova({ ...nova, department: e.target.value })}
            >
              <option value="">— sem departamento —</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <input
              type="checkbox"
              checked={nova.hasLogin}
              onChange={(e) => setNova({ ...nova, hasLogin: e.target.checked })}
            />
            Criar login
          </label>
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
                toast.error("Já existe uma pessoa com esse email.");
                return;
              }
              addPessoa({
                name: nova.name.trim(),
                email: nova.email.trim(),
                phone: nova.phone.trim(),
                nif: nova.nif.trim(),
                department: nova.department || null,
                hasLogin: nova.hasLogin,
                password: nova.hasLogin ? nova.password || "ipma" : null,
                responsabilidades: [],
              });
              setNova({
                name: "",
                email: "",
                phone: "",
                nif: "",
                department: "",
                hasLogin: true,
                password: "ipma",
              });
              toast.success(nova.hasLogin ? "Pessoa criada com login." : "Pessoa criada sem login.");
            }}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Criar pessoa
          </button>
        </div>

        <div className="mt-6 border-t border-border/60 pt-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Importar de Excel ou CSV
          </h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Colunas reconhecidas: Nome, Email, Telefone, NIF e Departamento. As pessoas importadas
            ficam sem login (podem ser membros do júri).
          </p>
          <div className="mt-3">
            <FilePickButton
              accept=".xlsx,.xls,.csv"
              label="Escolher ficheiro"
              onPick={(files) => {
                const file = files[0];
                if (file) void importar(file);
              }}
            />
          </div>
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
                <div className="flex flex-wrap items-center gap-4">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Departamento
                    </span>
                    <select
                      className="input-ipma mt-1 !py-1 text-[12px]"
                      value={p.department ?? ""}
                      onChange={(e) => updatePessoa(p.id, { department: e.target.value || null })}
                    >
                      <option value="">— sem departamento —</option>
                      {departamentos.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={p.hasLogin}
                      onChange={(e) =>
                        updatePessoa(p.id, {
                          hasLogin: e.target.checked,
                          password: e.target.checked ? (p.password ?? "ipma") : null,
                        })
                      }
                    />
                    Login ativo
                  </label>
                </div>
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

              <div className="mt-4 grid items-end gap-3 md:grid-cols-4">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Responsabilidade
                    <Req />
                  </span>
                  <select
                    className="input-ipma mt-1"
                    value={c.role}
                    onChange={(e) =>
                      setResp({ ...resp, [p.id]: { ...c, role: e.target.value as Role } })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Data de início
                    <Req />
                  </span>
                  <input
                    type="date"
                    required
                    className="input-ipma mt-1"
                    value={c.start}
                    onChange={(e) =>
                      setResp({ ...resp, [p.id]: { ...c, start: e.target.value || hoje() } })
                    }
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Data de fim (opcional)
                  </span>
                  <input
                    type="date"
                    className="input-ipma mt-1"
                    value={c.end}
                    onChange={(e) => setResp({ ...resp, [p.id]: { ...c, end: e.target.value } })}
                  />
                </label>
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
