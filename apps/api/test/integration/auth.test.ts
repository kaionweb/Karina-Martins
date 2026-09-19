import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import * as jwt from "jsonwebtoken";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

describe("Auth (Story 1.2)", () => {
  let app: INestApplication;
  const testEmail = `story-1.2-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  let refreshCookie: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("registra uma nova conta ADULT (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: testEmail, password })
      .expect(201);

    expect(res.body.email).toBe(testEmail);

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { profiles: true },
    });
    expect(user?.profiles).toHaveLength(1);
    expect(user?.profiles[0].type).toBe("ADULT");
  });

  it("rejeita registro com payload inválido (400) — AC4", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: "nao-e-um-email", password: "123" })
      .expect(400);

    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejeita login com payload inválido (400) — AC4", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "nao-e-um-email", password: "123" })
      .expect(400);
  });

  it("rejeita registro com email duplicado (409)", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: testEmail, password })
      .expect(409);
  });

  it("faz login e recebe access token + refresh cookie httpOnly (AC1, AC2)", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testEmail, password })
      .expect(200);

    expect(typeof res.body.accessToken).toBe("string");

    const cookies = res.headers["set-cookie"] as unknown as string[];
    const cookie = cookies?.find((c) => c.startsWith("refresh_token="));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=None/i);
    refreshCookie = cookie as string;
  });

  it("rejeita login com senha errada (401)", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testEmail, password: "senha-errada" })
      .expect(401);
  });

  it("renova o access token via refresh cookie (AC2)", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", refreshCookie)
      .expect(200);

    expect(typeof res.body.accessToken).toBe("string");
  });

  it("rejeita refresh sem cookie (401)", async () => {
    await request(app.getHttpServer()).post("/auth/refresh").expect(401);
  });

  it("logout limpa o cookie de refresh", async () => {
    const res = await request(app.getHttpServer()).post("/auth/logout").expect(200);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    const cookie = cookies?.find((c) => c.startsWith("refresh_token="));
    expect(cookie).toMatch(/refresh_token=;/);
  });
});

describe("Auth refresh carrega profileId (Story 10.4)", () => {
  let app: INestApplication;
  const testEmail = `story-10.4-${Date.now()}@test.local`;
  const password = "senha-segura-123";

  let userAccessToken: string;
  let userId: string;
  let adultProfileId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    userAccessToken = loginRes.body.accessToken;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: testEmail },
      include: { profiles: true },
    });
    userId = user.id;
    adultProfileId = user.profiles[0].id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("refresh token reemitido por /profiles/:id/select carrega profileId e é aceito por /auth/refresh, retornando { accessToken, profileId } (AC4, AC5)", async () => {
    const selectRes = await request(app.getHttpServer())
      .post(`/profiles/${adultProfileId}/select`)
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(200);

    const cookies = selectRes.headers["set-cookie"] as unknown as string[];
    const refreshCookie = cookies?.find((c) => c.startsWith("refresh_token="));
    expect(refreshCookie).toBeDefined();

    const refreshRes = await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", refreshCookie as string)
      .expect(200);

    expect(typeof refreshRes.body.accessToken).toBe("string");
    expect(refreshRes.body.profile?.id).toBe(adultProfileId);
  });

  it("compatibilidade retroativa (AC6): refresh token legado { sub } (sem profileId) é aceito, retornando { accessToken } sem profileId", async () => {
    // Token no formato ANTIGO (antes desta story): payload { sub } apenas, sem
    // passar por selectProfile. Prova que usuários já logados no deploy não são
    // deslogados à força.
    const legacyToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" });

    const res = await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", `refresh_token=${legacyToken}`)
      .expect(200);

    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.profileId).toBeUndefined();
  });
});
