import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

describe("Badges (Story 3.4)", () => {
  let app: INestApplication;
  const testEmail = `story-3.4-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-3.4-show-${Date.now()}`;
  const cronSecret = process.env.CRON_SECRET as string;

  let scopedToken: string;
  let profileId: string;
  let lessonId1: string;
  let lessonId2: string;

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
    const lesson1 = await prisma.lesson.create({
      data: { trackId: track.id, title: "Lição 1", order: 1, contentBody: "Conteúdo original 1." },
    });
    const lesson2 = await prisma.lesson.create({
      data: { trackId: track.id, title: "Lição 2", order: 2, contentBody: "Conteúdo original 2." },
    });
    lessonId1 = lesson1.id;
    lessonId2 = lesson2.id;
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita GET /gamification/badges sem token (401)", async () => {
    await request(app.getHttpServer()).get("/gamification/badges").expect(401);
  });

  it("retorna lista vazia antes de qualquer conquista", async () => {
    const res = await request(app.getHttpServer())
      .get("/gamification/badges")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("concede FIRST_LESSON ao concluir a primeira lição (AC1)", async () => {
    await request(app.getHttpServer())
      .post(`/lessons/${lessonId1}/complete`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/gamification/badges")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].code).toBe("FIRST_LESSON");
  });

  it("não concede FIRST_LESSON de novo ao concluir uma segunda lição", async () => {
    await request(app.getHttpServer())
      .post(`/lessons/${lessonId2}/complete`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/gamification/badges")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
  });

  it("concede STREAK_3 quando o streak atinge 3 dias (AC1)", async () => {
    const today = utcMidnight(new Date());
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    // Perfil já com streak de 2, ativo ontem — o job de hoje leva pra 3.
    await prisma.profile.update({
      where: { id: profileId },
      data: { currentStreak: 2, longestStreak: 2, lastActiveDate: yesterday },
    });

    await request(app.getHttpServer())
      .post("/internal/cron/streak")
      .set("X-Cron-Secret", cronSecret)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/gamification/badges")
      .set("Authorization", `Bearer ${scopedToken}`)
      .expect(200);

    const codes = res.body.map((badge: { code: string }) => badge.code).sort();
    expect(codes).toEqual(["FIRST_LESSON", "STREAK_3"]);
  });
});
