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
  SEED_APPLICANTS,
  SEED_VAGAS,
  newStages,
  type Applicant,
  type ApplicantState,
  type Vaga,
} from "./recrutamento";

const STORAGE_KEY = "ipma-recrutamento-v1";

interface Data {
  vagas: Vaga[];
  applicants: Applicant[];
}

interface StoreValue extends Data {
  hydrated: boolean;
  addVaga: (vaga: Omit<Vaga, "id" | "stages" | "state" | "publishedAt">) => Vaga;
  updateVaga: (id: string, patch: Partial<Vaga>) => void;
  publishVaga: (id: string) => { ok: boolean; message: string };
  advanceStage: (id: string) => void;
  addApplicant: (a: Omit<Applicant, "id" | "state" | "createdAt">) => Applicant;
  setApplicantState: (id: string, state: ApplicantState, reason?: string) => void;
  setGrades: (id: string, grades: Pick<Applicant, "pcGrade" | "acGrade" | "eacGrade">) => void;
  addAppeal: (id: string, text: string) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function load(): Data {
  if (typeof window === "undefined") return { vagas: SEED_VAGAS, applicants: SEED_APPLICANTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Data;
  } catch {
    /* ignore */
  }
  return { vagas: SEED_VAGAS, applicants: SEED_APPLICANTS };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>({ vagas: SEED_VAGAS, applicants: SEED_APPLICANTS });
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
      stages: newStages(0),
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
        return {
          ...v,
          state: "PUBLISHED",
          publishedAt: new Date().toISOString().slice(0, 10),
          stages: newStages(1),
        };
      }),
    }));
    return result;
  }, []);

  const advanceStage: StoreValue["advanceStage"] = useCallback((id) => {
    setData((d) => ({
      ...d,
      vagas: d.vagas.map((v) => {
        if (v.id !== id) return v;
        const idx = v.stages.findIndex((s) => s.state === "active");
        if (idx === -1 || idx === v.stages.length - 1) {
          return {
            ...v,
            state: "FINISHED",
            stages: v.stages.map((s) => ({ ...s, state: "completed" as const })),
          };
        }
        const stages = v.stages.map((s, i) =>
          i === idx
            ? { ...s, state: "completed" as const }
            : i === idx + 1
              ? { ...s, state: "active" as const }
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
    };
    setData((d) => ({ ...d, applicants: [applicant, ...d.applicants] }));
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

  const reset = useCallback(() => {
    setData({ vagas: SEED_VAGAS, applicants: SEED_APPLICANTS });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      addVaga,
      updateVaga,
      publishVaga,
      advanceStage,
      addApplicant,
      setApplicantState,
      setGrades,
      addAppeal,
      reset,
    }),
    [
      data,
      hydrated,
      addVaga,
      updateVaga,
      publishVaga,
      advanceStage,
      addApplicant,
      setApplicantState,
      setGrades,
      addAppeal,
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
