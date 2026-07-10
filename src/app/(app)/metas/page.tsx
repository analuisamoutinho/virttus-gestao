import { getContext } from "@/server/context";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function MetasPage() {
  await getContext();
  return (
    <ModulePlaceholder
      title="Metas & OKR"
      phase="Fase 3"
      icon="◉"
      description="Defina objetivos e key results com progresso auto-calculado a partir dos KRs."
    />
  );
}
