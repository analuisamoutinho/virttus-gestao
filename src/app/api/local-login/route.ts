import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

// Login sem Google OAuth, protegido por uma senha única compartilhada
// (LOCAL_LOGIN_PASSWORD). Sem essa env var configurada, o login fica
// desativado — inclusive em produção, evitando expor dados sem proteção.
// Cria o usuário no primeiro acesso; nos seguintes, reaproveita a conta pelo e-mail.
export async function POST(request: Request) {
  const requiredPassword = process.env.LOCAL_LOGIN_PASSWORD;
  if (!requiredPassword) {
    return NextResponse.json({ error: "Login local não configurado." }, { status: 404 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  if (password !== requiredPassword) {
    return NextResponse.redirect(new URL("/login?error=password", request.url));
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=email", request.url));
  }

  // E-mail não é globalmente único no schema (só por org) — se houver mais de
  // uma conta com o mesmo e-mail, prioriza a que já tem organização.
  let user = await db.user.findFirst({
    where: { email },
    orderBy: [{ organizationId: "desc" }, { createdAt: "asc" }],
  });
  if (!user) {
    user = await db.user.create({
      data: { name: name || null, email, role: "LEADER" },
    });
  }

  const sessionToken = randomUUID();
  await db.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  // Auth.js usa o prefixo "__Secure-" no nome do cookie quando a URL é https
  // (ver @auth/core/lib/init.js: useSecureCookies = url.protocol === "https:").
  const isHttps = new URL(request.url).protocol === "https:";
  const cookieName = isHttps ? "__Secure-authjs.session-token" : "authjs.session-token";

  const response = NextResponse.redirect(new URL("/onboarding", request.url));
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttps,
    expires: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });
  return response;
}
