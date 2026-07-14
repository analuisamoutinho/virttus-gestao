import { getContext } from "@/server/context";
import { auth, signOut } from "@/server/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Avatar, Badge, Button } from "@/components/ui";
import { PLAN_LIMITS } from "@/server/plan/limits";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getContext garante sessão + org (senão redireciona). Guard central.
  const { org, role } = await getContext();
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "Você";
  const planLabel = PLAN_LIMITS[org.plan].label;
  const roleLabel =
    role === "ADMIN"
      ? "Admin"
      : role === "HR"
        ? "RH"
        : role === "MEMBER"
          ? "Liderado"
          : "Líder";

  return (
    <div className="flex min-h-screen bg-bg bg-grad-mesh">
      <Sidebar planLabel={planLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-20 hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
          <div className="flex items-center gap-2.5">
            <span className="font-sora text-sm font-semibold text-deep">
              {org.name}
            </span>
            <Badge tone="purple" dot>
              {planLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={userName} size="sm" />
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold text-deep">{userName}</p>
                <p className="text-[11px] text-muted">{roleLabel}</p>
              </div>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm" icon="logout">
                Sair
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
