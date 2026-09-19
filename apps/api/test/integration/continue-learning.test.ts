import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

/**
 * Contrato HTTP de GET /lessons/continue-learning (Story 10.3) + regressão explícita
 * de GET /catalog/tracks/:id/lessons (Story 2.3) e POST /lessons/:id/complete
 * (Story 3.2) após a mudança de schema (`completed`/`lastAccessedAt`).
 */
describe("Continue Learning (Story 10.3)", () => {
  let app: INestApplication;
  const testEmail = `story-10.3-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-10.3-show-${Date.now()}`;

  let unscopedToken: string;
  let scopedToken: string;
  let trackId: string;
  let lessonIds: string[] = [];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    unscopedToken = loginRes.body.accessToken; // sem perfil selecionado

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail }, include: { profiles: true } });
    const profileId = user.profiles[0].id;

    const selectRes = await request(app.getHttpServer())
      .post(`/profiles/${profileId}/select`)
      .set("Authorization", `Bearer ${unscopedToken}`)
      .expect(200);
    scopedToken = selectRes.body.accessToken;

    const show = await prisma.show.create({
      data: { title: testShowTitle, synopsis: "Sinopse original de teste.", thumbnailKey: "ds/thumb-10.3" },
    });

    const track = await prisma.track.create({ data: { showId: show.id, title: "Trilha 10.3", order: 1 } });
    trackId = track.id;

    const lesson1 = await prisma.lesson.create({
      data: { trackId, title: "Lição 1", order: 1, contentBody: "Conteúdo original 1." },
    });
    const lesson2 = await prisma.lesson.create({
      data: { trackId, title: "Lição 2", order: 2, contentBody: "Conteúdo original 2." },
    });
    lessonIds = [lesson1.id, lesson2.id];
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita GET /lessons/continue-learning sem token (401)", async () => {
    await request(app.getHttpServer()).get("/lessons/continue-learning").expect(401);
  });

  it("retorna 403 NO_ACTIVE_PROFILE sem perfil ativo", async () => {
    const res = await request(app.getHttpServer())
      .get("/lessons/continue-learning")
      .set("Authorization", `Bearer ${unscopedToken}`)
      .expect(403);

    expect(res.body.error.code).toBe("NO_ACTIVE_PROFILE");
  });

  it("retorna { hasProgress: false } antes de qualquer acesso", async () => {
    const res = await request(app.getHttpServer())
      .get("/lessons/continue-learning")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body).toEqual({ hasProgress: false });
  });

  it("GET /lessons/:id registra o acesso e continue-learning passa a refletir a lição", async () => {
    await request(app.getHttpServer())
      .get(`/lessons/${lessonIds[0]}`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/lessons/continue-learning")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body.hasProgress).toBe(true);
    expect(res.body.lessonId).toBe(lessonIds[0]);
    expect(res.body.trackId).toBe(trackId);
    expect(res.body.lessonPosition).toBe(1);
    expect(res.body.totalLessonsInTrack).toBe(2);
    // Apenas acessada, nada concluído ainda ⇒ 0%.
    expect(res.body.trackProgressPercent).toBe(0);
  });

  it("acessar (não concluir) uma lição NÃO a marca como completed em GET /catalog/tracks/:id/lessons", async () => {
    const res = await request(app.getHttpServer())
      .get(`/catalog/tracks/${trackId}/lessons`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const lesson1 = res.body.find((l: { id: string }) => l.id === lessonIds[0]);
    expect(lesson1.completed).toBe(false);
  });

  it("POST /lessons/:id/complete marca completed apenas para a lição concluída (regressão Story 2.3/3.2)", async () => {
    await request(app.getHttpServer())
      .post(`/lessons/${lessonIds[1]}/complete`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/catalog/tracks/${trackId}/lessons`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const lesson1 = res.body.find((l: { id: string }) => l.id === lessonIds[0]);
    const lesson2 = res.body.find((l: { id: string }) => l.id === lessonIds[1]);
    expect(lesson1.completed).toBe(false); // apenas acessada
    expect(lesson2.completed).toBe(true); // concluída

    // continue-learning reflete o progresso da trilha (1 de 2 concluídas ⇒ 50%).
    const cl = await request(app.getHttpServer())
      .get("/lessons/continue-learning")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);
    expect(cl.body.trackProgressPercent).toBe(50);
  });
});
