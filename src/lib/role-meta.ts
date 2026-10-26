import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  LEADER: "Líder",
  HR: "RH",
  MEMBER: "Liderado",
};
