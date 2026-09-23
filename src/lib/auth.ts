/** Autenticação forte: política de palavra-passe, tokens de definição e códigos de 2.º nível. */

export type TokenPurpose = "CRIAR" | "RECUPERAR";

export interface PasswordToken {
  id: string;
  pessoaId: string;
  email: string;
  token: string;
  purpose: TokenPurpose;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface LoginCode {
  id: string;
  pessoaId: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  usedAt: string | null;
}

/** Validade do link de definição de palavra-passe (minutos). */
export const TOKEN_TTL_MIN = 30;
/** Validade do código de confirmação (minutos). */
export const CODE_TTL_MIN = 10;
/** Tentativas permitidas por código. */
export const CODE_MAX_ATTEMPTS = 5;

export interface ForcaPassword {
  ok: boolean;
  erros: string[];
  nivel: "fraca" | "media" | "forte";
}

/** Autenticação forte: 12+ caracteres, maiúscula, minúscula, dígito e símbolo. */
export function validarPassword(pw: string, email?: string): ForcaPassword {
  const erros: string[] = [];
  if (pw.length < 12) erros.push("Deve ter pelo menos 12 caracteres.");
  if (!/[A-ZÀ-Ý]/.test(pw)) erros.push("Deve incluir uma letra maiúscula.");
  if (!/[a-zà-ÿ]/.test(pw)) erros.push("Deve incluir uma letra minúscula.");
  if (!/[0-9]/.test(pw)) erros.push("Deve incluir um algarismo.");
  if (!/[^A-Za-zÀ-ÿ0-9]/.test(pw)) erros.push("Deve incluir um caractere especial (ex.: ! @ # $).");
  if (/(.)\1{2,}/.test(pw)) erros.push("Não pode repetir o mesmo caractere três vezes seguidas.");
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 3 && pw.toLowerCase().includes(local))
    erros.push("Não pode conter o seu endereço de email.");
  const nivel: ForcaPassword["nivel"] =
    erros.length === 0 ? (pw.length >= 16 ? "forte" : "media") : "fraca";
  return { ok: erros.length === 0, erros, nivel };
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function gerarToken(): string {
  return randomHex(24);
}

/** Código numérico de 6 dígitos para o segundo nível de autenticação. */
export function gerarCodigo(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String((arr[0] ?? 0) % 1_000_000).padStart(6, "0");
}

export function emMinutos(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

export function expirado(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** Endereço completo do link de definição de palavra-passe. */
export function linkDefinirPassword(token: string): string {
  const origem = typeof window !== "undefined" ? window.location.origin : "";
  return `${origem}/definir-password?token=${token}`;
}
