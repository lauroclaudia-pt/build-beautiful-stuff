// ============= Cliente do servidor de recrutamento (backend Java no Railway) =============
// Todas as chamadas passam pelo proxy interno /api/java/* (o backend não publica CORS).

import {
  newStagesFor,
  type JobState,
  type OfferType,
  type Vaga,
} from "./recrutamento";
import type { Role } from "./pessoas";

/** Endereço do servidor de recrutamento (pode ser alterado na Gestão do site). */
export const DEFAULT_JAVA_API_URL =
  "https://build-beautiful-stuff-production.up.railway.app";

const AUTH_KEY = "ipma-java-auth";

/** Guarda as credenciais da sessão (HTTP Basic) para as chamadas autenticadas. */
export function saveJavaAuth(email: string, password: string): void {
  try {
    window.sessionStorage.setItem(AUTH_KEY, `Basic ${btoa(`${email}:${password}`)}`);
  } catch {
    /* ignore */
  }
}

export function getJavaAuth(): string | null {
  try {
    return window.sessionStorage.getItem(AUTH_KEY);
  } catch {
    return null;
  }
}

export function clearJavaAuth(): void {
  try {
    window.sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

export function javaBase(siteUrl?: string | null): string {
  return siteUrl?.trim() || DEFAULT_JAVA_API_URL;
}

async function javaFetch(base: string, path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-java-base", base);
  const auth = getJavaAuth();
  if (auth && !headers.has("Authorization")) headers.set("Authorization", auth);
  return fetch(`/api/java${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers });
}

// ============= Autenticação (GET /api/auth/me com HTTP Basic) =============

export interface JavaMe {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export type JavaLoginFailure = "credentials" | "unreachable" | "server";

export async function loginJava(
  base: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; me?: JavaMe; message: string; failure?: JavaLoginFailure }> {
  try {
    const res = await fetch("/api/java/api/auth/me", {
      headers: { "x-java-base": base, Authorization: `Basic ${btoa(`${email}:${password}`)}` },
    });
    if (res.status === 401) {
      return { ok: false, failure: "credentials", message: "Credenciais recusadas pelo servidor de recrutamento." };
    }
    if (!res.ok) {
      return { ok: false, failure: "server", message: `O servidor de recrutamento respondeu com o erro ${res.status}.` };
    }
    const me = (await res.json()) as JavaMe & { javaUnavailable?: boolean };
    if (me?.javaUnavailable || !me?.email) {
      return { ok: false, failure: "unreachable", message: "Servidor de recrutamento indisponível." };
    }
    return { ok: true, me, message: `Bem-vindo(a), ${me.name}.` };
  } catch {
    return { ok: false, failure: "unreachable", message: "Servidor de recrutamento indisponível." };
  }
}

/** Perfis do backend (ADMIN, CDRH, GESTOR_RH, JURI, PORTAL) → responsabilidades da plataforma. */
const JAVA_ROLE_MAP: Record<string, Role> = {
  ADMIN: "ADMIN",
  GESTOR_RH: "GESTOR_RH",
  CDRH: "GESTAO",
  JURI: "JURI",
  PORTAL: "CANDIDATO",
};

export function mapJavaRoles(roles: string[]): Role[] {
  const out = new Set<Role>();
  for (const r of roles ?? []) {
    const mapped = JAVA_ROLE_MAP[r];
    if (mapped) out.add(mapped);
  }
  return out.size ? [...out] : ["CANDIDATO"];
}

// ============= Vagas públicas (GET /api/public/jobs) =============

const OFFER_MAP: Record<string, OfferType> = {
  PROCEDIMENTO_CONCURSAL_COMUM: "PROCEDIMENTO_CONCURSAL_COMUM",
  PROCEDIMENTO_CONCURSAL_RESERVA: "PROCEDIMENTO_CONCURSAL_RESERVA",
  PROCEDIMENTO_CONCURSAL_SELECAO_INTERNACIONAL: "SELECAO_INTERNACIONAL",
  PROCEDIMENTO_CONCURSAL_CARGOS_DIRECAO: "CARGOS_DIRECAO",
  MOBILIDADE_INTERNA: "MOBILIDADE_INTERNA",
  MOBILIDADE_INTERCARREIRAS: "MOBILIDADE_INTERCARREIRAS",
  BOLSA_INVESTIGACAO_CIENTIFICA: "BOLSA_INVESTIGACAO_CIENTIFICA",
};

/** Java LocalDateTime pode chegar como "2026-01-02T18:00:00" ou [2026,1,2,18,0]. */
function toDay(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value as number[];
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}

function nomesRel(rel: unknown): string[] {
  if (!Array.isArray(rel)) return [];
  return rel
    .map((r) => (typeof r === "string" ? r : r?.name))
    .filter((n): n is string => Boolean(n));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapJavaVaga(jv: any): Vaga {
  const offerType = OFFER_MAP[jv?.offerType] ?? "PROCEDIMENTO_CONCURSAL_COMUM";
  const hasPc = Boolean(jv?.hasPc);
  const hasAc = Boolean(jv?.hasAc);
  const hasEac = Boolean(jv?.hasEac);
  const state = (["PUBLISHED", "RUNNING", "FINISHED", "CANCELLED", "DESERT"].includes(jv?.state)
    ? jv.state
    : "PUBLISHED") as JobState;
  const salario = Number(jv?.salary ?? 0);
  const remuneration = salario
    ? `${salario.toFixed(2)} €${jv?.salaryInfo ? ` — ${jv.salaryInfo}` : ""}`
    : jv?.salaryInfo || "—";
  const vaga: Vaga = {
    id: `java-${jv?.id}`,
    javaId: jv?.id,
    ref: jv?.vagaCode || `BEP-${jv?.id}`,
    title: jv?.name || "Procedimento",
    offerType,
    state,
    department: nomesRel(jv?.departments).join(", ") || "IPMA",
    location: nomesRel(jv?.workLocations).join(", ") || "—",
    positions: jv?.noOfRecruitment ?? 1,
    career: jv?.jobPosition || "",
    bond: jv?.vinculo || "",
    regime: jv?.regime || "",
    remuneration,
    educationLevel: jv?.nivelHabilitacional || jv?.descricaoHabilitacao || "",
    requirements: jv?.requirements || jv?.otherRequirements || "",
    description: jv?.websiteDescription || jv?.procedureDescription || "",
    selectionMethods: [
      ...(hasPc ? ["Prova de conhecimentos"] : []),
      ...(hasAc ? ["Análise curricular"] : []),
      ...(hasEac ? ["Entrevista de avaliação de competências"] : []),
    ],
    juryPresident: jv?.juriPresidente?.name || "",
    juryMembers: [
      jv?.juriVogalEfetivo1?.name,
      jv?.juriVogalEfetivo2?.name,
      jv?.juriVogalSuplente1?.name,
      jv?.juriVogalSuplente2?.name,
    ].filter(Boolean),
    bepCode: jv?.vagaCode || "",
    publishedAt: toDay(jv?.publishDate) ?? toDay(jv?.publicationDate),
    deadline: toDay(jv?.deadlineDate) ?? "2999-12-31",
    stages: newStagesFor(offerType, { hasEac, activeIndex: 0 }),
    allowNoDegree: Boolean(jv?.allowNoDegree),
    hasPc,
    hasAc,
    hasEac,
  };
  if (jv?.salaryPlus) vaga.salaryPlus = `${Number(jv.salaryPlus).toFixed(2)} €`;
  return vaga;
}

/** Lista as vagas publicadas no servidor; devolve null quando não responde. */
export async function listJavaVagas(base: string): Promise<Vaga[] | null> {
  try {
    const res = await javaFetch(base, "/api/public/jobs");
    if (!res.ok) return null;
    const list = (await res.json()) as unknown[];
    return Array.isArray(list) ? list.map(mapJavaVaga) : null;
  } catch {
    return null;
  }
}

// ============= Candidatura pública (POST /api/public/jobs/{id}/apply) =============

export async function applyJava(
  base: string,
  jobId: number,
  formData: FormData,
): Promise<{ ok: boolean; message: string; applicantId?: number }> {
  try {
    const res = await javaFetch(base, `/api/public/jobs/${jobId}/apply`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const applicant = (await res.json().catch(() => null)) as { id?: number } | null;
      return {
        ok: true,
        message: "Candidatura registada no servidor de recrutamento.",
        ...(applicant?.id != null ? { applicantId: applicant.id } : {}),
      };
    }
    let message = `O servidor de recrutamento recusou a candidatura (erro ${res.status}).`;
    try {
      const err = (await res.json()) as { message?: string };
      if (err?.message) message = String(err.message);
    } catch {
      /* ignore */
    }
    return { ok: false, message };
  } catch {
    return { ok: false, message: "Servidor de recrutamento indisponível." };
  }
}
