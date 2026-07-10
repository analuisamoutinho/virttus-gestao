import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { db } from "@/server/db";
import type { Role } from "@prisma/client";

// Enriquecemos a sessão com organizationId + role para o gating multi-tenant.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: Role;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // `user` vem do banco (strategy database) — lemos org/role reais.
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true, role: true },
      });
      session.user.id = user.id;
      session.user.organizationId = dbUser?.organizationId ?? null;
      session.user.role = dbUser?.role ?? "LEADER";
      return session;
    },
  },
});
