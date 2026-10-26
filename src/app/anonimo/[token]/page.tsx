import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Logo } from "@/components/ui";
import { AnonymousForm } from "./AnonymousForm";

// Página pública (sem login). Nada aqui lê sessão ou cookies de identidade.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Feedback anônimo — Virttus",
  robots: { index: false, follow: false },
};

export default async function AnonymousFeedbackPage({ params }: { params: { token: string } }) {
  const manager = await db.user.findUnique({
    where: { anonFeedbackToken: params.token },
    select: { name: true, email: true, organization: { select: { name: true } } },
  });
  if (!manager) notFound();

  const managerName = manager.name ?? manager.email;

  return (
    <div className="min-h-screen bg-bg bg-grad-mesh px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple">
            {manager.organization?.name}
          </p>
          <h1 className="mt-1 font-sora text-2xl font-bold text-deep">Feedback anônimo para {managerName}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Sua resposta não é ligada a você: não pedimos login, nome, e-mail nem guardamos IP ou horário
            exato. Quem recebe só vê os resultados quando há respostas suficientes.
          </p>
        </div>
        <AnonymousForm token={params.token} managerName={managerName} />
      </div>
    </div>
  );
}
