import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

describe("Gamification (Story 3.2)", () => {
  let app: INestApplication;
  const testEmail = `story-3.2-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-3.2-show-${Date.now()}`;

  let scopedToken: string;
  let profileId: string;
  let lessonId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    const accessToken = loginRes.body.accessToken;

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail }, include: { profiles: true } });
    profileId = user.profiles[0].id;

    const selectRes = await request(app.getHttpServer())
      .post(`/profiles/${profileId}/select`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    scopedToken = selectRes.body.accessToken;

    const show = await prisma.show.create({
      data: { title: testShowTitle, synopsis: "Sinopse original de teste.", thumbnailKey: "ds/thumb-test" },
    });
    const track = await prisma.track.create({ data: { showId: show.id, title: "Trilha de teste", order: 1 } });
    const lesson = await prisma.lesson.create({
      data: { trackId: track.id, title: "Lição de teste", order: 1, contentBody: "Conteúdo original." },
    });
    lessonId = lesson.id;
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita POST /lessons/:id/complete sem token (401)", async () => {
    await request(app.getHttpServer()).post(`/lessons/${lessonId}/complete`).expect(401);
  });

  it("GET /gamification/xp retorna 0 antes de qualquer conclusão", async () => {
    const res = await request(app.getHttpServer())
      .get("/gamification/xp")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body.total).toBe(0);
  });

  it("primeira conclusão cria XpEvent e LessonProgress, concede XP (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/lessons/${lessonId}/complete`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body.xpAwarded).toBe(10);
    expect(res.body.xpTotal).toBe(10);

    const progress = await prisma.lessonProgress.findFirst({ where: { profileId, lessonId } });
    expect(progress).not.toBeNull();

    const events = await prisma.xpEvent.findMany({ where: { profileId, source: "LESSON_COMPLETED" } });
    expect(events).toHaveLength(1);
  });

  it("segunda conclusão da mesma lição não concede XP de novo (idempotência)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/lessons/${lessonId}/complete`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body.xpAwarded).toBe(0);
    expect(res.body.xpTotal).toBe(10);

    const events = await prisma.xpEvent.findMany({ where: { profileId, source: "LESSON_COMPLETED" } });
    expect(events).toHaveLength(1);
  });

  it("GET /gamification/xp reflete o total após a conclusão (AC2)", async () => {
    const res = await request(app.getHttpServer())
      .get("/gamification/xp")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body.total).toBe(10);
  });

  it("POST /lessons/:id/complete retorna 404 para lição inexistente", async () => {
    await request(app.getHttpServer())
      .post("/lessons/id-que-nao-existe/complete")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(404);
  });

  // CONC-001 (gate 10.3): dois POST /complete concorrentes para o mesmo perfil+lição
  // não podem creditar XP em dobro. O fix (compare-and-swap dentro da transação)
  // garante no máximo 1 XpEvent e no máximo 1 badge FIRST_LESSON sob concorrência.
  describe("idempotência sob concorrência real (CONC-001)", () => {
    // Perfil e lição próprios, para isolar a corrida da lição já concluída acima.
    const concEmail = `story-10.3-conc-${Date.now()}@test.local`;
    let concToken: string;
    let concProfileId: string;
    let concLessonId: string;

    beforeAll(async () => {
      await request(app.getHttpServer()).post("/auth/register").send({ email: concEmail, password });
      const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: concEmail, password });
      const accessToken = loginRes.body.accessToken;

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: concEmail },
        include: { profiles: true },
      });
      concProfileId = user.profiles[0].id;

      const selectRes = await request(app.getHttpServer())
        .post(`/profiles/${concProfileId}/select`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      concToken = selectRes.body.accessToken;

      // Lição sob o mesmo show de teste (limpo no afterAll do describe externo).
      const show = await prisma.show.findFirstOrThrow({ where: { title: testShowTitle } });
      const track = await prisma.track.create({
        data: { showId: show.id, title: "Trilha concorrência", order: 2 },
      });
      const lesson = await prisma.lesson.create({
        data: { trackId: track.id, title: "Lição concorrência", order: 1, contentBody: "Conteúdo original conc." },
      });
      concLessonId = lesson.id;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: concEmail } });
    });

    it("linha pré-acessada: dois completes em paralelo criam exatamente 1 XpEvent", async () => {
      // Cenário-alvo da regressão: getLesson criou a linha (completed:false) antes.
      await request(app.getHttpServer())
        .get(`/lessons/${concLessonId}`)
        .set("Authorization", `Bearer ${concToken}`)
        .expect(200);

      const server = app.getHttpServer();
      const responses = await Promise.all([
        request(server).post(`/lessons/${concLessonId}/complete`).set("Authorization", `Bearer ${concToken}`),
        request(server).post(`/lessons/${concLessonId}/complete`).set("Authorization", `Bearer ${concToken}`),
      ]);

      // Ambos os requests respondem 200 (nenhum 500 por corrida).
      for (const res of responses) {
        expect(res.status).toBe(200);
      }

      // Exatamente um dos dois creditou XP; o outro creditou 0.
      const awarded = responses.map((res) => res.body.xpAwarded).sort((a, b) => a - b);
      expect(awarded).toEqual([0, 10]);

      // A garantia forte: apenas 1 XpEvent no ledger para esta lição/perfil.
      const events = await prisma.xpEvent.findMany({
        where: { profileId: concProfileId, source: "LESSON_COMPLETED" },
      });
      expect(events).toHaveLength(1);

      // FIRST_LESSON concedido no máximo uma vez (única lição concluída = a primeira).
      const badges = await prisma.profileBadge.findMany({
        where: { profileId: concProfileId, badge: { code: "FIRST_LESSON" } },
      });
      expect(badges.length).toBeLessThanOrEqual(1);

      // xpTotal final consistente com um único crédito de 10 XP.
      const totalRes = await request(server)
        .get("/gamification/xp")
        .set("Authorization", `Bearer ${concToken}`)
        .expect(200);
      expect(totalRes.body.total).toBe(10);
    });
  });
});
