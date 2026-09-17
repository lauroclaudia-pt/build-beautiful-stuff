import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import { DEFAULT_CONTACTS, type ContactItem } from "@/lib/site";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

export const Route = createFileRoute("/backoffice/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos — Gestão | Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Editar a designação e o valor dos contactos apresentados nas páginas públicas do recrutamento do IPMA.",
      },
      { property: "og:title", content: "Contactos — Gestão | Recrutamento IPMA" },
      { property: "og:description", content: "Gestão dos contactos públicos do IPMA, I.P." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <GestaoContactos />
    </RequireRole>
  ),
});

function GestaoContactos() {
  const { site, updateSite } = useStore();
  const lista = site.contacts ?? [];
  const [novo, setNovo] = useState({ label: "", value: "" });

  function guardar(next: ContactItem[]) {
    updateSite({ contacts: next });
  }

  function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.label.trim() || !novo.value.trim()) {
      toast.error("Indique a designação e o valor.");
      return;
    }
    guardar([
      ...lista,
      { id: `ct-${Date.now()}`, label: novo.label.trim(), value: novo.value.trim() },
    ]);
    setNovo({ label: "", value: "" });
    toast.success("Contacto adicionado.");
  }

  function editar(id: string, patch: Partial<ContactItem>) {
    guardar(lista.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function mover(index: number, delta: number) {
    const destino = index + delta;
    if (destino < 0 || destino >= lista.length) return;
    const next = [...lista];
    const [item] = next.splice(index, 1);
    next.splice(destino, 0, item!);
    guardar(next);
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
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Contactos</h1>
          <p className="mt-2 max-w-[70ch] text-[14px] text-muted-foreground text-pretty">
            Cada linha é um contacto apresentado nas páginas públicas: a designação à esquerda (por
            exemplo «Divisão») e o valor à direita (por exemplo «Recursos Humanos»).
          </p>
        </div>

        <form onSubmit={criar} className="glass mt-8 animate-rise rounded-xl p-5 [animation-delay:60ms]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Novo contacto
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={novo.label}
              onChange={(e) => setNovo({ ...novo, label: e.target.value })}
              placeholder="Designação (ex.: Telefone)"
              className="input-ipma w-full"
            />
            <input
              value={novo.value}
              onChange={(e) => setNovo({ ...novo, value: e.target.value })}
              placeholder="Valor (ex.: 218 447 000)"
              className="input-ipma w-full"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Adicionar
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {lista.length === 0 && (
            <p className="glass rounded-xl p-5 text-[13px] text-muted-foreground">
              Não existem contactos configurados.
            </p>
          )}
          {lista.map((c, i) => (
            <div key={c.id} className="glass animate-rise rounded-xl p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={c.label}
                  onChange={(e) => editar(c.id, { label: e.target.value })}
                  className="input-ipma w-full"
                />
                <input
                  value={c.value}
                  onChange={(e) => editar(c.id, { value: e.target.value })}
                  className="input-ipma w-full font-medium"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === lista.length - 1}
                    className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      guardar(lista.filter((x) => x.id !== c.id));
                      toast.success("Contacto removido.");
                    }}
                    className="rounded-md border border-destructive/40 px-2 py-1 text-[12px] text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            guardar(DEFAULT_CONTACTS.map((c) => ({ ...c })));
            toast.success("Contactos repostos.");
          }}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-[13px] font-medium"
        >
          Repor contactos originais
        </button>
      </main>
    </PageShell>
  );
}
