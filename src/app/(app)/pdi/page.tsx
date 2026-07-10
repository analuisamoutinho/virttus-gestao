import { getContext } from "@/server/context";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function PdiPage() {
  await getContext();
  return (
    <ModulePlaceholder
      title="PDI"
      phase="Fase 3"
      icon="◆"
      description="Plano de Desenvolvimento Individual: 1 competência foco por trimestre, ações, prazos e evidências de evolução."
    />
  );
}
