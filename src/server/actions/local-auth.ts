"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import type { ActionResult } from "@/server/actions/team";

// Login sem Google OAuth, só para uso local (NODE_ENV !== "production").
// Cria o usuário no primeiro acesso; nos seguintes, reaproveita a conta.
export async function localLogin(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Login local desativado em produção." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { ok: false, error: "Informe um e-mail." };

  let user = await db.user.findFirst({ where: { email, organizationId: null } });
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

  cookies().set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });

  redirect("/onboarding");
}
