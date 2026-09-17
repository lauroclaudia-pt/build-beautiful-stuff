export type Role = "GESTOR_RH" | "GESTAO" | "ADMIN" | "CANDIDATO" | "JURI";

export const ROLE_LABEL: Record<Role, string> = {
  GESTOR_RH: "Gestor de RH",
  GESTAO: "Gestão",
  ADMIN: "Administrador",
  CANDIDATO: "Candidato",
  JURI: "Júri",
};

export const ROLES: Role[] = ["GESTOR_RH", "GESTAO", "ADMIN", "CANDIDATO", "JURI"];

export interface Responsabilidade {
  id: string;
  role: Role;
  /** Data de início (YYYY-MM-DD). */
  startDate: string;
  /** Data de fim (YYYY-MM-DD) ou null quando é por tempo indeterminado. */
  endDate: string | null;
}

export interface Pessoa {
  id: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  /** Cada pessoa pode ter, no máximo, um login. */
  hasLogin: boolean;
  password: string | null;
  responsabilidades: Responsabilidade[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Ativa: data de início ≤ hoje e (sem data de fim ou data de fim ≥ hoje). */
export function isResponsabilidadeAtiva(r: Responsabilidade, ref = today()): boolean {
  const started = !r.startDate || r.startDate <= ref;
  const notEnded = !r.endDate || r.endDate >= ref;
  return started && notEnded;
}

export function responsabilidadeEstado(r: Responsabilidade): "ATIVO" | "INATIVO" {
  return isResponsabilidadeAtiva(r) ? "ATIVO" : "INATIVO";
}

export function activeRoles(p: Pessoa): Role[] {
  return p.responsabilidades.filter((r) => isResponsabilidadeAtiva(r)).map((r) => r.role);
}

export function hasActiveRole(p: Pessoa | null, ...roles: Role[]): boolean {
  if (!p) return false;
  const active = activeRoles(p);
  return roles.some((r) => active.includes(r));
}

export const BACKOFFICE_ROLES: Role[] = ["GESTOR_RH", "GESTAO", "ADMIN", "JURI"];

function iso(offsetDays: number) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

let seq = 0;
function resp(role: Role, start: number, end: number | null): Responsabilidade {
  seq += 1;
  return {
    id: `r${seq}`,
    role,
    startDate: iso(start),
    endDate: end === null ? null : iso(end),
  };
}

export const SEED_PESSOAS: Pessoa[] = [
  {
    id: "p1",
    name: "Helena Marques",
    email: "helena.marques@ipma.pt",
    phone: "218 447 000",
    nif: "201234567",
    hasLogin: true,
    password: "ipma",
    responsabilidades: [resp("ADMIN", -400, null), resp("GESTOR_RH", -200, null)],
  },
  {
    id: "p2",
    name: "Rui Belo",
    email: "rui.belo@ipma.pt",
    phone: "218 447 010",
    nif: "202234567",
    hasLogin: true,
    password: "ipma",
    responsabilidades: [resp("GESTOR_RH", -180, 120), resp("JURI", -60, 240)],
  },
  {
    id: "p3",
    name: "Sofia Neves",
    email: "sofia.neves@ipma.pt",
    phone: "218 447 020",
    nif: "203234567",
    hasLogin: true,
    password: "ipma",
    responsabilidades: [resp("GESTAO", -300, null), resp("JURI", -500, -30)],
  },
  {
    id: "p4",
    name: "Marta Costa",
    email: "marta.costa@exemplo.pt",
    phone: "912 345 678",
    nif: "234567890",
    hasLogin: true,
    password: "ipma",
    responsabilidades: [resp("CANDIDATO", -30, null)],
  },
  {
    id: "p5",
    name: "Diogo Tavares",
    email: "diogo.tavares@exemplo.pt",
    phone: "917 555 444",
    nif: "212345678",
    hasLogin: true,
    password: "ipma",
    responsabilidades: [resp("CANDIDATO", -25, null)],
  },
];
