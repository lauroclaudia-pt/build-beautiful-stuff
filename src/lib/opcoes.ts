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
  | "SITUACAO_PROFISSIONAL";

export const OPTION_CATEGORY_LABEL: Record<OptionCategory, string> = {
  DEPARTAMENTO: "Unidade orgânica",
  LOCAL: "Local",
  CARREIRA: "Cargo / carreira",
  HABILITACAO: "Nível habilitacional",
  VINCULO: "Vínculo",
  REGIME: "Regime",
  METODO_SELECAO: "Método de seleção",
  SITUACAO_PROFISSIONAL: "Situação profissional",
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
}

/**
 * Estado do valor: ATIVO quando a data de início é anterior a hoje e a data de
 * fim é nula ou posterior a hoje. Nos restantes casos, INATIVO.
 */
export function isOpcaoAtiva(o: OptionValue, hoje = new Date()): boolean {
  const hojeISO = hoje.toISOString().slice(0, 10);
  if (!o.startDate || o.startDate > hojeISO) return false;
  if (o.endDate && o.endDate < hojeISO) return false;
  return true;
}

export function opcaoEstado(o: OptionValue): "ATIVO" | "INATIVO" {
  return isOpcaoAtiva(o) ? "ATIVO" : "INATIVO";
}

/** Valores ativos de uma categoria, pela ordem definida. */
export function opcoesAtivas(opcoes: OptionValue[], category: OptionCategory): string[] {
  return opcoes.filter((o) => o.category === category && isOpcaoAtiva(o)).map((o) => o.label);
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

export const SEED_OPCOES: OptionValue[] = [
  ...build("DEPARTAMENTO", DEPARTMENTS),
  ...build("LOCAL", LOCATIONS),
  ...build("CARREIRA", CAREERS),
  ...build("HABILITACAO", EDUCATION_LEVELS),
  ...build("VINCULO", BONDS),
  ...build("REGIME", REGIMES),
  ...build("METODO_SELECAO", SELECTION_METHODS),
  ...build("SITUACAO_PROFISSIONAL", SITUACOES_PROFISSIONAIS),
];
