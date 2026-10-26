import { notFound } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, PageHeader, SectionTitle, Badge, ProgressBar, ButtonLink } from "@/components/ui";
import { getScenario, DIFFICULTY_LABEL, type Difficulty } from "@/lib/feedback-scenarios";
import {
  BAND_LABEL,
  bandFor,
  computeTrust,
  scoreLabel,
  type Debrief,
  type PracticeMessage,
} from "@/lib/feedback-trainer";
import { llmEnabled } from "@/server/services/feedback-trainer-llm";
import { DeletePracticeButton, PracticeChat } from "../PracticeForms";

function readMessages(raw: unknown): PracticeMessage[] {
  return Array.isArray(raw) ? (raw as PracticeMessage[]) : [];
}

export default async function PracticePage({ params }: { params: { practiceId: string } }) {
  const { org, userId } = await getContext();

  const practice = await db.feedbackPractice.findFirst({
    where: { id: params.practiceId, organizationId: org.id, userId },
  });
  if (!practice) notFound();

  const scenario = getScenario(practice.scenarioKey);
  if (!scenario) notFound();

  const difficulty = practice.difficulty as Difficulty;
  const messages = readMessages(practice.messages);
  const leaderTexts = messages.filter((m) => m.role === "leader").map((m) => m.content);
  const trust = computeTrust(difficulty, leaderTexts);
  const debrief = practice.debrief as Debrief | null;
  const engineLabel = llmEnabled() ? "IA conectada" : "simulação por regras";

  return (
    <div>
      <PageHeader
        icon="mic"
        eyebrow={`Treino · ${DIFFICULTY_LABEL[difficulty].label}`}
        title={scenario.title}
        subtitle={scenario.tagline}
        actions={
          <>
            <ButtonLink href="/treino-feedback" variant="outline" size="sm" icon="chevronLeft">
              Cenários
            </ButtonLink>
            <DeletePracticeButton practiceId={practice.id} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          {practice.status === "IN_PROGRESS" ? (
            <PracticeChat
              practiceId={practice.id}
              personaName={scenario.personaName}
              personaRole={scenario.personaRole}
              difficulty={difficulty}
              initialMessages={messages}
              initialTrust={trust}
              initialBand={bandFor(trust)}
              engineLabel={engineLabel}
            />
          ) : debrief ? (
            <>
              <Card>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-grad text-white shadow-glow-blue">
                    <span className="font-sora text-3xl font-bold tabular-nums">{debrief.score}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">de 100</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-sora text-xl font-bold text-deep">{scoreLabel(debrief.score)}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {debrief.turns} {debrief.turns === 1 ? "fala" : "falas"} · {scenario.personaName} terminou{" "}
                      <strong className="text-deep">{BAND_LABEL[debrief.finalBand].toLowerCase()}</strong> (
                      {debrief.finalTrust}/100)
                    </p>
                    <p className="mt-1 text-xs text-muted">Objetivo do cenário: {scenario.goal}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle hint="Cada dimensão vale até 20 pontos.">Avaliação por dimensão</SectionTitle>
                <ul className="flex flex-col gap-4">
                  {debrief.dimensions.map((d) => (
                    <li key={d.key}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-deep">
                          {d.label} <span className="text-xs font-normal text-muted">· {d.virtue}</span>
                        </span>
                        <span className="text-sm font-bold tabular-nums text-blue">
                          {d.score}/{d.max}
                        </span>
                      </div>
                      <ProgressBar
                        value={(d.score / d.max) * 100}
                        tone={d.score >= 14 ? "success" : d.score >= 8 ? "blue" : "warn"}
                      />
                      {d.score < 14 ? <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.tip}</p> : null}
                    </li>
                  ))}
                </ul>
              </Card>

              {debrief.coach ? (
                <Card className="border-purple/20 bg-grad-soft">
                  <SectionTitle hint="Comentário do coach de IA sobre a sua conversa.">Olhar do coach</SectionTitle>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-deep">{debrief.coach}</p>
                </Card>
              ) : null}

              <Card>
                <SectionTitle>Conversa</SectionTitle>
                <Transcript messages={messages} personaName={scenario.personaName} />
              </Card>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle hint="O que você sabe sobre a situação.">
              Contexto — {scenario.personaName}
            </SectionTitle>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-deep">
              {scenario.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="mt-4 rounded-sm bg-grad-soft p-3 text-xs leading-relaxed text-deep">
              <strong>Seu objetivo:</strong> {scenario.goal}
            </div>
          </Card>

          {practice.status === "IN_PROGRESS" ? (
            <Card>
              <SectionTitle>Lembretes</SectionTitle>
              <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted">
                <li>
                  <Badge tone="blue">S</Badge> Situação: quando e onde?
                </li>
                <li>
                  <Badge tone="purple">B</Badge> Comportamento: o que foi observado, sem julgar.
                </li>
                <li>
                  <Badge tone="deep">I</Badge> Impacto: o efeito no time, no cliente ou no resultado.
                </li>
                <li>Pergunte, escute e feche com um combinado (o quê, até quando).</li>
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Transcript({ messages, personaName }: { messages: PracticeMessage[]; personaName: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((m, i) => (
        <li key={i} className="text-sm leading-relaxed">
          <span className={`font-semibold ${m.role === "leader" ? "text-blue" : "text-purple"}`}>
            {m.role === "leader" ? "Você" : personaName}:
          </span>{" "}
          <span className="text-deep">{m.content}</span>
        </li>
      ))}
    </ul>
  );
}
