import { z } from "zod";
import { optionalText, optionalUrl } from "./common";
import { virtueEnum } from "./one-on-one";
import { parseList } from "@/lib/text";

export const RESOURCE_TYPES = ["LIVRO", "PODCAST", "VIDEO", "CURSO", "ARTIGO", "FERRAMENTA", "OUTRO"] as const;

export const createResourceSchema = z.object({
  type: z.enum(RESOURCE_TYPES).default("LIVRO"),
  title: z.string().trim().min(2, "Dê um título à indicação").max(200),
  author: optionalText(160),
  url: optionalUrl,
  description: optionalText(2000),
  focusVirtue: virtueEnum.optional().or(z.literal("")),
  tags: z
    .string()
    .max(300)
    .optional()
    .transform((v) => parseList(v).map((t) => t.toLowerCase()).slice(0, 8)),
});
