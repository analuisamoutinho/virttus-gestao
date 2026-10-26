import { z } from "zod";
import { DIMENSION_KEYS } from "@/lib/manager-feedback";

const rating = z.coerce.number().int().min(1).max(5);
const text = z
  .string()
  .trim()
  .max(1500, "Texto longo demais (máx. 1500 caracteres)")
  .optional()
  .transform((v) => (v ? v : undefined));

export const submitManagerFeedbackSchema = z
  .object({
    token: z.string().min(10).max(100),
    ratings: z.object(
      Object.fromEntries(DIMENSION_KEYS.map((k) => [k, rating])) as Record<
        (typeof DIMENSION_KEYS)[number],
        typeof rating
      >,
    ),
    keepText: text,
    startText: text,
    stopText: text,
  })
  .strict();
