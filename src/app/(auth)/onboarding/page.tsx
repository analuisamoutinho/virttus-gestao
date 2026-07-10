import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Button, ButtonLink, Card, Logo } from "@/components/ui";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { finishOnboarding } from "@/server/actions/team";
import { CreateOrgForm, AddMemberForm } from "./OnboardingForms";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  // Passo 0 — ainda sem organização.
  if (!user?.organizationId) {
    return (
      <Shell step={1}>
        <CreateOrgForm />
      </Shell>
    );
  }

  const org = await db.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
  });
  if (org.onboardedAt) redirect("/dashboard");

  const members = await db.teamMember.findMany({
    where: { organizationId: org.id, active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true },
  });
  const limit = PLAN_LIMITS[org.plan].maxMembers;
  const atLimit = members.length >= limit;

  return (
    <Shell step={2}>
      <Card className="w-full max-w-xl">
        <h2 className="font-sora text-xl font-bold text-deep">Cadastre sua equipe</h2>
        <p className="mt-1 text-sm text-muted">
          Adicione seus liderados. Você pode pular e fazer isso depois.
        </p>

        {members.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium text-deep">{m.name}</span>
                <span className="text-muted">{m.role ?? "—"}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4">
          <AddMemberForm atLimit={atLimit} />
          {atLimit ? (
            <p className="mt-2 text-xs text-muted">
              Você atingiu o limite de {limit} liderados do plano{" "}
              {PLAN_LIMITS[org.plan].label}.{" "}
              <span className="font-medium text-purple">Faça upgrade</span> para adicionar
              mais.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {members.length}/{Number.isFinite(limit) ? limit : "∞"} liderados no plano{" "}
              {PLAN_LIMITS[org.plan].label}.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <ButtonLink href="/dashboard" variant="ghost">
            Pular por agora
          </ButtonLink>
          <form action={finishOnboarding}>
            <Button type="submit">Concluir e ir ao dashboard</Button>
          </form>
        </div>
      </Card>
    </Shell>
  );
}

function Shell({ step, children }: { step: 1 | 2; children: React.ReactNode }) {
  const steps = ["Empresa", "Equipe", "Pronto"];
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-grad-soft px-6 py-12">
      <div className="flex flex-col items-center gap-4">
        <Logo className="text-2xl" />
        <div className="flex items-center gap-2 text-xs">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`rounded-full px-3 py-1 ${
                i + 1 <= step ? "bg-grad text-white" : "bg-white text-muted"
              }`}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>
      {children}
    </main>
  );
}
