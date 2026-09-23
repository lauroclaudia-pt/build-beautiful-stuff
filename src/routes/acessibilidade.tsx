import { createFileRoute } from "@tanstack/react-router";
import { InstitutionalPage } from "@/components/institutional-page";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/acessibilidade")({
  head: () => ({
    meta: [
      { title: "Acessibilidade — Recrutamento IPMA" },
      {
        name: "description",
        content: "Declaração e informação de acessibilidade do portal de recrutamento do IPMA, I.P.",
      },
      { property: "og:title", content: "Acessibilidade — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Informação sobre a acessibilidade do portal de recrutamento do IPMA, I.P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Acessibilidade,
});

function Acessibilidade() {
  const { site } = useStore();
  return (
    <InstitutionalPage
      eyebrow="Informação institucional"
      title="Acessibilidade"
      intro="Informação sobre a utilização acessível do portal de recrutamento."
      content={site.accessibilityText}
    />
  );
}