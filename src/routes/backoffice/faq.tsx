import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, RequireRole } from "@/components/shell";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/pessoas";
import { DEFAULT_FAQ, type FaqItem } from "@/lib/site";

const ADMIN_ROLES: Role[] = ["ADMIN", "GESTOR_RH", "GESTAO"];

export const Route = createFileRoute("/backoffice/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — Gestão | Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Criar, editar, reordenar e remover as perguntas e respostas apresentadas na página de apoio ao candidato do recrutamento do IPMA.",
      },
      { property: "og:title", content: "Perguntas frequentes — Gestão | Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Gestão do conteúdo da página de apoio ao candidato.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireRole roles={ADMIN_ROLES}>
      <GestaoFaq />
    </RequireRole>
  ),
});

function GestaoFaq() {
  const { site, updateSite } = useStore();
  const faq = site.faq ?? [];
  const [novo, setNovo] = useState({ question: "", answer: "" });

  function guardar(lista: FaqItem[]) {
    updateSite({ faq: lista });
  }

  function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.question.trim() || !novo.answer.trim()) {
      toast.error("Indique o título e o texto da pergunta.");
      return;
    }
    guardar([
      ...faq,
      {
        id: `faq-${Date.now()}`,
        question: novo.question.trim(),
        answer: novo.answer.trim(),
      },
    ]);
    setNovo({ question: "", answer: "" });
    toast.success("Pergunta adicionada.");
  }

  function editar(id: string, patch: Partial<FaqItem>) {
    guardar(faq.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function remover(id: string) {
    guardar(faq.filter((f) => f.id !== id));
    toast.success("Pergunta removida.");
  }

  function mover(index: number, delta: number) {
    const destino = index + delta;
    if (destino < 0 || destino >= faq.length) return;
    const lista = [...faq];
    const [item] = lista.splice(index, 1);
    lista.splice(destino, 0, item!);
    guardar(lista);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="animate-rise">
          <Link
            to="/backoffice/admin"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Administração
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Perguntas frequentes</h1>
          <p className="mt-2 max-w-[70ch] text-[14px] text-muted-foreground text-pretty">
            Cada registo é um par de título e texto apresentado na página de apoio ao candidato,
            pela ordem definida aqui.
          </p>
        </div>

        <form onSubmit={criar} className="glass mt-8 animate-rise rounded-xl p-5 [animation-delay:60ms]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Nova pergunta
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={novo.question}
              onChange={(e) => setNovo({ ...novo, question: e.target.value })}
              placeholder="Como me candidato a uma vaga?"
              className="input-ipma w-full"
            />
            <textarea
              value={novo.answer}
              onChange={(e) => setNovo({ ...novo, answer: e.target.value })}
              rows={4}
              placeholder="Abra a vaga pretendida no portal público e preencha o formulário…"
              className="input-ipma w-full"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Adicionar pergunta
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {faq.length === 0 && (
            <p className="glass rounded-xl p-5 text-[13px] text-muted-foreground">
              Ainda não existem perguntas. A página de apoio fica sem a lista de Q&amp;A.
            </p>
          )}
          {faq.map((f, i) => (
            <div key={f.id} className="glass animate-rise rounded-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Registo {i + 1}
                </span>
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
                    disabled={i === faq.length - 1}
                    className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(f.id)}
                    className="rounded-md border border-destructive/40 px-2 py-1 text-[12px] text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <input
                value={f.question}
                onChange={(e) => editar(f.id, { question: e.target.value })}
                className="input-ipma mt-3 w-full font-semibold"
              />
              <textarea
                value={f.answer}
                onChange={(e) => editar(f.id, { answer: e.target.value })}
                rows={4}
                className="input-ipma mt-2 w-full"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            guardar(DEFAULT_FAQ.map((f) => ({ ...f })));
            toast.success("Perguntas repostas.");
          }}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-[13px] font-medium"
        >
          Repor lista original
        </button>
      </main>
    </PageShell>
  );
}
