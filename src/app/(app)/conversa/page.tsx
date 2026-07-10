import { getContext } from "@/server/context";
import { hasFeature } from "@/server/plan/gate";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { EmptyState } from "@/components/ui";

export default async function ConversaPage() {
  const { org } = await getContext();

  // Feature gating: construtor de conversa é Pro+.
  if (!hasFeature(org, "conversation_builder")) {
    return (
      <div>
        <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Conversa</h1>
        <EmptyState
          icon="◌"
          title="Recurso do plano Pro"
          description={`O construtor de conversa gera roteiros para conversas difíceis a partir do perfil pessoal do liderado. Disponível a partir do plano Pro (${PLAN_LIMITS.PRO.priceLabel}).`}
        />
      </div>
    );
  }

  return (
    <ModulePlaceholder
      title="Conversa"
      phase="Fase 4"
      icon="◌"
      description="Construtor de conversa: abertura, perguntas socráticas e fechamento gerados a partir do perfil pessoal do liderado."
    />
  );
}
