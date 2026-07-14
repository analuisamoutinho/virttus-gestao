import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Logo, Card } from "@/components/ui";
import { CreateOrgForm } from "./OnboardingForms";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  // Já tem organização — o cadastro de equipe acontece na tela Equipe.
  if (user?.organizationId) redirect("/equipe");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg bg-grad-mesh px-6 py-12">
      <Logo className="text-2xl" />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple">
            Passo 1 de 2
          </span>
          <h1 className="mt-1 font-sora text-2xl font-bold text-deep">
            Crie sua organização
          </h1>
          <p className="mt-1 text-sm text-muted">
            Depois você adiciona seus liderados e começa a acompanhar a evolução.
          </p>
        </div>
        <Card>
          <CreateOrgForm />
        </Card>
      </div>
    </main>
  );
}
