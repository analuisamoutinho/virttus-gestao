import { NextResponse } from "next/server";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { hasFeature } from "@/server/plan/gate";
import { writeAuditLog } from "@/server/audit";
import { toCsv } from "@/lib/csv";
import { virtueIndex, teamRadar } from "@/server/services/virtue-score";
import { isStale, daysSince } from "@/server/services/alerts";
import { formatDate } from "@/lib/format";

// Exportação CSV da equipe (plano Pro+). Best-effort de auditoria (LGPD).
export async function GET() {
  const { org, userId } = await getContext();

  if (!hasFeature(org, "export")) {
    return NextResponse.json({ error: "Recurso indisponível neste plano." }, { status: 403 });
  }

  const [members, scores, oneOnOnes] = await Promise.all([
    db.teamMember.findMany({
      where: { organizationId: org.id, active: true },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.virtueScore.findMany({
      where: { organizationId: org.id },
      select: { teamMemberId: true, virtue: true, score: true, recordedAt: true },
    }),
    db.oneOnOne.findMany({
      where: { organizationId: org.id, status: "DONE" },
      select: { teamMemberId: true, scheduledAt: true },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  const lastByMember = new Map<string, Date>();
  for (const o of oneOnOnes) {
    if (!lastByMember.has(o.teamMemberId)) lastByMember.set(o.teamMemberId, o.scheduledAt);
  }

  const rows: (string | number)[][] = [
    ["Nome", "Cargo", "E-mail", "Índice de virtude", "Último 1:1", "Dias sem 1:1", "Status"],
  ];
  for (const m of members) {
    const memberScores = scores.filter((s) => s.teamMemberId === m.id);
    const index = virtueIndex(teamRadar(memberScores));
    const last = lastByMember.get(m.id) ?? null;
    rows.push([
      m.name,
      m.role ?? "",
      m.email ?? "",
      index || "",
      last ? formatDate(last) : "",
      last ? (daysSince(last) ?? "") : "",
      isStale(last) ? "Atrasado" : "Em dia",
    ]);
  }

  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "export.csv",
    entity: "TeamMember",
  });

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="virttus-equipe-${org.slug}.csv"`,
    },
  });
}
