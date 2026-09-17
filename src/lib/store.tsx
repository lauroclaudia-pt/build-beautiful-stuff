import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DOCUMENTS,
  SEED_APPLICANTS,
  SEED_VAGAS,
  newStagesFor,
  STAGE_LABEL,
  type Applicant,
  type ApplicantState,
  type CandidateDocument,
  type DocState,
  type Vaga,
  type VagaRegistro,
} from "./recrutamento";
import { SEED_PESSOAS, type Pessoa, type Responsabilidade, type Role } from "./pessoas";
import { DEFAULT_SITE, type SiteConfig } from "./site";
import {
  SEED_OPCOES,
  opcoesAtivas,
  type OptionCategory,
  type OptionValue,
} from "./opcoes";

const STORAGE_KEY = "ipma-recrutamento-v5";

interface Data {
  vagas: Vaga[];
  applicants: Applicant[];
  pessoas: Pessoa[];
  sessionId: string | null;
  site: SiteConfig;
  opcoes: OptionValue[];
}

interface StoreValue extends Data {
  hydrated: boolean;
  currentUser: Pessoa | null;
  addVaga: (vaga: Omit<Vaga, "id" | "stages" | "state" | "publishedAt">) => Vaga;
  updateVaga: (id: string, patch: Partial<Vaga>) => void;
  publishVaga: (id: string) => { ok: boolean; message: string };
  advanceStage: (id: string) => void;
  addApplicant: (a: Omit<Applicant, "id" | "state" | "createdAt">) => Applicant;
  setApplicantState: (id: string, state: ApplicantState, reason?: string) => void;
  setGrades: (id: string, grades: Pick<Applicant, "pcGrade" | "acGrade" | "eacGrade">) => void;
  setTriagem: (id: string, triagem: TriagemCriterios) => void;
  addAppeal: (id: string, text: string) => void;
  setDocumentState: (applicantId: string, docId: string, state: DocState) => void;
  login: (email: string, password: string) => { ok: boolean; message: string; pessoa?: Pessoa };
  /** Define a sessão ativa para uma pessoa existente (ex.: login no servidor de recrutamento). */
  setSession: (pessoaId: string) => void;
  /** Insere vagas sincronizadas do servidor de recrutamento (ignora as que já existem). */
  syncJavaVagas: (incoming: Vaga[]) => number;
  logout: () => void;
  addPessoa: (p: Omit<Pessoa, "id">) => Pessoa;
  updatePessoa: (id: string, patch: Partial<Pessoa>) => void;
  addResponsabilidade: (pessoaId: string, r: Omit<Responsabilidade, "id">) => void;
  removeResponsabilidade: (pessoaId: string, respId: string) => void;
  updateSite: (patch: Partial<SiteConfig>) => void;
  resetSite: () => void;
  addOpcao: (o: Omit<OptionValue, "id">) => void;
  updateOpcao: (id: string, patch: Partial<Omit<OptionValue, "id">>) => void;
  removeOpcao: (id: string) => void;
  opcoesDe: (category: OptionCategory) => string[];
  concludeScreening: (vagaId: string) => { ok: boolean; message: string };
  /** Acrescenta um registo ao procedimento (notificação enviada ou observação manual). */
  addVagaRegistro: (vagaId: string, reg: Omit<VagaRegistro, "id" | "createdAt">) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function seed(): Data {
  return {
    vagas: SEED_VAGAS,
    applicants: SEED_APPLICANTS.map((a) => ({
      ...a,
      documents: a.documents ?? DEFAULT_DOCUMENTS.map((d) => ({ ...d })),
    })),
    pessoas: SEED_PESSOAS,
    sessionId: null,
    site: { ...DEFAULT_SITE },
    opcoes: SEED_OPCOES.map((o) => ({ ...o })),
  };
}

function load(): Data {
  const base = seed();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Data>;
      return {
        vagas: parsed.vagas ?? base.vagas,
        applicants: (parsed.applicants ?? base.applicants).map((a) => ({
          ...a,
          documents: a.documents ?? DEFAULT_DOCUMENTS.map((d) => ({ ...d })),
        })),
        pessoas: parsed.pessoas ?? base.pessoas,
        sessionId: parsed.sessionId ?? null,
        site: { ...DEFAULT_SITE, ...(parsed.site ?? {}) },
        opcoes: parsed.opcoes?.length ? parsed.opcoes : base.opcoes,
      };
    }
  } catch {
    /* ignore */
  }
  return base;
}

export type { CandidateDocument };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const addVaga: StoreValue["addVaga"] = useCallback((input) => {
    const vaga: Vaga = {
      ...input,
      id: crypto.randomUUID(),
      state: "DRAFT",
      publishedAt: null,
      stages: newStagesFor(input.offerType, { hasEac: input.hasEac ?? true, activeIndex: 0 }),
    };
    setData((d) => ({ ...d, vagas: [vaga, ...d.vagas] }));
    return vaga;
  }, []);

  const updateVaga: StoreValue["updateVaga"] = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      vagas: d.vagas.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  }, []);

  const publishVaga: StoreValue["publishVaga"] = useCallback((id) => {
    let result = { ok: true, message: "Vaga publicada no portal público." };
    const hoje = new Date().toISOString().slice(0, 10);
    setData((d) => ({
      ...d,
      vagas: d.vagas.map((v) => {
        if (v.id !== id) return v;
        if (!v.bepCode || !v.juryPresident) {
          result = {
            ok: false,
            message: "Para publicar é obrigatório preencher o código BEP/Edital e o presidente do júri.",
          };
          return v;
        }
        const stages = newStagesFor(v.offerType, { hasEac: v.hasEac ?? true, activeIndex: 1 }).map(
          (s, i) =>
            i === 0
              ? { ...s, startedAt: hoje, endedAt: hoje }
              : i === 1
                ? { ...s, startedAt: hoje }
                : s,
        );
        return {
          ...v,
          state: "PUBLISHED" as const,
          publishedAt: hoje,
          stages,
        };
      }),
    }));
    return result;
  }, []);

  const advanceStage: StoreValue["advanceStage"] = useCallback((id) => {
    const hoje = new Date().toISOString().slice(0, 10);
    setData((d) => ({
      ...d,
      vagas: d.vagas.map((v) => {
        if (v.id !== id) return v;
        const idx = v.stages.findIndex((s) => s.state === "active");
        if (idx === -1 || idx === v.stages.length - 1) {
          return {
            ...v,
            state: "FINISHED" as const,
            stages: v.stages.map((s) =>
              s.state === "active"
                ? { ...s, state: "completed" as const, endedAt: hoje }
                : { ...s, state: "completed" as const },
            ),
          };
        }
        const stages = v.stages.map((s, i) =>
          i === idx
            ? { ...s, state: "completed" as const, endedAt: hoje }
            : i === idx + 1
              ? { ...s, state: "active" as const, startedAt: hoje }
              : s,
        );
        return { ...v, state: "RUNNING" as const, stages };
      }),
    }));
  }, []);

  const addApplicant: StoreValue["addApplicant"] = useCallback((input) => {
    const applicant: Applicant = {
      ...input,
      id: crypto.randomUUID(),
      state: "SUBMITTED",
      createdAt: new Date().toISOString().slice(0, 10),
      documents: input.documents ?? DEFAULT_DOCUMENTS.map((d) => ({ ...d })),
    };
    setData((d) => {
      const known = d.pessoas.some(
        (p) => p.email.toLowerCase() === applicant.email.toLowerCase(),
      );
      const pessoas = known
        ? d.pessoas
        : [
            ...d.pessoas,
            {
              id: crypto.randomUUID(),
              name: applicant.name,
              email: applicant.email,
              phone: applicant.phone,
              nif: applicant.nif,
              hasLogin: true,
              password: "ipma",
              responsabilidades: [
                {
                  id: crypto.randomUUID(),
                  role: "CANDIDATO" as Role,
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: null,
                },
              ],
            } satisfies Pessoa,
          ];
      return { ...d, applicants: [applicant, ...d.applicants], pessoas };
    });
    return applicant;
  }, []);

  const setApplicantState: StoreValue["setApplicantState"] = useCallback((id, state, reason) => {
    setData((d) => ({
      ...d,
      applicants: d.applicants.map((a) =>
        a.id === id ? { ...a, state, ...(reason ?? a.exclusionReason ? { exclusionReason: (reason ?? a.exclusionReason)! } : {}) } : a,
      ),
    }));
  }, []);

  const setGrades: StoreValue["setGrades"] = useCallback((id, grades) => {
    setData((d) => ({
      ...d,
      applicants: d.applicants.map((a) => (a.id === id ? { ...a, ...grades } : a)),
    }));
  }, []);

  const setTriagem: StoreValue["setTriagem"] = useCallback((id, triagem) => {
    setData((d) => ({
      ...d,
      applicants: d.applicants.map((a) => (a.id === id ? { ...a, triagem } : a)),
    }));
  }, []);



  const addAppeal: StoreValue["addAppeal"] = useCallback((id, text) => {
    setData((d) => ({
      ...d,
      applicants: d.applicants.map((a) =>
        a.id === id
          ? {
              ...a,
              state: "UNDER_APPEAL" as ApplicantState,
              appeal: { text, createdAt: new Date().toISOString().slice(0, 10) },
            }
          : a,
      ),
    }));
  }, []);

  const setDocumentState: StoreValue["setDocumentState"] = useCallback(
    (applicantId, docId, state) => {
      setData((d) => ({
        ...d,
        applicants: d.applicants.map((a) =>
          a.id === applicantId
            ? {
                ...a,
                documents: (a.documents ?? DEFAULT_DOCUMENTS).map((doc) =>
                  doc.id === docId ? { ...doc, state } : doc,
                ),
              }
            : a,
        ),
      }));
    },
    [],
  );

  const login: StoreValue["login"] = useCallback(
    (email, password) => {
      const pessoa = data.pessoas.find(
        (p) => p.email.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (!pessoa) return { ok: false, message: "Não existe nenhum utilizador com esse email." };
      if (!pessoa.hasLogin || !pessoa.password)
        return { ok: false, message: "Esta pessoa não tem login ativo." };
      if (pessoa.password !== password)
        return { ok: false, message: "Palavra-passe incorreta." };
      setData((d) => ({ ...d, sessionId: pessoa.id }));
      return { ok: true, message: `Bem-vindo(a), ${pessoa.name}.`, pessoa };
    },
    [data.pessoas],
  );

  const logout = useCallback(() => setData((d) => ({ ...d, sessionId: null })), []);

  const setSession: StoreValue["setSession"] = useCallback((pessoaId) => {
    setData((d) => ({ ...d, sessionId: pessoaId }));
  }, []);

  const syncJavaVagas: StoreValue["syncJavaVagas"] = useCallback((incoming) => {
    let added = 0;
    setData((d) => {
      const known = new Set(d.vagas.flatMap((v) => (v.javaId != null ? [v.javaId] : [])));
      const novos = incoming.filter((v) => v.javaId != null && !known.has(v.javaId));
      if (!novos.length) return d;
      added = novos.length;
      return { ...d, vagas: [...novos, ...d.vagas] };
    });
    return added;
  }, []);

  const addVagaRegistro: StoreValue["addVagaRegistro"] = useCallback((vagaId, reg) => {
    setData((d) => ({
      ...d,
      vagas: d.vagas.map((v) =>
        v.id === vagaId
          ? {
              ...v,
              registros: [
                ...(v.registros ?? []),
                { ...reg, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
              ],
            }
          : v,
      ),
    }));
  }, []);

  const addPessoa: StoreValue["addPessoa"] = useCallback((input) => {
    const pessoa: Pessoa = { ...input, id: crypto.randomUUID() };
    setData((d) => ({ ...d, pessoas: [...d.pessoas, pessoa] }));
    return pessoa;
  }, []);

  const updatePessoa: StoreValue["updatePessoa"] = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      pessoas: d.pessoas.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const addResponsabilidade: StoreValue["addResponsabilidade"] = useCallback((pessoaId, r) => {
    setData((d) => ({
      ...d,
      pessoas: d.pessoas.map((p) =>
        p.id === pessoaId
          ? { ...p, responsabilidades: [...p.responsabilidades, { ...r, id: crypto.randomUUID() }] }
          : p,
      ),
    }));
  }, []);

  const removeResponsabilidade: StoreValue["removeResponsabilidade"] = useCallback(
    (pessoaId, respId) => {
      setData((d) => ({
        ...d,
        pessoas: d.pessoas.map((p) =>
          p.id === pessoaId
            ? { ...p, responsabilidades: p.responsabilidades.filter((r) => r.id !== respId) }
            : p,
        ),
      }));
    },
    [],
  );

  const updateSite: StoreValue["updateSite"] = useCallback((patch) => {
    setData((d) => ({ ...d, site: { ...d.site, ...patch } }));
  }, []);

  const resetSite = useCallback(() => {
    setData((d) => ({ ...d, site: { ...DEFAULT_SITE } }));
  }, []);

  const addOpcao: StoreValue["addOpcao"] = useCallback((o) => {
    setData((d) => ({ ...d, opcoes: [...d.opcoes, { ...o, id: crypto.randomUUID() }] }));
  }, []);

  const updateOpcao: StoreValue["updateOpcao"] = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      opcoes: d.opcoes.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  }, []);

  const removeOpcao: StoreValue["removeOpcao"] = useCallback((id) => {
    // Remover não elimina: fixa a data e hora de fim, passando o valor a inativo.
    const agora = new Date();
    setData((d) => ({
      ...d,
      opcoes: d.opcoes.map((o) =>
        o.id === id
          ? { ...o, endedAt: agora.toISOString(), endDate: agora.toISOString().slice(0, 10) }
          : o,
      ),
    }));
  }, []);

  const opcoesDe: StoreValue["opcoesDe"] = useCallback(
    (category) => opcoesAtivas(data.opcoes, category),
    [data.opcoes],
  );

  /**
   * Conclui a triagem provisória: se existirem candidatos excluídos segue para a
   * recolha de requisitos em falta, caso contrário avança diretamente para a avaliação.
   */
  const concludeScreening: StoreValue["concludeScreening"] = useCallback((vagaId) => {
    let result = { ok: true, message: "Triagem provisória concluída." };
    setData((d) => {
      const excluidos = d.applicants.some((a) => a.vagaId === vagaId && a.state === "EXCLUDED");
      return {
        ...d,
        vagas: d.vagas.map((v) => {
          if (v.id !== vagaId) return v;
          const idx = v.stages.findIndex((s) => s.code === "ADMISSION");
          if (idx === -1) {
            result = { ok: false, message: "Esta vaga não tem etapa de triagem." };
            return v;
          }
          const proximo = excluidos ? "MISSING_REQUIREMENTS" : "EVALUATION";
          const alvo = v.stages.findIndex((s) => s.code === proximo);
          const destino = alvo === -1 ? Math.min(idx + 1, v.stages.length - 1) : alvo;
          result = {
            ok: true,
            message: excluidos
              ? "Triagem concluída — segue para recolha de requisitos em falta."
              : "Triagem concluída — segue para avaliação.",
          };
          return {
            ...v,
            state: "RUNNING" as const,
            stages: v.stages.map((s, i) => ({
              ...s,
              state:
                i < destino
                  ? ("completed" as const)
                  : i === destino
                    ? ("active" as const)
                    : ("draft" as const),
            })),
          };
        }),
      };
    });
    return result;
  }, []);

  const reset = useCallback(() => {
    setData(seed());
  }, []);

  const currentUser = useMemo(
    () => data.pessoas.find((p) => p.id === data.sessionId) ?? null,
    [data.pessoas, data.sessionId],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      currentUser,
      addVaga,
      updateVaga,
      publishVaga,
      advanceStage,
      addApplicant,
      setApplicantState,
      setGrades,
      addAppeal,
      setDocumentState,
      login,
      logout,
      setSession,
      syncJavaVagas,
      addPessoa,
      updatePessoa,
      addResponsabilidade,
      removeResponsabilidade,
      updateSite,
      resetSite,
      addOpcao,
      updateOpcao,
      removeOpcao,
      opcoesDe,
      concludeScreening,
      addVagaRegistro,
      reset,
    }),
    [
      data,
      hydrated,
      currentUser,
      addVaga,
      updateVaga,
      publishVaga,
      advanceStage,
      addApplicant,
      setApplicantState,
      setGrades,
      addAppeal,
      setDocumentState,
      login,
      logout,
      setSession,
      syncJavaVagas,
      addPessoa,
      updatePessoa,
      addResponsabilidade,
      removeResponsabilidade,
      updateSite,
      resetSite,
      addOpcao,
      updateOpcao,
      removeOpcao,
      opcoesDe,
      concludeScreening,
      addVagaRegistro,
      reset,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore tem de ser usado dentro de StoreProvider");
  return ctx;
}

export function finalGrade(a: Applicant): number | null {
  const parts = [a.pcGrade, a.acGrade, a.eacGrade].filter(
    (n): n is number => typeof n === "number",
  );
  if (!parts.length) return null;
  return Math.round((parts.reduce((s, n) => s + n, 0) / parts.length) * 100) / 100;
}
