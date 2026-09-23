import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  nome: z.string().min(1).max(200),
  vagaTitulo: z.string().min(1).max(300),
  referencia: z.string().min(1).max(100),
  prazo: z.string().max(100).optional(),
  candidaturaId: z.string().min(1).max(100),
});

export const enviarConfirmacaoCandidatura = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    try {
      const result = await sendTemplateEmail("candidatura-confirmada", data.email, {
        templateData: {
          nome: data.nome,
          vagaTitulo: data.vagaTitulo,
          referencia: data.referencia,
          prazo: data.prazo,
        },
        idempotencyKey: `candidatura-confirmada-${data.candidaturaId}`,
      });
      return { ok: result.sent };
    } catch (error) {
      console.error("Falha ao enviar confirmação de candidatura", error);
      return { ok: false };
    }
  });

const linkSchema = z.object({
  email: z.string().email(),
  nome: z.string().max(200).optional(),
  link: z.string().url(),
  minutos: z.number().int().positive().max(1440),
  motivo: z.enum(["CRIAR", "RECUPERAR"]),
});

/** Envia o link (token) para o utilizador definir ou recuperar a palavra-passe. */
export const enviarLinkPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => linkSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    try {
      const result = await sendTemplateEmail("recuperar-password", data.email, {
        templateData: {
          nome: data.nome,
          link: data.link,
          minutos: data.minutos,
          motivo: data.motivo,
        },
      });
      return { ok: result.sent };
    } catch (error) {
      console.error("Falha ao enviar link de palavra-passe", error);
      return { ok: false };
    }
  });

const codigoSchema = z.object({
  email: z.string().email(),
  nome: z.string().max(200).optional(),
  codigo: z.string().regex(/^[0-9]{6}$/),
  minutos: z.number().int().positive().max(120),
});

/** Envia o código de confirmação (segundo nível de autenticação). */
export const enviarCodigoAcesso = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codigoSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    try {
      const result = await sendTemplateEmail("codigo-acesso", data.email, {
        templateData: { nome: data.nome, codigo: data.codigo, minutos: data.minutos },
      });
      return { ok: result.sent };
    } catch (error) {
      console.error("Falha ao enviar código de acesso", error);
      return { ok: false };
    }
  });
