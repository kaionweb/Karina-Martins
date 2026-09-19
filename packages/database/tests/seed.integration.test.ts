import { execSync } from "child_process";
import path from "path";
import * as bcrypt from "bcryptjs";
import { prisma } from "../src/index";

const SHOW_TITLES = ["Aventuras no Espaço", "Fazenda Divertida"];
const SERIES_TITLES = [
  "Pequenos Heróis",
  "Fundo do Mar",
  "Fazenda Divertida",
  "Grandes Emoções",
  "Mistérios da Cidade",
  "Robôs & Amigos",
  "Viagem no Tempo",
  "Aventuras no Espaço",
  "Risadas em Inglês",
  "Mundo Animal",
  "Confusão na Cozinha",
  "O Cachorro Desastrado",
  "O Tesouro Escondido",
  "Quem Comeu o Bolo?",
  "Fazendo as Pazes",
  "Cartas para Vovó",
  "O Novo Amigo",
  "Cores do Dia",
  "Números Mágicos",
  "Histórias pra Ouvir",
  "Fale Comigo",
  "Palavra do Dia",
];
const FAMILY_EMAIL = "familia.demo@kaionweb.com";
const SOLO_EMAIL = "convidado.demo@kaionweb.com";
const DEMO_PASSWORD = "Demo@1234";

function runSeed() {
  execSync("npx tsx seed.ts", { cwd: path.resolve(__dirname, ".."), stdio: "pipe" });
}

// Este teste NÃO limpa os shows criados ao final — são exatamente os dados de
// demonstração que a Story 2.4 existe para popular (AC1), não fixtures de teste.
describe("Seed de catálogo demo (Story 2.4)", () => {
  beforeAll(() => {
    runSeed();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cria exatamente os 2 shows esperados, cada um com 1 trilha e 5 lições em ordem (AC1)", async () => {
    const shows = await prisma.show.findMany({
      where: { title: { in: SHOW_TITLES } },
      include: { tracks: { include: { lessons: true } } },
    });

    expect(shows).toHaveLength(2);

    for (const show of shows) {
      expect(show.tracks).toHaveLength(1);

      const lessons = show.tracks[0].lessons.sort((a, b) => a.order - b.order);
      expect(lessons).toHaveLength(5);
      expect(lessons.map((lesson) => lesson.order)).toEqual([1, 2, 3, 4, 5]);
      lessons.forEach((lesson) => expect(lesson.contentBody.length).toBeGreaterThan(0));
    }
  });

  it("cria a conta familiar com perfil ADULT + CHILD, progresso e badges corretos (Story 5.3, AC1)", async () => {
    const familyUser = await prisma.user.findUniqueOrThrow({
      where: { email: FAMILY_EMAIL },
      include: { profiles: true },
    });

    expect(await bcrypt.compare(DEMO_PASSWORD, familyUser.passwordHash as string)).toBe(true);
    expect(familyUser.profiles).toHaveLength(2);

    const adult = familyUser.profiles.find((p) => p.type === "ADULT")!;
    const child = familyUser.profiles.find((p) => p.type === "CHILD")!;
    expect(adult.nickname).toBe("Ana");
    expect(child).toMatchObject({ nickname: "Theo", ageRange: "6-8", currentStreak: 3, longestStreak: 3 });

    const xpTotal = await prisma.xpEvent.aggregate({ _sum: { amount: true }, where: { profileId: child.id } });
    expect(xpTotal._sum.amount).toBe(30);

    const progress = await prisma.lessonProgress.count({ where: { profileId: child.id } });
    expect(progress).toBe(3);

    const badges = await prisma.profileBadge.findMany({ where: { profileId: child.id }, include: { badge: true } });
    expect(badges.map((b) => b.badge.code).sort()).toEqual(["FIRST_LESSON", "STREAK_3"]);
  });

  it("cria a conta adulta avulsa com progresso e badge (Story 5.3, AC1)", async () => {
    const soloUser = await prisma.user.findUniqueOrThrow({
      where: { email: SOLO_EMAIL },
      include: { profiles: true },
    });

    expect(await bcrypt.compare(DEMO_PASSWORD, soloUser.passwordHash as string)).toBe(true);
    expect(soloUser.profiles).toHaveLength(1);
    expect(soloUser.profiles[0]).toMatchObject({ nickname: "Carlos", type: "ADULT" });

    const soloProfileId = soloUser.profiles[0].id;
    const xpTotal = await prisma.xpEvent.aggregate({ _sum: { amount: true }, where: { profileId: soloProfileId } });
    expect(xpTotal._sum.amount).toBe(10);

    const badges = await prisma.profileBadge.findMany({ where: { profileId: soloProfileId } });
    expect(badges).toHaveLength(1);
  });

  it("cria as 22 séries do seed com metadado de catálogo (genre/skills/featured) preenchido pra todas", async () => {
    const seriesList = await prisma.series.findMany({ where: { title: { in: SERIES_TITLES } } });
    expect(seriesList).toHaveLength(SERIES_TITLES.length);

    // Nenhuma série deve ficar sem genre/skills — senão ela some do Explorar
    // assim que um filtro de gênero/habilidade é ativado.
    for (const series of seriesList) {
      expect(series.genre).toBeTruthy();
      expect(Array.isArray(series.skills) && (series.skills as string[]).length > 0).toBe(true);
    }

    const destacadas = seriesList.filter((s) => s.featured).map((s) => s.title).sort();
    expect(destacadas).toEqual(["Mistérios da Cidade", "Mundo Animal", "Risadas em Inglês"].sort());

    const pequenosHerois = seriesList.find((s) => s.title === "Pequenos Heróis")!;
    expect(pequenosHerois.genre).toBe("Infantil");
    expect(pequenosHerois.skills).toEqual(["Vocabulary", "Speaking"]);
  });

  it("roda uma segunda vez sem erro e sem duplicar shows, contas, perfis ou badges (AC2, idempotência)", async () => {
    expect(() => runSeed()).not.toThrow();

    const shows = await prisma.show.findMany({ where: { title: { in: SHOW_TITLES } } });
    expect(shows).toHaveLength(2);

    const familyUser = await prisma.user.findUniqueOrThrow({
      where: { email: FAMILY_EMAIL },
      include: { profiles: true },
    });
    expect(familyUser.profiles).toHaveLength(2);

    const child = familyUser.profiles.find((p) => p.type === "CHILD")!;
    const xpTotal = await prisma.xpEvent.aggregate({ _sum: { amount: true }, where: { profileId: child.id } });
    expect(xpTotal._sum.amount).toBe(30);

    const badgeCount = await prisma.badge.count({ where: { code: { in: ["FIRST_LESSON", "STREAK_3"] } } });
    expect(badgeCount).toBe(2);

    const seriesList = await prisma.series.findMany({ where: { title: { in: SERIES_TITLES } } });
    expect(seriesList).toHaveLength(SERIES_TITLES.length);
  }, 60000);
});
