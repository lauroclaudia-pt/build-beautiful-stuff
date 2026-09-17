import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/shell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/apoio")({
  head: () => ({
    meta: [
      { title: "Apoio ao candidato — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Como se candidatar aos procedimentos concursais do IPMA, prazos, documentos exigidos, audiência de interessados e contactos da Divisão de Recursos Humanos.",
      },
      { property: "og:title", content: "Apoio ao candidato — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Prazos, documentos, audiência de interessados e contactos do recrutamento IPMA.",
      },
    ],
  }),
  component: Apoio,
});


function Apoio() {
  const { site } = useStore();
  const faq = site.faq ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="max-w-[60ch] animate-rise">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Apoio ao candidato
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">
            Perguntas frequentes e contactos
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground text-pretty">
            Informação sobre o funcionamento dos procedimentos concursais do IPMA, I.P.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-4 lg:col-span-8">
            {faq.map((f, i) => (
              <div
                key={f.id}
                style={{ animationDelay: `${80 + i * 60}ms` }}
                className="glass animate-rise rounded-xl p-5"
              >
                <h2 className="text-[15px] font-semibold tracking-tight">{f.question}</h2>
                <p className="mt-2 text-[13px] text-muted-foreground text-pretty">{f.answer}</p>
              </div>
            ))}
          </div>
          <aside className="col-span-12 lg:col-span-4">
            <div className="glass animate-rise rounded-xl p-5 [animation-delay:200ms]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Contactos
              </p>
              <div className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Divisão</span>
                  <span className="font-medium">Recursos Humanos</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">recrutamento@ipma.pt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">9h30 — 17h00</span>
                </div>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Dados de contacto de demonstração
              </p>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
