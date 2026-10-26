import { z } from "zod";

// Só http(s): links viram <a href> e `javascript:` não pode passar.
export const httpUrl = z
  .string()
  .trim()
  .max(500, "Link muito longo")
  .url("Link inválido")
  .refine((u) => /^https?:\/\//i.test(u), "O link precisa começar com http:// ou https://");

// Campo opcional vindo de <input>: "" vira undefined.
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const optionalUrl = z
  .union([httpUrl, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const optionalInt = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().int().min(min).max(max)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));
