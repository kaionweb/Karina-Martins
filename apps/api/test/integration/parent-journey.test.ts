import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

describe("GET /parent/profiles/:id/journey (Story 5.1)", () => {
  let app: INestApplication;
  const testEmail = `story-5.1-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-5.1-show-${Date.now()}`;

  let rawToken: string;
  let adultToken: string;
  let childToken: string;
  let adultProfileId: string;
  let childProfileId: string;
  let lessonId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    rawToken = loginRes.body.accessToken;

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail }, include: { profiles: true } });
    adultProfileId = user.profiles[0].id;

    const adultSelectRes = await request(app.getHttpServer())
      .post(`/profiles/${adultProfileId}/select`)
      .set("Authorization", `Bearer ${rawToken}`)
      .expect(200);
    adultToken = adultSelectRes.body.accessToken;

    const childProfile = await prisma.profile.create({
      data: { userId: user.id, nickname: "Pequena Exploradora", type: "CHILD", ageRange: "4-6" },
    });
    childProfileId = childProfile.id;
    const childSelectRes = await request(app.getHttpServer())
      .post(`/profiles/${childProfileId}/select`)
      .set("Authorization", `Bearer ${rawToken}`)
      .expect(200);
    childToken = childSelectRes.body.accessToken;

    const show = await prisma.show.create({
      data: { title: testShowTitle, synopsis: "Sinopse original de teste.", thumbnailKey: "ds/thumb-test" },
    });
    const track = await prisma.track.create({ data: { showId: show.id, title: "Trilha de teste", order: 1 } });
    const lesson = await prisma.lesson.create({
      data: { trackId: track.id, title: "Lição de teste", order: 1, contentBody: "Conteúdo original." },
    });
    lessonId = lesson.id;

    await request(app.getHttpServer())
      .post(`/lessons/${lessonId}/complete`)
      .set("Authorization", `Bearer ${childToken}`)
      .expect(200);

    await prisma.profile.update({
      where: { id: childProfileId },
      data: { currentStreak: 2, longestStreak: 3 },
    });
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita sem token (401)", async () => {
    await request(app.getHttpServer()).get(`/parent/profiles/${childProfileId}/journey`).expect(401);
  });

  it("rejeita quando o perfil ativo é CHILD (403)", async () => {
    await request(app.getHttpServer())
      .get(`/parent/profiles/${childProfileId}/journey`)
      .set("Authorization", `Bearer ${childToken}`)
      .expect(403);
  });

  it("retorna 404 para perfil inexistente", async () => {
    await request(app.getHttpServer())
      .get("/parent/profiles/clnonexistentprofile00000/journey")
      .set("Authorization", `Bearer ${adultToken}`)
      .expect(404);
  });

  it("retorna 404 quando o perfil-alvo não é CHILD (é o próprio ADULT)", async () => {
    await request(app.getHttpServer())
      .get(`/parent/profiles/${adultProfileId}/journey`)
      .set("Authorization", `Bearer ${adultToken}`)
      .expect(404);
  });

  it("retorna a jornada consolidada do perfil CHILD (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/parent/profiles/${childProfileId}/journey`)
      .set("Authorization", `Bearer ${adultToken}`)
      .expect(200);

    expect(res.body.profile).toMatchObject({
      id: childProfileId,
      nickname: "Pequena Exploradora",
      ageRange: "4-6",
      currentStreak: 2,
      longestStreak: 3,
    });
    expect(res.body.xpTotal).toBe(10);
    expect(res.body.badges.map((b: { code: string }) => b.code)).toEqual(["FIRST_LESSON"]);
    expect(res.body.completedLessons).toEqual([
      { lessonId, title: "Lição de teste", completedAt: expect.any(String) },
    ]);
  });
});
