import {
  BONDS,
  CAREERS,
  DEPARTMENTS,
  EDUCATION_LEVELS,
  LOCATIONS,
  REGIMES,
  SELECTION_METHODS,
} from "./recrutamento";

/** Categorias de valores de listas (select boxes) usadas nos formulários. */
export type OptionCategory =
  | "DEPARTAMENTO"
  | "LOCAL"
  | "CARREIRA"
  | "HABILITACAO"
  | "VINCULO"
  | "REGIME"
  | "METODO_SELECAO"
  | "SITUACAO_PROFISSIONAL"
  | "NACIONALIDADE"
  | "DISTRITO"
  | "CONCELHO";

export const OPTION_CATEGORY_LABEL: Record<OptionCategory, string> = {
  DEPARTAMENTO: "Unidade orgânica",
  LOCAL: "Local",
  CARREIRA: "Cargo / carreira",
  HABILITACAO: "Nível habilitacional",
  VINCULO: "Vínculo",
  REGIME: "Regime",
  METODO_SELECAO: "Método de seleção",
  SITUACAO_PROFISSIONAL: "Situação profissional",
  NACIONALIDADE: "Nacionalidade",
  DISTRITO: "Distrito",
  CONCELHO: "Concelho",
};

export const OPTION_CATEGORY_FORMS: Record<OptionCategory, string> = {
  DEPARTAMENTO: "Novo procedimento · Filtros da página inicial",
  LOCAL: "Novo procedimento · Filtros da página inicial",
  CARREIRA: "Novo procedimento · Filtros da página inicial",
  HABILITACAO: "Novo procedimento · Formulário de candidatura",
  VINCULO: "Novo procedimento",
  REGIME: "Novo procedimento",
  METODO_SELECAO: "Novo procedimento",
  SITUACAO_PROFISSIONAL: "Formulário de candidatura",
  NACIONALIDADE: "Formulário de candidatura",
  DISTRITO: "Locais",
  CONCELHO: "Locais",
};

export const OPTION_CATEGORIES = Object.keys(OPTION_CATEGORY_LABEL) as OptionCategory[];

export interface OptionValue {
  id: string;
  category: OptionCategory;
  label: string;
  /** Data de início (AAAA-MM-DD). */
  startDate: string;
  /** Data de fim (AAAA-MM-DD) ou nula quando não tem termo. */
  endDate: string | null;
  /** Data e hora exatas em que o valor foi desativado (ISO) ou nula. */
  endedAt?: string | null;
  /** Morada completa (apenas para a categoria LOCAL). */
  address?: string | null;
  /** Distrito associado, por identificador (LOCAL e CONCELHO). */
  distritoId?: string | null;
  /** Concelho associado, por identificador (LOCAL). */
  concelhoId?: string | null;
}

/**
 * Estado do valor: ATIVO quando a data de início é anterior a hoje e a data de
 * fim é nula ou posterior a hoje. Nos restantes casos, INATIVO.
 */
export function isOpcaoAtiva(o: OptionValue, hoje = new Date()): boolean {
  const hojeISO = hoje.toISOString().slice(0, 10);
  if (o.endedAt && new Date(o.endedAt) <= hoje) return false;
  if (!o.startDate || o.startDate > hojeISO) return false;
  if (o.endDate && o.endDate < hojeISO) return false;
  return true;
}

export function opcaoEstado(o: OptionValue): "ATIVO" | "INATIVO" {
  return isOpcaoAtiva(o) ? "ATIVO" : "INATIVO";
}

/** Ordenação alfabética do valor (português, sem distinguir maiúsculas). */
export function compararPorValor(a: OptionValue, b: OptionValue): number {
  return a.label.localeCompare(b.label, "pt", { sensitivity: "base", numeric: true });
}

/** Registos ativos de uma categoria, por ordem alfabética do valor. */
export function registosAtivos(opcoes: OptionValue[], category: OptionCategory): OptionValue[] {
  return opcoes
    .filter((o) => o.category === category && isOpcaoAtiva(o))
    .sort(compararPorValor);
}

/** Valores ativos de uma categoria, por ordem alfabética do valor. */
export function opcoesAtivas(opcoes: OptionValue[], category: OptionCategory): string[] {
  return registosAtivos(opcoes, category).map((o) => o.label);
}

const INICIO = "2020-01-01";

function build(category: OptionCategory, labels: string[]): OptionValue[] {
  return labels.map((label, i) => ({
    id: `${category.toLowerCase()}-${i + 1}`,
    category,
    label,
    startDate: INICIO,
    endDate: null,
  }));
}

export const SITUACOES_PROFISSIONAIS = [
  "Trabalhador em funções públicas",
  "Trabalhador por conta de outrem",
  "Trabalhador independente",
  "Desempregado",
  "Estudante",
];

export const NACIONALIDADES = [
  "Portuguesa",
  "Espanhola",
  "Brasileira",
  "Francesa",
  "Alemã",
  "Italiana",
  "Cabo-verdiana",
  "Angolana",
  "Moçambicana",
  "Outra",
];

export const DISTRITOS_CONCELHOS: Record<string, string[]> = {
  Lisboa: ["Lisboa", "Cascais", "Oeiras", "Sintra", "Loures", "Amadora"],
  Porto: ["Porto", "Matosinhos", "Vila Nova de Gaia", "Maia", "Gondomar"],
  Faro: ["Faro", "Olhão", "Portimão", "Lagos", "Tavira"],
  Setúbal: ["Setúbal", "Almada", "Seixal", "Sesimbra", "Palmela"],
  Aveiro: ["Aveiro", "Ílhavo", "Ovar", "Águeda"],
  Coimbra: ["Coimbra", "Figueira da Foz", "Cantanhede"],
  Braga: ["Braga", "Guimarães", "Barcelos", "Esposende"],
  "Ilha da Madeira": ["Funchal", "Machico", "Câmara de Lobos"],
  "Ilha de São Miguel": ["Ponta Delgada", "Ribeira Grande", "Lagoa"],
};

const distritos: OptionValue[] = Object.keys(DISTRITOS_CONCELHOS).map((label, i) => ({
  id: `distrito-${i + 1}`,
  category: "DISTRITO" as OptionCategory,
  label,
  startDate: INICIO,
  endDate: null,
}));

const concelhos: OptionValue[] = distritos.flatMap((d, di) =>
  (DISTRITOS_CONCELHOS[d.label] ?? []).map((label, i) => ({
    id: `concelho-${di + 1}-${i + 1}`,
    category: "CONCELHO" as OptionCategory,
    label,
    startDate: INICIO,
    endDate: null,
    distritoId: d.id,
  })),
);

export const SEED_OPCOES: OptionValue[] = [
  ...distritos,
  ...concelhos,
  ...build("DEPARTAMENTO", DEPARTMENTS),
  ...build("LOCAL", LOCATIONS),
  ...build("CARREIRA", CAREERS),
  ...build("HABILITACAO", EDUCATION_LEVELS),
  ...build("VINCULO", BONDS),
  ...build("REGIME", REGIMES),
  ...build("METODO_SELECAO", SELECTION_METHODS),
  ...build("SITUACAO_PROFISSIONAL", SITUACOES_PROFISSIONAIS),
  ...build("NACIONALIDADE", NACIONALIDADES),
];
