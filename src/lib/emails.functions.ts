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
