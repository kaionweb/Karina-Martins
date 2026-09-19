import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";
import { verifyRefreshToken } from "../../src/common/auth/jwt.util";

describe("Profiles (Story 1.4)", () => {
  let app: INestApplication;
  const testEmail = `story-1.4-${Date.now()}@test.local`;
  const password = "senha-segura-123";

  let userAccessToken: string;
  let adultProfileId: string;
  let childProfileId: string;

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
    adultProfileId = user.profiles[0].id;

    const childProfile = await prisma.profile.create({
      data: { userId: user.id, nickname: "Pequeno Explorador", type: "CHILD", ageRange: "4-6" },
    });
    childProfileId = childProfile.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita GET /profiles sem token (401)", async () => {
    await request(app.getHttpServer()).get("/profiles").expect(401);
  });

  it("lista os perfis da conta com token de login (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .get("/profiles")
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.map((p: { type: string }) => p.type).sort()).toEqual(["ADULT", "CHILD"]);
  });

  it("rejeita seleção de perfil de outro usuário/inexistente (404)", async () => {
    await request(app.getHttpServer())
      .post("/profiles/id-que-nao-existe/select")
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(404);
  });

  let adultScopedToken: string;

  it("seleciona o perfil ADULT e recebe um novo access token (AC2)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/profiles/${adultProfileId}/select`)
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(200);

    expect(typeof res.body.accessToken).toBe("string");
    adultScopedToken = res.body.accessToken;
  });

  it("POST /profiles/:id/select reemite Set-Cookie de refresh_token com { sub, profileId } corretos (Story 10.4, AC4)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/profiles/${adultProfileId}/select`)
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(200);

    const cookies = res.headers["set-cookie"] as unknown as string[];
    const refreshCookie = cookies?.find((c) => c.startsWith("refresh_token="));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/SameSite=None/i);

    const rawToken = decodeURIComponent((refreshCookie as string).split("refresh_token=")[1].split(";")[0]);
    const payload = verifyRefreshToken(rawToken);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    expect(payload.sub).toBe(user.id);
    expect(payload.profileId).toBe(adultProfileId);
  });

  it("token pós-seleção ADULT ainda lista todos os perfis (AC3)", async () => {
    const res = await request(app.getHttpServer())
      .get("/profiles")
      .set("Authorization", `Bearer ${adultScopedToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  let childScopedToken: string;

  it("seleciona o perfil CHILD", async () => {
    const res = await request(app.getHttpServer())
      .post(`/profiles/${childProfileId}/select`)
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(200);

    childScopedToken = res.body.accessToken;
  });

  it("token pós-seleção CHILD não pode listar os perfis da conta (403, AC4)", async () => {
    await request(app.getHttpServer())
      .get("/profiles")
      .set("Authorization", `Bearer ${childScopedToken}`)
      .expect(403);
  });

  it("REGRESSÃO SEC-002: token CHILD não consegue se autopromover a ADULT via /select", async () => {
    await request(app.getHttpServer())
      .post(`/profiles/${adultProfileId}/select`)
      .set("Authorization", `Bearer ${childScopedToken}`)
      .expect(403);
  });

  it("REGRESSÃO SEC-002: token CHILD não consegue trocar para outro perfil CHILD via /select", async () => {
    const otherChild = await prisma.profile.create({
      data: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: testEmail } })).id, nickname: "Outro Filho", type: "CHILD" },
    });

    await request(app.getHttpServer())
      .post(`/profiles/${otherChild.id}/select`)
      .set("Authorization", `Bearer ${childScopedToken}`)
      .expect(403);
  });

  it("token CHILD pode reselecionar a si mesmo (no-op permitido)", async () => {
    await request(app.getHttpServer())
      .post(`/profiles/${childProfileId}/select`)
      .set("Authorization", `Bearer ${childScopedToken}`)
      .expect(200);
  });

  it("POST /profiles cria um perfil CHILD vinculado à conta (AC1, Story 8.1)", async () => {
    const res = await request(app.getHttpServer())
      .post("/profiles")
      .set("Authorization", `Bearer ${userAccessToken}`)
      .send({ nickname: "Novo Explorador", ageRange: "6-8" })
      .expect(201);

    expect(res.body.type).toBe("CHILD");
    expect(res.body.nickname).toBe("Novo Explorador");
    expect(res.body.ageRange).toBe("6-8");

    const created = await prisma.profile.findUnique({ where: { id: res.body.id } });
    expect(created?.userId).toBe((await prisma.user.findUniqueOrThrow({ where: { email: testEmail } })).id);
  });

  it("POST /profiles com token de perfil CHILD ativo é bloqueado (403, AC2, Story 8.1)", async () => {
    await request(app.getHttpServer())
      .post("/profiles")
      .set("Authorization", `Bearer ${childScopedToken}`)
      .send({ nickname: "Não deveria criar" })
      .expect(403);
  });

  it("POST /profiles sem nickname é rejeitado (400, Story 8.1)", async () => {
    await request(app.getHttpServer())
      .post("/profiles")
      .set("Authorization", `Bearer ${userAccessToken}`)
      .send({ ageRange: "6-8" })
      .expect(400);
  });
});
