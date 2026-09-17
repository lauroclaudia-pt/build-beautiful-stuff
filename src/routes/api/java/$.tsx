import { createFileRoute } from "@tanstack/react-router";

/**
 * Proxy para o servidor de recrutamento (backend Java, HTTP Basic sobre HTTPS).
 * O endereço-base vem no cabeçalho x-java-base (configurado na Gestão do site);
 * o resto do pedido — método, caminho, query, autorização e corpo — é reencaminhado.
 */
export const Route = createFileRoute("/api/java/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});

const HOP_BY_HOP = new Set([
  "x-java-base",
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "accept-encoding",
]);

async function handle({ request, params }: { request: Request; params: Record<string, string> }) {
  const base = (request.headers.get("x-java-base") ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/|$)/i.test(base)) {
    return Response.json({ error: "Endereço do servidor de recrutamento inválido." }, { status: 400 });
  }
  const splat = params["_splat"] ?? params["*"] ?? "";
  const search = new URL(request.url).search;
  const target = `${base}/${splat}${search}`;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  }

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  try {
    const res = await fetch(target, { method: request.method, headers, body: body ?? null, redirect: "manual" });
    const resHeaders = new Headers();
    for (const key of ["content-type", "content-disposition"]) {
      const v = res.headers.get(key);
      if (v) resHeaders.set(key, v);
    }
    return new Response(res.body, { status: res.status, headers: resHeaders });
  } catch {
    return Response.json({ error: "Servidor de recrutamento indisponível." }, { status: 502 });
  }
}
