import { z } from "zod";

export const noteCategoryEnum = z.enum([
  "BASE_CONHECIMENTO",
  "PDI_SETOR",
  "CONTEXTO_SETOR",
  "FORMULARIO",
  "OUTRO",
]);

export const createNoteSchema = z.object({
  category: noteCategoryEnum,
  title: z.string().min(3, "Dê um título").max(200),
  content: z.string().min(1, "Escreva o conteúdo"),
});

export const updateNoteSchema = z.object({
  noteId: z.string().min(1),
  title: z.string().min(3).max(200),
  content: z.string().min(1),
});
