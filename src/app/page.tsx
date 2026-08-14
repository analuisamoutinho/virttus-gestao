import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { Badge, ButtonLink, Icon, Logo, type IconName } from "@/components/ui";
import { VirtueRadar } from "@/components/charts/VirtueRadar";
import { PLAN_LIMITS } from "@/server/plan/limits";

const MICROCOPY = [
  "Gestão de performance",
  "Desenvolvimento individual",
  "Cultura forte em escala",
];

const PAIN_BAD = [
  "Líderes apagando incêndios constantemente",
  "Cobrança sem desenvolvimento real",
  "Equipes desmotivadas e sem direção",
  "Crescimento desorganizado e sem registro",
  "Conversas difíceis sem estrutura ou preparo",
];

const PAIN_GOOD = [
  "Evolução contínua com registro histórico",
  "Clareza de performance e desenvolvimento",
  "Plano individual de desenvolvimento por pessoa",
  "Cultura forte e escalável com dados reais",
  "Roteiros estruturados para conversas difíceis",
];

const MODULES: {
  icon: IconName;
  num: string;
  name: string;
  desc: string;
  tag: string;
  purple?: boolean;
}[] = [
  {
    icon: "dashboard",
    num: "01",
    name: "Dashboard",
    desc: "Visão panorâmica do time. Radar das 9 virtudes, KPIs do trimestre e alertas de pessoas sem 1:1 há mais de 21 dias.",
    tag: "Visão geral",
  },
  {
    icon: "team",
    num: "02",
    name: "Equipe completa",
    desc: "Perfil de cada liderado com abas integradas: visão geral, perfil pessoal, 1:1s, feedbacks, metas e PDI num só lugar.",
    tag: "Gestão de pessoas",
  },
  {
    icon: "oneOnOne",
    num: "03",
    name: "1:1s estruturados",
    desc: "Agendamento, pauta, notas, ações de acompanhamento, virtude foco e mood — tudo registrado e acessível no histórico.",
    tag: "Acompanhamento",
    purple: true,
  },
  {
    icon: "feedback",
    num: "04",
    name: "Feedback SBI",
    desc: "Modelo Situação → Comportamento → Impacto. Reconhecimento ou construtivo, ancorado numa virtude de desenvolvimento.",
    tag: "Crescimento",
  },
  {
    icon: "goals",
    num: "05",
    name: "Metas & OKRs",
    desc: "Objetivos com Key Results e progresso auto-calculado. Cada meta ligada a uma área de desenvolvimento da pessoa.",
    tag: "Performance",
    purple: true,
  },
  {
    icon: "pdi",
    num: "06",
    name: "PDI por trimestre",
    desc: "Plano de Desenvolvimento Individual focado em uma competência por trimestre. Ações, prazos e evidências de evolução.",
    tag: "Desenvolvimento",
  },
  {
    icon: "training",
    num: "07",
    name: "Treinamentos",
    desc: "Board de trilhas e treinamentos por competência, com acompanhamento de progresso de cada liderado.",
    tag: "Capacitação",
    purple: true,
  },
  {
    icon: "chat",
    num: "08",
    name: "Construir conversa",
    desc: "Engine que gera roteiros para conversas difíceis. Abertura, perguntas socráticas e fechamento — personalizado por perfil pessoal.",
    tag: "Novo 🔥",
    purple: true,
  },
];

const STEPS = [
  { n: 1, title: "Cadastre sua equipe", desc: "Adicione seus liderados e preencha o perfil pessoal de cada um." },
  { n: 2, title: "Defina metas e competências", desc: "Crie OKRs e PDIs alinhados ao desenvolvimento individual." },
  { n: 3, title: "Acompanhe a evolução", desc: "Dashboard com radar de virtudes, KPIs e histórico completo." },
  { n: 4, title: "Desenvolva líderes", desc: "Gere conversas estruturadas e feedbacks com impacto real." },
];

const TESTIMONIALS = [
  {
    quote:
      "Antes eu entrava nas conversas difíceis no improviso. Agora tenho um roteiro estruturado, personalizado para cada pessoa. A qualidade dos meus 1:1s mudou completamente.",
    name: "Ana Moutinho",
    role: "Head de Produto",
  },
  {
    quote:
      "Finalmente uma ferramenta que entende que gestão de pessoas não é só sobre tarefas. O perfil pessoal de cada liderado mudou como me preparo para cada conversa.",
    name: "Ricardo Alves",
    role: "Diretor de Engenharia",
  },
  {
    quote:
      "O radar de virtudes do time virou meu principal instrumento de liderança. Consigo ver de forma clara onde cada pessoa está e o que precisa para crescer.",
    name: "Carla Santos",
    role: "VP de Operações",
  },
];

const METHODOLOGIES = [
  "Havard VCLA Framework",
  "Feedback SBI",
  "Radical Candor",
  "OKRs",
  "Crucial Conversations",
  "NVC",
  "GROW Coaching",
  "9 Virtudes Cardeais",
];

function NavPublic() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#modules" className="text-sm font-medium text-muted transition hover:text-deep">
            Módulos
          </a>
          <a href="#how" className="text-sm font-medium text-muted transition hover:text-deep">
            Como funciona
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted transition hover:text-deep">
            Preços
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
          <ButtonLink href="/login" size="sm" icon="sparkle">
            Começar grátis
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-card bg-grad-soft blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lg">
        <div className="flex items-center gap-2 border-b border-border bg-bg px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate rounded-md border border-border bg-surface px-3 py-1 text-[11px] text-muted">
            virttus.app/dashboard
          </span>
        </div>
        <div className="grid grid-cols-[auto,1fr]">
          <div className="hidden w-40 flex-col gap-1 border-r border-border p-3 sm:flex">
            {(
              [
                ["dashboard", "Dashboard", true],
                ["team", "Equipe", false],
                ["oneOnOne", "1:1s", false],
                ["feedback", "Feedback", false],
                ["goals", "Metas OKR", false],
                ["pdi", "PDI", false],
                ["chat", "Conversa", false],
              ] as [IconName, string, boolean][]
            ).map(([icon, label, active]) => {
              const IconCmp = Icon[icon];
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                    active ? "bg-grad-soft text-deep" : "text-muted"
                  }`}
                >
                  <IconCmp width={13} height={13} className={active ? "text-purple" : ""} />
                  {label}
                </div>
              );
            })}
          </div>
          <div className="p-4 sm:p-5">
            <p className="font-sora text-sm font-bold text-deep">Bom dia, Ana 👋</p>
            <p className="text-[11px] text-muted">Q2 2026 · 5 liderados · 2 alertas</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border p-2">
                <p className="text-[9px] font-semibold uppercase text-muted">Índice virtude</p>
                <p className="font-sora text-lg font-bold text-blue">7.4</p>
                <p className="text-[9px] text-success">↑ +0.3 Q1</p>
              </div>
              <div className="rounded-lg border border-border p-2">
                <p className="text-[9px] font-semibold uppercase text-muted">1:1s no prazo</p>
                <p className="font-sora text-lg font-bold text-deep">4/5</p>
                <p className="text-[9px] text-muted">1 pendente</p>
              </div>
              <div className="rounded-lg border border-border p-2">
                <p className="text-[9px] font-semibold uppercase text-muted">PDIs ativos</p>
                <p className="font-sora text-lg font-bold text-deep">5</p>
                <p className="text-[9px] text-success">3 on track</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-border p-2">
              <p className="mb-1 text-[10px] font-semibold text-deep">Radar do time</p>
              <VirtueRadar
                size={180}
                scores={{
                  MAGNANIMIDADE: 8,
                  HUMILDADE: 6.5,
                  PRUDENCIA: 7,
                  JUSTICA: 7.5,
                  CORAGEM: 6,
                  AUTOCONTROLE: 8.5,
                  FE: 6,
                  ESPERANCA: 7,
                  CARIDADE: 8,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -left-6 -top-5 hidden rounded-xl border border-border bg-surface px-4 py-3 shadow-md sm:block">
        <p className="text-[10px] font-semibold uppercase text-muted">Índice do time</p>
        <p className="font-sora text-xl font-bold text-blue">7.4</p>
      </div>
      <div className="absolute -bottom-5 -right-4 hidden rounded-xl border border-border bg-surface px-4 py-3 shadow-md sm:block">
        <p className="text-[10px] font-semibold uppercase text-muted">PDIs ativos</p>
        <p className="font-sora text-xl font-bold text-purple">5</p>
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface">
      <NavPublic />

      {/* HERO */}
      <section className="relative bg-bg bg-grad-mesh">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue/20 bg-grad-soft px-3.5 py-1.5 text-xs font-semibold text-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-grad" />
              Baseado no framework de Alexandre Havard
            </span>
            <h1 className="font-sora text-4xl font-bold leading-[1.1] tracking-tight text-deep sm:text-5xl lg:text-[54px]">
              Sua empresa cresce na velocidade das{" "}
              <span className="text-gradient">pessoas que você desenvolve.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              O Virttus transforma gestão em desenvolvimento. Acompanhe performance,
              crescimento e evolução individual da sua equipe em um único sistema.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/login" icon="sparkle">
                Começar grátis
              </ButtonLink>
              <ButtonLink href="#modules" variant="outline">
                Ver demonstração
              </ButtonLink>
            </div>
            <div className="mt-9 flex flex-wrap gap-5">
              {MICROCOPY.map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs text-muted">
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-blue/20 bg-grad-soft">
                    <Icon.check width={10} height={10} className="text-blue" />
                  </span>
                  {m}
                </div>
              ))}
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      {/* PAIN */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple">O problema</p>
          <h2 className="mt-3 font-sora text-3xl font-bold text-deep sm:text-4xl">
            A maioria das empresas gerencia tarefas.
            <br />
            <span className="text-gradient">Poucas desenvolvem pessoas.</span>
          </h2>
          <p className="mt-4 text-muted">
            Existe uma diferença enorme entre cobrar resultados e desenvolver quem os entrega.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-card border border-border bg-bg p-7">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-lg">
              ❌
            </span>
            <h3 className="font-sora text-lg font-semibold text-deep">Gestão tradicional</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {PAIN_BAD.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                  <Icon.alert width={14} height={14} className="mt-0.5 shrink-0 text-danger" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-purple/25 bg-grad-soft p-7">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-purple shadow-sm">
              <Icon.sparkle width={20} height={20} />
            </span>
            <h3 className="font-sora text-lg font-semibold text-deep">Com Virttus</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {PAIN_GOOD.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-deep">
                  <Icon.check width={14} height={14} className="mt-0.5 shrink-0 text-blue" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="bg-bg py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-purple">Módulos</p>
            <h2 className="mt-3 font-sora text-3xl font-bold text-deep sm:text-4xl">
              Tudo que um líder precisa para
              <br />
              <span className="text-gradient">desenvolver equipes extraordinárias</span>
            </h2>
            <p className="mt-4 text-muted">
              {MODULES.length} módulos integrados — do acompanhamento diário ao plano de longo prazo.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => {
              const IconCmp = Icon[m.icon];
              return (
                <div
                  key={m.num}
                  className={`rounded-card border bg-surface p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                    m.purple ? "border-purple/25" : "border-border"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      m.purple ? "bg-purple/10 text-purple" : "bg-blue/10 text-blue"
                    }`}
                  >
                    <IconCmp width={22} height={22} />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-muted-light">{m.num} —</p>
                  <h3 className="font-sora text-base font-semibold text-deep">{m.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.desc}</p>
                  <Badge tone={m.purple ? "purple" : "blue"} className="mt-4">
                    {m.tag}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="relative overflow-hidden bg-grad-deep py-24 text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple/20 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold">
            <Icon.sparkle width={14} height={14} />
            Manifesto Virttus
          </span>
          <h2 className="mt-5 font-sora text-3xl font-bold sm:text-4xl">
            Pessoas melhores constroem
            <br />
            <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              empresas melhores.
            </span>
          </h2>
          <p className="mt-5 text-white/70">
            O Virttus foi criado para empresas que entendem que performance sustentável nasce
            do desenvolvimento humano. Enquanto todos os outros SaaS falam de produtividade e
            tarefas, o Virttus fala de virtude, caráter e crescimento real.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              ["9", "Virtudes mapeadas"],
              [String(MODULES.length), "Módulos integrados"],
              ["1", "Missão: desenvolver pessoas"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-sora text-4xl font-bold">{value}</p>
                <p className="mt-1 text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple">Como funciona</p>
          <h2 className="mt-3 font-sora text-3xl font-bold text-deep sm:text-4xl">
            Configure em minutos,
            <br />
            <span className="text-gradient">lidere para sempre</span>
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-card border border-border bg-surface p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad font-sora text-sm font-bold text-white shadow-glow-blue">
                {s.n}
              </span>
              <h3 className="mt-4 font-sora text-base font-semibold text-deep">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF */}
      <section className="bg-bg py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-purple">Autoridade</p>
            <h2 className="mt-3 font-sora text-3xl font-bold text-deep sm:text-4xl">
              Criado com base em princípios reais
              <br />
              <span className="text-gradient">de liderança e desenvolvimento</span>
            </h2>
            <p className="mt-4 text-muted">
              Sistematizamos o que os melhores frameworks de liderança já provaram.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <p className="font-sora text-3xl text-purple/40">&ldquo;</p>
                <p className="-mt-3 text-sm leading-relaxed text-deep">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad-soft font-sora text-xs font-bold text-blue">
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-deep">{t.name}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Baseado em</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {METHODOLOGIES.map((m) => (
                <Badge key={m} tone="neutral" className="border border-border bg-surface">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple">Planos</p>
          <h2 className="mt-3 font-sora text-3xl font-bold text-deep sm:text-4xl">
            Simples, transparente,
            <br />
            <span className="text-gradient">sem surpresas</span>
          </h2>
          <p className="mt-4 text-muted">Comece gratuitamente. Cresça conforme sua equipe cresce.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {(
            [
              {
                plan: PLAN_LIMITS.STARTER,
                desc: "Para líderes que querem começar com intencionalidade.",
                cta: "Começar grátis",
                featured: false,
                feats: [
                  ["Até 3 liderados", true],
                  ["Dashboard com radar de virtudes", true],
                  ["1:1s ilimitados", true],
                  ["Feedback SBI", true],
                  ["Construtor de conversa", false],
                  ["PDI avançado", false],
                  ["Exportações PDF/CSV", false],
                ] as [string, boolean][],
              },
              {
                plan: PLAN_LIMITS.PRO,
                desc: "Para líderes que levam desenvolvimento a sério.",
                cta: "Assinar Pro",
                featured: true,
                feats: [
                  ["Até 10 liderados", true],
                  ["Dashboard completo + radar", true],
                  ["1:1s ilimitados + histórico", true],
                  ["Feedback SBI completo", true],
                  ["Construtor de conversa", true],
                  ["PDI avançado por trimestre", true],
                  ["OKRs + evolução histórica", true],
                  ["Exportações PDF e CSV", true],
                ] as [string, boolean][],
              },
              {
                plan: PLAN_LIMITS.TIME,
                desc: "Para organizações com múltiplos líderes.",
                cta: "Falar com a equipe",
                featured: false,
                feats: [
                  ["Até 5 líderes + equipes ilimitadas", true],
                  ["Tudo do plano Pro", true],
                  ["Painel de RH com visão agregada", true],
                  ["Benchmarks entre times", true],
                  ["Relatório trimestral automatizado", true],
                  ["Suporte prioritário + onboarding", true],
                ] as [string, boolean][],
              },
            ] as const
          ).map(({ plan, desc, cta, featured, feats }) => (
            <div
              key={plan.label}
              className={`relative flex flex-col rounded-card border p-7 ${
                featured
                  ? "border-purple/30 bg-grad-deep text-white shadow-lg"
                  : "border-border bg-surface shadow-sm"
              }`}
            >
              {featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-grad px-3 py-1 text-[11px] font-semibold text-white shadow-glow-blue">
                  Mais popular
                </span>
              ) : null}
              <h3 className={`font-sora text-lg font-semibold ${featured ? "text-white" : "text-deep"}`}>
                {plan.label}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`font-sora text-4xl font-bold ${featured ? "text-white" : "text-deep"}`}>
                  {plan.priceLabel === "Grátis" ? "R$0" : plan.priceLabel.split("/")[0]}
                </span>
                {plan.priceLabel !== "Grátis" ? (
                  <span className={featured ? "text-white/60" : "text-muted"}>/mês</span>
                ) : (
                  <span className={featured ? "text-white/60" : "text-muted"}>/mês</span>
                )}
              </div>
              <p className={`mt-2 text-sm ${featured ? "text-white/70" : "text-muted"}`}>{desc}</p>
              <div className={`my-6 h-px ${featured ? "bg-white/15" : "bg-border"}`} />
              <ul className="flex flex-1 flex-col gap-3">
                {feats.map(([label, on]) => (
                  <li
                    key={label}
                    className={`flex items-start gap-2.5 text-sm ${
                      on ? (featured ? "text-white" : "text-deep") : featured ? "text-white/40" : "text-muted-light"
                    }`}
                  >
                    {on ? (
                      <Icon.check
                        width={14}
                        height={14}
                        className={`mt-0.5 shrink-0 ${featured ? "text-white" : "text-blue"}`}
                      />
                    ) : (
                      <span className="mt-0.5 h-3.5 w-3.5 shrink-0 border-t border-current opacity-40" />
                    )}
                    {label}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/login"
                className="mt-7 justify-center"
                variant={featured ? "primary" : "outline"}
              >
                {cta}
              </ButtonLink>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-grad-mesh bg-bg py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple">Comece hoje</p>
          <h2 className="mt-3 font-sora text-3xl font-bold text-deep sm:text-4xl">
            Desenvolva equipes <span className="text-gradient">extraordinárias.</span>
          </h2>
          <p className="mt-4 text-muted">
            Gestão não deveria formar apenas profissionais mais produtivos. Deveria formar
            pessoas melhores.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/login" icon="sparkle">
              Começar grátis
            </ButtonLink>
            <ButtonLink href="#modules" variant="outline">
              Ver demonstração
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                Gestão de equipe baseada nas 9 virtudes do framework de Alexandre Havard. Para
                líderes que desenvolvem o ser humano inteiro.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-deep">Produto</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted">
                <li><a href="#modules" className="hover:text-deep">Módulos</a></li>
                <li><a href="#pricing" className="hover:text-deep">Preços</a></li>
                <li><a href="/login" className="hover:text-deep">Entrar</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-deep">Recursos</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted">
                <li><a href="#how" className="hover:text-deep">Como funciona</a></li>
                <li><a href="#modules" className="hover:text-deep">Manifesto</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-deep">Contato</p>
              <p className="mt-4 text-sm text-muted">contato@virttus.app</p>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-6 text-xs text-muted-light">
            © {new Date().getFullYear()} Virttus. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}
