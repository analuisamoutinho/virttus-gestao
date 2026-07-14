import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { ButtonLink, Logo, Icon } from "@/components/ui";

// Placeholder da home; a LP completa (virttus-lp_1.html) será migrada aqui.
export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const pillars = [
    { icon: "oneOnOne" as const, title: "1:1s estruturados", desc: "Pauta, notas, mood e ações de follow-up sempre registrados." },
    { icon: "feedback" as const, title: "Feedback SBI", desc: "Situação, comportamento e impacto ancorados nas virtudes." },
    { icon: "goals" as const, title: "Metas & OKR", desc: "Objetivos com key results e progresso automático." },
    { icon: "pdi" as const, title: "PDI trimestral", desc: "Uma competência foco por trimestre, com evidências." },
  ];

  return (
    <main className="min-h-screen bg-bg bg-grad-mesh">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <ButtonLink href="/login" variant="outline" size="sm">
          Entrar
        </ButtonLink>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-purple shadow-sm">
          <Icon.sparkle width={14} height={14} />
          Framework das 9 virtudes de Alexandre Havard
        </span>
        <h1 className="font-sora text-4xl font-bold leading-[1.1] text-deep sm:text-6xl">
          Gestão vira <span className="text-gradient">desenvolvimento</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Desenvolva seus liderados de forma estruturada. 1:1s, feedback SBI, metas e
          PDI — tudo num só lugar, com o rigor de um método consagrado.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/login" icon="sparkle">
            Começar grátis
          </ButtonLink>
          <ButtonLink href="/login" variant="outline">
            Já tenho conta
          </ButtonLink>
        </div>
      </section>

      {/* Pilares */}
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => {
          const IconCmp = Icon[p.icon];
          return (
            <div
              key={p.title}
              className="rounded-card border border-border bg-surface p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-grad text-white shadow-glow-blue">
                <IconCmp width={22} height={22} />
              </span>
              <h3 className="font-sora text-base font-semibold text-deep">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
