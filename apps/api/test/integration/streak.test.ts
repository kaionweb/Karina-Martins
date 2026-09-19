import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

describe("Streak cron job (Story 3.3)", () => {
  let app: INestApplication;
  const testEmail = `story-3.3-${Date.now()}@test.local`;
  const cronSecret = process.env.CRON_SECRET as string;

  let profileId: string;
  let inactiveProfileId: string;

  const today = utcMidnight(new Date());
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const longAgo = new Date(today);
  longAgo.setUTCDate(longAgo.getUTCDate() - 10);

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const user = await prisma.user.create({ data: { email: testEmail, passwordHash: "hashed-password" } });

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        nickname: "Perfil ativo ontem",
        type: "CHILD",
        ageRange: "4-6",
        currentStreak: 3,
        longestStreak: 3,
        lastActiveDate: yesterday,
      },
    });
    profileId = profile.id;

    const inactiveProfile = await prisma.profile.create({
      data: {
        userId: user.id,
        nickname: "Perfil com lacuna",
        type: "CHILD",
        ageRange: "6-8",
        currentStreak: 5,
        longestStreak: 5,
        lastActiveDate: longAgo,
      },
    });
    inactiveProfileId = inactiveProfile.id;

    // Só o primeiro perfil tem atividade "hoje" nesta fase inicial do teste.
    await prisma.xpEvent.create({ data: { profileId, amount: 10, source: "LESSON_COMPLETED" } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita sem header X-Cron-Secret (401)", async () => {
    await request(app.getHttpServer()).post("/internal/cron/streak").expect(401);
  });

  it("rejeita com X-Cron-Secret incorreto (401)", async () => {
    await request(app.getHttpServer())
      .post("/internal/cron/streak")
      .set("X-Cron-Secret", "secret-errado")
      .expect(401);
  });

  it("incrementa o streak de um perfil ativo hoje que também estava ativo ontem (AC1)", async () => {
    await request(app.getHttpServer()).post("/internal/cron/streak").set("X-Cron-Secret", cronSecret).expect(200);

    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.currentStreak).toBe(4);
    expect(profile.longestStreak).toBe(4);
    expect(profile.lastActiveDate?.getTime()).toBe(today.getTime());
  });

  it("não altera um perfil sem atividade hoje", async () => {
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: inactiveProfileId } });
    expect(profile.currentStreak).toBe(5);
    expect(profile.lastActiveDate?.getTime()).toBe(longAgo.getTime());
  });

  it("é idempotente: rodar de novo no mesmo dia não incrementa de novo (AC2)", async () => {
    await request(app.getHttpServer()).post("/internal/cron/streak").set("X-Cron-Secret", cronSecret).expect(200);

    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.currentStreak).toBe(4);
  });

  it("reinicia o streak para 1 quando havia uma lacuna, preservando o longestStreak", async () => {
    await prisma.xpEvent.create({ data: { profileId: inactiveProfileId, amount: 10, source: "LESSON_COMPLETED" } });

    await request(app.getHttpServer()).post("/internal/cron/streak").set("X-Cron-Secret", cronSecret).expect(200);

    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: inactiveProfileId } });
    expect(profile.currentStreak).toBe(1);
    expect(profile.longestStreak).toBe(5);
  });
});
