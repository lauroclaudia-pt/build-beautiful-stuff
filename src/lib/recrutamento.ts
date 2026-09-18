export type OfferType =
  | "PROCEDIMENTO_CONCURSAL_COMUM"
  | "PROCEDIMENTO_CONCURSAL_RESERVA"
  | "SELECAO_INTERNACIONAL"
  | "CARGOS_DIRECAO"
  | "MOBILIDADE_INTERNA"
  | "MOBILIDADE_INTERCARREIRAS"
  | "BOLSA_INVESTIGACAO_CIENTIFICA";

export type JobState = "DRAFT" | "PUBLISHED" | "RUNNING" | "FINISHED" | "CANCELLED" | "DESERT";

export type ApplicantState =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ADMITTED"
  | "EXCLUDED"
  | "UNDER_APPEAL"
  | "APPROVED"
  | "HIRED"
  | "REJECTED"
  | "CANCELLED";

export type StageCode =
  | "OPENING"
  | "APPLICATIONS"
  | "ADMISSION"
  | "MISSING_REQUIREMENTS"
  | "EVALUATION"
  | "INTERVIEW"
  | "APPEAL"
  | "CONTRACT"
  | "MOBILITY"
  | "APPOINTMENT";

export type StageState = "draft" | "active" | "completed" | "skipped" | "cancelled";

export interface JobStage {
  code: StageCode;
  state: StageState;
  /** Data de início da fase (registada automaticamente). */
  startedAt?: string;
  /** Data de conclusão da fase (registada automaticamente). */
  endedAt?: string;
}

export type RegistroTipo = "FASE" | "NOTIFICACAO" | "OBSERVACAO";

export interface VagaRegistro {
  id: string;
  tipo: RegistroTipo;
  /** Fase do pipeline a que o registo se refere, quando aplicável. */
  stage?: StageCode;
  texto: string;
  /** Data/hora ISO do registo. */
  createdAt: string;
}

/** Notificação por email efetivamente enviada a um candidato, com o texto final. */
export interface Notificacao {
  id: string;
  vagaId: string;
  /** Candidato destinatário; nulo quando a notificação é geral do procedimento. */
  applicantId: string | null;
  /** Nome do destinatário apresentado nas listas. */
  destinatario: string;
  email: string;
  /** Fase do procedimento que originou a notificação. */
  stage: StageCode;
  /** Nome do modelo de notificação utilizado. */
  nome: string;
  assunto: string;
  /** Texto final enviado, já com os campos substituídos. */
  texto: string;
  /** Data/hora ISO do envio. */
  sentAt: string;
}

export interface Vaga {
  id: string;
  /** Identificador no servidor de recrutamento (backend Java), quando sincronizado. */
  javaId?: number;
  ref: string;
  title: string;
  offerType: OfferType;
  state: JobState;
  department: string;
  location: string;
  positions: number;
  career: string;
  bond: string;
  regime: string;
  remuneration: string;
  educationLevel: string;
  requirements: string;
  description: string;
  selectionMethods: string[];
  juryPresident: string;
  juryMembers: string[];
  bepCode: string;
  publishedAt: string | null;
  deadline: string;
  stages: JobStage[];
  /** Admite candidatos sem a habilitação exigida (allow_no_degree). */
  allowNoDegree?: boolean;
  /** Postos reservados a candidatos com deficiência (quota). */
  vagasDeficiencia?: number;
  /** Ativação condicional dos métodos de avaliação. */
  hasPc?: boolean;
  hasAc?: boolean;
  hasEac?: boolean;
  /** Suplemento remuneratório / informação adicional. */
  salaryPlus?: string;
  /** Registos e observações do procedimento (fases, notificações, notas manuais). */
  registros?: VagaRegistro[];
}

export type DocState = "PENDING" | "RECEIVED" | "VALIDATED" | "MISSING";

export const DOC_STATE_LABEL: Record<DocState, string> = {
  PENDING: "Por entregar",
  RECEIVED: "Entregue",
  VALIDATED: "Validado",
  MISSING: "Em falta",
};

export interface DocumentUpload {
  name: string;
  description?: string;
}

export interface CandidateDocument {
  id: string;
  label: string;
  state: DocState;
  note?: string;
  /** Ficheiros entregues para este documento (pode ser mais do que um). */
  uploads?: DocumentUpload[];
}

export const DEFAULT_DOCUMENTS: CandidateDocument[] = [
  { id: "cv", label: "Curriculum vitae", state: "RECEIVED" },
  { id: "habilit", label: "Certificado de habilitações", state: "PENDING" },
  { id: "bi", label: "Documento de identificação", state: "RECEIVED" },
  { id: "decservico", label: "Declaração da entidade empregadora", state: "PENDING" },
];

export interface Applicant {
  id: string;
  vagaId: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  education: string;
  professionalSituation: string;
  motivation: string;
  state: ApplicantState;
  exclusionReason?: string;
  pcGrade?: number | null;
  acGrade?: number | null;
  eacGrade?: number | null;
  createdAt: string;
  appeal?: { text: string; createdAt: string; channel?: AppealChannel } | null;
  documents?: CandidateDocument[];
  /** Data de nascimento (validação de maioridade). */
  birthDate?: string;
  /** Candidato com deficiência (quota) — exige declaração de incapacidade. */
  deficiencia?: boolean;
  /** Candidato abrangido pelo Regime Jurídico do Emprego Público (RJEP). */
  rjep?: boolean;
  /** Condições especiais para a realização dos métodos de seleção. */
  specialConditions?: string;
  /** Declaração de veracidade das informações prestadas. */
  truthDeclaration?: boolean;
  /** Anexos entregues no momento da candidatura. */
  attachments?: string[];
  /** Resultado da triagem por critério. */
  triagem?: TriagemCriterios;
}

/** Critérios booleanos verificados na triagem da candidatura. */
export interface TriagemCriterios {
  habilitacao: boolean | null;
  vinculo: boolean | null;
  documentos: boolean | null;
  experiencia: boolean | null;
  motivo?: string;
}

export const TRIAGEM_CRITERIOS: { key: keyof Omit<TriagemCriterios, "motivo">; label: string }[] = [
  { key: "habilitacao", label: "Habilitação" },
  { key: "vinculo", label: "Vínculo" },
  { key: "documentos", label: "Documentos" },
  { key: "experiencia", label: "Experiência" },
];

export const EMPTY_TRIAGEM: TriagemCriterios = {
  habilitacao: null,
  vinculo: null,
  documentos: null,
  experiencia: null,
  motivo: "",
};

export type AppealChannel = "PORTAL" | "EMAIL" | "FISICO" | "SEM_RESPOSTA";


export const APPEAL_CHANNEL_LABEL: Record<AppealChannel, string> = {
  PORTAL: "Portal",
  EMAIL: "Email",
  FISICO: "Físico",
  SEM_RESPOSTA: "Não respondeu",
};

export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  PROCEDIMENTO_CONCURSAL_COMUM: "Procedimento concursal comum",
  PROCEDIMENTO_CONCURSAL_RESERVA: "Procedimento concursal — reserva",
  SELECAO_INTERNACIONAL: "Seleção internacional",
  CARGOS_DIRECAO: "Cargos de direção",
  MOBILIDADE_INTERNA: "Mobilidade interna",
  MOBILIDADE_INTERCARREIRAS: "Mobilidade intercarreiras",
  BOLSA_INVESTIGACAO_CIENTIFICA: "Bolsa de investigação científica",
};

export const JOB_STATE_LABEL: Record<JobState, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  RUNNING: "Em curso",
  FINISHED: "Concluída",
  CANCELLED: "Cancelada",
  DESERT: "Deserta",
};

export const APPLICANT_STATE_LABEL: Record<ApplicantState, string> = {
  SUBMITTED: "Submetida",
  UNDER_REVIEW: "Em análise",
  ADMITTED: "Admitido",
  EXCLUDED: "Excluído",
  UNDER_APPEAL: "Em audiência",
  APPROVED: "Aprovado",
  HIRED: "Contratado",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelada",
};

export const STAGE_LABEL: Record<StageCode, string> = {
  OPENING: "Abertura",
  APPLICATIONS: "Candidaturas",
  ADMISSION: "Triagem provisória",
  MISSING_REQUIREMENTS: "Requisitos em falta",
  EVALUATION: "Avaliação",
  INTERVIEW: "Entrevista (EAC)",
  APPEAL: "Audiência de interessados",
  CONTRACT: "Contratação",
  MOBILITY: "Acordo de mobilidade",
  APPOINTMENT: "Nomeação / designação",
};

export const DEPARTMENTS = [
  "Divisão de Meteorologia",
  "Divisão de Oceanografia",
  "Divisão de Clima e Alterações Climáticas",
  "Divisão de Recursos Humanos",
  "Departamento do Mar e Recursos Marinhos",
  "Departamento de Sismologia e Geofísica",
];

export const LOCATIONS = [
  "Lisboa — Sede",
  "Porto",
  "Coimbra",
  "Faro",
  "Funchal",
  "Ponta Delgada",
  "Olhão",
];

export const EDUCATION_LEVELS = [
  "12.º ano",
  "Licenciatura",
  "Mestrado",
  "Doutoramento",
];

export const BONDS = ["Contrato de trabalho em funções públicas", "Comissão de serviço", "Bolsa"];
export const REGIMES = ["Tempo inteiro", "Tempo parcial"];
export const SELECTION_METHODS = ["Prova de Conhecimentos (PC)", "Avaliação Curricular (AC)", "Entrevista de Avaliação de Competências (EAC)"];

export const CAREERS = [
  "Técnico Superior",
  "Assistente Técnico",
  "Assistente Operacional",
  "Informático",
  "Bolseiro de investigação",
  "Dirigente intermédio",
];

export const DEFAULT_STAGES: StageCode[] = [
  "OPENING",
  "APPLICATIONS",
  "ADMISSION",
  "EVALUATION",
  "INTERVIEW",
  "CONTRACT",
];

/** Modelos de fluxo por tipo de oferta (WorkflowTemplate). */
export const WORKFLOW_TEMPLATES: Record<OfferType, StageCode[]> = {
  PROCEDIMENTO_CONCURSAL_COMUM: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "MISSING_REQUIREMENTS",
    "EVALUATION",
    "INTERVIEW",
    "APPEAL",
    "CONTRACT",
  ],
  PROCEDIMENTO_CONCURSAL_RESERVA: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "MISSING_REQUIREMENTS",
    "EVALUATION",
    "INTERVIEW",
    "APPEAL",
    "CONTRACT",
  ],
  SELECAO_INTERNACIONAL: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "MISSING_REQUIREMENTS",
    "EVALUATION",
    "INTERVIEW",
    "APPEAL",
    "CONTRACT",
  ],
  CARGOS_DIRECAO: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "EVALUATION",
    "INTERVIEW",
    "APPOINTMENT",
  ],
  MOBILIDADE_INTERNA: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "EVALUATION",
    "INTERVIEW",
    "APPEAL",
    "MOBILITY",
  ],
  MOBILIDADE_INTERCARREIRAS: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "EVALUATION",
    "INTERVIEW",
    "APPEAL",
    "MOBILITY",
  ],
  BOLSA_INVESTIGACAO_CIENTIFICA: [
    "OPENING",
    "APPLICATIONS",
    "ADMISSION",
    "EVALUATION",
    "INTERVIEW",
    "APPEAL",
    "CONTRACT",
  ],
};

export function newStages(activeIndex = 0): JobStage[] {
  return DEFAULT_STAGES.map((code, i) => ({
    code,
    state: i < activeIndex ? "completed" : i === activeIndex ? "active" : "draft",
  }));
}

/**
 * Cria o pipeline de uma vaga a partir do modelo do tipo de oferta.
 * A entrevista só entra quando a vaga tem EAC; a recolha de requisitos em falta
 * fica sempre presente mas só é ativada quando existirem candidatos excluídos.
 */
export function newStagesFor(
  offerType: OfferType,
  opts: { hasEac?: boolean; activeIndex?: number } = {},
): JobStage[] {
  const { hasEac = true, activeIndex = 0 } = opts;
  const codes = (WORKFLOW_TEMPLATES[offerType] ?? DEFAULT_STAGES).filter(
    (c) => c !== "INTERVIEW" || hasEac,
  );
  return codes.map((code, i) => ({
    code,
    state: i < activeIndex ? "completed" : i === activeIndex ? "active" : "draft",
  }));
}

/** Validação do NIF português (algoritmo do módulo 11). */
export function validateNif(nif: string): boolean {
  const n = nif.replace(/\D/g, "");
  if (n.length !== 9) return false;
  if (!"125689".includes(n[0]!)) return false;
  let soma = 0;
  for (let i = 0; i < 8; i += 1) soma += Number(n[i]) * (9 - i);
  const resto = soma % 11;
  const check = resto < 2 ? 0 : 11 - resto;
  return check === Number(n[8]);
}

/** Idade em anos completos à data de hoje. */
export function ageFrom(birthISO: string): number {
  const b = new Date(birthISO);
  if (Number.isNaN(b.getTime())) return -1;
  const hoje = new Date();
  let a = hoje.getFullYear() - b.getFullYear();
  const m = hoje.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < b.getDate())) a -= 1;
  return a;
}

export function daysUntil(dateISO: string): number {
  const diff = new Date(dateISO).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function formatDate(dateISO: string | null): string {
  if (!dateISO) return "—";
  return new Date(dateISO).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function iso(offsetDays: number) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export const SEED_VAGAS: Vaga[] = [
  {
    id: "v1",
    ref: "014/2026",
    title: "Técnico Superior — Oceanografia Costeira",
    offerType: "PROCEDIMENTO_CONCURSAL_COMUM",
    state: "PUBLISHED",
    department: "Divisão de Oceanografia",
    location: "Funchal",
    positions: 2,
    career: "Técnico Superior",
    bond: "Contrato de trabalho em funções públicas",
    regime: "Tempo inteiro",
    remuneration: "1 333,35 € — 2.ª posição remuneratória",
    educationLevel: "Licenciatura",
    requirements:
      "Licenciatura em Oceanografia, Biologia Marinha ou áreas afins; experiência em aquisição e tratamento de dados marinhos.",
    description:
      "Recolha, validação e análise de dados oceanográficos costeiros, apoio à operação de boias e à produção de boletins do estado do mar.",
    selectionMethods: ["Prova de Conhecimentos (PC)", "Avaliação Curricular (AC)"],
    juryPresident: "Dr.ª Helena Marques",
    juryMembers: ["Eng.º Pedro Salgado", "Dr.ª Inês Carvalho"],
    bepCode: "OE202602/0114",
    publishedAt: iso(-10),
    deadline: iso(12),
    stages: newStages(1),
  },
  {
    id: "v2",
    ref: "021/2026",
    title: "Engenheiro de Sistemas de Previsão",
    offerType: "MOBILIDADE_INTERNA",
    state: "RUNNING",
    department: "Divisão de Meteorologia",
    location: "Lisboa — Sede",
    positions: 1,
    career: "Técnico Superior",
    bond: "Contrato de trabalho em funções públicas",
    regime: "Tempo inteiro",
    remuneration: "1 613,42 €",
    educationLevel: "Mestrado",
    requirements:
      "Mestrado em Engenharia Informática, Física ou Meteorologia; experiência com modelos numéricos de previsão e Linux/HPC.",
    description:
      "Operação e evolução da cadeia de modelação numérica de previsão do tempo, automatização de processos e monitorização de produtos.",
    selectionMethods: ["Avaliação Curricular (AC)", "Entrevista de Avaliação de Competências (EAC)"],
    juryPresident: "Eng.º Rui Belo",
    juryMembers: ["Dr.ª Sofia Neves", "Eng.º Tiago Pinto"],
    bepCode: "OE202602/0121",
    publishedAt: iso(-25),
    deadline: iso(5),
    stages: newStages(3),
  },
  {
    id: "v3",
    ref: "009/2026",
    title: "Técnico de Observação Climática",
    offerType: "PROCEDIMENTO_CONCURSAL_RESERVA",
    state: "PUBLISHED",
    department: "Divisão de Clima e Alterações Climáticas",
    location: "Porto",
    positions: 3,
    career: "Assistente Técnico",
    bond: "Contrato de trabalho em funções públicas",
    regime: "Tempo inteiro",
    remuneration: "930,98 €",
    educationLevel: "12.º ano",
    requirements:
      "12.º ano de escolaridade; disponibilidade para trabalho por turnos em estações de observação.",
    description:
      "Observação e registo de parâmetros climáticos, manutenção de primeiro nível da rede de estações automáticas.",
    selectionMethods: ["Prova de Conhecimentos (PC)", "Entrevista de Avaliação de Competências (EAC)"],
    juryPresident: "Dr. Manuel Freitas",
    juryMembers: ["Dr.ª Ana Rocha", "Eng.º Nuno Lima"],
    bepCode: "OE202602/0109",
    publishedAt: iso(-4),
    deadline: iso(23),
    stages: newStages(1),
  },
  {
    id: "v4",
    ref: "027/2026",
    title: "Bolsa de Investigação — Dinâmica Atmosférica",
    offerType: "BOLSA_INVESTIGACAO_CIENTIFICA",
    state: "PUBLISHED",
    department: "Divisão de Meteorologia",
    location: "Lisboa — Sede",
    positions: 1,
    career: "Bolseiro de investigação",
    bond: "Bolsa",
    regime: "Tempo inteiro",
    remuneration: "1 259,64 € (bolsa de doutoramento)",
    educationLevel: "Mestrado",
    requirements: "Mestrado em Ciências Atmosféricas, Física ou Matemática Aplicada.",
    description:
      "Investigação em dinâmica atmosférica de mesoescala aplicada a eventos extremos no território continental.",
    selectionMethods: ["Avaliação Curricular (AC)"],
    juryPresident: "Prof.ª Doutora Clara Antunes",
    juryMembers: ["Doutor Jorge Vasques", "Doutora Marta Pires"],
    bepCode: "OE202602/0127",
    publishedAt: iso(-2),
    deadline: iso(30),
    stages: newStages(1),
  },
  {
    id: "v5",
    ref: "031/2026",
    title: "Especialista em Análise de Vento",
    offerType: "PROCEDIMENTO_CONCURSAL_COMUM",
    state: "DRAFT",
    department: "Divisão de Meteorologia",
    location: "Coimbra",
    positions: 1,
    career: "Técnico Superior",
    bond: "Contrato de trabalho em funções públicas",
    regime: "Tempo inteiro",
    remuneration: "1 333,35 €",
    educationLevel: "Licenciatura",
    requirements: "Licenciatura em Engenharia do Ambiente ou Meteorologia.",
    description: "Análise de regimes de vento e apoio a estudos de energia eólica.",
    selectionMethods: ["Avaliação Curricular (AC)"],
    juryPresident: "",
    juryMembers: [],
    bepCode: "",
    publishedAt: null,
    deadline: iso(45),
    stages: newStages(0),
  },
  {
    id: "v6",
    ref: "004/2026",
    title: "Técnico Superior de Sismologia",
    offerType: "PROCEDIMENTO_CONCURSAL_COMUM",
    state: "FINISHED",
    department: "Divisão de Sismologia",
    location: "Lisboa — Sede",
    positions: 1,
    career: "Técnico Superior",
    bond: "Contrato de trabalho em funções públicas",
    regime: "Tempo inteiro",
    remuneration: "1 333,35 €",
    educationLevel: "Licenciatura",
    requirements: "Licenciatura em Geofísica, Física ou Engenharia Geológica.",
    description:
      "Análise de registos sismográficos da rede nacional e elaboração de boletins de sismicidade.",
    selectionMethods: ["Prova de Conhecimentos (PC)", "Avaliação Curricular (AC)"],
    juryPresident: "Doutor Paulo Mendes",
    juryMembers: ["Doutora Inês Carvalho", "Eng.ª Sara Pinto"],
    bepCode: "OE202601/0004",
    publishedAt: iso(-120),
    deadline: iso(-90),
    stages: newStages(7),
  },
  {
    id: "v7",
    ref: "012/2026",
    title: "Assistente Técnico de Apoio Administrativo",
    offerType: "PROCEDIMENTO_CONCURSAL_COMUM",
    state: "CANCELLED",
    department: "Divisão de Recursos Humanos",
    location: "Lisboa — Sede",
    positions: 2,
    career: "Assistente Técnico",
    bond: "Contrato de trabalho em funções públicas",
    regime: "Tempo inteiro",
    remuneration: "930,98 €",
    educationLevel: "12.º ano",
    requirements: "12.º ano de escolaridade e experiência em gestão documental.",
    description: "Apoio administrativo aos procedimentos concursais e à gestão de processos individuais.",
    selectionMethods: ["Avaliação Curricular (AC)"],
    juryPresident: "Dr.ª Helena Marques",
    juryMembers: ["Dr. Rui Belo"],
    bepCode: "OE202601/0012",
    publishedAt: iso(-60),
    deadline: iso(-30),
    stages: newStages(2),
  },
  {
    id: "v8",
    ref: "035/2026",
    title: "Coordenador de Mobilidade Interna — Rede de Estações",
    offerType: "MOBILIDADE_INTERNA",
    state: "RUNNING",
    department: "Divisão de Infraestruturas de Observação",
    location: "Faro",
    positions: 1,
    career: "Técnico Superior",
    bond: "Mobilidade na categoria",
    regime: "Tempo inteiro",
    remuneration: "Remuneração de origem",
    educationLevel: "Licenciatura",
    requirements: "Vínculo de emprego público por tempo indeterminado e experiência em manutenção de redes de observação.",
    description: "Coordenação da manutenção da rede de estações meteorológicas automáticas do sul do país.",
    selectionMethods: ["Avaliação Curricular (AC)", "Entrevista de Avaliação de Competências (EAC)"],
    juryPresident: "Eng.º Nuno Lima",
    juryMembers: ["Dr.ª Ana Rocha"],
    bepCode: "OE202603/0035",
    publishedAt: iso(-15),
    deadline: iso(-1),
    stages: newStages(3),
  },
];

export const SEED_APPLICANTS: Applicant[] = [
  {
    id: "a1",
    vagaId: "v1",
    name: "Marta Costa",
    email: "marta.costa@exemplo.pt",
    phone: "912 345 678",
    nif: "234567890",
    education: "Mestrado",
    professionalSituation: "Trabalhador por conta de outrem",
    motivation: "Experiência de 6 anos em monitorização costeira.",
    state: "ADMITTED",
    pcGrade: 16.5,
    acGrade: 17,
    eacGrade: null,
    createdAt: iso(-8),
  },
  {
    id: "a2",
    vagaId: "v1",
    name: "João Ribeiro",
    email: "joao.ribeiro@exemplo.pt",
    phone: "934 111 222",
    nif: "198765432",
    education: "Licenciatura",
    professionalSituation: "Desempregado",
    motivation: "Recém-licenciado em Biologia Marinha.",
    state: "UNDER_REVIEW",
    pcGrade: 13,
    acGrade: null,
    eacGrade: null,
    createdAt: iso(-6),
  },
  {
    id: "a3",
    vagaId: "v1",
    name: "Ana Sousa",
    email: "ana.sousa@exemplo.pt",
    phone: "962 000 111",
    nif: "176543219",
    education: "12.º ano",
    professionalSituation: "Trabalhador independente",
    motivation: "Interesse na área do mar.",
    state: "EXCLUDED",
    exclusionReason: "Não cumpre o nível habilitacional exigido (Licenciatura).",
    createdAt: iso(-5),
  },
  {
    id: "a4",
    vagaId: "v2",
    name: "Diogo Tavares",
    email: "diogo.tavares@exemplo.pt",
    phone: "917 555 444",
    nif: "212345678",
    education: "Mestrado",
    professionalSituation: "Trabalhador em funções públicas",
    motivation: "Trabalho atualmente com modelos WRF e AROME.",
    state: "APPROVED",
    pcGrade: null,
    acGrade: 18,
    eacGrade: 17.5,
    createdAt: iso(-20),
  },
  {
    id: "a5",
    vagaId: "v2",
    name: "Rute Almeida",
    email: "rute.almeida@exemplo.pt",
    phone: "969 888 777",
    nif: "223344556",
    education: "Doutoramento",
    professionalSituation: "Trabalhador por conta de outrem",
    motivation: "Investigação em previsão numérica de alta resolução.",
    state: "UNDER_APPEAL",
    exclusionReason: "Documento comprovativo de habilitações em falta.",
    appeal: { text: "Junto anexo o certificado de doutoramento emitido pela FCUL.", createdAt: iso(-3) },
    createdAt: iso(-19),
  },
  {
    id: "a6",
    vagaId: "v3",
    name: "Bruno Silva",
    email: "bruno.silva@exemplo.pt",
    phone: "911 222 333",
    nif: "245566778",
    education: "12.º ano",
    professionalSituation: "Desempregado",
    motivation: "Disponibilidade total para turnos.",
    state: "SUBMITTED",
    createdAt: iso(-1),
  },
  {
    id: "a7",
    vagaId: "v6",
    name: "Carla Nogueira",
    email: "carla.nogueira@exemplo.pt",
    phone: "913 404 505",
    nif: "231122334",
    education: "Mestrado",
    professionalSituation: "Trabalhador por conta de outrem",
    motivation: "Experiência em análise de registos sismográficos.",
    state: "HIRED",
    pcGrade: 17,
    acGrade: 16.5,
    eacGrade: null,
    createdAt: iso(-115),
  },
  {
    id: "a8",
    vagaId: "v6",
    name: "Pedro Matias",
    email: "pedro.matias@exemplo.pt",
    phone: "925 303 202",
    nif: "239988776",
    education: "Licenciatura",
    professionalSituation: "Desempregado",
    motivation: "Licenciado em Geofísica com estágio no observatório.",
    state: "REJECTED",
    exclusionReason: "Classificação final inferior à do candidato ordenado em primeiro lugar.",
    pcGrade: 12,
    acGrade: 13,
    eacGrade: null,
    createdAt: iso(-113),
  },
  {
    id: "a9",
    vagaId: "v8",
    name: "Sónia Freitas",
    email: "sonia.freitas@exemplo.pt",
    phone: "961 717 818",
    nif: "247788990",
    education: "Licenciatura",
    professionalSituation: "Trabalhador em funções públicas",
    motivation: "Dez anos de manutenção da rede de estações do Algarve.",
    state: "ADMITTED",
    acGrade: 15,
    eacGrade: null,
    createdAt: iso(-12),
  },
  {
    id: "a10",
    vagaId: "v4",
    name: "Tiago Lourenço",
    email: "tiago.lourenco@exemplo.pt",
    phone: "934 909 101",
    nif: "254433221",
    education: "Mestrado",
    professionalSituation: "Estudante",
    motivation: "Mestrado em Física da Atmosfera, com tese em eventos extremos.",
    state: "SUBMITTED",
    createdAt: iso(-1),
  },
];

