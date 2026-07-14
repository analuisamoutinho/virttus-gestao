"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { createNote, updateNote, deleteNote, seedDefaultNotes } from "@/server/actions/note";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

const CATEGORY_OPTIONS = [
  { value: "BASE_CONHECIMENTO", label: "Base de conhecimento" },
  { value: "PDI_SETOR", label: "PDI do setor" },
  { value: "CONTEXTO_SETOR", label: "Contexto do setor" },
  { value: "FORMULARIO", label: "Formulário" },
  { value: "OUTRO", label: "Outro" },
] as const;

export function NewNoteForm() {
  const [state, action, pending] = useFormState(createNote, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <SelectField label="Categoria" name="category" required defaultValue="OUTRO">
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </SelectField>
      <TextField label="Título" name="title" required placeholder="Ex.: Roteiro da 1:1 de julho" />
      <TextArea
        label="Conteúdo"
        name="content"
        required
        placeholder="Cole ou escreva aqui…"
        className="min-h-[160px]"
      />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Adicionar nota"}
      </Button>
    </form>
  );
}

export function SeedNotesButton() {
  const [state, action, pending] = useFormState(seedDefaultNotes, initial);
  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Carregando…" : "Carregar conteúdo padrão"}
      </Button>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
    </form>
  );
}

export function NoteCard({
  id,
  title,
  content,
}: {
  id: string;
  title: string;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-left font-sora text-sm font-semibold text-deep hover:text-blue"
        >
          {open ? "▾ " : "▸ "}
          {title}
        </button>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setEditing((e) => !e);
            }}
            className="font-medium text-purple hover:underline"
          >
            {editing ? "cancelar" : "editar"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm("Excluir esta nota?")) start(() => deleteNote(id));
            }}
            className="font-medium text-danger hover:underline"
          >
            excluir
          </button>
        </div>
      </div>

      {open && editing ? (
        <form
          action={(fd) => {
            fd.set("noteId", id);
            start(async () => {
              await updateNote(initial, fd);
              setEditing(false);
            });
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <TextField label="Título" name="title" defaultValue={title} required />
          <TextArea
            label="Conteúdo"
            name="content"
            defaultValue={content}
            required
            className="min-h-[240px] font-mono text-xs"
          />
          <Button type="submit" variant="outline" disabled={pending}>
            salvar
          </Button>
        </form>
      ) : open ? (
        <pre className="mt-2 max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-sm bg-bg p-3 font-sans text-xs leading-relaxed text-deep">
          {content}
        </pre>
      ) : null}
    </div>
  );
}
