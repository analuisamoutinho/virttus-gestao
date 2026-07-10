import { getContext } from "@/server/context";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function OneOnOnePage() {
  await getContext();
  return (
    <ModulePlaceholder
      title="1:1s"
      phase="Fase 2"
      icon="◍"
      description="Agende 1:1s com pauta, notas, ações de follow-up, virtude em foco e mood — tudo registrado no histórico."
    />
  );
}
