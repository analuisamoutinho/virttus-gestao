import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import {
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
  Avatar,
  Badge,
  Icon,
} from "@/components/ui";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { hasFeature } from "@/server/plan/gate";
import { AddMemberForm } from "./AddMemberForm";

export default async function EquipePage() {
  const { org } = await getContext();
  const members = await db.teamMember.findMany({
    where: { organizationId: org.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, email: true },
  });

  const limit = PLAN_LIMITS[org.plan].maxMembers;
  const atLimit = members.length >= limit;
  const limitLabel = Number.isFinite(limit) ? limit : "∞";

  return (
    <div>
      <PageHeader
        icon="team"
        eyebrow="Pessoas"
        title="Equipe"
        subtitle="Gerencie seus liderados e acompanhe cada perfil."
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={atLimit ? "warn" : "blue"}>
              {members.length}/{limitLabel} liderados
            </Badge>
            {hasFeature(org, "export") ? (
              <a
                href="/api/export/team"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple hover:text-purple-600"
              >
                <Icon.download width={16} height={16} />
                Exportar CSV
              </a>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {members.length === 0 ? (
            <EmptyState
              icon="◎"
              title="Nenhum liderado ainda"
              description="Adicione a primeira pessoa da sua equipe usando o formulário ao lado."
            />
          ) : (
            <>
              <p className="mb-3 text-xs text-muted">
                Clique numa pessoa para ver o perfil, editar ou remover.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {members.map((m) => (
                  <Link key={m.id} href={`/equipe/${m.id}`} className="group block">
                    <Card
                      className="flex items-center gap-3.5 py-4 group-hover:border-blue"
                      hover
                    >
                      <Avatar name={m.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-deep">
                          {m.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {m.role ?? "Sem cargo definido"}
                        </p>
                      </div>
                      <span className="text-muted-light transition group-hover:translate-x-0.5 group-hover:text-blue">
                        <Icon.chevronRight width={18} height={18} />
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <SectionTitle hint="Cadastre um novo liderado no time.">
            Adicionar liderado
          </SectionTitle>
          <AddMemberForm atLimit={atLimit} />
          {atLimit ? (
            <div className="mt-4 rounded-sm bg-warn-soft px-3 py-2.5 text-xs text-warn">
              Limite do plano <strong>{PLAN_LIMITS[org.plan].label}</strong> atingido.{" "}
              <span className="font-semibold underline">Faça upgrade</span> para adicionar mais.
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
