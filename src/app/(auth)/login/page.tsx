import { redirect } from "next/navigation";
import { auth, signIn } from "@/server/auth";
import { Card, Button, Logo, Icon } from "@/components/ui";
import { LocalLoginForm } from "./LocalLoginForm";

const GOOGLE_CONFIGURED = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
const LOCAL_LOGIN_CONFIGURED = Boolean(process.env.LOCAL_LOGIN_PASSWORD);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca */}
      <aside className="relative hidden overflow-hidden bg-grad-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-grad-mesh opacity-60" aria-hidden />
        <div className="relative">
          <Logo className="text-2xl text-white [&_.text-gradient]:text-white" />
        </div>
        <div className="relative max-w-md">
          <h2 className="font-sora text-3xl font-bold leading-tight">
            Gestão vira <span className="text-white/70">desenvolvimento</span>.
          </h2>
          <p className="mt-4 text-white/70">
            Desenvolva seus liderados com base nas 9 virtudes cardeais de Alexandre
            Havard. 1:1s, feedback SBI, metas e PDI num só lugar.
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-white/80">
            {["1:1s estruturados e recorrentes", "Feedback SBI ancorado em virtudes", "PDIs e OKRs por trimestre"].map(
              (item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                    <Icon.check width={14} height={14} />
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Virttus · Desenvolvimento de liderados
        </p>
      </aside>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-bg bg-grad-mesh px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <Logo className="justify-center text-2xl" />
          </div>
          <Card className="text-center">
            <div className="mb-6">
              <h1 className="font-sora text-xl font-bold text-deep">Bem-vindo de volta</h1>
              <p className="mt-1 text-sm text-muted">Entre para desenvolver sua equipe.</p>
            </div>

            {GOOGLE_CONFIGURED ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/onboarding" });
                }}
              >
                <Button type="submit" variant="outline" className="w-full">
                  <GoogleIcon />
                  Continuar com Google
                </Button>
              </form>
            ) : LOCAL_LOGIN_CONFIGURED ? (
              <LocalLoginForm error={searchParams.error} />
            ) : (
              <p className="rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger">
                Login não configurado. Defina AUTH_GOOGLE_ID/SECRET ou LOCAL_LOGIN_PASSWORD.
              </p>
            )}

            <p className="mt-6 text-xs text-muted">
              Ao continuar, você concorda com o tratamento de dados conforme a LGPD.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
