import { getContext } from "@/server/context";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default async function FeedbackPage() {
  await getContext();
  return (
    <ModulePlaceholder
      title="Feedback"
      phase="Fase 2"
      icon="✎"
      description="Registre feedback no modelo SBI (Situação, Comportamento, Impacto), de reconhecimento ou construtivo, ancorado numa virtude."
    />
  );
}
