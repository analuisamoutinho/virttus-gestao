import { getContext } from "@/server/context";
import { signOut } from "@/server/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui";
import { PLAN_LIMITS } from "@/server/plan/limits";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getContext garante sessão + org (senão redireciona). Guard central.
  const { org } = await getContext();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="font-sora font-semibold text-deep">{org.name}</span>
            <span className="rounded-full bg-grad-soft px-2 py-0.5 text-xs font-medium text-purple">
              {PLAN_LIMITS[org.plan].label}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" className="text-xs">
              Sair
            </Button>
          </form>
        </header>
        <main className="flex-1 bg-bg px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
