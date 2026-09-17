import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import {
  OPTION_CATEGORIES,
  OPTION_CATEGORY_FORMS,
  OPTION_CATEGORY_LABEL,
  isOpcaoAtiva,
  type OptionCategory,
  type OptionValue,
} from "@/lib/opcoes";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

export const Route = createFileRoute("/backoffice/dados")({
  head: () => ({
    meta: [
      { title: "Gestão de dados — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Gestão dos valores das listas de escolha dos formulários do recrutamento do IPMA, com data de início, data de fim e estado ativo ou inativo.",
      },
      { property: "og:title", content: "Gestão de dados — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Valores das listas de escolha dos formulários, com períodos de validade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <Dados />
    </RequireRole>
  ),
});

const hoje = () => new Date().toISOString().slice(0, 10);

function Dados() {
  const { opcoes, addOpcao, updateOpcao, removeOpcao } = useStore();
  const [categoria, setCategoria] = useState<OptionCategory>("DEPARTAMENTO");
  const [novo, setNovo] = useState({
    label: "",
    startDate: hoje(),
    endDate: "",
    address: "",
    distritoId: "",
    concelhoId: "",
  });

  const distritos = useMemo(
    () => opcoes.filter((o) => o.category === "DISTRITO" && isOpcaoAtiva(o)),
    [opcoes],
  );
  const concelhos = useMemo(
    () => opcoes.filter((o) => o.category === "CONCELHO" && isOpcaoAtiva(o)),
    [opcoes],
  );
  const nomeDe = (id?: string | null) => opcoes.find((o) => o.id === id)?.label ?? "—";
  const isLocal = categoria === "LOCAL";
  const isConcelho = categoria === "CONCELHO";

  const lista = useMemo(
    () => opcoes.filter((o) => o.category === categoria),
    [opcoes, categoria],
  );

  function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.label.trim()) {
      toast.error("Indique a designação do valor.");
      return;
    }
    if (isConcelho && !novo.distritoId) {
      toast.error("Escolha o distrito do concelho.");
      return;
    }
    addOpcao({
      category: categoria,
      label: novo.label.trim(),
      startDate: novo.startDate || hoje(),
      endDate: novo.endDate || null,
      endedAt: null,
      address: isLocal ? novo.address.trim() || null : null,
      distritoId: isLocal || isConcelho ? novo.distritoId || null : null,
      concelhoId: isLocal ? novo.concelhoId || null : null,
    });
    setNovo({ label: "", startDate: hoje(), endDate: "", address: "", distritoId: "", concelhoId: "" });
    toast.success("Valor acrescentado à lista.");
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <section className="animate-rise">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Administração
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Gestão de dados</h1>
          <p className="mt-3 max-w-[68ch] text-[15px] text-muted-foreground text-pretty">
            Valores das listas de escolha de todos os formulários. Cada valor tem data de início,
            data de fim e estado: fica ativo quando a data de início já passou e a data de fim está
            vazia ou ainda não chegou. Só os valores ativos aparecem nas listas dos formulários.
          </p>
        </section>

        <div className="mt-8 flex animate-rise flex-wrap gap-1.5 [animation-delay:60ms]">
          {OPTION_CATEGORIES.map((c) => {
            const ativos = opcoes.filter((o) => o.category === c && isOpcaoAtiva(o)).length;
            const total = opcoes.filter((o) => o.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                className={`rounded-md px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                  categoria === c
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-white/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {OPTION_CATEGORY_LABEL[c]} · {ativos}/{total}
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Usado em: {OPTION_CATEGORY_FORMS[categoria]}
        </p>

        <form
          onSubmit={criar}
          className="glass mt-4 grid animate-rise items-end gap-4 rounded-xl p-5 [animation-delay:100ms] sm:grid-cols-4"
        >
          <label className="block sm:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Novo valor
            </span>
            <input
              value={novo.label}
              onChange={(e) => setNovo({ ...novo, label: e.target.value })}
              placeholder={`Designação (${OPTION_CATEGORY_LABEL[categoria]})`}
              className="input-ipma mt-1.5"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Data de início
            </span>
            <input
              type="date"
              value={novo.startDate}
              onChange={(e) => setNovo({ ...novo, startDate: e.target.value })}
              className="input-ipma mt-1.5"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Data de fim (opcional)
            </span>
            <input
              type="date"
              value={novo.endDate}
              onChange={(e) => setNovo({ ...novo, endDate: e.target.value })}
              className="input-ipma mt-1.5"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Acrescentar valor
            </button>
          </div>
        </form>

        <div className="glass mt-6 animate-rise overflow-x-auto rounded-xl [animation-delay:140ms]">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data de início</th>
                <th className="px-4 py-3">Data de fim</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((o) => {
                const ativo = isOpcaoAtiva(o);
                return (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <input
                        value={o.label}
                        onChange={(e) => updateOpcao(o.id, { label: e.target.value })}
                        className="input-ipma"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="date"
                        value={o.startDate}
                        onChange={(e) => updateOpcao(o.id, { startDate: e.target.value })}
                        className="input-ipma"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="date"
                        value={o.endDate ?? ""}
                        onChange={(e) => updateOpcao(o.id, { endDate: e.target.value || null })}
                        className="input-ipma"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                          ativo ? "bg-success/10 text-success" : "bg-neutral/15 text-neutral"
                        }`}
                      >
                        {ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          removeOpcao(o.id);
                          toast.success("Valor removido.");
                        }}
                        className="rounded-md border border-border px-3 py-1.5 text-[12px] hover:bg-foreground/5"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Ainda não há valores nesta lista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </PageShell>
  );
}
