import { z } from "zod";

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "LEADER", "HR", "MEMBER"]),
});
