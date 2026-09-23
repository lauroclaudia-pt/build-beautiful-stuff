import { createFileRoute } from "@tanstack/react-router";
import { InstitutionalPage } from "@/components/institutional-page";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dados-pessoais")({
  head: () => ({
    meta: [
      { title: "Dados pessoais — Recrutamento IPMA" },
      {
        name: "description",
        content: "Informação sobre o tratamento de dados pessoais no portal de recrutamento do IPMA, I.P.",
      },
      { property: "og:title", content: "Dados pessoais — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Tratamento e proteção de dados pessoais no recrutamento do IPMA, I.P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DadosPessoais,
});

function DadosPessoais() {
  const { site } = useStore();
  return (
    <InstitutionalPage
      eyebrow="Informação institucional"
      title="Dados pessoais"
      intro="Informação sobre o tratamento de dados pessoais no âmbito do recrutamento."
      content={site.personalDataText}
    />
  );
}