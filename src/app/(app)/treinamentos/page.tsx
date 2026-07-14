import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, PageHeader, SectionTitle, Badge, Icon } from "@/components/ui";
import { VirtueBadge } from "@/components/VirtueBadge";
import { formatDateTime } from "@/lib/format";
import { NewTrainingForm, SeedTrainingsButton, TrainingStatusControls } from "./TrainingForms";
import type { Training } from "@prisma/client";

export default async function TreinamentosPage() {
  const { org } = await getContext();

  const trainings = await db.training.findMany({
    where: { organizationId: org.id },
    orderBy: { scheduledAt: "asc" },
  });

  const groups = groupByModule(trainings);

  return (
    <div>
      <PageHeader
        icon="training"
        eyebrow="Cronograma de desenvolvimento"
        title="Treinamentos"
        subtitle="Alinhamento semanal: segunda e sexta, 9h (15 min) — visível só para você nesta organização."
      />

      {trainings.length === 0 ? (
        <EmptyState
          icon="◫"
          title="Nenhum treinamento cadastrado ainda"
          description="Carregue o cronograma padrão do setor de Mídia (jul–out) ou adicione o primeiro treinamento manualmente ao lado."
          action={<SeedTrainingsButton />}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6">
            {groups.map(([module, items]) => (
              <div key={module}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-grad" />
                  <h2 className="font-sora text-xs font-bold uppercase tracking-[0.1em] text-muted">
                    {module}
                  </h2>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((t) => (
                    <Card key={t.id} hover>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-sora text-sm font-semibold text-deep">{t.title}</p>
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Icon.calendar width={12} height={12} />
                            {formatDateTime(t.scheduledAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.focusVirtue ? <VirtueBadge virtue={t.focusVirtue} /> : null}
                          <StatusPill status={t.status} />
                        </div>
                      </div>
                      {t.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                          {t.description}
                        </p>
                      ) : null}
                      <div className="mt-3">
                        <TrainingStatusControls id={t.id} status={t.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <SectionTitle hint="Adicione ao cronograma do setor.">
              Novo treinamento
            </SectionTitle>
            <NewTrainingForm />
          </Card>
        </div>
      )}
    </div>
  );
}

function groupByModule(trainings: Training[]): Array<[string, Training[]]> {
  const map = new Map<string, Training[]>();
  for (const t of trainings) {
    const key = t.module ?? "Sem módulo";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries());
}

function StatusPill({ status }: { status: "PLANNED" | "DONE" | "CANCELED" }) {
  const map = {
    PLANNED: { label: "Planejado", tone: "blue" as const },
    DONE: { label: "Concluído", tone: "success" as const },
    CANCELED: { label: "Cancelado", tone: "neutral" as const },
  };
  const s = map[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}
