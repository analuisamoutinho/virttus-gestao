import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState } from "@/components/ui";
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
      <h1 className="mb-1 font-sora text-2xl font-bold text-deep">Treinamentos</h1>
      <p className="mb-6 text-sm text-muted">
        Cronograma do setor — visível só para você, nesta organização. Alinhamento semanal:
        segunda e sexta, 9h (15 min, tarefas em andamento e metas da semana).
      </p>

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
                <h2 className="mb-2 font-sora text-sm font-semibold uppercase tracking-wide text-muted">
                  {module}
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((t) => (
                    <Card key={t.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-sora text-sm font-semibold text-deep">{t.title}</p>
                          <p className="text-xs text-muted">{formatDateTime(t.scheduledAt)}</p>
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

          <Card className="h-fit">
            <h2 className="mb-3 font-sora text-lg font-semibold text-deep">Novo treinamento</h2>
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
    PLANNED: { label: "Planejado", cls: "bg-grad-soft text-blue" },
    DONE: { label: "Concluído", cls: "bg-green-50 text-green-700" },
    CANCELED: { label: "Cancelado", cls: "bg-bg text-muted" },
  } as const;
  const s = map[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
