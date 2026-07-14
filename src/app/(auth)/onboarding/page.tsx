import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Logo } from "@/components/ui";
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-grad-soft px-6 py-12">
      <Logo className="text-2xl" />
      <CreateOrgForm />
    </main>
  );
}
