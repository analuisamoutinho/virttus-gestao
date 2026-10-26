import { z } from "zod";
import { optionalInt, optionalText, optionalUrl } from "./common";
import { virtueEnum } from "./one-on-one";
import { parseList } from "@/lib/text";

export const JOB_STATUSES = ["OPEN", "PAUSED", "CLOSED"] as const;
export const CANDIDATE_STATUSES = [
  "BANCO",
  "EM_PROCESSO",
  "ENTREVISTA",
  "PROPOSTA",
  "CONTRATADO",
  "DESCARTADO",
] as const;

const list = z
  .string()
  .max(1000)
  .optional()
  .transform((v) => parseList(v));

export const jobOpeningSchema = z
  .object({
    title: z.string().trim().min(3, "Dê um título à vaga").max(160),
    area: optionalText(120),
    location: optionalText(120),
    description: optionalText(4000),
    status: z.enum(JOB_STATUSES).default("OPEN"),
    requiredSkills: list,
    desiredSkills: list,
    minYears: z.coerce.number().int().min(0).max(40).default(0),
    salaryMin: optionalInt(0, 10_000_000),
    salaryMax: optionalInt(0, 10_000_000),
    targetVirtues: z.array(virtueEnum).max(9).default([]),
  })
  .refine((v) => v.salaryMin === undefined || v.salaryMax === undefined || v.salaryMin <= v.salaryMax, {
    message: "A faixa salarial mínima não pode ser maior que a máxima",
    path: ["salaryMin"],
  });

const rating = z.coerce.number().int().min(1).max(5);

export const candidateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do candidato").max(160),
  email: z
    .union([z.string().trim().email("E-mail inválido"), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  phone: optionalText(40),
  linkedinUrl: optionalUrl,
  currentRole: optionalText(160),
  location: optionalText(120),
  source: optionalText(120),
  openingId: optionalText(60),
  yearsExperience: z.coerce.number().int().min(0).max(60).default(0),
  skills: list,
  salaryExpectation: optionalInt(0, 10_000_000),
  resumeText: optionalText(30_000),
  notes: optionalText(4000),
  status: z.enum(CANDIDATE_STATUSES).default("BANCO"),
  interviewRating: z
    .union([z.literal(""), rating])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
});

export const virtueRatingsSchema = z.record(virtueEnum, rating);
