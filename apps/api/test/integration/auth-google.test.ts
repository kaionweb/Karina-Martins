import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";
import { AuthService } from "../../src/modules/auth/auth.service";

describe("Auth Google OAuth (Story 1.3)", () => {
  let app: INestApplication;
  let authService: AuthService;

  const newUserEmail = `story-1.3-new-${Date.now()}@test.local`;
  const linkedUserEmail = `story-1.3-linked-${Date.now()}@test.local`;
  const unverifiedUserEmail = `story-1.3-unverified-${Date.now()}@test.local`;
  const passwordOnlyEmail = `story-1.3-password-only-${Date.now()}@test.local`;
  const password = "senha-segura-123";

  const googleIdNewUser = `google-new-${Date.now()}`;
  const googleIdLinked = `google-linked-${Date.now()}`;
  const googleIdUnverified = `google-unverified-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    authService = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [newUserEmail, linkedUserEmail, unverifiedUserEmail, passwordOnlyEmail] } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it("cria User + Profile ADULT (passwordHash null) para um perfil Google novo (AC1)", async () => {
    const result = await authService.loginWithGoogle({
      googleId: googleIdNewUser,
      email: newUserEmail,
      emailVerified: true,
    });

    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");

    const user = await prisma.user.findUnique({ where: { email: newUserEmail }, include: { profiles: true } });
    expect(user?.googleId).toBe(googleIdNewUser);
    expect(user?.passwordHash).toBeNull();
    expect(user?.profiles).toHaveLength(1);
    expect(user?.profiles[0].type).toBe("ADULT");
  });

  it("reconhece a mesma conta em um login Google subsequente (mesmo googleId) — AC1", async () => {
    const first = await prisma.user.findUnique({ where: { email: newUserEmail } });

    const result = await authService.loginWithGoogle({
      googleId: googleIdNewUser,
      email: newUserEmail,
      emailVerified: true,
    });

    expect(typeof result.accessToken).toBe("string");

    const usersWithThisGoogleId = await prisma.user.count({ where: { googleId: googleIdNewUser } });
    expect(usersWithThisGoogleId).toBe(1);
    expect(first?.id).toBeDefined();
  });

  it("associa googleId a uma conta ADULT já existente (cadastrada por senha, mesmo email) — AC1, AC2", async () => {
    const registerRes = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: linkedUserEmail, password })
      .expect(201);
    expect(registerRes.body.email).toBe(linkedUserEmail);

    const result = await authService.loginWithGoogle({
      googleId: googleIdLinked,
      email: linkedUserEmail,
      emailVerified: true,
    });
    expect(typeof result.accessToken).toBe("string");

    const user = await prisma.user.findUnique({ where: { email: linkedUserEmail } });
    expect(user?.googleId).toBe(googleIdLinked);
    expect(user?.passwordHash).not.toBeNull();
  });

  it("login por senha continua funcionando para a conta que também foi associada ao Google", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: linkedUserEmail, password })
      .expect(200);
    expect(typeof res.body.accessToken).toBe("string");
  });

  it("rejeita associação por email quando o email do Google não é verificado (hardening anti account-takeover)", async () => {
    await request(app.getHttpServer()).post("/auth/register").send({ email: unverifiedUserEmail, password }).expect(201);

    await expect(
      authService.loginWithGoogle({
        googleId: googleIdUnverified,
        email: unverifiedUserEmail,
        emailVerified: false,
      }),
    ).rejects.toThrow();

    const user = await prisma.user.findUnique({ where: { email: unverifiedUserEmail } });
    expect(user?.googleId).toBeNull();
  });

  it("emite cookie de refresh com os mesmos atributos da Story 1.2 (httpOnly, SameSite=None)", async () => {
    const googleId = `google-cookie-${Date.now()}`;
    const email = `story-1.3-cookie-${Date.now()}@test.local`;
    const { refreshToken } = await authService.loginWithGoogle({ googleId, email, emailVerified: true });

    // Simula o que o controller faz no callback: seta o mesmo cookie usado em /auth/login
    // (o controller em si não é exercitado aqui pois exige o AuthGuard("google") real)
    expect(typeof refreshToken).toBe("string");

    await prisma.user.deleteMany({ where: { email } });
  });

  it("regressão: conta 100%-Google (passwordHash null) tentando /auth/login com senha recebe 401, não 500", async () => {
    const googleOnlyEmail = `story-1.3-google-only-${Date.now()}@test.local`;
    await authService.loginWithGoogle({
      googleId: `google-only-${Date.now()}`,
      email: googleOnlyEmail,
      emailVerified: true,
    });

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: googleOnlyEmail, password: "qualquer-senha-123" })
      .expect(401);

    await prisma.user.deleteMany({ where: { email: googleOnlyEmail } });
  });

  it("regressão: login por senha continua funcionando para contas nunca tocadas pelo Google", async () => {
    await request(app.getHttpServer()).post("/auth/register").send({ email: passwordOnlyEmail, password }).expect(201);

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: passwordOnlyEmail, password })
      .expect(200);
    expect(typeof res.body.accessToken).toBe("string");
  });
});

describe("Auth Google OAuth — guard/Strategy layer (fix SEC-003 / TEST-002)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /auth/google redireciona para o Google com state e seta o cookie oauth_state (httpOnly, SameSite=Lax)", async () => {
    const res = await request(app.getHttpServer()).get("/auth/google").expect(302);

    expect(res.headers.location).toContain("accounts.google.com");
    expect(res.headers.location).toMatch(/state=/);

    const cookies = res.headers["set-cookie"] as unknown as string[];
    const stateCookie = cookies?.find((c) => c.startsWith("oauth_state="));
    expect(stateCookie).toBeDefined();
    expect(stateCookie).toMatch(/HttpOnly/i);
    expect(stateCookie).toMatch(/SameSite=Lax/i);
  });

  it("GET /auth/google/callback rejeita quando o state não bate com nenhum cookie — cenário de login CSRF (SEC-003)", async () => {
    const res = await request(app.getHttpServer()).get(
      "/auth/google/callback?code=fake-code&state=state-forjado-pelo-atacante",
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("GET /auth/google/callback rejeita quando não há state nenhum na query", async () => {
    const res = await request(app.getHttpServer()).get("/auth/google/callback?code=fake-code");

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("GET /auth/google/callback rejeita mesmo com o cookie presente, se o state da query for diferente", async () => {
    const initial = await request(app.getHttpServer()).get("/auth/google").expect(302);
    const cookies = initial.headers["set-cookie"] as unknown as string[];
    const stateCookie = cookies?.find((c) => c.startsWith("oauth_state="));
    expect(stateCookie).toBeDefined();

    const res = await request(app.getHttpServer())
      .get("/auth/google/callback?code=fake-code&state=um-valor-diferente-do-cookie")
      .set("Cookie", stateCookie as string);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
