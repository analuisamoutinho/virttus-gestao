import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, PageHeader, SectionTitle, Badge, Icon } from "@/components/ui";
import {
  buildMonthGrid,
  dayKey,
  groupByDay,
  monthLabel,
  monthParam,
  monthRange,
  parseMonthParam,
  shiftMonth,
  WEEKDAYS_PT,
} from "@/lib/calendar";
import { CALL_KIND_META } from "@/lib/call-kinds";
import { snippetAround } from "@/lib/transcript";
import { formatDateTime } from "@/lib/format";
import { NewCallForm } from "./CallForms";

type SearchParams = { mes?: string; q?: string };

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  date: Date;
  href: string;
  kindLabel: string;
  chip: string;
  hasTranscript: boolean;
  external: boolean; // treinamento/1:1 vindos de outros módulos
};

const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const MAX_PER_DAY = 3;

export default async function CallsPage({ searchParams }: { searchParams: SearchParams }) {
  const { org } = await getContext();

  const ref = parseMonthParam(searchParams.mes);
  const { start, end } = monthRange(ref);
  const q = (searchParams.q ?? "").trim().slice(0, 100);

  const [calls, trainings, oneOnOnes, upcoming, withTranscript, matches] = await Promise.all([
    db.call.findMany({
      where: { organizationId: org.id, scheduledAt: { gte: start, lt: end } },
      orderBy: { scheduledAt: "asc" },
      include: { transcript: { select: { id: true } } },
    }),
    db.training.findMany({
      where: { organizationId: org.id, scheduledAt: { gte: start, lt: end }, status: { not: "CANCELED" } },
      orderBy: { scheduledAt: "asc" },
      select: { id: true, title: true, scheduledAt: true },
    }),
    db.oneOnOne.findMany({
      where: { organizationId: org.id, scheduledAt: { gte: start, lt: end }, status: { not: "CANCELED" } },
      orderBy: { scheduledAt: "asc" },
      select: { id: true, scheduledAt: true, teamMember: { select: { name: true } } },
    }),
    db.call.findMany({
      where: { organizationId: org.id, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: { id: true, title: true, kind: true, scheduledAt: true },
    }),
    db.callTranscript.count({ where: { organizationId: org.id } }),
    q
      ? db.callTranscript.findMany({
          where: { organizationId: org.id, content: { contains: q, mode: "insensitive" } },
          take: 15,
          orderBy: { updatedAt: "desc" },
          include: { call: { select: { id: true, title: true, scheduledAt: true } } },
        })
      : Promise.resolve([]),
  ]);

  const events: CalendarEvent[] = [
    ...calls.map((c) => ({
      id: `call-${c.id}`,
      title: c.title,
      time: timeFmt.format(c.scheduledAt),
      date: c.scheduledAt,
      href: `/calls/${c.id}`,
      kindLabel: CALL_KIND_META[c.kind].label,
      chip: CALL_KIND_META[c.kind].chip,
      hasTranscript: !!c.transcript,
      external: false,
    })),
    ...trainings.map((t) => ({
      id: `tr-${t.id}`,
      title: t.title,
      time: timeFmt.format(t.scheduledAt),
      date: t.scheduledAt,
      href: "/treinamentos",
      kindLabel: "Treinamento",
      chip: "bg-bg text-muted ring-1 ring-inset ring-border",
      hasTranscript: false,
      external: true,
    })),
    ...oneOnOnes.map((o) => ({
      id: `oo-${o.id}`,
      title: `1:1 · ${o.teamMember.name}`,
      time: timeFmt.format(o.scheduledAt),
      date: o.scheduledAt,
      href: "/um-a-um",
      kindLabel: "1:1",
      chip: "bg-bg text-muted ring-1 ring-inset ring-border",
      hasTranscript: false,
      external: true,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const byDay = groupByDay(events, (e) => e.date);
  const weeks = buildMonthGrid(ref);
  const todayKey = dayKey(new Date());
  const prev = monthParam(shiftMonth(ref, -1));
  const next = monthParam(shiftMonth(ref, 1));
  const qs = (mes: string) => `/calls?mes=${mes}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <PageHeader
        icon="calendar"
        eyebrow="Agenda do time"
        title="Calendário de calls"
        subtitle={`${withTranscript} ${withTranscript === 1 ? "call com transcrição" : "calls com transcrição"} — alinhamentos, decisões e combinados ficam pesquisáveis.`}
      />

      {/* Busca nas transcrições */}
      <form action="/calls" method="get" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="mes" value={monthParam(ref)} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar nas transcrições (ex.: “verba”, “prazo”, “FOCEX”)…"
          className="w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-deep shadow-xs placeholder:text-muted-light hover:border-border-strong focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
        <button
          type="submit"
          className="rounded-sm bg-grad px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-glow-blue"
        >
          Buscar
        </button>
      </form>

      {q ? (
        <Card className="mb-6">
          <SectionTitle hint={`${matches.length} ${matches.length === 1 ? "resultado" : "resultados"} para “${q}”`}>
            Resultados nas transcrições
          </SectionTitle>
          {matches.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma transcrição menciona esse termo.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {matches.map((m) => (
                <li key={m.id} className="py-3">
                  <Link href={`/calls/${m.call.id}`} className="font-sora text-sm font-semibold text-deep hover:text-blue">
                    {m.call.title}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{formatDateTime(m.call.scheduledAt)}</span>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{snippetAround(m.content, q)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card padded={false} className="overflow-hidden">
          {/* Cabeçalho do mês */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <h2 className="font-sora text-lg font-bold text-deep">{monthLabel(ref)}</h2>
            <div className="flex items-center gap-1">
              <Link
                href={qs(prev)}
                aria-label="Mês anterior"
                className="flex h-9 w-9 items-center justify-center rounded-sm text-muted hover:bg-bg hover:text-deep"
              >
                <Icon.chevronLeft width={18} height={18} />
              </Link>
              <Link
                href={qs(monthParam(parseMonthParam(undefined)))}
                className="rounded-sm px-3 py-2 text-xs font-semibold text-deep hover:bg-bg"
              >
                Hoje
              </Link>
              <Link
                href={qs(next)}
                aria-label="Próximo mês"
                className="flex h-9 w-9 items-center justify-center rounded-sm text-muted hover:bg-bg hover:text-deep"
              >
                <Icon.chevronRight width={18} height={18} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-7 border-b border-border bg-bg/60">
                {WEEKDAYS_PT.map((w) => (
                  <div key={w} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
                    {w}
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-border last:border-0">
                  {week.map((day) => {
                    const dayEvents = byDay.get(day.key) ?? [];
                    const isToday = day.key === todayKey;
                    return (
                      <div
                        key={day.key}
                        className={`min-h-[104px] border-r border-border p-1.5 last:border-0 ${
                          day.inMonth ? "bg-surface" : "bg-bg/50"
                        }`}
                      >
                        <span
                          className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-grad text-white"
                              : day.inMonth
                                ? "text-deep"
                                : "text-muted-light"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                        <div className="flex flex-col gap-1">
                          {dayEvents.slice(0, MAX_PER_DAY).map((e) => (
                            <Link
                              key={e.id}
                              href={e.href}
                              title={`${e.time} · ${e.title}`}
                              className={`flex items-center gap-1 truncate rounded-[8px] px-1.5 py-1 text-[11px] font-medium leading-tight transition hover:brightness-95 ${e.chip}`}
                            >
                              <span className="shrink-0 tabular-nums opacity-70">{e.time}</span>
                              <span className="truncate">{e.title}</span>
                              {e.hasTranscript ? (
                                <span className="ml-auto shrink-0" title="Com transcrição">
                                  <Icon.mic width={11} height={11} />
                                </span>
                              ) : null}
                            </Link>
                          ))}
                          {dayEvents.length > MAX_PER_DAY ? (
                            <span className="px-1.5 text-[11px] font-semibold text-muted">
                              +{dayEvents.length - MAX_PER_DAY} mais
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-[11px] text-muted sm:px-6">
            {Object.values(CALL_KIND_META).map((k) => (
              <span key={k.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${k.dot}`} />
                {k.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <Icon.mic width={12} height={12} /> com transcrição
            </span>
            <span className="ml-auto">Cinza = treinamentos e 1:1s de outros módulos</span>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle hint="Próximas 5 calls agendadas.">Próximas calls</SectionTitle>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma call futura agendada.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {upcoming.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <Link href={`/calls/${c.id}`} className="text-sm font-semibold text-deep hover:text-blue">
                      {c.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <Badge tone="neutral">{CALL_KIND_META[c.kind].label}</Badge>
                      {formatDateTime(c.scheduledAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle hint="A transcrição é anexada depois, na página da call.">Nova call</SectionTitle>
            <NewCallForm />
          </Card>
        </div>
      </div>

      {calls.length === 0 && !q ? (
        <div className="mt-6">
          <EmptyState
            icon="▦"
            title="Nenhuma call neste mês"
            description="Agende a primeira call ao lado. Depois da reunião, cole ou importe a transcrição para o time poder pesquisar decisões e combinados."
          />
        </div>
      ) : null}
    </div>
  );
}
