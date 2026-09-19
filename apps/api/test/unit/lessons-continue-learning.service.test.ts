import { prisma } from "@ipp/database";
import { LessonsService } from "../../src/modules/lessons/lessons.service";
import { GamificationService } from "../../src/modules/gamification/gamification.service";

/**
 * Testa getContinueLearning (Story 10.3) isolado do HTTP, contra o banco de teste
 * real (mesmo padrão de gamification-ranking.service.test.ts — sem mocks).
 *
 * O perfil é criado exclusivamente para este teste, então as asserções são
 * absolutas para os dados deste perfil (posição/total/progresso da SUA trilha),
 * sem depender do estado global do banco compartilhado.
 */
describe("LessonsService.getContinueLearning (Story 10.3)", () => {
  const email = `unit-10.3-${Date.now()}@test.local`;
  const service = new LessonsService(new GamificationService());

  let profileId: string;
  let showId: string;
  let trackId: string;
  let lessonIds: string[] = [];

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: "hash-de-teste" } });
    const profile = await prisma.profile.create({
      data: { userId: user.id, nickname: "ContinueKid", type: "CHILD", ageRange: "4-6" },
    });
    profileId = profile.id;

    const show = await prisma.show.create({
      data: { title: `unit-10.3-show-${Date.now()}`, synopsis: "Sinopse original.", thumbnailKey: "ds/thumb-10.3" },
    });
    showId = show.id;

    const track = await prisma.track.create({ data: { showId, title: "Trilha 10.3", order: 1 } });
    trackId = track.id;

    // 4 lições em ordem 1..4.
    const lessons = [];
    for (let i = 1; i <= 4; i++) {
      lessons.push(
        await prisma.lesson.create({
          data: { trackId, title: `Lição ${i}`, order: i, contentBody: `Conteúdo ${i}.` },
        }),
      );
    }
    lessonIds = lessons.map((l) => l.id);
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { id: showId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("retorna { hasProgress: false } quando o perfil nunca acessou nenhuma lição", async () => {
    const res = await service.getContinueLearning(profileId);
    expect(res).toEqual({ hasProgress: false });
  });

  it("retorna a lição mais recentemente acessada e calcula posição/total/progresso corretamente", async () => {
    // Lição 1: concluída, acessada mais cedo.
    await prisma.lessonProgress.create({
      data: {
        profileId,
        lessonId: lessonIds[0],
        completed: true,
        completedAt: new Date("2026-01-01T10:00:00.000Z"),
        lastAccessedAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    });
    // Lição 3: apenas acessada (não concluída), acesso MAIS recente ⇒ deve vencer.
    await prisma.lessonProgress.create({
      data: {
        profileId,
        lessonId: lessonIds[2],
        completed: false,
        lastAccessedAt: new Date("2026-01-02T10:00:00.000Z"),
      },
    });

    const res = await service.getContinueLearning(profileId);

    expect(res.hasProgress).toBe(true);
    if (!res.hasProgress) throw new Error("esperado hasProgress: true");
    expect(res.lessonId).toBe(lessonIds[2]);
    expect(res.trackId).toBe(trackId);
    expect(res.trackTitle).toBe("Trilha 10.3");
    expect(res.lessonPosition).toBe(3); // lição 3 (índice 2 + 1) na ordem da trilha
    expect(res.totalLessonsInTrack).toBe(4);
    // Apenas 1 de 4 lições concluídas (`completed: true`) ⇒ 25%.
    expect(res.trackProgressPercent).toBe(25);
  });

  it("acessar uma lição depois desloca o card para a lição mais recente", async () => {
    await prisma.lessonProgress.create({
      data: {
        profileId,
        lessonId: lessonIds[3],
        completed: false,
        lastAccessedAt: new Date("2026-01-03T10:00:00.000Z"),
      },
    });

    const res = await service.getContinueLearning(profileId);
    expect(res.hasProgress).toBe(true);
    if (!res.hasProgress) throw new Error("esperado hasProgress: true");
    expect(res.lessonId).toBe(lessonIds[3]);
    expect(res.lessonPosition).toBe(4);
  });
});
