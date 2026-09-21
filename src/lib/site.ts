import type { StageCode } from "./recrutamento";
import { DEFAULT_JAVA_API_URL } from "./java-api";

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
  /** Endereço do servidor de recrutamento (backend Java). */
  apiUrl: string;
  showTypeFilter: boolean;
  showDepartmentFilter: boolean;
  showCareerFilter: boolean;
  showLocationFilter: boolean;
  /** Mostrar o cartão «Síntese do procedimento» no website público. */
  showSummaryPublic: boolean;
  /** Mostrar o cartão «Síntese do procedimento» aos candidatos autenticados. */
  showSummaryCandidate: boolean;
  /** Perguntas frequentes apresentadas na página de apoio. */
  faq: FaqItem[];
  /** Contactos apresentados na página pública. */
  contacts: ContactItem[];
  /** Notificações por email enviadas aos candidatos em cada fase. */
  emailTemplates: EmailTemplate[];
  /** Documentos (atas) a gerar em cada fase. */
  docTemplates: DocTemplate[];
  /** Configuração da caixa de correio remetente dos emails da aplicação. */
  emailConfig: EmailConfig;
}

/** Configuração do remetente e do servidor de saída (SMTP) dos emails da aplicação. */
export interface EmailConfig {
  /** Nome a apresentar na caixa de entrada do destinatário. */
  fromName: string;
  /** Endereço de correio do remetente (caixa de correio). */
  fromEmail: string;
  /** Servidor de saída (SMTP), por exemplo smtp.ipma.pt. */
  smtpHost?: string;
  /** Porta do servidor de saída (25, 465 ou 587). */
  smtpPort?: string;
  /** Utilizador da caixa de correio. */
  smtpUser?: string;
  /** Palavra-passe da caixa de correio. */
  smtpPassword?: string;
  /** Domínio de envio configurado (ex.: noreply-rh.ipma.pt). */
  sendingDomain?: string;
  /** Verificação do domínio concluída junto do servidor de correio. */
  domainVerified?: boolean;
  /** Data e hora da última verificação com sucesso. */
  verifiedAt?: string | null;
}


/** Estado de um documento/valor com janela de validade por datas. */
export function docEstado(
  startDate?: string | null,
  endDate?: string | null,
): "ATIVO" | "INATIVO" {
  const hoje = new Date().toISOString().slice(0, 10);
  if (!startDate || startDate > hoje) return "INATIVO";
  return !endDate || endDate > hoje ? "ATIVO" : "INATIVO";
}

/** Modelo de email associado a uma fase do procedimento. */
export interface EmailTemplate {
  id: string;
  stage: StageCode;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
}

/** Modelo de documento (ata) associado a uma fase do procedimento. */
export interface DocTemplate {
  id: string;
  stage: StageCode;
  name: string;
  fileName: string;
  body: string;
  enabled: boolean;
  /** Data de início de validade (estado ativo quando início ≤ hoje e fim nula ou futura). */
  startDate?: string;
  /** Data de fim de validade; nula enquanto o documento estiver em vigor. */
  endDate?: string | null;
}

/** Campos substituíveis nos modelos. */
export const TEMPLATE_FIELDS = [
  "{{candidato}}",
  "{{email}}",
  "{{procedimento}}",
  "{{referencia}}",
  "{{fase}}",
  "{{prazo}}",
  "{{classificacao}}",
  "{{motivo}}",
  "{{data}}",
] as const;

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "mail-opening",
    stage: "OPENING",
    name: "Publicação do procedimento",
    subject: "Novo procedimento concursal: {{procedimento}}",
    body:
      "Caro(a) {{candidato}},\n\nFoi publicado o procedimento {{procedimento}} (ref. {{referencia}}). As candidaturas são aceites até {{prazo}}.\n\nCom os melhores cumprimentos,\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-applications",
    stage: "APPLICATIONS",
    name: "Confirmação de candidatura",
    subject: "Candidatura recebida — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nConfirmamos a receção da sua candidatura ao procedimento {{procedimento}} (ref. {{referencia}}) em {{data}}.\n\nCom os melhores cumprimentos,\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-admission",
    stage: "ADMISSION",
    name: "Lista provisória de admitidos e excluídos",
    subject: "Resultado da triagem — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nInformamos que, na lista provisória do procedimento {{procedimento}}, a sua candidatura foi apreciada pelo júri.\n{{motivo}}\n\nPode consultar o estado da candidatura no portal do candidato.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-missing",
    stage: "MISSING_REQUIREMENTS",
    name: "Recolha de requisitos em falta",
    subject: "Elementos em falta na sua candidatura — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nA sua candidatura ao procedimento {{procedimento}} encontra-se incompleta. Deve juntar os elementos em falta até {{prazo}}, através do portal do candidato.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-evaluation",
    stage: "EVALUATION",
    name: "Convocatória para os métodos de seleção",
    subject: "Métodos de seleção — {{procedimento}}",
    body:
      "Caro(a) {{candidato}},\n\nFoi convocado(a) para os métodos de seleção do procedimento {{procedimento}} (ref. {{referencia}}), a realizar em {{data}}.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-interview",
    stage: "INTERVIEW",
    name: "Convocatória para entrevista",
    subject: "Entrevista de avaliação de competências — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nFoi convocado(a) para a entrevista de avaliação de competências do procedimento {{procedimento}}, em {{data}}.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-appeal",
    stage: "APPEAL",
    name: "Audiência de interessados",
    subject: "Audiência de interessados — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nNos termos legais, dispõe do prazo até {{prazo}} para se pronunciar sobre a exclusão da sua candidatura ao procedimento {{procedimento}}.\nMotivo: {{motivo}}\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-contract",
    stage: "CONTRACT",
    name: "Classificação final e contratação",
    subject: "Classificação final — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nA sua classificação final no procedimento {{procedimento}} foi de {{classificacao}} valores. Será contactado(a) para os trâmites de contratação.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-mobility",
    stage: "MOBILITY",
    name: "Acordo de mobilidade",
    subject: "Acordo de mobilidade — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nInformamos que foi selecionado(a) para o acordo de mobilidade relativo a {{procedimento}}. Aguardamos a anuência do serviço de origem.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
  {
    id: "mail-appointment",
    stage: "APPOINTMENT",
    name: "Nomeação / designação",
    subject: "Nomeação — {{referencia}}",
    body:
      "Caro(a) {{candidato}},\n\nInformamos que foi designado(a) no âmbito do procedimento {{procedimento}}, com efeitos a {{data}}.\n\nIPMA, I.P. — Recursos Humanos",
    enabled: true,
  },
];

export const DEFAULT_DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "doc-opening",
    stage: "OPENING",
    name: "Ata de abertura do procedimento",
    fileName: "ata-abertura-{{referencia}}.txt",
    body:
      "ATA DE ABERTURA\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nAos {{data}}, reuniu o júri do procedimento supra identificado, tendo deliberado aprovar os métodos de seleção e os respetivos critérios de avaliação.",
    enabled: true,
  },
  {
    id: "doc-admission",
    stage: "ADMISSION",
    name: "Ata da lista provisória de admitidos e excluídos",
    fileName: "ata-lista-provisoria-{{referencia}}.txt",
    body:
      "ATA DA LISTA PROVISÓRIA\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nO júri procedeu à apreciação das candidaturas, elaborando a lista provisória de candidatos admitidos e excluídos, com indicação dos respetivos fundamentos.",
    enabled: true,
  },
  {
    id: "doc-missing",
    stage: "MISSING_REQUIREMENTS",
    name: "Grelha de recolha de requisitos em falta",
    fileName: "grelha-requisitos-{{referencia}}.txt",
    body:
      "GRELHA DE REQUISITOS EM FALTA\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nRelação dos candidatos notificados para suprir elementos em falta e prazo concedido: {{prazo}}.",
    enabled: true,
  },
  {
    id: "doc-evaluation",
    stage: "EVALUATION",
    name: "Grelha de avaliação curricular e prova de conhecimentos",
    fileName: "grelha-avaliacao-{{referencia}}.txt",
    body:
      "GRELHA DE AVALIAÇÃO\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nClassificações obtidas pelos candidatos nos métodos de seleção aplicados, na escala de 0 a 20 valores.",
    enabled: true,
  },
  {
    id: "doc-interview",
    stage: "INTERVIEW",
    name: "Grelha da entrevista de avaliação de competências",
    fileName: "grelha-eac-{{referencia}}.txt",
    body:
      "GRELHA DE ENTREVISTA (EAC)\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nParâmetros avaliados e níveis atribuídos a cada candidato entrevistado.",
    enabled: true,
  },
  {
    id: "doc-appeal",
    stage: "APPEAL",
    name: "Ata da audiência de interessados",
    fileName: "ata-audiencia-{{referencia}}.txt",
    body:
      "ATA DA AUDIÊNCIA DE INTERESSADOS\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nO júri apreciou as alegações apresentadas pelos candidatos excluídos e deliberou sobre a manutenção ou revogação das exclusões.",
    enabled: true,
  },
  {
    id: "doc-contract",
    stage: "CONTRACT",
    name: "Ata final de ordenação e contratação",
    fileName: "ata-final-{{referencia}}.txt",
    body:
      "ATA FINAL\n\nProcedimento: {{procedimento}} (ref. {{referencia}})\nData: {{data}}\n\nLista unitária de ordenação final dos candidatos aprovados e proposta de contratação.",
    enabled: true,
  },
];

/** Um registo de pergunta e resposta da página de apoio. */
/** Um contacto apresentado na página pública (designação + valor). */
export interface ContactItem {
  id: string;
  label: string;
  value: string;
}

export const DEFAULT_CONTACTS: ContactItem[] = [
  { id: "ct-1", label: "Divisão", value: "Recursos Humanos" },
  { id: "ct-2", label: "Email", value: "recrutamento@ipma.pt" },
  { id: "ct-3", label: "Horário", value: "9h30 — 17h00" },
];

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
  apiUrl: DEFAULT_JAVA_API_URL,
  showTypeFilter: true,
  showDepartmentFilter: true,
  showCareerFilter: true,
  showLocationFilter: true,
  showSummaryPublic: true,
  showSummaryCandidate: true,
  faq: DEFAULT_FAQ.map((f) => ({ ...f })),
  contacts: DEFAULT_CONTACTS.map((c) => ({ ...c })),
  emailTemplates: DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t })),
  docTemplates: DEFAULT_DOC_TEMPLATES.map((t) => ({ ...t })),
  emailConfig: {
    fromName: "Recrutamento IPMA",
    fromEmail: "recrutamento@ipma.pt",
    sendingDomain: "noreply-rh.ipma.pt",
    domainVerified: false,
    verifiedAt: null,
  },
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
