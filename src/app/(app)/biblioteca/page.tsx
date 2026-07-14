import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState } from "@/components/ui";
import { NewNoteForm, SeedNotesButton, NoteCard } from "./NoteForms";
import type { Note, NoteCategory } from "@prisma/client";

const CATEGORY_LABEL: Record<NoteCategory, string> = {
  BASE_CONHECIMENTO: "Base de conhecimento",
  PDI_SETOR: "PDI do setor",
  CONTEXTO_SETOR: "Contexto do setor",
  FORMULARIO: "Formulários",
  OUTRO: "Outros",
};

const CATEGORY_ORDER: NoteCategory[] = [
  "BASE_CONHECIMENTO",
  "PDI_SETOR",
  "CONTEXTO_SETOR",
  "FORMULARIO",
  "OUTRO",
];

export default async function BibliotecaPage() {
  const { org } = await getContext();

  const notes = await db.note.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
  });

  const groups = CATEGORY_ORDER.map(
    (cat) => [cat, notes.filter((n) => n.category === cat)] as [NoteCategory, Note[]],
  ).filter(([, items]) => items.length > 0);

  return (
    <div>
      <h1 className="mb-1 font-sora text-2xl font-bold text-deep">Biblioteca de liderança</h1>
      <p className="mb-6 text-sm text-muted">
        Base de conhecimento, PDI do setor e formulários — visível só para você, nesta
        organização.
      </p>

      {notes.length === 0 ? (
        <EmptyState
          icon="◆"
          title="Nenhuma nota ainda"
          description="Carregue o conteúdo padrão (manual de liderança, PDI do setor, contexto e formulário de virtudes) ou adicione a primeira nota ao lado."
          action={<SeedNotesButton />}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6">
            {groups.map(([cat, items]) => (
              <Card key={cat}>
                <h2 className="mb-1 font-sora text-sm font-semibold uppercase tracking-wide text-muted">
                  {CATEGORY_LABEL[cat]}
                </h2>
                <div>
                  {items.map((n) => (
                    <NoteCard key={n.id} id={n.id} title={n.title} content={n.content} />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="h-fit">
            <h2 className="mb-3 font-sora text-lg font-semibold text-deep">Nova nota</h2>
            <NewNoteForm />
          </Card>
        </div>
      )}
    </div>
  );
}
