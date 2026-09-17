import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { Req, hojeISO } from "@/components/req";
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

const hoje = hojeISO;

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
    if (!novo.startDate) {
      toast.error("A data de início é obrigatória.");
      return;
    }
    if (novo.endDate && novo.endDate < novo.startDate) {
      toast.error("A data de fim não pode ser anterior à data de início.");
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
            vazia ou ainda não chegou. Só os valores ativos aparecem nas listas dos formulários. O
            botão Remover não apaga o registo: fixa a data e a hora de fim no momento atual e o
            valor passa a inativo.
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
              <Req />
            </span>
            <input
              value={novo.label}
              onChange={(e) => setNovo({ ...novo, label: e.target.value })}
              placeholder={`Designação (${OPTION_CATEGORY_LABEL[categoria]})`}
              required
              className="input-ipma mt-1.5"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Data de início
              <Req />
            </span>
            <input
              type="date"
              value={novo.startDate}
              onChange={(e) => setNovo({ ...novo, startDate: e.target.value || hoje() })}
              required
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
          {isLocal && (
            <label className="block sm:col-span-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Morada completa
              </span>
              <input
                value={novo.address}
                onChange={(e) => setNovo({ ...novo, address: e.target.value })}
                placeholder="Rua C do Aeroporto, 1749-077 Lisboa"
                className="input-ipma mt-1.5"
              />
            </label>
          )}
          {(isLocal || isConcelho) && (
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Distrito
              </span>
              <select
                value={novo.distritoId}
                onChange={(e) => setNovo({ ...novo, distritoId: e.target.value, concelhoId: "" })}
                className="input-ipma mt-1.5"
              >
                <option value="">Selecione…</option>
                {distritos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isLocal && (
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Concelho
              </span>
              <select
                value={novo.concelhoId}
                onChange={(e) => setNovo({ ...novo, concelhoId: e.target.value })}
                className="input-ipma mt-1.5"
              >
                <option value="">Selecione…</option>
                {concelhos
                  .filter((c) => !novo.distritoId || c.distritoId === novo.distritoId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
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
                {isLocal && <th className="px-4 py-3">Morada completa</th>}
                {(isLocal || isConcelho) && <th className="px-4 py-3">Distrito</th>}
                {isLocal && <th className="px-4 py-3">Concelho</th>}
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
                    {isLocal && (
                      <td className="px-4 py-2.5">
                        <input
                          value={o.address ?? ""}
                          onChange={(e) => updateOpcao(o.id, { address: e.target.value || null })}
                          placeholder="Morada completa"
                          className="input-ipma min-w-[220px]"
                        />
                      </td>
                    )}
                    {(isLocal || isConcelho) && (
                      <td className="px-4 py-2.5">
                        <select
                          value={o.distritoId ?? ""}
                          onChange={(e) =>
                            updateOpcao(o.id, {
                              distritoId: e.target.value || null,
                              ...(isLocal ? { concelhoId: null } : {}),
                            })
                          }
                          className="input-ipma"
                        >
                          <option value="">—</option>
                          {distritos.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {isLocal && (
                      <td className="px-4 py-2.5">
                        <select
                          value={o.concelhoId ?? ""}
                          onChange={(e) => updateOpcao(o.id, { concelhoId: e.target.value || null })}
                          className="input-ipma"
                        >
                          <option value="">—</option>
                          {concelhos
                            .filter((c) => !o.distritoId || c.distritoId === o.distritoId)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                        </select>
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <input
                        type="date"
                        value={o.startDate}
                        onChange={(e) =>
                          updateOpcao(o.id, { startDate: e.target.value || hoje() })
                        }
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
                          toast.success("Valor desativado com data e hora de agora.");
                        }}
                        disabled={!ativo}
                        className="rounded-md border border-border px-3 py-1.5 text-[12px] hover:bg-foreground/5 disabled:opacity-40"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
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
