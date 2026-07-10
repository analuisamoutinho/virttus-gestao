import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState } from "@/components/ui";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { AddMemberForm } from "@/app/(auth)/onboarding/OnboardingForms";

export default async function EquipePage() {
  const { org } = await getContext();
  const members = await db.teamMember.findMany({
    where: { organizationId: org.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, email: true },
  });

  const limit = PLAN_LIMITS[org.plan].maxMembers;
  const atLimit = members.length >= limit;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-deep">Equipe</h1>
        <span className="text-sm text-muted">
          {members.length}/{Number.isFinite(limit) ? limit : "∞"} liderados ·{" "}
          {PLAN_LIMITS[org.plan].label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {members.length === 0 ? (
            <EmptyState
              icon="◎"
              title="Nenhum liderado ainda"
              description="Adicione a primeira pessoa da sua equipe usando o formulário ao lado."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <Card
                  key={m.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-deep">{m.name}</p>
                    <p className="text-xs text-muted">{m.role ?? "—"}</p>
                  </div>
                  <span className="text-xs text-muted">{m.email ?? ""}</span>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <h2 className="mb-3 font-sora text-lg font-semibold text-deep">
            Adicionar liderado
          </h2>
          <AddMemberForm atLimit={atLimit} />
          {atLimit ? (
            <p className="mt-3 text-xs text-muted">
              Limite do plano {PLAN_LIMITS[org.plan].label} atingido.{" "}
              <span className="font-medium text-purple">Faça upgrade</span> para adicionar
              mais.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
