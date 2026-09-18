import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, JobStateBadge } from "@/components/shell";
import { useStore } from "@/lib/store";
import {
  OFFER_TYPE_LABEL,
  STAGE_LABEL,
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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VagaDetalhe,
});

const NACIONALIDADES = [
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
  municipality: "",
  email: "",
  phone: "",
  mobile: "",
  // Secção B
  education: "",
  postgradInfo: "",
  rjep: false,
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
  specialConditions: "",
  // Secção E
  truthDeclaration: false,
  mobDeclaration: false,
  grantDeclaration: false,
};

function VagaDetalhe() {
  const { vagaId } = Route.useParams();
  const navigate = useNavigate();
  const { vagas, applicants, addApplicant, hydrated, opcoesDe, site } = useStore();
  const habilitacoes = opcoesDe("HABILITACAO");
  const situacoes = opcoesDe("SITUACAO_PROFISSIONAL");
  const vaga = vagas.find((v) => v.id === vagaId);
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
  const total = applicants.filter((a) => a.vagaId === vaga.id).length;
  const ehConcursal =
    vaga.offerType === "PROCEDIMENTO_CONCURSAL_COMUM" ||
    vaga.offerType === "PROCEDIMENTO_CONCURSAL_RESERVA";
  const ehMobilidade =
    vaga.offerType === "MOBILIDADE_INTERNA" || vaga.offerType === "MOBILIDADE_INTERCARREIRAS";
  const ehBolsa = vaga.offerType === "BOLSA_INVESTIGACAO_CIENTIFICA";
  const mostraDeficiencia = (vaga.vagasDeficiencia ?? 0) > 0;

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
    if (!form.municipality.trim()) err["municipality"] = "Indique o concelho de residência.";
    if (!form.education.trim()) err["education"] = "Indique o nível habilitacional.";
    if (form.rjep && !form.employmentSituation.trim())
      err["employmentSituation"] = "Descreva a situação de RJEP.";
    if (vaga!.allowNoDegree && !form.alternativeQualification.trim())
      err["alternativeQualification"] =
        "Descreva a formação ou experiência substitutiva do grau académico.";
    if (ehConcursal && form.selectionMethodsWanted.length === 0)
      err["selectionMethodsWanted"] = "Escolha pelo menos um método de seleção.";
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
      err["deficiencia"] = "Anexe a declaração de incapacidade.";
    if (!form.truthDeclaration)
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
      mobile: form.mobile.trim(),
      postgradInfo: form.postgradInfo.trim(),
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
                <JobStateBadge state={vaga.state} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">{vaga.title}</h1>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Ref. {vaga.ref} · {vaga.department} · {vaga.location} · {vaga.positions}{" "}
                {vaga.positions === 1 ? "posto" : "postos"}
              </p>
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
                      {NACIONALIDADES.map((n) => (
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
                  <Field label="Concelho de residência" req error={errors["municipality"]}>
                    <input
                      value={form.municipality}
                      maxLength={80}
                      onChange={(e) => set("municipality", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Endereço eletrónico" req error={errors["email"]}>
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
                    Secção B — Situação perante os requisitos de admissão
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
                    <Field label="Pós-graduação, mestrado ou doutoramento">
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
                    <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]">
                      <input
                        type="checkbox"
                        checked={form.rjep}
                        onChange={(e) => set("rjep", e.target.checked)}
                        className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
                      />
                      <span>
                        Titular de vínculo de emprego público (RJEP)?
                        <Req />
                      </span>
                    </label>
                  </div>
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
                  <Field label="Órgão/serviço onde exerce ou por último exerceu">
                    <input
                      value={form.lastEmployer}
                      maxLength={200}
                      onChange={(e) => set("lastEmployer", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <Field label="Atividade exercida ou que por último exerceu">
                    <input
                      value={form.lastActivity}
                      maxLength={200}
                      onChange={(e) => set("lastActivity", e.target.value)}
                      className="input-ipma"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Avaliação de desempenho dos últimos 3 anos">
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
                  {vaga.allowNoDegree && (
                    <div className="sm:col-span-2">
                      <Field
                        label="Formação/experiência substitutiva de grau académico"
                        req
                        error={errors["alternativeQualification"]}
                      >
                        <textarea
                          rows={3}
                          value={form.alternativeQualification}
                          maxLength={1000}
                          onChange={(e) => set("alternativeQualification", e.target.value)}
                          className="input-ipma resize-y"
                        />
                      </Field>
                    </div>
                  )}

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
                              type="checkbox"
                              checked={form.selectionMethodsWanted.includes(m)}
                              onChange={(e) =>
                                set(
                                  "selectionMethodsWanted",
                                  e.target.checked
                                    ? [...form.selectionMethodsWanted, m]
                                    : form.selectionMethodsWanted.filter((x) => x !== m),
                                )
                              }
                              className="size-4 rounded border-border accent-[var(--primary)]"
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
                      <SectionTitle>Secção D — Candidatos com deficiência</SectionTitle>
                      <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]">
                        <input
                          type="checkbox"
                          checked={form.deficiencia}
                          onChange={(e) => set("deficiencia", e.target.checked)}
                          className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
                        />
                        <span>Tenho grau de incapacidade (Lei n.º 4/2019 — quota de emprego)</span>
                      </label>
                      {form.deficiencia && (
                        <div className="rounded-lg border border-border bg-white/40 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            Declaração de grau de incapacidade e tipo de deficiência
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
                      )}
                      <Field label="Condições especiais para a realização dos métodos de seleção">
                        <input
                          value={form.specialConditions}
                          maxLength={200}
                          placeholder="Opcional — ex.: apoio à mobilidade, tempo adicional"
                          onChange={(e) => set("specialConditions", e.target.value)}
                          className="input-ipma"
                        />
                      </Field>
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

                  <div className="sm:col-span-2">
                    <label className="flex items-start gap-3 rounded-lg border border-border bg-white/50 p-3 text-[13px]">
                      <input
                        type="checkbox"
                        checked={form.truthDeclaration}
                        onChange={(e) => set("truthDeclaration", e.target.checked)}
                        className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
                      />
                      <span>
                        Declaro, sob compromisso de honra, que as informações prestadas são
                        verdadeiras e que reúno os requisitos de admissão.
                      </span>
                    </label>
                    {errors["truthDeclaration"] && (
                      <p className="mt-1 text-[11px] text-destructive">
                        {errors["truthDeclaration"]}
                      </p>
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

          <aside className="col-span-12 lg:col-span-4">
            <div className="glass sticky top-24 animate-rise rounded-xl p-5 [animation-delay:200ms]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Síntese do procedimento
              </p>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ["Carreira", vaga.career],
                  ["Vínculo", vaga.bond],
                  ["Regime", vaga.regime],
                  ["Remuneração", vaga.remuneration],
                  ["Habilitação", vaga.educationLevel],
                  ["Código BEP", vaga.bepCode || "—"],
                  ["Presidente do júri", vaga.juryPresident || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-right font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Fases
                </p>
                <ol className="mt-2 space-y-1.5">
                  {vaga.stages.map((s) => (
                    <li key={s.code} className="flex items-center gap-2 text-[13px]">
                      <span
                        className={`size-1.5 rounded-full ${
                          s.state === "completed"
                            ? "bg-success"
                            : s.state === "active"
                              ? "bg-atmosfera"
                              : "bg-border"
                        }`}
                      />
                      <span className={s.state === "draft" ? "text-muted-foreground" : ""}>
                        {STAGE_LABEL[s.code]}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground">
                {total} {total === 1 ? "candidatura registada" : "candidaturas registadas"}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
