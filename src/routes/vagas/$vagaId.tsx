import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PublicJobStateBadge } from "@/components/shell";
import { useStore } from "@/lib/store";
import { isOpcaoAtiva } from "@/lib/opcoes";
import {
  OFFER_TYPE_LABEL,
  ageFrom,
  daysUntil,
  formatDate,
  validateNif,
} from "@/lib/recrutamento";
import { applyJava, javaBase } from "@/lib/java-api";
import { enviarConfirmacaoCandidatura } from "@/lib/emails.functions";
import { FilePickButton, UploadList, type UploadItem } from "@/components/file-upload";
import { DEFAULT_DOCUMENTS } from "@/lib/recrutamento";
import { Req } from "@/components/req";

/** Imagem de partilha (logótipo IPMA) em URL absoluto para as redes sociais. */
const SHARE_IMAGE =
  "https://build-beautiful-stuff.lovable.app/__l5e/assets-v1/b1fae16c-1590-4152-b801-f6e780a55676/logo-ipma.png";

export const Route = createFileRoute("/vagas/$vagaId")({
  head: () => ({
    meta: [
      { title: "Detalhe da vaga — Recrutamento IPMA" },
      {
        name: "description",
        content:
          "Consulte os requisitos, métodos de seleção, júri e prazo do procedimento e submeta a sua candidatura ao IPMA, I.P.",
      },
      { property: "og:title", content: "Detalhe da vaga — Recrutamento IPMA" },
      {
        property: "og:description",
        content: "Requisitos, métodos de seleção e candidatura a procedimentos do IPMA, I.P.",
      },
      { property: "og:type", content: "article" },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
  }),
  component: VagaDetalhe,
});

const SITUACOES_ATUAIS = [
  "Em exercício de funções",
  "Em licença",
  "Ao abrigo do Regime de Valorização Profissional, aprovado pela Lei n.º 25/2017, de 30 de maio",
];

const METODOS_PRETENDIDOS = ["Avaliação Curricular (AC)", "Prova de Conhecimentos (PC)"];

const emptyForm = {
  // Secção A
  name: "",
  birthDate: "",
  gender: "",
  nationality: "",
  idNumber: "",
  nif: "",
  address: "",
  postalCode: "",
  locality: "",
  district: "",
  municipality: "",
  email: "",
  phone: "",
  mobile: "",
  // Secção B
  education: "",
  postgradInfo: "",
  professionalTraining: "",
  otherTraining: "",
  rjep: false,
  publicEmploymentType: "",
  careerCategory: "",
  salaryPosition: "",
  employmentSituation: "",
  lastEmployer: "",
  lastActivity: "",
  performanceEvaluation: "",
  motivation: "",
  otherExperience: "",
  alternativeQualification: "",
  professionalSituation: "",
  // Secção C
  selectionMethodsWanted: [] as string[],
  // Secção D
  deficiencia: false,
  disabilityDegree: "",
  disabilityType: "",
  specialConditions: "",
  // Secção E
  truthDeclaration: false,
  mobDeclaration: false,
  grantDeclaration: false,
};

function VagaDetalhe() {
  const { vagaId } = Route.useParams();
  const navigate = useNavigate();
  const { vagas, applicants, addApplicant, hydrated, opcoes, opcoesDe, site, currentUser } =
    useStore();
  // Cartão «Síntese do procedimento»: visibilidade separada para público e candidatos autenticados.
  const mostrarSintese = currentUser
    ? site.showSummaryCandidate !== false
    : site.showSummaryPublic !== false;
  const habilitacoes = opcoesDe("HABILITACAO");
  const nacionalidades = opcoesDe("NACIONALIDADE");
  const vinculosLista = opcoesDe("VINCULO");
  const distritosOpc = opcoes.filter((o) => o.category === "DISTRITO" && isOpcaoAtiva(o));
  const concelhosOpc = opcoes.filter((o) => o.category === "CONCELHO" && isOpcaoAtiva(o));
  const situacoes = opcoesDe("SITUACAO_PROFISSIONAL");
  const vaga = vagas.find((v) => v.id === vagaId);
  const vinculos = Array.from(new Set([vaga?.bond, ...vinculosLista].filter(Boolean) as string[]));
  const [form, setForm] = useState(emptyForm);
  const [docFiles, setDocFiles] = useState<Record<string, UploadItem[]>>({});
  const [declaracaoIncap, setDeclaracaoIncap] = useState<File | null>(null);

  function addDocFiles(docId: string, files: File[]) {
    setDocFiles((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] ?? []), ...files.map((file) => ({ file, description: "" }))],
    }));
    setErrors((e) => ({ ...e, [`doc:${docId}`]: "" }));
  }
  function setDocFileDesc(docId: string, index: number, description: string) {
    setDocFiles((prev) => ({
      ...prev,
      [docId]: (prev[docId] ?? []).map((it, i) => (i === index ? { ...it, description } : it)),
    }));
  }
  function removeDocFile(docId: string, index: number) {
    setDocFiles((prev) => ({
      ...prev,
      [docId]: (prev[docId] ?? []).filter((_, i) => i !== index),
    }));
  }
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  // Pré-preenchimento: reutiliza os dados da última candidatura do candidato autenticado.
  const [prefilled, setPrefilled] = useState(false);
  const emailSessao = currentUser?.email?.toLowerCase() ?? "";
  const anterior = useMemo(() => {
    if (!emailSessao) return null;
    const meus = applicants
      .filter((a) => (a.email ?? "").toLowerCase() === emailSessao)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return meus[0] ?? null;
  }, [applicants, emailSessao]);

  useEffect(() => {
    if (prefilled || !anterior) return;
    setPrefilled(true);
    setForm((f) => ({
      ...f,
      name: anterior.name ?? f.name,
      birthDate: anterior.birthDate ?? f.birthDate,
      gender: anterior.gender ?? f.gender,
      nationality: anterior.nationality ?? f.nationality,
      idNumber: anterior.idNumber ?? f.idNumber,
      nif: anterior.nif ?? f.nif,
      address: anterior.address ?? f.address,
      postalCode: anterior.postalCode ?? f.postalCode,
      locality: anterior.locality ?? f.locality,
      district: anterior.district ?? f.district,
      municipality: anterior.municipality ?? f.municipality,
      email: anterior.email ?? f.email,
      phone: anterior.phone ?? f.phone,
      mobile: anterior.mobile ?? f.mobile,
      education: anterior.education ?? f.education,
      postgradInfo: anterior.postgradInfo ?? f.postgradInfo,
      professionalTraining: anterior.professionalTraining ?? f.professionalTraining,
      otherTraining: anterior.otherTraining ?? f.otherTraining,
      publicEmploymentType: anterior.publicEmploymentType ?? f.publicEmploymentType,
      careerCategory: anterior.careerCategory ?? f.careerCategory,
      salaryPosition: anterior.salaryPosition ?? f.salaryPosition,
      rjep: anterior.rjep ?? f.rjep,
      employmentSituation: anterior.employmentSituation ?? f.employmentSituation,
      lastEmployer: anterior.lastEmployer ?? f.lastEmployer,
      lastActivity: anterior.lastActivity ?? f.lastActivity,
      performanceEvaluation: anterior.performanceEvaluation ?? f.performanceEvaluation,
      motivation: anterior.motivation ?? f.motivation,
      otherExperience: anterior.otherExperience ?? f.otherExperience,
      alternativeQualification: anterior.alternativeQualification ?? f.alternativeQualification,
      professionalSituation: anterior.professionalSituation ?? f.professionalSituation,
      deficiencia: anterior.deficiencia ?? f.deficiencia,
      specialConditions: anterior.specialConditions ?? f.specialConditions,
    }));
  }, [anterior, prefilled]);

  if (!vaga) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Vaga não encontrada</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {hydrated ? "Este procedimento já não está disponível." : "A carregar…"}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
          >
            Voltar às vagas
          </Link>
        </main>
      </PageShell>
    );
  }

  const dias = daysUntil(vaga.deadline);
  const encerrado = dias <= 0 || vaga.state === "FINISHED" || vaga.state === "CANCELLED";
  const ehConcursal =
    vaga.offerType === "PROCEDIMENTO_CONCURSAL_COMUM" ||
    vaga.offerType === "PROCEDIMENTO_CONCURSAL_RESERVA";
  const ehMobilidade =
    vaga.offerType === "MOBILIDADE_INTERNA" || vaga.offerType === "MOBILIDADE_INTERCARREIRAS";
  const ehBolsa = vaga.offerType === "BOLSA_INVESTIGACAO_CIENTIFICA";
  const mostraDeficiencia = vaga.disabilityQuota === true || (vaga.vagasDeficiencia ?? 0) > 0;

  function set<K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const nif = form.nif.replace(/\s/g, "");
    if (!form.name.trim() || form.name.trim().length > 120) err["name"] = "Indique o nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) err["email"] = "Email inválido.";
    if (form.mobile.replace(/\D/g, "").length < 9) err["mobile"] = "Telemóvel inválido.";
    if (!form.gender) err["gender"] = "Indique o sexo.";
    if (!form.nationality) err["nationality"] = "Indique a nacionalidade.";
    if (!form.idNumber.trim()) err["idNumber"] = "Indique o número de identificação civil.";
    if (!form.address.trim()) err["address"] = "Indique o endereço postal.";
    if (!/^\d{4}-\d{3}$/.test(form.postalCode.trim()))
      err["postalCode"] = "Código postal no formato 0000-000.";
    if (!form.locality.trim()) err["locality"] = "Indique a localidade.";
    if (!form.district.trim()) err["district"] = "Indique o distrito de residência.";
    if (!form.municipality.trim()) err["municipality"] = "Indique o concelho de residência.";
    if (!form.education.trim()) err["education"] = "Indique o nível habilitacional.";
    if (form.rjep && !form.employmentSituation.trim())
      err["employmentSituation"] = "Descreva a situação de RJEP.";
    if (ehConcursal && form.selectionMethodsWanted.length === 0)
      err["selectionMethodsWanted"] = "Escolha um método de seleção.";
    if (!validateNif(nif)) err["nif"] = "NIF inválido (verificação do dígito de controlo).";
    else if (
      applicants.some((a) => a.vagaId === vaga!.id && a.nif.replace(/\s/g, "") === nif)
    )
      err["nif"] = "Já existe uma candidatura com este NIF neste procedimento.";
    if (!form.birthDate) err["birthDate"] = "Indique a data de nascimento.";
    else if (ageFrom(form.birthDate) < 18) err["birthDate"] = "É necessário ter 18 anos ou mais.";
    if (form.motivation.trim().length < 20) err["motivation"] = "Escreva pelo menos 20 caracteres.";
    if (form.motivation.length > 1500) err["motivation"] = "Máximo de 1500 caracteres.";
    for (const d of DEFAULT_DOCUMENTS) {
      if (!d.optional && (docFiles[d.id] ?? []).length === 0)
        err[`doc:${d.id}`] = `Anexe pelo menos um ficheiro: ${d.label}.`;
    }
    if (form.deficiencia && !declaracaoIncap)
      err["deficiencia"] = "Anexe o certificado de incapacidade.";
    if (form.deficiencia && form.disabilityDegree !== "") {
      const grau = Number(form.disabilityDegree);
      if (!Number.isFinite(grau) || grau < 0 || grau > 100)
        err["disabilityDegree"] = "O grau de incapacidade tem de estar entre 0% e 100%.";
    }
    if (!ehBolsa && !form.truthDeclaration)
      err["truthDeclaration"] =
        "Não é possível submeter a candidatura sem confirmar a veracidade dos factos.";
    if (ehMobilidade && !form.mobDeclaration)
      err["mobDeclaration"] =
        "Para concorrer tem de manifestar o seu interesse formalmente na mobilidade clicando na declaração.";
    if (ehBolsa && !form.grantDeclaration)
      err["grantDeclaration"] =
        "Não é possível submeter a candidatura sem confirmar a veracidade dos factos.";
    setErrors(err);
    if (Object.keys(err).length) {
      toast.error("Verifique os campos assinalados.");
      return;
    }

    // Procedimentos sincronizados do servidor: submeter também ao backend Java.
    if (vaga!.javaId != null) {
      const fd = new FormData();
      fd.append("partnerName", form.name.trim());
      fd.append("birthDate", form.birthDate);
      fd.append("nationality", form.nationality);
      fd.append("idNumber", form.idNumber.trim());
      fd.append("idNif", nif);
      fd.append("emailFrom", form.email.trim());
      fd.append("partnerPhone", form.phone.trim());
      fd.append("partnerMobile", form.mobile.trim());
      fd.append("address", form.address.trim());
      fd.append("postalCode", form.postalCode.trim());
      fd.append("locality", form.locality.trim());
      fd.append("municipality", form.municipality.trim());
      fd.append("gender", form.gender);
      if (form.education) fd.append("educationCourse", form.education);
      if (form.postgradInfo.trim()) fd.append("postgradInfo", form.postgradInfo.trim());
      if (form.lastEmployer.trim()) fd.append("lastEmployer", form.lastEmployer.trim());
      if (form.lastActivity.trim()) fd.append("lastActivity", form.lastActivity.trim());
      if (form.performanceEvaluation.trim())
        fd.append("performanceEvaluation", form.performanceEvaluation.trim());
      if (form.otherExperience.trim()) fd.append("otherExperience", form.otherExperience.trim());
      if (form.alternativeQualification.trim())
        fd.append("alternativeQualification", form.alternativeQualification.trim());
      if (form.selectionMethodsWanted.length)
        fd.append("selectionMethods", form.selectionMethodsWanted.join(", "));
      if (form.employmentSituation.trim())
        fd.append("employmentSituation", form.employmentSituation.trim());
      fd.append("relevantExperience", form.motivation.trim());
      fd.append("hasDisability", String(form.deficiencia));
      if (form.specialConditions.trim())
        fd.append("specialNeedsDesc", form.specialConditions.trim());
      fd.append("publicEmployment", String(form.rjep));
      fd.append("declarationTrue", "true");
      const cv = docFiles["cv"]?.[0]?.file;
      const habilit = docFiles["habilit"]?.[0]?.file;
      const decservico = docFiles["decservico"]?.[0]?.file;
      if (cv) fd.append("cv", cv, cv.name);
      if (habilit) fd.append("attachment_habilit", habilit, habilit.name);
      if (decservico) fd.append("attachment_decservico", decservico, decservico.name);
      if (declaracaoIncap) fd.append("attachment_disability", declaracaoIncap, declaracaoIncap.name);
      const java = await applyJava(javaBase(site.apiUrl), vaga!.javaId, fd);
      if (!java.ok) {
        toast.error(java.message);
        return;
      }
      toast.success("Candidatura registada no servidor de recrutamento.");
    }

    const a = addApplicant({
      vagaId: vaga!.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      nif,
      birthDate: form.birthDate,
      education: form.education,
      professionalSituation: form.professionalSituation,
      motivation: form.motivation.trim(),
      deficiencia: form.deficiencia,
      rjep: form.rjep,
      specialConditions: form.specialConditions.trim(),
      truthDeclaration: true,
      gender: form.gender,
      nationality: form.nationality,
      idNumber: form.idNumber.trim(),
      address: form.address.trim(),
      postalCode: form.postalCode.trim(),
      locality: form.locality.trim(),
      municipality: form.municipality.trim(),
      district: form.district.trim(),
      mobile: form.mobile.trim(),
      postgradInfo: form.postgradInfo.trim(),
      professionalTraining: form.professionalTraining.trim(),
      otherTraining: form.otherTraining.trim(),
      publicEmploymentType: form.publicEmploymentType.trim(),
      careerCategory: form.careerCategory.trim(),
      salaryPosition: form.salaryPosition.trim(),
      disabilityDegree: form.disabilityDegree === "" ? null : Number(form.disabilityDegree),
      disabilityType: form.disabilityType.trim(),
      employmentSituation: form.employmentSituation.trim(),
      lastEmployer: form.lastEmployer.trim(),
      lastActivity: form.lastActivity.trim(),
      performanceEvaluation: form.performanceEvaluation.trim(),
      otherExperience: form.otherExperience.trim(),
      alternativeQualification: form.alternativeQualification.trim(),
      selectionMethodsWanted: form.selectionMethodsWanted,
      mobDeclaration: form.mobDeclaration,
      grantDeclaration: form.grantDeclaration,
      attachments: [
        ...Object.values(docFiles).flat().map((u) =>
          u.description.trim() ? `${u.file.name} — ${u.description.trim()}` : u.file.name,
        ),
        ...(declaracaoIncap ? [declaracaoIncap.name] : []),
      ],
      documents: DEFAULT_DOCUMENTS.map((d) => {
        const ups = docFiles[d.id] ?? [];
        return {
          ...d,
          state: ups.length > 0 ? ("RECEIVED" as const) : d.state,
          uploads: ups.map((u) => ({
            name: u.file.name,
            description: u.description.trim() || undefined,
          })),
        };
      }),
    });
    setDone(a.id);
    setForm(emptyForm);
    setDocFiles({});
    setDeclaracaoIncap(null);
    toast.success("Candidatura submetida e registada.");
    void enviarConfirmacaoCandidatura({
      data: {
        email: a.email,
        nome: a.name,
        vagaTitulo: vaga!.title,
        referencia: vaga!.ref,
        prazo: vaga!.deadline,
        candidaturaId: a.id,
      },
    }).catch(() => undefined);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <button
          onClick={() => navigate({ to: "/" })}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Todas as vagas
        </button>

        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-6 lg:col-span-8">
            <section className="glass animate-rise rounded-xl p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                  {OFFER_TYPE_LABEL[vaga.offerType]}
                </span>
                <PublicJobStateBadge vaga={vaga} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">{vaga.title}</h1>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Ref. {vaga.ref} · {vaga.department} · {vaga.location} · {vaga.positions}{" "}
                {vaga.positions === 1 ? "posto" : "postos"}
              </p>
              <ShareVaga title={vaga.title} vagaRef={vaga.ref} />
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  ["Prazo", dias > 0 ? `${dias} dias` : "Encerrado"],
                  ["Publicada", formatDate(vaga.publishedAt)],
                  ["Encerra", formatDate(vaga.deadline)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-white/40 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {k}
                    </p>
                    <p className={`mt-1 text-[15px] font-semibold ${k === "Prazo" && dias <= 7 ? "text-warn" : ""}`}>
                      {v}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4 text-[14px] text-pretty">
                <div>
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Caracterização do posto
                  </h2>
                  <p className="mt-2">{vaga.description}</p>
                </div>
                <div>
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Requisitos de admissão
                  </h2>
                  <p className="mt-2">{vaga.requirements}</p>
                </div>
                <div>
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Métodos de seleção
                  </h2>
                  <ul className="mt-2 list-inside list-disc">
                    {vaga.selectionMethods.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="candidatura" className="glass animate-rise rounded-xl p-6 [animation-delay:120ms]">
              <h2 className="text-xl font-semibold tracking-tight">Formulário de candidatura</h2>
              {done ? (
                <div className="mt-4 rounded-lg border border-success/40 bg-success/10 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-success">
                    Candidatura registada
                  </p>
                  <p className="mt-2 text-[14px]">
                    A sua candidatura ao procedimento {vaga.ref} foi submetida com o estado
                    “Submetida”. Guarde o comprovativo n.º{" "}
                    <span className="font-mono">{done.slice(0, 8).toUpperCase()}</span>.
                  </p>
                  <button
                    onClick={() => setDone(null)}
                    className="mt-4 rounded-md border border-border bg-white/60 px-4 py-2 text-[13px] font-medium"
                  >
                    Submeter outra candidatura
                  </button>
                </div>
              ) : encerrado ? (
                <p className="mt-3 rounded-lg border border-border bg-white/40 p-4 text-[14px] text-muted-foreground">
                  O prazo de candidatura deste procedimento está encerrado.
                </p>
              ) : (
                <form onSubmit={submeter} className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SectionTitle>Secção A — Identificação do candidato</SectionTitle>
                  <Field label="Nome completo" req error={errors["name"]}>
                    <input
                      value={form.name}
                      maxLength={120}
                      onChange={(e) => set("name", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Data de nascimento" req error={errors["birthDate"]}>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => set("birthDate", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Sexo" req error={errors["gender"]}>
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      className="input-ipma"
                    >
                      <option value="">Selecione…</option>
                      <option>Masculino</option>
                      <option>Feminino</option>
                    </select>
                  </Field>
                  <Field label="Nacionalidade" req error={errors["nationality"]}>
                    <select
                      value={form.nationality}
                      onChange={(e) => set("nationality", e.target.value)}
                      className="input-ipma"
                    >
                      <option value="">Selecione…</option>
                      {nacionalidades.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="N.º de identificação civil (CC/BI)"
                    req
                    error={errors["idNumber"]}
                  >
                    <input
                      value={form.idNumber}
                      maxLength={20}
                      onChange={(e) => set("idNumber", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="NIF" req error={errors["nif"]}>
                    <input
                      value={form.nif}
                      maxLength={11}
                      onChange={(e) => set("nif", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Endereço postal (rua, n.º, andar)" req error={errors["address"]}>
                      <input
                        value={form.address}
                        maxLength={200}
                        onChange={(e) => set("address", e.target.value)}
                        className="input-ipma"
                      />
                    </Field>
                  </div>
                  <Field label="Código postal" req error={errors["postalCode"]}>
                    <input
                      value={form.postalCode}
                      maxLength={8}
                      placeholder="0000-000"
                      onChange={(e) => set("postalCode", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Localidade" req error={errors["locality"]}>
                    <input
                      value={form.locality}
                      maxLength={80}
                      onChange={(e) => set("locality", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Distrito de residência" req error={errors["district"]}>
                    <select
                      value={form.district}
                      onChange={(e) => {
                        set("district", e.target.value);
                        set("municipality", "");
                      }}
                      className="input-ipma"
                    >
                      <option value="">Selecione…</option>
                      {distritosOpc.map((d) => (
                        <option key={d.id} value={d.label}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Concelho de residência" req error={errors["municipality"]}>
                    <select
                      value={form.municipality}
                      onChange={(e) => set("municipality", e.target.value)}
                      className="input-ipma"
                      disabled={!form.district}
                    >
                      <option value="">
                        {form.district ? "Selecione…" : "Escolha primeiro o distrito"}
                      </option>
                      {concelhosOpc
                        .filter((c) => {
                          const d = distritosOpc.find((x) => x.label === form.district);
                          return d ? c.distritoId === d.id : false;
                        })
                        .map((c) => (
                          <option key={c.id} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Endereço eletrónico (e-mail)" req error={errors["email"]}>
                    <input
                      type="email"
                      value={form.email}
                      maxLength={255}
                      onChange={(e) => set("email", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Telefone" error={errors["phone"]}>
                    <input
                      value={form.phone}
                      maxLength={20}
                      onChange={(e) => set("phone", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Telemóvel" req error={errors["mobile"]}>
                    <input
                      value={form.mobile}
                      maxLength={20}
                      onChange={(e) => set("mobile", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>

                  <SectionTitle>
                    Secção B — Situação do(a) Candidato(a)
                  </SectionTitle>
                  <div className="sm:col-span-2">
                    <Field
                      label="Nível habilitacional (curso e área de formação)"
                      req
                      error={errors["education"]}
                    >
                      <input
                        list="habilitacoes-lista"
                        value={form.education}
                        maxLength={200}
                        onChange={(e) => set("education", e.target.value)}
                        className="input-ipma"
                      />
                      <datalist id="habilitacoes-lista">
                        {habilitacoes.map((l) => (
                          <option key={l} value={l} />
                        ))}
                      </datalist>
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Área de formação académica">
                      <textarea
                        rows={2}
                        value={form.postgradInfo}
                        maxLength={600}
                        onChange={(e) => set("postgradInfo", e.target.value)}
                        className="input-ipma resize-y"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Área de formação profissional">
                      <textarea
                        rows={2}
                        value={form.professionalTraining}
                        maxLength={600}
                        onChange={(e) => set("professionalTraining", e.target.value)}
                        className="input-ipma resize-y"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Outras formações académicas e profissionais relevantes">
                      <textarea
                        rows={2}
                        value={form.otherTraining}
                        maxLength={600}
                        onChange={(e) => set("otherTraining", e.target.value)}
                        className="input-ipma resize-y"
                      />
                    </Field>
                  </div>
                  {vaga.allowNoDegree && (
                    <div className="sm:col-span-2">
                      <Field label="Formação ou experiência profissional substitutiva do nível habilitacional exigido">
                        <textarea
                          rows={2}
                          value={form.alternativeQualification}
                          maxLength={1000}
                          onChange={(e) => set("alternativeQualification", e.target.value)}
                          className="input-ipma resize-y"
                        />
                      </Field>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-[13px] font-medium">
                      Titular de vínculo de emprego público (RJEP)?
                      <Req />
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {[
                        ["Sim", true],
                        ["Não", false],
                      ].map(([rotulo, valor]) => (
                        <label
                          key={String(rotulo)}
                          className="flex items-center gap-2 rounded-lg border border-border bg-white/50 px-4 py-2 text-[13px]"
                        >
                          <input
                            type="radio"
                            name="rjep"
                            checked={form.rjep === valor}
                            onChange={() => set("rjep", valor as boolean)}
                            className="size-4 rounded-full border-border accent-[var(--primary)]"
                          />
                          <span>{rotulo as string}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {form.rjep && (
                    <div className="sm:col-span-2">
                      <Field label="Indique a sua Modalidade de Vínculo de Emprego Público">
                        <select
                          value={form.publicEmploymentType}
                          onChange={(e) => set("publicEmploymentType", e.target.value)}
                          className="input-ipma"
                        >
                          <option value="">Selecione…</option>
                          {vinculos.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}
                  {form.rjep && (
                    <div className="sm:col-span-2">
                      <Field label="Situação de RJEP" req error={errors["employmentSituation"]}>
                        <input
                          list="situacoes-lista"
                          value={form.employmentSituation}
                          maxLength={200}
                          onChange={(e) => set("employmentSituation", e.target.value)}
                          className="input-ipma"
                        />
                        <datalist id="situacoes-lista">
                          {situacoes.map((l) => (
                            <option key={l} value={l} />
                          ))}
                        </datalist>
                      </Field>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Field label="Situação Profissional atual">
                      <select
                        value={form.professionalSituation}
                        onChange={(e) => set("professionalSituation", e.target.value)}
                        className="input-ipma"
                      >
                        <option value="">Selecione…</option>
                        {SITUACOES_ATUAIS.map((sit) => (
                          <option key={sit}>{sit}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Órgão/serviço onde exerce ou por último exerceu funções">
                      <input
                        value={form.lastEmployer}
                        maxLength={500}
                        onChange={(e) => set("lastEmployer", e.target.value)}
                        className="input-ipma"
                      />
                    </Field>
                  </div>
                  <Field label="Carreira e categoria">
                    <input
                      value={form.careerCategory}
                      maxLength={150}
                      onChange={(e) => set("careerCategory", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Posição e nível remuneratórios detidos">
                    <input
                      value={form.salaryPosition}
                      maxLength={150}
                      onChange={(e) => set("salaryPosition", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Atividade exercida ou que, por último, exerceu no órgão ou serviço">
                      <textarea
                        rows={3}
                        value={form.lastActivity}
                        maxLength={1000}
                        onChange={(e) => set("lastActivity", e.target.value)}
                        className="input-ipma resize-y"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Última Avaliação de desempenho">
                      <input
                        value={form.performanceEvaluation}
                        maxLength={200}
                        onChange={(e) => set("performanceEvaluation", e.target.value)}
                        className="input-ipma"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Funções relacionadas com o posto de trabalho a que se candidata"
                      req
                      error={errors["motivation"]}
                    >
                      <textarea
                        rows={5}
                        value={form.motivation}
                        maxLength={1500}
                        onChange={(e) => set("motivation", e.target.value)}
                        className="input-ipma resize-y"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Outras funções e atividades exercidas">
                      <textarea
                        rows={3}
                        value={form.otherExperience}
                        maxLength={1000}
                        onChange={(e) => set("otherExperience", e.target.value)}
                        className="input-ipma resize-y"
                      />
                    </Field>
                  </div>

                  {ehConcursal && (
                    <div className="sm:col-span-2">
                      <SectionTitle>Secção C — Método de seleção</SectionTitle>
                      <p className="text-[12px] text-muted-foreground">
                        Método de seleção pretendido, nos termos do artigo 36.º, n.º 3 da LTFP.
                        <Req />
                      </p>
                      <div className="mt-2 space-y-2">
                        {METODOS_PRETENDIDOS.map((m) => (
                          <label
                            key={m}
                            className="flex items-center gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]"
                          >
                            <input
                              type="radio"
                              name="metodo-selecao"
                              checked={form.selectionMethodsWanted[0] === m}
                              onChange={() => set("selectionMethodsWanted", [m])}
                              className="size-4 rounded-full border-border accent-[var(--primary)]"
                            />
                            <span>{m}</span>
                          </label>
                        ))}
                      </div>
                      {errors["selectionMethodsWanted"] && (
                        <p className="mt-1 text-[11px] text-destructive">
                          {errors["selectionMethodsWanted"]}
                        </p>
                      )}
                    </div>
                  )}

                  {mostraDeficiencia && (
                    <div className="space-y-3 sm:col-span-2">
                      <SectionTitle>Secção D — Necessidades Especiais</SectionTitle>
                      <p className="text-[12px] text-muted-foreground text-pretty">
                        Caso lhe tenha sido reconhecido, legalmente, algum grau de incapacidade,
                        indique o respetivo grau, o tipo de deficiência e se necessita de meios /
                        condições especiais para a realização dos métodos de seleção.
                      </p>
                      <div>
                        <p className="text-[13px] font-medium">Tem algum grau de incapacidade?</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {[
                            ["Sim", true],
                            ["Não", false],
                          ].map(([rotulo, valor]) => (
                            <label
                              key={String(rotulo)}
                              className="flex items-center gap-2 rounded-lg border border-border bg-white/50 px-4 py-2 text-[13px]"
                            >
                              <input
                                type="radio"
                                name="incapacidade"
                                checked={form.deficiencia === valor}
                                onChange={() => set("deficiencia", valor as boolean)}
                                className="size-4 rounded-full border-border accent-[var(--primary)]"
                              />
                              <span>{rotulo as string}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {form.deficiencia && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Grau de incapacidade (%)" error={errors["disabilityDegree"]}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={form.disabilityDegree}
                                onChange={(e) => set("disabilityDegree", e.target.value)}
                                className="input-ipma"
                              />
                            </Field>
                            <Field label="Tipo de Incapacidade">
                              <input
                                value={form.disabilityType}
                                maxLength={200}
                                onChange={(e) => set("disabilityType", e.target.value)}
                                className="input-ipma"
                              />
                            </Field>
                          </div>
                          <Field label="Especifique as condições especiais necessárias para a realização dos métodos de seleção.">
                            <textarea
                              rows={3}
                              value={form.specialConditions}
                              maxLength={1000}
                              onChange={(e) => set("specialConditions", e.target.value)}
                              className="input-ipma resize-y"
                            />
                          </Field>
                          <div className="rounded-lg border border-border bg-white/40 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              Certificado de incapacidade
                              <Req />
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <FilePickButton
                                accept=".pdf,image/*"
                                label="Escolher ficheiro"
                                onPick={(files) => setDeclaracaoIncap(files[0] ?? null)}
                              />
                              {declaracaoIncap && (
                                <span className="font-mono text-[11px] text-success">
                                  {declaracaoIncap.name}
                                </span>
                              )}
                            </div>
                            {errors["deficiencia"] && (
                              <p className="mt-1 text-[11px] text-destructive">
                                {errors["deficiencia"]}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 sm:col-span-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Documentos a anexar — pode juntar vários ficheiros por documento e uma
                      descrição a cada um
                    </p>
                    {DEFAULT_DOCUMENTS.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-lg border border-border bg-white/40 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[13px] font-medium">
                            {d.label}
                            {d.optional ? (
                              <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                (facultativo)
                              </span>
                            ) : (
                              <Req />
                            )}
                          </p>
                          <FilePickButton
                            multiple
                            accept=".pdf,.doc,.docx,image/*"
                            label="Escolher ficheiros"
                            onPick={(files) => addDocFiles(d.id, files)}
                          />
                        </div>
                        <UploadList
                          items={docFiles[d.id] ?? []}
                          onDescription={(i, desc) => setDocFileDesc(d.id, i, desc)}
                          onRemove={(i) => removeDocFile(d.id, i)}
                        />
                        {errors[`doc:${d.id}`] && (
                          <p className="mt-1 text-[11px] text-destructive">
                            {errors[`doc:${d.id}`]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 sm:col-span-2">
                    <SectionTitle>Secção E — Declaração de veracidade</SectionTitle>
                    {!ehBolsa && (
                      <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]">
                        <input
                          type="checkbox"
                          checked={form.truthDeclaration}
                          onChange={(e) => set("truthDeclaration", e.target.checked)}
                          className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
                        />
                        <span>
                          Declaro sob compromisso de honra, que:
                          <br />- reúno os requisitos previstos no artigo 17.º da Lei Geral do
                          Trabalho em Funções Públicas, bem como os constantes no Aviso de Abertura
                          do Procedimento Concursal.
                          <br />- nos termos e para os efeitos do disposto na alínea g), n.º 1 do
                          artigo 13.º da Portaria n.º 233/2022, de 9 de setembro, declaro que são
                          verdadeiras as informações acima prestadas.
                          <Req />
                        </span>
                      </label>
                    )}
                    {!ehBolsa && errors["truthDeclaration"] && (
                      <p className="text-[11px] text-destructive">{errors["truthDeclaration"]}</p>
                    )}
                    {ehMobilidade && (
                      <>
                        <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]">
                          <input
                            type="checkbox"
                            checked={form.mobDeclaration}
                            onChange={(e) => set("mobDeclaration", e.target.checked)}
                            className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
                          />
                          <span>
                            Venho, pelo presente, manifestar o meu interesse em integrar o Instituto
                            Português do Mar e da Atmosfera (IPMA), no âmbito de um processo de
                            mobilidade, entendendo que esta oportunidade representa uma mais-valia
                            para o meu percurso profissional e me permitirá contribuir para os
                            objetivos e missão da instituição.
                            <Req />
                          </span>
                        </label>
                        {errors["mobDeclaration"] && (
                          <p className="text-[11px] text-destructive">{errors["mobDeclaration"]}</p>
                        )}
                      </>
                    )}
                    {ehBolsa && (
                      <>
                        <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]">
                          <input
                            type="checkbox"
                            checked={form.grantDeclaration}
                            onChange={(e) => set("grantDeclaration", e.target.checked)}
                            className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
                          />
                          <span>
                            Declaro, sob compromisso de honra, que reúno e preencho todos os
                            requisitos de admissão ao presente concurso previstos na Lei, em
                            especial no Regulamento de Bolsas de Investigação Científica do IPMA,
                            I.P. e, subsidiariamente, no Regulamento de Bolsas de Investigação da
                            Fundação para a Ciência e a Tecnologia, I.P. (FCT, I.P.), no Estatuto do
                            Bolseiro de Investigação (EBI) e no Aviso de abertura do presente
                            concurso. Declaro que não exerço qualquer atividade profissional ou de
                            prestação de serviços que viole o dever de dedicação exclusiva. Declaro
                            ter pleno conhecimento de que, sem prejuízo do disposto na lei penal, a
                            prestação de falsas declarações sobre matérias relevantes para a
                            concessão ou renovação da bolsa, nos termos do artigo 25.º do
                            Regulamento de Bolsas de Investigação da FCT, I.P., implica o
                            cancelamento da respetiva bolsa.
                            <Req />
                          </span>
                        </label>
                        {errors["grantDeclaration"] && (
                          <p className="text-[11px] text-destructive">
                            {errors["grantDeclaration"]}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 sm:col-span-2">
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground ring-1 ring-black/5 transition-colors hover:bg-primary/90"
                    >
                      Submeter candidatura
                    </button>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Os dados são tratados pela Divisão de Recursos Humanos do IPMA, I.P.
                    </p>
                  </div>
                </form>
              )}
            </section>
          </div>

          {mostrarSintese && (
          <aside className="col-span-12 lg:col-span-4">
            <div className="glass sticky top-24 animate-rise rounded-xl p-5 [animation-delay:200ms]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Síntese do procedimento
              </p>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ["Código BEP / n.º Edital", vaga.bepCode || "—"],
                  ["Vínculo", vaga.bond],
                  ["Regime", vaga.regime],
                  ["Carreira / Categoria", vaga.career],
                  ["Remuneração", vaga.remuneration],
                  ["Suplemento mensal", vaga.monthlySupplement || "—"],
                  ["Habilitação mínima", vaga.educationLevel],
                  ["Admissão sem habilitação exigida", vaga.allowNoDegree ? "Sim" : "Não"],
                  ["Vagas para candidatos com deficiência", vaga.disabilityQuota ? "Sim" : "Não"],
                  ["Presidente do júri", vaga.juryPresident || "—"],
                  ["1.º Vogal Efetivo", vaga.juryVogal1 || "—"],
                  ["2.º Vogal Efetivo", vaga.juryVogal2 || "—"],
                  ["1.º Vogal Suplente", vaga.jurySuplente1 || "—"],
                  ["2.º Vogal Suplente", vaga.jurySuplente2 || "—"],
                  ["N.º Aviso / Edital", vaga.noticeNumber || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-right font-medium">{v}</span>
                  </div>
                ))}
              </div>
              {([
                ["Características da remuneração", vaga.remunerationNotes],
                ["Descrição da habilitação literária", vaga.educationDescription],
                ["Lista de consulta de legislação/documentos para a prova de conhecimentos", vaga.knowledgeReadings],
                ["Texto do aviso / edital", vaga.procedureDescription],
              ] as const)
                .filter(([, v]) => Boolean(v && v.trim()))
                .map(([k, v]) => (
                  <div key={k} className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {k}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px]">{v}</p>
                  </div>
                ))}
            </div>
          </aside>
          )}
        </div>
      </main>
    </PageShell>
  );
}

/** Botões de partilha da vaga pública nas redes sociais (imagem: logótipo IPMA). */
function ShareVaga({ title, vagaRef }: { title: string; vagaRef: string }) {
  const share = (network: "facebook" | "linkedin" | "instagram") => {
    const url = window.location.href;
    const text = `${title} — Ref. ${vagaRef} · Recrutamento IPMA`;
    if (network === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,width=640,height=580",
      );
    } else if (network === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,width=640,height=580",
      );
    } else {
      // O Instagram não tem partilha por link: copia-se o endereço para colar na publicação/story.
      const payload = `${text}\n${url}`;
      const fallbackCopy = () => {
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("copy failed");
      };
      void (async () => {
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(payload);
          else fallbackCopy();
          toast.success("Ligação copiada — cole-a no Instagram.");
        } catch {
          try {
            fallbackCopy();
            toast.success("Ligação copiada — cole-a no Instagram.");
          } catch {
            toast.error("Não foi possível copiar a ligação.");
          }
        }
      })();
    }
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-md border border-border bg-white/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary hover:text-primary";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Partilhar:
      </span>
      <button type="button" className={btn} onClick={() => share("facebook")} title="Partilhar no Facebook">
        <Facebook className="h-3.5 w-3.5" /> Facebook
      </button>
      <button type="button" className={btn} onClick={() => share("linkedin")} title="Partilhar no LinkedIn">
        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
      </button>
      <button type="button" className={btn} onClick={() => share("instagram")} title="Copiar ligação para o Instagram">
        <Instagram className="h-3.5 w-3.5" /> Instagram
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-2 border-b border-border pb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary sm:col-span-2">
      {children}
    </h3>
  );
}

function Field({
  label,
  error,
  req,
  children,
}: {
  label: string;
  error?: string | undefined;
  req?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {req && <Req />}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
