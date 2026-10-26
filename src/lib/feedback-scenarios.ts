// Cenários do treino de feedback difícil. Todas as pessoas são fictícias —
// nenhum dado de liderado real entra na simulação.
//
// Cada cenário traz os fatos que o líder "sabe" (para montar o SBI), a
// descrição da persona (usada pelo LLM, quando disponível) e falas prontas por
// faixa de abertura, usadas pelo motor de regras (sem IA) e como fallback.

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABEL: Record<Difficulty, { label: string; hint: string }> = {
  1: { label: "Receptivo", hint: "Ouve, mas precisa de clareza." },
  2: { label: "Defensivo", hint: "Justifica e testa a sua calma." },
  3: { label: "Hostil / emocional", hint: "Reage forte a qualquer deslize." },
};

// Faixas de abertura da persona (derivadas da "confiança" 0–100).
export type Band = "HOSTILE" | "DEFENSIVE" | "GUARDED" | "OPEN" | "COMMITTED";

export type Scenario = {
  key: string;
  title: string;
  tagline: string;
  personaName: string;
  personaRole: string;
  // Fatos conhecidos pelo líder — material para Situação / Comportamento / Impacto.
  facts: string[];
  goal: string;
  // Instruções de personagem para o LLM.
  personaPrompt: string;
  greeting: string;
  lines: Record<Band, string[]>;
};

export const SCENARIOS: Scenario[] = [
  {
    key: "prazos",
    title: "Entregas atrasadas",
    tagline: "Três relatórios de cliente entregues fora do prazo no mês.",
    personaName: "Rafael",
    personaRole: "Analista de mídia",
    facts: [
      "Nas últimas 3 semanas, 3 relatórios de clientes foram entregues 1 a 2 dias depois do combinado.",
      "O CS precisou remarcar duas reuniões de resultado com clientes por causa disso.",
      "Rafael é bom tecnicamente e nunca avisou antecipadamente sobre os atrasos.",
    ],
    goal: "Alinhar a expectativa de prazo e combinar como ele passa a avisar antes de atrasar.",
    personaPrompt:
      "Rafael, 27 anos, analista de mídia. É bom tecnicamente, mas acumulou clientes novos sem reclamar e agora se sente sobrecarregado, embora nunca tenha dito isso. Tende a justificar atrasos com a carga de trabalho e a achar que o líder não enxerga o esforço dele.",
    greeting: "Oi! Você queria falar comigo? Pode ser rápido? Estou no meio de um relatório.",
    lines: {
      HOSTILE: [
        "Sinceramente, acho injusto. Eu estou me matando aqui e a conversa vem só pra cobrar.",
        "Se acha que alguém faria melhor com essa carga, é só colocar essa pessoa no meu lugar.",
        "Não vou ficar aqui ouvindo isso. Ninguém reconhece o que eu entrego.",
      ],
      DEFENSIVE: [
        "Os prazos estavam apertados demais, eu peguei dois clientes novos e ninguém tirou nada do meu prato.",
        "Foram só um ou dois dias. Os clientes nem reclamaram, o problema foi o CS que marcou a call cedo demais.",
        "Eu entrego, só que no meu ritmo. Isso não pode pesar tanto assim.",
      ],
      GUARDED: [
        "Tá... eu sei que atrasou. Mas você sabe o quanto eu tenho na fila hoje?",
        "Entendo o ponto, só não sei o que você espera que eu faça diferente com essa carga.",
        "Hm. Posso concordar com parte disso, mas queria que olhassem o contexto também.",
      ],
      OPEN: [
        "É... eu devia ter avisado antes que ia atrasar. Fiquei com receio de parecer que não dou conta.",
        "Faz sentido. Não tinha pensado no efeito que isso teve nas calls do CS.",
        "Obrigado por perguntar como estou. A verdade é que estou no limite com os clientes novos.",
      ],
      COMMITTED: [
        "Fechado. Vou avisar com 48h de antecedência quando perceber risco de atraso, e posso priorizar a fila com você toda segunda.",
        "Combinado. Me ajuda a redistribuir um cliente e eu garanto os prazos dos demais.",
      ],
    },
  },
  {
    key: "resultado",
    title: "Resultado abaixo da meta",
    tagline: "Terceiro trimestre seguido sem bater a meta de performance.",
    personaName: "Camila",
    personaRole: "Gestora de tráfego",
    facts: [
      "Nos últimos 3 trimestres Camila ficou entre 60% e 70% da meta de resultados das contas dela.",
      "As contas dela estão com otimizações semanais atrasadas e pouca análise de criativos.",
      "Ela costuma se cobrar demais, já chorou em uma conversa anterior e é muito dedicada.",
    ],
    goal: "Mostrar o gap com clareza e cuidado, entender causas e montar um plano de recuperação.",
    personaPrompt:
      "Camila, 31 anos, gestora de tráfego muito dedicada e perfeccionista. Está há três trimestres abaixo da meta e sente vergonha e medo de ser demitida. Reage com emoção (choro, voz embargada) a críticas duras, mas se abre bastante com acolhimento e clareza.",
    greeting: "Oi... pode falar. Eu já imagino o assunto, na verdade.",
    lines: {
      HOSTILE: [
        "Então eu sou o problema do time, é isso? Eu me dedico mais do que todo mundo aqui.",
        "(voz embargada) Eu não consigo ouvir isso agora. Dei tudo que eu podia.",
        "Se já decidiram me mandar embora, é só falar logo.",
      ],
      DEFENSIVE: [
        "As contas que me passaram já estavam ruins, o orçamento é baixo e o cliente muda de ideia toda hora.",
        "Eu tento otimizar toda semana, só que a plataforma está instável e não depende só de mim.",
        "Outras pessoas também não bateram a meta, por que só comigo essa conversa?",
      ],
      GUARDED: [
        "Eu sei que os números não estão bons... só queria entender o que exatamente você espera de mim.",
        "Estou tentando, de verdade. Mas às vezes parece que quanto mais eu me esforço, menos dá certo.",
        "Pode me dar um exemplo concreto do que você viu nas minhas contas?",
      ],
      OPEN: [
        "Obrigada por falar assim, com calma. Eu estava com medo desta conversa há semanas.",
        "Acho que me perdi nas otimizações e deixei de olhar criativo. Tô sobrecarregada com tudo.",
        "Eu queria muito melhorar, só não sei por onde começar sozinha.",
      ],
      COMMITTED: [
        "Topo o plano. Posso começar revisando as três contas principais esta semana e te mostrar na nossa próxima 1:1?",
        "Combinado. Preciso de apoio nos criativos; se a gente revisar juntos toda quinta, eu me comprometo com os prazos.",
      ],
    },
  },
  {
    key: "postura",
    title: "Postura com os colegas",
    tagline: "Interrompe e responde de forma ríspida em reuniões.",
    personaName: "Diego",
    personaRole: "Estrategista sênior",
    facts: [
      "Em 3 reuniões nas últimas 2 semanas, Diego interrompeu colegas e respondeu com ironia.",
      "Duas pessoas do time comentaram, em 1:1, que evitam levar ideias quando ele está na sala.",
      "Tecnicamente é referência no time e muito rápido nas entregas.",
    ],
    goal: "Tornar o impacto concreto e conseguir que ele reconheça o efeito, sem rótulos nem ataque pessoal.",
    personaPrompt:
      "Diego, 35 anos, estrategista sênior, referência técnica. Se vê como 'direto, sem rodeios' e acredita que o time é sensível demais. Fica na defensiva, minimiza e contra-ataca com ironia, mas respeita quem usa fatos específicos e demonstra firmeza com respeito.",
    greeting: "Fala. Se for sobre aquela reunião de terça, já adianto que não vi problema nenhum.",
    lines: {
      HOSTILE: [
        "Ah, claro. Agora ser direto virou crime? O time é que precisa crescer a casca.",
        "Quem foi que reclamou? Se tem problema comigo, que fale na minha cara.",
        "Isso é palhaçada. Se eu fosse mais fraco nas entregas ninguém estaria aqui me cobrando postura.",
      ],
      DEFENSIVE: [
        "Eu só sou objetivo. Perder tempo com rodeio não ajuda o cliente.",
        "Se alguém ficou ofendido foi mal-entendido. Eu não falei nada demais.",
        "Isso é percepção, né? Você tem algum exemplo concreto ou só impressão?",
      ],
      GUARDED: [
        "Pode ser que eu tenha sido mais seco do que precisava... mas qual foi o momento específico?",
        "Entendo que você tenha percebido. Só acho que o time poderia se posicionar mais também.",
        "Tá. E o que, na prática, você quer que eu mude?",
      ],
      OPEN: [
        "Hm. Eu não tinha percebido que alguém deixou de falar por minha causa. Isso me incomoda de verdade.",
        "É... na terça eu cortei a Ana duas vezes. Se eu fosse ela, também ficaria quieta.",
        "Obrigado por trazer fatos. Se fosse só crítica genérica eu teria ignorado.",
      ],
      COMMITTED: [
        "Combinado. Vou esperar a pessoa terminar antes de responder e, se discordar, começo reconhecendo o ponto. Pode me avisar se eu escorregar.",
        "Fechado. Quero pedir desculpa à Ana ainda esta semana, e você pode me dar um retorno em duas semanas?",
      ],
    },
  },
  {
    key: "combinado",
    title: "Combinados não cumpridos",
    tagline: "Não registra tarefas e some do canal do time durante o dia.",
    personaName: "Bruna",
    personaRole: "Analista de performance",
    facts: [
      "Em 2 semanas, 9 tarefas ficaram sem registro no sistema e sem comentário de andamento.",
      "Em 3 dias Bruna ficou mais de 4 horas sem responder o canal do time durante o horário combinado de disponibilidade.",
      "O CS precisou cobrar status de cliente duas vezes por falta de informação registrada.",
    ],
    goal: "Reforçar o combinado de registro e disponibilidade, entendendo o que está travando.",
    personaPrompt:
      "Bruna, 24 anos, analista de performance em seu primeiro emprego em agência. Considera o registro de tarefas 'burocracia' e já viu colegas deixarem de registrar sem consequência. Não é má-fé; falta hábito e clareza do porquê. Reage com ironia leve no começo e se abre quando entende o impacto no cliente e no time.",
    greeting: "Oi, tudo bem? Vi que você marcou uma conversa. Aconteceu alguma coisa?",
    lines: {
      HOSTILE: [
        "Pelo jeito vou virar a 'vilã do sistema'. Todo mundo deixa tarefa sem registro, só eu que sou chamada.",
        "Eu trabalho, as entregas saem. Preencher campo no sistema não deveria ser mais importante que o trabalho.",
        "Se o problema é eu, é só dizer. Cansei dessa cobrança.",
      ],
      DEFENSIVE: [
        "Eu estava resolvendo coisa urgente de cliente, não deu tempo de registrar. Faço depois.",
        "Fiquei fora do canal porque estava concentrada na otimização. Isso também é trabalho, né?",
        "Nunca ficou claro que era tão importante registrar tudo, ninguém me falou isso desse jeito.",
      ],
      GUARDED: [
        "Eu entendo a regra, só esqueço no meio da correria. O que você sugere?",
        "Mas qual o prejuízo prático disso? Me ajuda a ver.",
        "Posso melhorar, só não sei se é viável registrar tudo em tempo real.",
      ],
      OPEN: [
        "Nossa, não pensei que o CS ficava sem resposta pro cliente por minha causa. Isso é sério.",
        "Faz sentido. Acho que tratei o registro como burocracia e não como parte da entrega.",
        "Obrigada por explicar o porquê. Antes eu só ouvia 'tem que registrar'.",
      ],
      COMMITTED: [
        "Fechado. Vou registrar ao concluir cada tarefa e deixar status no canal se eu precisar me ausentar. Podemos revisar em 2 semanas?",
        "Combinado. Vou separar 10 minutos antes do almoço e no fim do dia para registrar tudo; me cobra se eu falhar.",
      ],
    },
  },
  {
    key: "promocao",
    title: "Promoção não aprovada",
    tagline: "Esperava ser promovido neste ciclo e não foi.",
    personaName: "Lucas",
    personaRole: "Analista pleno",
    facts: [
      "Lucas entrega bem, mas ainda não lidera projetos nem forma outras pessoas, requisitos do nível sênior.",
      "Ele comentou há meses que queria a promoção e entendeu que 'estava encaminhada'.",
      "A decisão de adiar vale por dois ciclos e já está tomada; o critério é claro e documentado.",
    ],
    goal: "Comunicar a decisão com transparência, ouvir a frustração e combinar um caminho concreto para o próximo ciclo.",
    personaPrompt:
      "Lucas, 29 anos, analista pleno ambicioso. Entendeu que a promoção estava garantida e se sente enganado. Começa ressentido, ameaça procurar outra empresa e pede garantias. Se sentir respeito, transparência e um caminho concreto, passa a negociar com maturidade.",
    greeting: "Oi. Imagino que seja sobre o resultado do ciclo. Pode falar, já tô esperando a notícia.",
    lines: {
      HOSTILE: [
        "Então foi tudo conversa. Me prometeram isso há meses. Já vi que aqui não valorizam quem entrega.",
        "Tenho proposta de outra empresa, sabia? Talvez seja hora de ouvir.",
        "Isso é absurdo. Quem foi promovido entrega menos que eu.",
      ],
      DEFENSIVE: [
        "Mas eu bati todas as metas. Qual é o critério afinal, porque ninguém nunca me mostrou?",
        "Você disse que estava encaminhado. Agora muda tudo?",
        "Se não é pelo resultado, então é pelo quê? Tem algo que eu não estou sabendo?",
      ],
      GUARDED: [
        "Tá, eu escuto. Mas preciso entender o que falta de verdade, sem enrolação.",
        "Fiquei chateado, não vou negar. Me explica o critério de novo?",
        "E se eu fizer tudo que você pedir, qual é a garantia de que no próximo ciclo sai?",
      ],
      OPEN: [
        "Ok... faz sentido o que você diz sobre liderar projeto. Eu não tinha enxergado dessa forma.",
        "Agradeço a transparência. Doeu ouvir, mas é melhor do que ficar na dúvida.",
        "Se me der espaço para liderar um projeto, eu topo mostrar que estou pronto.",
      ],
      COMMITTED: [
        "Fechado. Quero liderar a próxima conta nova e mentorar o analista júnior; marcamos uma revisão em 90 dias?",
        "Combinado. Com critérios claros e um plano com data, eu fico e dou o meu melhor.",
      ],
    },
  },
];

export function getScenario(key: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
