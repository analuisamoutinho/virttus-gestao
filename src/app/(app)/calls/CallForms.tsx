"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { CALL_KIND_OPTIONS } from "@/lib/call-kinds";
import { createCall, deleteCall, saveTranscript, deleteTranscript } from "@/server/actions/call";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function NewCallForm({ defaultDate }: { defaultDate?: string }) {
  const [state, action, pending] = useFormState(createCall, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <TextField label="Título" name="title" required placeholder="Ex.: Alinhamento semanal do time" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Tipo" name="kind" defaultValue="ALINHAMENTO">
          {CALL_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <TextField label="Duração (min)" name="durationMin" type="number" min={5} max={480} defaultValue={30} />
      </div>
      <TextField
        label="Data e hora"
        name="scheduledAt"
        type="datetime-local"
        required
        defaultValue={defaultDate}
      />
      <TextField label="Link da reunião" name="meetingUrl" type="url" placeholder="https://meet.google.com/…" />
      <TextField label="Participantes" name="participants" placeholder="Ana, Bruno, Carla" />
      <TextArea label="Pauta / observações" name="notes" placeholder="O que será tratado nesta call…" />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Agendar call"}
      </Button>
    </form>
  );
}

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function TranscriptForm({
  callId,
  initialContent = "",
}: {
  callId: string;
  initialContent?: string;
}) {
  const [state, action, pending] = useFormState(saveTranscript, initial);
  const [content, setContent] = useState(initialContent);
  const [source, setSource] = useState<"manual" | "upload">("manual");
  const [fileError, setFileError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Arquivo maior que 2 MB.");
      return;
    }
    setFileError(null);
    setContent(await file.text());
    setSource("upload");
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="callId" value={callId} />
      <input type="hidden" name="source" value={source} />
      <label className="flex flex-col gap-1.5 text-left">
        <span className="text-xs font-semibold text-deep">Importar arquivo (.txt, .vtt, .srt)</span>
        <input
          type="file"
          accept=".txt,.vtt,.srt,.md,text/plain,text/vtt"
          onChange={onFile}
          className="text-xs text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-grad-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-deep"
        />
        {fileError ? <span className="text-[11px] text-danger">{fileError}</span> : null}
      </label>
      <TextArea
        label="Transcrição"
        name="content"
        required
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSource("manual");
        }}
        placeholder="Cole aqui a transcrição da call (do Meet, Zoom, Fireflies, Otter…)"
        className="min-h-[220px]"
        hint="Marcações de tempo de arquivos .vtt/.srt são removidas automaticamente."
      />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar transcrição"}
      </Button>
    </form>
  );
}

export function DeleteCallButton({ callId }: { callId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      icon="trash"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir esta call e a transcrição?")) start(() => deleteCall(callId));
      }}
    >
      Excluir call
    </Button>
  );
}

export function DeleteTranscriptButton({ callId }: { callId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Remover a transcrição desta call?")) start(() => deleteTranscript(callId));
      }}
      className="text-xs font-medium text-danger hover:underline"
    >
      Remover transcrição
    </button>
  );
}
