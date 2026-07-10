import { EmptyState } from "@/components/ui";

// Placeholder para módulos das próximas fases — mantém a navegação da sidebar
// funcional com um estado vazio consistente.
export function ModulePlaceholder({
  title,
  phase,
  description,
  icon,
}: {
  title: string;
  phase: string;
  description: string;
  icon: string;
}) {
  return (
    <div>
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">{title}</h1>
      <EmptyState
        icon={icon}
        title={`Em breve — ${phase}`}
        description={description}
      />
    </div>
  );
}
