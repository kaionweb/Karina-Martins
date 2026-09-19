import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

describe("Lessons & Tracks Navigation (Story 2.3)", () => {
  let app: INestApplication;
  const testEmail = `story-2.3-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-2.3-show-${Date.now()}`;

  let scopedToken: string;
  let showId: string;
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
    const accessToken = loginRes.body.accessToken;

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail }, include: { profiles: true } });
    const profileId = user.profiles[0].id;

    const selectRes = await request(app.getHttpServer())
      .post(`/profiles/${profileId}/select`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    scopedToken = selectRes.body.accessToken;

    const show = await prisma.show.create({
      data: { title: testShowTitle, synopsis: "Sinopse original de teste.", thumbnailKey: "ds/thumb-test" },
    });
    showId = show.id;

    const track = await prisma.track.create({ data: { showId, title: "Trilha de teste", order: 1 } });
    trackId = track.id;

    const lesson1 = await prisma.lesson.create({
      data: { trackId, title: "Lição 1", order: 1, contentBody: "Conteúdo original 1." },
    });
    const lesson2 = await prisma.lesson.create({
      data: { trackId, title: "Lição 2", order: 2, contentBody: "Conteúdo original 2." },
    });
    lessonIds = [lesson1.id, lesson2.id];

    // Story 10.3: `completed: true` explícito — a mera existência da linha não
    // significa mais conclusão (o novo default é `completed: false`).
    await prisma.lessonProgress.create({
      data: { profileId, lessonId: lesson1.id, completed: true, completedAt: new Date() },
    });
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita GET /catalog/shows/:id/tracks sem token (401)", async () => {
    await request(app.getHttpServer()).get(`/catalog/shows/${showId}/tracks`).expect(401);
  });

  it("GET /catalog/shows/:id/tracks retorna as trilhas do show (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/catalog/shows/${showId}/tracks`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(trackId);
  });

  it("GET /catalog/shows/:id/tracks retorna 404 para show inexistente", async () => {
    await request(app.getHttpServer())
      .get("/catalog/shows/id-que-nao-existe/tracks")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(404);
  });

  it("rejeita GET /catalog/tracks/:id/lessons sem token (401)", async () => {
    await request(app.getHttpServer()).get(`/catalog/tracks/${trackId}/lessons`).expect(401);
  });

  it("GET /catalog/tracks/:id/lessons retorna as lições em ordem, com progresso do perfil ativo (AC1, AC3)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/catalog/tracks/${trackId}/lessons`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.map((l: { id: string }) => l.id)).toEqual(lessonIds);
    expect(res.body[0].completed).toBe(true);
    expect(res.body[1].completed).toBe(false);
  });

  it("GET /catalog/tracks/:id/lessons retorna 404 para trilha inexistente", async () => {
    await request(app.getHttpServer())
      .get("/catalog/tracks/id-que-nao-existe/lessons")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(404);
  });

  it("rejeita GET /lessons/:id sem token (401)", async () => {
    await request(app.getHttpServer()).get(`/lessons/${lessonIds[0]}`).expect(401);
  });

  it("GET /lessons/:id retorna o conteúdo original da lição (AC2)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/lessons/${lessonIds[0]}`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body.contentBody).toBe("Conteúdo original 1.");
  });

  it("GET /lessons/:id retorna 404 para lição inexistente", async () => {
    await request(app.getHttpServer())
      .get("/lessons/id-que-nao-existe")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(404);
  });
});
