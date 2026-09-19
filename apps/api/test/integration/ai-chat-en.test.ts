import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";
import { GEMINI_CLIENT } from "../../src/modules/ai/ai.constants";

function mockGeminiReply(text: string, inputTokens: number, outputTokens: number) {
  return {
    response: {
      text: () => JSON.stringify({ text }),
      usageMetadata: { promptTokenCount: inputTokens, candidatesTokenCount: outputTokens },
    },
  };
}

describe("POST /ai/chat/en (Story 4.2)", () => {
  let app: INestApplication;
  const testEmail = `story-4.2-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-4.2-show-${Date.now()}`;

  let scopedToken: string;
  let childToken: string;
  let rawToken: string;
  let lessonId: string;
  let generateContentMock: jest.Mock;
  let getGenerativeModelMock: jest.Mock;

  beforeAll(async () => {
    generateContentMock = jest.fn().mockResolvedValue(mockGeminiReply("Hello! Let's talk about colors.", 20, 8));
    getGenerativeModelMock = jest.fn().mockReturnValue({ generateContent: generateContentMock });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GEMINI_CLIENT)
      .useValue({ getGenerativeModel: getGenerativeModelMock })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    const accessToken = loginRes.body.accessToken;
    rawToken = accessToken;

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail }, include: { profiles: true } });
    const profileId = user.profiles[0].id;

    const selectRes = await request(app.getHttpServer())
      .post(`/profiles/${profileId}/select`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    scopedToken = selectRes.body.accessToken;

    const childProfile = await prisma.profile.create({
      data: { userId: user.id, nickname: "Pequeno Explorador", type: "CHILD", ageRange: "4-6" },
    });
    const childSelectRes = await request(app.getHttpServer())
      .post(`/profiles/${childProfile.id}/select`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    childToken = childSelectRes.body.accessToken;

    const show = await prisma.show.create({
      data: { title: testShowTitle, synopsis: "Sinopse original de teste.", thumbnailKey: "ds/thumb-test" },
    });
    const track = await prisma.track.create({ data: { showId: show.id, title: "Trilha de teste", order: 1 } });
    const lesson = await prisma.lesson.create({
      data: { trackId: track.id, title: "Colors in the Forest", order: 1, contentBody: "Learn colors with forest animals." },
    });
    lessonId = lesson.id;
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita sem token (401)", async () => {
    await request(app.getHttpServer()).post("/ai/chat/en").send({ lessonId, message: "Hi" }).expect(401);
  });

  it("rejeita corpo inválido (400)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId: "not-a-cuid", message: "" })
      .expect(400);
  });

  it("retorna 404 para lição inexistente", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId: "clnonexistentlesson0000000", message: "Hi" })
      .expect(404);
  });

  it("retorna { reply } chamando gemini-3.6-flash com o tema da lição no system prompt (AC1, AC3)", async () => {
    const res = await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId, message: "What is your favorite pizza topping?" })
      .expect(200);

    expect(res.body).toEqual({ reply: "Hello! Let's talk about colors." });
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.6-flash",
        systemInstruction: expect.stringContaining("Colors in the Forest"),
      }),
    );
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [{ role: "user", parts: [{ text: "What is your favorite pizza topping?" }] }],
      }),
    );
  });

  it("retorna 200 com fallback gentil quando o Gemini falha, sem persistir AiSession (correção pós-4.2)", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("Gemini indisponível"));

    const sessionsBefore = await prisma.aiSession.count();

    const res = await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId, message: "Hi" })
      .expect(200);

    expect(res.body).toEqual({ reply: "Oops! I'm taking a little break. Try again in a moment! 🙂" });
    expect(await prisma.aiSession.count()).toBe(sessionsBefore);
  });

  it("retorna a mensagem segura de fallback quando o perfil é CHILD e a resposta da IA é reprovada pelo filtro (Story 4.4, AC1, AC2)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("The hunter will kill the animal.", 20, 8));

    const res = await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${childToken}`)
      .send({ lessonId, message: "Tell me a story" })
      .expect(200);

    expect(res.body.reply).not.toBe("The hunter will kill the animal.");
    expect(res.body.reply).toContain("lesson");
  });

  it("continua retornando a resposta real para perfil ADULT mesmo com conteúdo reprovado (filtro só se aplica a CHILD, Story 4.4)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("The hunter will kill the animal.", 20, 8));

    const res = await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId, message: "Tell me a story" })
      .expect(200);

    expect(res.body).toEqual({ reply: "The hunter will kill the animal." });
  });

  it("rejeita quando não há perfil ativo (403, Story 4.5)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${rawToken}`)
      .send({ lessonId, message: "Hi" })
      .expect(403);
  });

  it("persiste AiSession + AiMessage com os tokens corretos (Story 4.5, AC2)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("Sure, colors are fun!", 33, 12));

    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId, message: "Tell me about colors" })
      .expect(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const adultProfile = await prisma.profile.findFirstOrThrow({ where: { userId: user.id, type: "ADULT" } });

    const session = await prisma.aiSession.findFirstOrThrow({
      where: { profileId: adultProfile.id, language: "EN", promptTokens: 33 },
      include: { messages: true },
    });

    expect(session.completionTokens).toBe(12);
    expect(session.lessonId).toBe(lessonId);
    expect(session.messages).toHaveLength(2);
    expect(session.messages.find((m) => m.role === "user")).toMatchObject({
      content: "Tell me about colors",
      flaggedByFilter: false,
    });
    expect(session.messages.find((m) => m.role === "assistant")).toMatchObject({
      content: "Sure, colors are fun!",
      flaggedByFilter: false,
    });
  });

  it("persiste a mensagem reprovada com flaggedByFilter=true e content=fallback, nunca o texto reprovado (Story 4.4+4.5)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("The hunter will kill the animal.", 15, 9));

    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${childToken}`)
      .send({ lessonId, message: "Tell me a violent story" })
      .expect(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const childProfile = await prisma.profile.findFirstOrThrow({ where: { userId: user.id, type: "CHILD" } });

    const session = await prisma.aiSession.findFirstOrThrow({
      where: { profileId: childProfile.id, promptTokens: 15 },
      include: { messages: true },
    });

    const assistantMessage = session.messages.find((m) => m.role === "assistant");
    expect(assistantMessage?.flaggedByFilter).toBe(true);
    expect(assistantMessage?.content).not.toBe("The hunter will kill the animal.");
    expect(assistantMessage?.content).toContain("lesson");
  });

  it("aceita scenario curado sem lessonId e usa o tema do cenário no system prompt (Conversação)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("Hi! Let's shop for apples.", 18, 6));

    const res = await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ scenario: "No Supermercado", message: "What should I buy?" })
      .expect(200);

    expect(res.body).toEqual({ reply: "Hi! Let's shop for apples." });
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.6-flash",
        systemInstruction: expect.stringContaining("No Supermercado"),
      }),
    );

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const adultProfile = await prisma.profile.findFirstOrThrow({ where: { userId: user.id, type: "ADULT" } });
    const session = await prisma.aiSession.findFirstOrThrow({
      where: { profileId: adultProfile.id, language: "EN", promptTokens: 18 },
    });
    expect(session.lessonId).toBeNull();
  });

  it("rejeita scenario fora da lista curada (400)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ scenario: "Texto livre qualquer", message: "Hi" })
      .expect(400);
  });

  it("rejeita quando envia lessonId e scenario juntos (400)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId, scenario: "No Supermercado", message: "Hi" })
      .expect(400);
  });

  it("rejeita quando não envia nem lessonId nem scenario (400)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ message: "Hi" })
      .expect(400);
  });

  it("bloqueia com 429 ao atingir AI_DAILY_LIMIT, sem chamar o Gemini a mais (Story 4.5, AC1)", async () => {
    const originalLimit = process.env.AI_DAILY_LIMIT;
    process.env.AI_DAILY_LIMIT = "1";

    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
      // Trial expirado: perfil novo nasceria com trialStartedAt=now() (trial
      // ativo), o que isentaria o limite diário e mascararia este teste.
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const limitProfile = await prisma.profile.create({
        data: { userId: user.id, nickname: "Perfil do Limite", type: "ADULT", trialStartedAt: eightDaysAgo },
      });
      const selectRes = await request(app.getHttpServer())
        .post(`/profiles/${limitProfile.id}/select`)
        .set("Authorization", `Bearer ${rawToken}`)
        .expect(200);
      const limitToken = selectRes.body.accessToken;

      await request(app.getHttpServer())
        .post("/ai/chat/en")
        .set("Authorization", `Bearer ${limitToken}`)
        .send({ lessonId, message: "First message" })
        .expect(200);

      const callsBefore = generateContentMock.mock.calls.length;

      await request(app.getHttpServer())
        .post("/ai/chat/en")
        .set("Authorization", `Bearer ${limitToken}`)
        .send({ lessonId, message: "Second message" })
        .expect(429);

      expect(generateContentMock.mock.calls.length).toBe(callsBefore);
    } finally {
      process.env.AI_DAILY_LIMIT = originalLimit;
    }
  });
});
