import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, PageHeader, SectionTitle, Badge, Icon } from "@/components/ui";
import { RESOURCE_META, RESOURCE_TYPE_ORDER } from "@/lib/resource-meta";
import { virtueLabel } from "@/lib/virtues";
import { NewResourceForm, ResourceActions } from "./ResourceForms";
import type { Prisma, ResourceType } from "@prisma/client";

type SearchParams = { tipo?: string; q?: string };

export default async function CentralPage({ searchParams }: { searchParams: SearchParams }) {
  const { org } = await getContext();

  const tipo = RESOURCE_TYPE_ORDER.find((t) => t === searchParams.tipo);
  const q = (searchParams.q ?? "").trim().slice(0, 100);

  const where: Prisma.DevResourceWhereInput = {
    organizationId: org.id,
    ...(tipo ? { type: tipo } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tags: { has: q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [resources, counts] = await Promise.all([
    db.devResource.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { createdBy: { select: { name: true } } },
    }),
    db.devResource.groupBy({
      by: ["type"],
      where: { organizationId: org.id },
      _count: { _all: true },
    }),
  ]);

  const countByType = new Map<ResourceType, number>(counts.map((c) => [c.type, c._count._all]));
  const total = counts.reduce((a, c) => a + c._count._all, 0);
  const href = (t?: ResourceType) => {
    const p = new URLSearchParams();
    if (t) p.set("tipo", t);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/central?${s}` : "/central";
  };

  return (
    <div>
      <PageHeader
        icon="compass"
        eyebrow="Mural de aprendizado"
        title="Central de desenvolvimento"
        subtitle="Livros, podcasts, vídeos, cursos e artigos indicados pelo time — para estudar e crescer junto."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <form action="/central" method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
            {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por título, autor, tag…"
              className="w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-deep shadow-xs placeholder:text-muted-light hover:border-border-strong focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30"
            />
            <button
              type="submit"
              className="rounded-sm bg-grad px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-glow-blue"
            >
              Buscar
            </button>
          </form>

          <div className="mb-5 flex flex-wrap gap-2">
            <Link
              href={href()}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !tipo
                  ? "border-blue/30 bg-grad-soft text-blue shadow-sm"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-deep"
              }`}
            >
              Tudo
              <span className="rounded-full bg-bg px-1.5 text-[11px] font-bold tabular-nums text-muted-light">{total}</span>
            </Link>
            {RESOURCE_TYPE_ORDER.filter((t) => (countByType.get(t) ?? 0) > 0 || t === tipo).map((t) => (
              <Link
                key={t}
                href={href(t)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  tipo === t
                    ? "border-blue/30 bg-grad-soft text-blue shadow-sm"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-deep"
                }`}
              >
                {RESOURCE_META[t].plural}
                <span className="rounded-full bg-bg px-1.5 text-[11px] font-bold tabular-nums text-muted-light">
                  {countByType.get(t) ?? 0}
                </span>
              </Link>
            ))}
          </div>

          {resources.length === 0 ? (
            <EmptyState
              icon="◆"
              title={total === 0 ? "O mural está vazio" : "Nada encontrado"}
              description={
                total === 0
                  ? "Indique o primeiro livro, podcast, vídeo ou curso ao lado — cada indicação fica salva para o time todo."
                  : "Tente outro termo ou limpe o filtro de tipo."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.map((r) => {
                const meta = RESOURCE_META[r.type];
                return (
                  <Card key={r.id} padded={false} hover className="flex flex-col overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${meta.accent}`} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.chip}`}>{meta.label}</span>
                        {r.focusVirtue ? <Badge tone="purple">{virtueLabel(r.focusVirtue)}</Badge> : null}
                        {r.pinned ? (
                          <span className="ml-auto text-purple" title="Fixado no topo">
                            <Icon.pin width={14} height={14} />
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 font-sora text-base font-bold leading-snug text-deep">{r.title}</h3>
                      {r.author ? <p className="text-xs text-muted">{r.author}</p> : null}
                      {r.description ? (
                        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted">{r.description}</p>
                      ) : null}
                      {r.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.tags.map((t) => (
                            <span key={t} className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
                              #{t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-auto pt-4">
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline"
                          >
                            Acessar <Icon.external width={14} height={14} />
                          </a>
                        ) : null}
                        <p className="mt-2 text-[11px] text-muted-light">
                          Indicado por {r.createdBy?.name ?? "alguém do time"}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border px-5 py-3">
                      <ResourceActions id={r.id} pinned={r.pinned} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <SectionTitle hint="Salve uma indicação para o time todo.">Indicar conteúdo</SectionTitle>
          <NewResourceForm />
        </Card>
      </div>
    </div>
  );
}
