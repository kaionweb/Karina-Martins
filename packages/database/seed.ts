import * as bcrypt from "bcryptjs";
import { prisma } from "./src/index";
import { markFirstSeriesPerLevelAsFree } from "./scripts/seed-free-after-trial";

const SHOW_TITLES = [
  "Aventuras no Espaço",
  "Fazenda Divertida",
  "Fundo do Mar",
  "Floresta Mágica",
  "Dia na Cidade",
] as const;
const DEMO_PASSWORD = "Demo@1234";
const PASSWORD_HASH_ROUNDS = 10;
const LESSON_COMPLETION_XP = 10;

// Espelha GamificationService.BADGE_DEFINITIONS (apps/api) — packages/database não pode
// depender de apps/api (regra de camadas do monorepo), então os valores são duplicados
// aqui intencionalmente. Qualquer mudança nos badges reais precisa ser replicada aqui.
const BADGE_DEFINITIONS = {
  FIRST_LESSON: {
    code: "FIRST_LESSON",
    title: "Primeira Lição",
    description: "Concluiu a primeira lição na plataforma.",
    iconKey: "badges/first-lesson",
  },
  STREAK_3: {
    code: "STREAK_3",
    title: "Sequência de 3 dias",
    description: "Usou a plataforma por 3 dias seguidos.",
    iconKey: "badges/streak-3",
  },
} as const;

type BadgeCode = keyof typeof BADGE_DEFINITIONS;

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function seedCatalog() {
  await prisma.show.deleteMany({ where: { title: { in: [...SHOW_TITLES] } } });

  const spaceShow = await prisma.show.create({
    data: {
      title: "Aventuras no Espaço",
      synopsis: "Uma jornada original pelo sistema solar, aprendendo palavras novas em inglês a cada parada.",
      thumbnailKey: "design-system/thumb-space",
      tracks: {
        create: {
          title: "Explorando o Sistema Solar",
          order: 1,
          lessons: {
            create: [
              { title: "The Moon", order: 1, contentBody: "Hello! Let's learn about the Moon. The Moon is white and round." },
              { title: "The Sun", order: 2, contentBody: "The Sun is big and yellow. The Sun gives us light." },
              { title: "Stars", order: 3, contentBody: "Look at the sky at night. Stars are small and bright." },
              { title: "Planets", order: 4, contentBody: "There are many planets. Some planets are red, some are blue." },
              { title: "Rockets", order: 5, contentBody: "A rocket goes up, up, up! Rockets fly to space." },
            ],
          },
        },
      },
    },
    include: { tracks: { include: { lessons: true } } },
  });

  const farmShow = await prisma.show.create({
    data: {
      title: "Fazenda Divertida",
      synopsis: "Histórias originais sobre os animais da fazenda e os sons que eles fazem, em inglês.",
      thumbnailKey: "design-system/thumb-farm",
      tracks: {
        create: {
          title: "Sons e Nomes dos Animais",
          order: 1,
          lessons: {
            create: [
              { title: "The Cow", order: 1, contentBody: "The cow says moo! The cow is big and gives us milk." },
              { title: "The Dog", order: 2, contentBody: "The dog says woof! The dog likes to run and play." },
              { title: "The Cat", order: 3, contentBody: "The cat says meow! The cat is soft and small." },
              { title: "The Duck", order: 4, contentBody: "The duck says quack! The duck likes to swim in water." },
              { title: "The Horse", order: 5, contentBody: "The horse says neigh! The horse can run very fast." },
            ],
          },
        },
      },
    },
    include: { tracks: { include: { lessons: true } } },
  });

  // Trilhas 3-5: destravadas só depois que o perfil completa a trilha 1
  // (Aventuras no Espaço) — trava aplicada no client, ver
  // apps/web/src/lib/progression/useShowUnlock.ts. Ordem de criação aqui
  // importa: GET /catalog/shows ordena por createdAt, e a Home trata o
  // primeiro item da lista como "trilha 1".
  await prisma.show.create({
    data: {
      title: "Fundo do Mar",
      synopsis: "Uma jornada original pelo oceano, aprendendo o nome dos animais marinhos em inglês.",
      thumbnailKey: "design-system/thumb-ocean",
      tracks: {
        create: {
          title: "Animais do Oceano",
          order: 1,
          lessons: {
            create: [
              { title: "The Fish", order: 1, contentBody: "The fish swims in the water. The fish has fins and a tail." },
              { title: "The Octopus", order: 2, contentBody: "The octopus has eight arms. The octopus can hide in the sand." },
              { title: "The Turtle", order: 3, contentBody: "The turtle is slow and calm. The turtle carries its shell." },
              { title: "The Shark", order: 4, contentBody: "The shark swims very fast. The shark has sharp teeth." },
              { title: "The Whale", order: 5, contentBody: "The whale is very big. The whale sings songs in the sea." },
            ],
          },
        },
      },
    },
  });

  await prisma.show.create({
    data: {
      title: "Floresta Mágica",
      synopsis: "Histórias originais sobre os animais da floresta e onde eles vivem, em inglês.",
      thumbnailKey: "design-system/thumb-forest",
      tracks: {
        create: {
          title: "Animais da Floresta",
          order: 1,
          lessons: {
            create: [
              { title: "The Bird", order: 1, contentBody: "The bird sings in the tree. The bird can fly high in the sky." },
              { title: "The Rabbit", order: 2, contentBody: "The rabbit hops very fast. The rabbit likes to eat carrots." },
              { title: "The Fox", order: 3, contentBody: "The fox has orange fur. The fox is clever and quiet." },
              { title: "The Bear", order: 4, contentBody: "The bear is big and strong. The bear sleeps all winter." },
              { title: "The Owl", order: 5, contentBody: "The owl wakes up at night. The owl says who who." },
            ],
          },
        },
      },
    },
  });

  await prisma.show.create({
    data: {
      title: "Dia na Cidade",
      synopsis: "Uma jornada original pelos meios de transporte da cidade, em inglês.",
      thumbnailKey: "design-system/thumb-city",
      tracks: {
        create: {
          title: "Meios de Transporte",
          order: 1,
          lessons: {
            create: [
              { title: "The Car", order: 1, contentBody: "The car drives on the road. The car has four wheels." },
              { title: "The Bus", order: 2, contentBody: "The bus is big and yellow. The bus takes many people to school." },
              { title: "The Train", order: 3, contentBody: "The train runs on the tracks. The train goes choo choo." },
              { title: "The Bike", order: 4, contentBody: "The bike has two wheels. We can ride the bike in the park." },
              { title: "The Airplane", order: 5, contentBody: "The airplane flies in the sky. The airplane takes us far away." },
            ],
          },
        },
      },
    },
  });

  console.log(
    `Seed concluído: 5 shows criados (${spaceShow.title}, ${farmShow.title}, Fundo do Mar, Floresta Mágica, Dia na Cidade), 1 trilha e 5 lições cada.`,
  );

  const spaceLessons = [...spaceShow.tracks[0].lessons].sort((a, b) => a.order - b.order);
  const farmLessons = [...farmShow.tracks[0].lessons].sort((a, b) => a.order - b.order);

  return { spaceLessonIds: spaceLessons.map((l) => l.id), farmLessonIds: farmLessons.map((l) => l.id) };
}

// Espelha LessonsService.completeLesson (apps/api) — mesma razão de duplicação do
// BADGE_DEFINITIONS acima. Idempotente: não duplica progresso/XP se já concluída.
async function completeLessonForProfile(profileId: string, lessonId: string) {
  const existing = await prisma.lessonProgress.findFirst({ where: { profileId, lessonId } });
  if (existing) {
    return;
  }

  const now = new Date();
  await prisma.$transaction([
    // Story 10.3: `completed`/`lastAccessedAt` explícitos — sem isso, o novo default
    // `completed: false` faria as lições do seed aparecerem como não concluídas.
    prisma.lessonProgress.create({
      data: { profileId, lessonId, completed: true, completedAt: now, lastAccessedAt: now },
    }),
    prisma.xpEvent.create({ data: { profileId, amount: LESSON_COMPLETION_XP, source: "LESSON_COMPLETED" } }),
  ]);
}

// Espelha GamificationService.awardBadgeIfEligible (apps/api) — mesma razão de duplicação acima.
async function awardBadge(profileId: string, code: BadgeCode) {
  const definition = BADGE_DEFINITIONS[code];
  const badge = await prisma.badge.upsert({
    where: { code: definition.code },
    create: definition,
    update: {},
  });

  const alreadyAwarded = await prisma.profileBadge.findFirst({ where: { profileId, badgeId: badge.id } });
  if (alreadyAwarded) {
    return;
  }

  await prisma.profileBadge.create({ data: { profileId, badgeId: badge.id } });
}

async function seedAccounts(spaceLessonIds: string[], farmLessonIds: string[]) {
  const familyEmail = "familia.demo@kaionweb.com";
  const soloEmail = "convidado.demo@kaionweb.com";

  await prisma.user.deleteMany({ where: { email: { in: [familyEmail, soloEmail] } } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_HASH_ROUNDS);

  const familyUser = await prisma.user.create({
    data: {
      email: familyEmail,
      passwordHash,
      profiles: {
        create: [
          { nickname: "Ana", type: "ADULT" },
          { nickname: "Theo", type: "CHILD", ageRange: "6-8" },
        ],
      },
    },
    include: { profiles: true },
  });

  const soloUser = await prisma.user.create({
    data: {
      email: soloEmail,
      passwordHash,
      profiles: { create: { nickname: "Carlos", type: "ADULT" } },
    },
    include: { profiles: true },
  });

  const childProfile = familyUser.profiles.find((p) => p.type === "CHILD")!;
  const soloAdultProfile = soloUser.profiles[0];

  await completeLessonForProfile(childProfile.id, spaceLessonIds[0]);
  await completeLessonForProfile(childProfile.id, spaceLessonIds[1]);
  await completeLessonForProfile(childProfile.id, farmLessonIds[0]);
  await awardBadge(childProfile.id, "FIRST_LESSON");

  const today = utcMidnight(new Date());
  await prisma.profile.update({
    where: { id: childProfile.id },
    data: { currentStreak: 3, longestStreak: 3, lastActiveDate: today },
  });
  await awardBadge(childProfile.id, "STREAK_3");

  await completeLessonForProfile(soloAdultProfile.id, farmLessonIds[1]);
  await awardBadge(soloAdultProfile.id, "FIRST_LESSON");

  console.log(
    `Seed de contas concluído: conta familiar (${familyEmail}) com perfil ADULT "Ana" + CHILD "Theo" ` +
      `(3 lições, 30 XP, badges FIRST_LESSON+STREAK_3); conta adulta avulsa (${soloEmail}) com perfil ` +
      `"Carlos" (1 lição, 10 XP, badge FIRST_LESSON). Senha de demonstração: ${DEMO_PASSWORD}`,
  );
}

// Registra as playlists curadas (Epic 9) — não cria Video nenhum aqui: a
// sincronização real dos vídeos (metadados + thumbnail via API do YouTube)
// é feita por YoutubeSyncService, disparada via POST /internal/cron/videos-sync.
const VIDEO_PLAYLISTS = [
  {
    playlistId: "PLAZzOPGDTospjnI11hxGWZUfjdLL4I2Ob",
    channel: "Monica and Friends",
    level: "INICIANTE",
    ageRange: "6-8",
    skill: "LISTENING",
    theme: "Turma da Mônica",
  },
  {
    playlistId: "PLVRdJEqvAMbe7V5z6bP1bVvPQqzNmbxWs",
    channel: "Turma da Mônica em Inglês",
    level: "INICIANTE",
    ageRange: "6-8",
    skill: "LISTENING",
    theme: "Inglês com Histórias",
  },
] as const;

async function seedVideoPlaylists() {
  for (const playlist of VIDEO_PLAYLISTS) {
    await prisma.curatedPlaylist.upsert({
      where: { playlistId: playlist.playlistId },
      create: playlist,
      update: playlist,
    });
  }

  console.log(
    `Seed de playlists concluído: ${VIDEO_PLAYLISTS.length} playlists curadas registradas ` +
      `(${VIDEO_PLAYLISTS.map((p) => p.theme).join(", ")}). Rode a sincronização ` +
      `(POST /internal/cron/videos-sync) para puxar os vídeos reais do YouTube.`,
  );
}

// Catálogo de séries (temporada/episódio) — Epic Redesign visual. Só
// "Pequenos Heróis" tem playlist real; as demais ficam sem `playlistId` até
// serem cadastradas via /admin/series (o painel roda a sincronização dos
// episódios; o seed só registra os metadados, mesmo espírito de
// seedVideoPlaylists acima).
//
// genre/skills/description/featured alimentam a tela /explorar (filtros +
// "Em destaque"). São opcionais no schema, mas mantidos aqui pra todo mundo
// ficar filtrável — sem isso a série some da grade assim que um filtro de
// gênero/habilidade é ativado.
const SERIES = [
  {
    title: "Pequenos Heróis",
    emoji: "🦸",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: "PLzLUUm_EOx7w5K-l5Q6U9lxtTjyOABWtL",
    genre: "Infantil",
    skills: ["Vocabulary", "Speaking"],
    featured: false,
    description:
      "Crianças viram super-heróis e aprendem inglês salvando o dia — cada episódio ensina uma habilidade nova junto com uma palavra-poder.",
  },
  {
    title: "Fundo do Mar",
    emoji: "🐠",
    level: "BASICO",
    ageRange: "3+",
    seasons: 2,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary", "Listening"],
    featured: false,
    description: "Uma jornada pelo oceano conhecendo peixes, corais e criaturas marinhas, com vocabulário simples e repetitivo pra fixar fácil.",
  },
  {
    title: "Fazenda Divertida",
    emoji: "🐮",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary"],
    featured: false,
    description: null,
  },
  {
    title: "Grandes Emoções",
    emoji: "💛",
    level: "INTERMEDIARIO",
    ageRange: "5+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Speaking", "Vocabulary"],
    featured: false,
    description: "Histórias sobre nomear e lidar com sentimentos — alegria, medo, saudade — com o vocabulário emocional em inglês.",
  },
  {
    title: "Mistérios da Cidade",
    emoji: "🔍",
    level: "AVANCADO",
    ageRange: "8+",
    seasons: 3,
    playlistId: null,
    genre: "Suspense",
    skills: ["Listening", "Vocabulary"],
    featured: true,
    description:
      "Uma série de mistério para praticar inglês avançado, com pistas, personagens e vocabulário mais complexo — pensada pra quem já tem uma base sólida.",
  },
  {
    title: "Robôs & Amigos",
    emoji: "🤖",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary", "Listening"],
    featured: false,
    description: null,
  },
  {
    title: "Viagem no Tempo",
    emoji: "⏰",
    level: "AVANCADO",
    ageRange: "8+",
    seasons: 2,
    playlistId: null,
    genre: "Suspense",
    skills: ["Listening", "Vocabulary", "Speaking"],
    featured: false,
    description: "Uma aventura por diferentes épocas da história, com diálogos mais desafiadores e vocabulário histórico em inglês.",
  },
  {
    title: "Aventuras no Espaço",
    emoji: "🚀",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary", "Speaking"],
    featured: false,
    description: null,
  },

  // ─── Novas (catálogo ampliado — sem playlist/episódio ainda) ────────────
  {
    title: "Risadas em Inglês",
    emoji: "😄",
    level: "INTERMEDIARIO",
    ageRange: "5+",
    seasons: 1,
    playlistId: null,
    genre: "Comédia",
    skills: ["Speaking", "Listening"],
    featured: true,
    description: "Situações engraçadas do dia a dia em inglês — a criança aprende vocabulário rindo com esquetes curtas e cheias de expressão.",
  },
  {
    title: "Mundo Animal",
    emoji: "🦒",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary"],
    featured: true,
    description: "Conheça animais do mundo todo e aprenda seus nomes e sons em inglês, em episódios curtos e visuais para os pequenos.",
  },
  {
    title: "Confusão na Cozinha",
    emoji: "🍳",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Comédia",
    skills: ["Vocabulary", "Speaking"],
    featured: false,
    description:
      "Um personagem tenta fazer uma receita simples e erra tudo de um jeito engraçado — ensina nomes de comida e verbos de ação como misturar e derramar.",
  },
  {
    title: "O Cachorro Desastrado",
    emoji: "🐕",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Comédia",
    skills: ["Listening", "Vocabulary"],
    featured: false,
    description:
      "Um cachorro atrapalhado bagunça a casa em cada episódio, repetindo frases curtas e fáceis de acompanhar — ótimo pra quem está começando.",
  },
  {
    title: "O Tesouro Escondido",
    emoji: "🗺️",
    level: "INTERMEDIARIO",
    ageRange: "5+",
    seasons: 1,
    playlistId: null,
    genre: "Suspense",
    skills: ["Listening", "Vocabulary"],
    featured: false,
    description: "Uma busca por um objeto perdido pela casa, com pistas simples em inglês — tensão leve de caça ao tesouro, não terror.",
  },
  {
    title: "Quem Comeu o Bolo?",
    emoji: "🍰",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Suspense",
    skills: ["Speaking", "Vocabulary"],
    featured: false,
    description: "Um mistério tranquilo entre bichinhos da fazenda, com perguntas e respostas simples pra criança acompanhar e adivinhar junto.",
  },
  {
    title: "Fazendo as Pazes",
    emoji: "🤝",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Amizade",
    skills: ["Speaking"],
    featured: false,
    description: "Dois amigos brigam por um brinquedo e aprendem a se desculpar e dividir — vocabulário de sentimento e reconciliação.",
  },
  {
    title: "Cartas para Vovó",
    emoji: "💌",
    level: "INTERMEDIARIO",
    ageRange: "5+",
    seasons: 1,
    playlistId: null,
    genre: "Amizade",
    skills: ["Speaking", "Vocabulary"],
    featured: false,
    description:
      'Uma criança grava mensagens carinhosas pra família distante, aprendendo expressões de afeto como "I miss you" e "See you soon".',
  },
  {
    title: "O Novo Amigo",
    emoji: "👋",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Amizade",
    skills: ["Speaking", "Vocabulary"],
    featured: false,
    description:
      'Uma criança nova na escola é acolhida pela turma — tema de inclusão, com vocabulário de apresentação como "What\'s your name?".',
  },
  {
    title: "Cores do Dia",
    emoji: "🎨",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary"],
    featured: false,
    description: "A rotina diária (acordar, escovar os dentes, brincar, dormir) narrada com foco em cores e objetos do dia a dia.",
  },
  {
    title: "Números Mágicos",
    emoji: "🔢",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary", "Listening"],
    featured: false,
    description: "Contagem de 1 a 10 com bichinhos aparecendo e desaparecendo — repetição bem marcada pra fixar os números.",
  },
  {
    title: "Histórias pra Ouvir",
    emoji: "🎧",
    level: "INTERMEDIARIO",
    ageRange: "5+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Listening"],
    featured: false,
    description:
      "Narração mais longa, com menos diálogo, no estilo de audiobook curto — treina o ouvido pra acompanhar histórias sem apoio visual constante.",
  },
  {
    title: "Fale Comigo",
    emoji: "🗣️",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Speaking"],
    featured: false,
    description:
      'Formato de pergunta e pausa — "What do you see?" — com espaço pra criança responder em voz alta antes de continuar. Combina bem com a função de repetição de frase.',
  },
  {
    title: "Palavra do Dia",
    emoji: "📇",
    level: "BASICO",
    ageRange: "3+",
    seasons: 1,
    playlistId: null,
    genre: "Infantil",
    skills: ["Vocabulary"],
    featured: false,
    description:
      "Formato cápsula curta: um objeto aparece, o nome é falado e repetido, e passa pro próximo — episódios de 1 a 2 minutos, ideal pra sessões rápidas.",
  },
] as const;

async function seedSeries() {
  for (const series of SERIES) {
    await prisma.series.upsert({
      where: { title: series.title },
      create: series,
      update: series,
    });
  }

  console.log(
    `Seed de séries concluído: ${SERIES.length} séries registradas (${SERIES.map((s) => s.title).join(", ")}). ` +
      `Rode a sincronização pelo painel /admin/series para puxar os episódios reais das que já têm playlist.`,
  );
}

async function main() {
  const { spaceLessonIds, farmLessonIds } = await seedCatalog();
  await seedAccounts(spaceLessonIds, farmLessonIds);
  await seedVideoPlaylists();
  await seedSeries();

  // Mesma regra do admin (AdminSeriesService.upsertSeries): a primeira série
  // de cada nível nasce freeAfterTrial=true. O seed usa prisma.series.upsert
  // direto (sem passar pelo service), então essa marcação roda como um passo
  // separado — idempotente: nunca mexe num nível que já tem alguma série livre.
  const marked = await markFirstSeriesPerLevelAsFree();
  console.log(`Seed de freeAfterTrial concluído: ${marked} série(s) marcada(s) como grátis-permanente (1 por nível).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
