import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa").max(80),
});

export const addMemberSchema = z.object({
  name: z.string().min(2, "Informe o nome").max(80),
  role: z.string().max(80).optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateTeamMemberSchema = z.object({
  teamMemberId: z.string().min(1),
  name: z.string().min(2, "Informe o nome").max(80),
  role: z.string().max(80).optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

export const removeTeamMemberSchema = z.object({
  teamMemberId: z.string().min(1),
});
