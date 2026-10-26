import { headers } from "next/headers";

// URL pública do app para montar links compartilháveis. Prefere o host da
// requisição (funciona em previews da Vercel) e cai em NEXTAUTH_URL.
export function getBaseUrl(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
