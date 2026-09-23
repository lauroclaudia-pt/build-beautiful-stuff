import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Download, Pencil, Trash2 } from "lucide-react";
import { PageShell, RequireRole } from "@/components/shell";
import { FilePickButton } from "@/components/file-upload";
import { Req, hojeISO } from "@/components/req";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import {
  OPTION_CATEGORIES,
  OPTION_CATEGORY_FORMS,
  OPTION_CATEGORY_LABEL,
  compararPorValor,
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
  const [editando, setEditando] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<{
    chave: "valor" | "inicio" | "fim";
    direcao: "asc" | "desc";
  }>({ chave: "valor", direcao: "asc" });
  const [novo, setNovo] = useState({
    label: "",
    startDate: hoje(),
    endDate: "",
    address: "",
    distritoId: "",
    concelhoId: "",
  });

  const distritos = useMemo(
    () => opcoes.filter((o) => o.category === "DISTRITO" && isOpcaoAtiva(o)).sort(compararPorValor),
    [opcoes],
  );
  const concelhos = useMemo(
    () => opcoes.filter((o) => o.category === "CONCELHO" && isOpcaoAtiva(o)).sort(compararPorValor),
    [opcoes],
  );
  const nomeDe = (id?: string | null) => opcoes.find((o) => o.id === id)?.label ?? "—";
  const isLocal = categoria === "LOCAL";
  const isConcelho = categoria === "CONCELHO";

  const lista = useMemo(() => {
    const itens = opcoes.filter((o) => o.category === categoria);
    const fator = ordenacao.direcao === "asc" ? 1 : -1;
    return [...itens].sort((a, b) => {
      if (ordenacao.chave === "valor") return fator * compararPorValor(a, b);
      const va = ordenacao.chave === "inicio" ? a.startDate : a.endDate ?? "";
      const vb = ordenacao.chave === "inicio" ? b.startDate : b.endDate ?? "";
      if (va === vb) return compararPorValor(a, b);
      return fator * (va < vb ? -1 : 1);
    });
  }, [opcoes, categoria, ordenacao]);

  function mudarOrdenacao(chave: "valor" | "inicio" | "fim") {
    setOrdenacao((atual) =>
      atual.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: "asc" },
    );
  }

  /** Descarrega os valores da categoria atual num ficheiro CSV (Excel-friendly). */
  function descarregar() {
    const cab = ["Valor", "Data de início", "Data de fim", "Morada", "Distrito", "Concelho", "Estado"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linhas = lista.map((o) =>
      [
        o.label,
        o.startDate,
        o.endDate ?? "",
        o.address ?? "",
        o.distritoId ? nomeDe(o.distritoId) : "",
        o.concelhoId ? nomeDe(o.concelhoId) : "",
        isOpcaoAtiva(o) ? "ATIVO" : "INATIVO",
      ].map(esc).join(";"),
    );
    const csv = "\uFEFF" + [cab.map(esc).join(";"), ...linhas].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${categoria.toLowerCase()}-${hoje()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${lista.length} valor(es) descarregado(s).`);
  }

  /** Carrega valores para a categoria atual a partir de um ficheiro Excel ou CSV. */
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
    const dataISO = (v: string) => {
      if (!v) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
      const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
    };
    const porNome = (nome: string, cat: OptionCategory) =>
      opcoes.find(
        (o) => o.category === cat && o.label.localeCompare(nome, "pt", { sensitivity: "base" }) === 0,
      )?.id ?? null;

    let criados = 0;
    let ignorados = 0;
    for (const l of linhas) {
      const label = valor(l, "valor", "designação", "designacao", "nome", "label");
      if (!label) {
        ignorados += 1;
        continue;
      }
      if (
        opcoes.some(
          (o) =>
            o.category === categoria &&
            o.label.localeCompare(label, "pt", { sensitivity: "base" }) === 0,
        )
      ) {
        ignorados += 1;
        continue;
      }
      const distritoNome = valor(l, "distrito");
      const concelhoNome = valor(l, "concelho");
      addOpcao({
        category: categoria,
        label,
        startDate: dataISO(valor(l, "data de início", "data de inicio", "início", "inicio")) || hoje(),
        endDate: dataISO(valor(l, "data de fim", "fim")) || null,
        endedAt: null,
        address: isLocal ? valor(l, "morada", "endereço", "endereco") || null : null,
        distritoId: isLocal || isConcelho ? (distritoNome ? porNome(distritoNome, "DISTRITO") : null) : null,
        concelhoId: isLocal ? (concelhoNome ? porNome(concelhoNome, "CONCELHO") : null) : null,
      });
      criados += 1;
    }
    toast.success(
      `${criados} valor(es) importado(s).${ignorados ? ` ${ignorados} ignorado(s).` : ""}`,
    );
  }

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
            vazia ou ainda não chegou. Só os valores ativos aparecem nas listas dos formulários, por
            ordem alfabética do valor. O botão Remover não apaga o registo: fixa a data e a hora de
            fim no momento atual e o valor passa a inativo. As colunas Valor, Data de início e Data
            de fim podem ser ordenadas clicando no respetivo título.
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Usado em: {OPTION_CATEGORY_FORMS[categoria]}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FilePickButton
              accept=".xlsx,.xls,.csv"
              label="Importar de Excel ou CSV"
              small
              onPick={(fs) => {
                const f = fs[0];
                if (f) void importar(f);
              }}
            />
            <button
              type="button"
              onClick={descarregar}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white/60 px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-foreground/5"
            >
              <Download size={13} />
              Descarregar valores (CSV)
            </button>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          O ficheiro a importar deve ter as colunas <strong>Valor</strong>,{" "}
          <strong>Data de início</strong> e <strong>Data de fim</strong> (e ainda Morada, Distrito e
          Concelho nos locais e concelhos). Valores repetidos são ignorados.
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
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => mudarOrdenacao("valor")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    title="Ordenar por valor"
                  >
                    Valor
                    <SortIcon ativo={ordenacao.chave === "valor"} direcao={ordenacao.direcao} />
                  </button>
                </th>
                {isLocal && <th className="px-4 py-3">Morada completa</th>}
                {(isLocal || isConcelho) && <th className="px-4 py-3">Distrito</th>}
                {isLocal && <th className="px-4 py-3">Concelho</th>}
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => mudarOrdenacao("inicio")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    title="Ordenar por data de início"
                  >
                    Data de início
                    <SortIcon ativo={ordenacao.chave === "inicio"} direcao={ordenacao.direcao} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => mudarOrdenacao("fim")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    title="Ordenar por data de fim"
                  >
                    Data de fim
                    <SortIcon ativo={ordenacao.chave === "fim"} direcao={ordenacao.direcao} />
                  </button>
                </th>
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
                        disabled={editando !== o.id}
                        className="input-ipma disabled:border-transparent disabled:bg-transparent disabled:opacity-100"
                      />
                    </td>
                    {isLocal && (
                      <td className="px-4 py-2.5">
                        <input
                          value={o.address ?? ""}
                          onChange={(e) => updateOpcao(o.id, { address: e.target.value || null })}
                          placeholder="Morada completa"
                          disabled={editando !== o.id}
                          className="input-ipma min-w-[220px] disabled:border-transparent disabled:bg-transparent disabled:opacity-100"
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
                          disabled={editando !== o.id}
                          className="input-ipma disabled:border-transparent disabled:bg-transparent disabled:opacity-100"
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
                          disabled={editando !== o.id}
                          className="input-ipma disabled:border-transparent disabled:bg-transparent disabled:opacity-100"
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
                        disabled={editando !== o.id}
                        className="input-ipma disabled:border-transparent disabled:bg-transparent disabled:opacity-100"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="date"
                        value={o.endDate ?? ""}
                        onChange={(e) => updateOpcao(o.id, { endDate: e.target.value || null })}
                        disabled={editando !== o.id}
                        className="input-ipma disabled:border-transparent disabled:bg-transparent disabled:opacity-100"
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
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title={editando === o.id ? "Guardar alterações" : "Editar"}
                          aria-label={editando === o.id ? "Guardar alterações" : "Editar"}
                          onClick={() => {
                            if (editando === o.id) {
                              setEditando(null);
                              toast.success("Alterações guardadas.");
                            } else {
                              setEditando(o.id);
                            }
                          }}
                          className={`rounded-md border p-2 transition ${
                            editando === o.id
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-border hover:bg-foreground/5"
                          }`}
                        >
                          {editando === o.id ? <Check size={15} /> : <Pencil size={15} />}
                        </button>
                        <button
                          type="button"
                          title="Remover"
                          aria-label="Remover"
                          onClick={() => {
                            removeOpcao(o.id);
                            setEditando(null);
                            toast.success("Valor desativado com data e hora de agora.");
                          }}
                          disabled={!ativo}
                          className="rounded-md border border-border p-2 text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

function SortIcon({ ativo, direcao }: { ativo: boolean; direcao: "asc" | "desc" }) {
  if (!ativo) return <ArrowUpDown size={11} className="opacity-50" />;
  return direcao === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
}
