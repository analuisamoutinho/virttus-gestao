import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { virtueLabel } from "@/lib/virtues";
import { NewTrainingForm, SeedTrainingsButton } from "./TrainingForms";
import { TrainingBoard, type TrainingCard } from "./TrainingBoard";

export default async function TreinamentosPage() {
  const { org } = await getContext();

  const trainings = await db.training.findMany({
    where: { organizationId: org.id },
    orderBy: { scheduledAt: "asc" },
  });

  const cards: TrainingCard[] = trainings.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    module: t.module,
    status: t.status,
    focusVirtueLabel: t.focusVirtue ? virtueLabel(t.focusVirtue) : null,
    dateLabel: formatDateTime(t.scheduledAt),
  }));

  return (
    <div>
      <PageHeader
        icon="training"
        eyebrow="Cronograma de desenvolvimento"
        title="Treinamentos"
        subtitle="Alinhamento semanal: segunda e sexta, 9h (15 min) — visível só para você nesta organização."
      />

      {trainings.length === 0 ? (
        <div className="flex flex-col gap-6">
          <EmptyState
            icon="▦"
            title="Nenhum treinamento cadastrado ainda"
            description="Carregue o cronograma padrão do setor de Mídia (jul–out) ou adicione o primeiro treinamento manualmente abaixo."
            action={<SeedTrainingsButton />}
          />
          <Card className="mx-auto w-full max-w-xl">
            <h2 className="mb-3 font-sora text-lg font-semibold text-deep">
              Novo treinamento
            </h2>
            <NewTrainingForm />
          </Card>
        </div>
      ) : (
        <>
          {/* Disclosure: novo treinamento */}
          <details className="group mb-6">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-deep shadow-sm transition hover:border-border-strong">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-purple transition group-open:rotate-45"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Novo treinamento
            </summary>
            <Card className="mt-3 max-w-xl animate-scale-in">
              <NewTrainingForm />
            </Card>
          </details>

          <TrainingBoard trainings={cards} />
        </>
      )}
    </div>
  );
}
