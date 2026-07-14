import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, PageHeader, SectionTitle, Badge } from "@/components/ui";
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
      <PageHeader
        icon="library"
        eyebrow="Base de conhecimento"
        title="Biblioteca de liderança"
        subtitle="Manuais, PDI do setor e formulários — visível só para você nesta organização."
      />

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
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="font-sora text-sm font-bold text-deep">
                    {CATEGORY_LABEL[cat]}
                  </h2>
                  <Badge tone="purple">{items.length}</Badge>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {items.map((n) => (
                    <NoteCard key={n.id} id={n.id} title={n.title} content={n.content} />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <SectionTitle hint="Adicione um documento à biblioteca.">Nova nota</SectionTitle>
            <NewNoteForm />
          </Card>
        </div>
      )}
    </div>
  );
}
