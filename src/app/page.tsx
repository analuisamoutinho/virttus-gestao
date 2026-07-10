import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { ButtonLink, Logo } from "@/components/ui";

// Placeholder da home; a LP completa (virttus-lp_1.html) será migrada aqui.
export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="text-3xl" />
      <h1 className="font-sora text-4xl font-bold text-deep sm:text-5xl">
        Gestão vira <span className="text-gradient">desenvolvimento</span>
      </h1>
      <p className="max-w-xl text-muted">
        Desenvolva seus liderados com base nas 9 virtudes cardeais do framework de
        Alexandre Havard. 1:1s, feedback SBI, metas e PDI num só lugar.
      </p>
      <ButtonLink href="/login">Começar grátis</ButtonLink>
    </main>
  );
}
