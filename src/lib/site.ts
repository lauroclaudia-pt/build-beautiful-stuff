/** Configuração editável do site, gerida no painel de administração. */
export interface SiteConfig {
  /** Logótipo apresentado no cabeçalho (URL ou data URL de um ficheiro carregado). */
  logoUrl: string | null;
  /** Ícone do separador do browser (favicon). */
  faviconUrl: string | null;
  /** Cor dos títulos principais (CSS oklch/hex). */
  titleColor: string;
  /** Cor de fundo dos botões principais. */
  buttonColor: string;
  /** Cor do texto dos botões principais. */
  buttonTextColor: string;
  /** Cor de destaque (etiquetas, realces). */
  accentColor: string;
  heroTitle: string;
  heroLead: string;
  showTypeFilter: boolean;
  showDepartmentFilter: boolean;
  showCareerFilter: boolean;
  showLocationFilter: boolean;
  /** Perguntas frequentes apresentadas na página de apoio. */
  faq: FaqItem[];
}

/** Um registo de pergunta e resposta da página de apoio. */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const DEFAULT_FAQ: FaqItem[] = [
  {
    id: "faq-1",
    question: "Como me candidato a uma vaga?",
    answer:
      "Abra a vaga pretendida no portal público e preencha o formulário de candidatura dentro do prazo indicado. Receberá confirmação por email com a referência do procedimento.",
  },
  {
    id: "faq-2",
    question: "Que documentos são exigidos?",
    answer:
      "Curriculum vitae, documento de identificação, certificado de habilitações e, quando aplicável, declaração da entidade empregadora pública com a caracterização do vínculo.",
  },
  {
    id: "faq-3",
    question: "O que é a recolha de requisitos em falta?",
    answer:
      "Se a sua candidatura estiver incompleta, é notificado por email para juntar os elementos em falta num prazo fixado. Findo esse prazo sem resposta, a candidatura é excluída.",
  },
  {
    id: "faq-4",
    question: "O que é a audiência de interessados?",
    answer:
      "Após a lista provisória de admitidos e excluídos, os candidatos excluídos podem apresentar alegações escritas, que são apreciadas pelo júri antes da lista definitiva.",
  },
];

export const DEFAULT_SITE: SiteConfig = {
  logoUrl: null,
  faviconUrl: null,
  titleColor: "#2C3987",
  buttonColor: "#2C3987",
  buttonTextColor: "#FFFFFF",
  accentColor: "#20C4F4",
  heroTitle: "Recrutamento de pessoal",
  heroLead:
    "Procedimentos concursais, mobilidades e bolsas de investigação do Instituto Português do Mar e da Atmosfera. Consulte o estado de cada processo e candidate-se dentro do prazo fixado.",
  showTypeFilter: true,
  showDepartmentFilter: true,
  showCareerFilter: true,
  showLocationFilter: true,
  faq: DEFAULT_FAQ.map((f) => ({ ...f })),
};

export const COLOR_FIELDS: {
  key: keyof Pick<
    SiteConfig,
    "titleColor" | "buttonColor" | "buttonTextColor" | "accentColor"
  >;
  label: string;
  hint: string;
}[] = [
  { key: "titleColor", label: "Títulos principais", hint: "Cor dos títulos e destaques de texto" },
  { key: "buttonColor", label: "Botões", hint: "Fundo dos botões de ação" },
  { key: "buttonTextColor", label: "Texto dos botões", hint: "Cor do texto dentro dos botões" },
  { key: "accentColor", label: "Realce", hint: "Etiquetas e elementos de destaque" },
];
