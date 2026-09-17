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
}

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
