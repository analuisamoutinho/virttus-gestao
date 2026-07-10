import { PrismaClient, Virtue } from "@prisma/client";
import { currentQuarter } from "../src/server/services/okr";

const db = new PrismaClient();

// Seed de demonstração: 1 org PRO, 1 admin/líder, 3 liderados com perfil,
// séries de VirtueScore para popular o radar, e alguns 1:1s.
async function main() {
  const org = await db.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Ltda",
      slug: "acme",
      plan: "PRO",
      billingStatus: "ACTIVE",
      onboardedAt: new Date(),
    },
  });

  const leader = await db.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "lider@acme.com" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Ana Líder",
      email: "lider@acme.com",
      role: "ADMIN",
    },
  });

  const virtues: Virtue[] = [
    "MAGNANIMIDADE",
    "HUMILDADE",
    "PRUDENCIA",
    "JUSTICA",
    "CORAGEM",
    "AUTOCONTROLE",
    "FE",
    "ESPERANCA",
    "CARIDADE",
  ];

  const people = [
    { name: "Bruno Souza", role: "Analista Pleno" },
    { name: "Carla Dias", role: "Desenvolvedora Sênior" },
    { name: "Diego Lima", role: "Designer" },
  ];

  for (const p of people) {
    const member = await db.teamMember.create({
      data: {
        organizationId: org.id,
        leaderId: leader.id,
        name: p.name,
        role: p.role,
        startedAt: new Date("2025-01-15"),
        profile: {
          create: {
            motivators: "Autonomia e reconhecimento público.",
            feedbackPrefs: "Prefere feedback 1:1, direto, com exemplos concretos.",
            communicationStyle: "Objetivo, gosta de contexto antes da tarefa.",
          },
        },
      },
    });

    // Radar: um score por virtude
    await db.virtueScore.createMany({
      data: virtues.map((v, i) => ({
        organizationId: org.id,
        teamMemberId: member.id,
        virtue: v,
        score: 5 + ((i + p.name.length) % 5), // 5–9 pseudo-variado
        source: "assessment",
      })),
    });

    // Um 1:1 recente
    await db.oneOnOne.create({
      data: {
        organizationId: org.id,
        teamMemberId: member.id,
        scheduledAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        status: "DONE",
        agenda: "Check-in trimestral",
        focusVirtue: "CORAGEM",
        mood: 4,
      },
    });

    // Um objetivo (OKR) com progresso auto-calculado a partir dos KRs
    await db.goal.create({
      data: {
        organizationId: org.id,
        teamMemberId: member.id,
        objective: "Elevar a qualidade das entregas do trimestre",
        quarter: currentQuarter(),
        progress: 55,
        keyResults: {
          create: [
            { title: "Reduzir bugs em produção", target: 10, current: 6, unit: "un." },
            { title: "Cobertura de testes", target: 80, current: 44, unit: "%" },
          ],
        },
      },
    });

    // Um PDI do trimestre
    await db.pDI.create({
      data: {
        organizationId: org.id,
        teamMemberId: member.id,
        quarter: currentQuarter(),
        focusVirtue: "HUMILDADE",
        competency: "Pedir e incorporar feedback com abertura",
        actions: {
          create: [
            { text: "Pedir feedback ao fim de cada sprint", done: true },
            { text: "Registrar 1 aprendizado por semana", done: false },
          ],
        },
      },
    });
  }

  console.log(`Seed OK: org=${org.slug}, ${people.length} liderados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
