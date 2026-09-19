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

describe("POST /ai/chat/pt (Story 4.3)", () => {
  let app: INestApplication;
  const testEmail = `story-4.3-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-4.3-show-${Date.now()}`;

  let scopedToken: string;
  let childToken: string;
  let rawToken: string;
  let lessonId: string;
  let generateContentMock: jest.Mock;
  let getGenerativeModelMock: jest.Mock;

  beforeAll(async () => {
    generateContentMock = jest
      .fn()
      .mockResolvedValue(mockGeminiReply("Claro! Vamos entender melhor essa parte.", 18, 10));
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
    await request(app.getHttpServer()).post("/ai/chat/pt").send({ message: "O que significa essa palavra?" }).expect(401);
  });

  it("rejeita corpo inválido (400)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ message: "" })
      .expect(400);
  });

  it("retorna 404 quando lessonId é informado mas a lição não existe", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId: "clnonexistentlesson0000000", message: "O que significa essa palavra?" })
      .expect(404);
  });

  it("retorna { reply } chamando gemini-3.6-flash com o tema da lição no system prompt quando lessonId é informado (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ lessonId, message: "O que significa essa palavra?" })
      .expect(200);

    expect(res.body).toEqual({ reply: "Claro! Vamos entender melhor essa parte." });
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.6-flash",
        systemInstruction: expect.stringContaining("Colors in the Forest"),
      }),
    );
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [{ role: "user", parts: [{ text: "O que significa essa palavra?" }] }],
      }),
    );
  });

  it("retorna { reply } chamando gemini-3.6-flash sem exigir lessonId (dúvida geral)", async () => {
    const res = await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ message: "Como funciona o streak do app?" })
      .expect(200);

    expect(res.body).toEqual({ reply: "Claro! Vamos entender melhor essa parte." });
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-3.6-flash" }),
    );
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [{ role: "user", parts: [{ text: "Como funciona o streak do app?" }] }],
      }),
    );
  });

  it("retorna 200 com fallback gentil quando o Gemini falha, sem persistir AiSession (correção pós-4.3)", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("Gemini indisponível"));

    const sessionsBefore = await prisma.aiSession.count();

    const res = await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ message: "Oi" })
      .expect(200);

    expect(res.body).toEqual({ reply: "Ops! A Kai tirou uma pausinha rapidinha. Tenta de novo daqui a pouco! 🙂" });
    expect(await prisma.aiSession.count()).toBe(sessionsBefore);
  });

  it("retorna a mensagem segura de fallback quando o perfil é CHILD e a resposta da IA é reprovada pelo filtro (Story 4.4, AC1, AC2)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("The hunter will kill the animal.", 18, 10));

    const res = await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${childToken}`)
      .send({ message: "Me conte uma história" })
      .expect(200);

    expect(res.body.reply).not.toBe("The hunter will kill the animal.");
    expect(res.body.reply).toContain("lição");
  });

  it("continua retornando a resposta real para perfil ADULT mesmo com conteúdo reprovado (filtro só se aplica a CHILD, Story 4.4)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("The hunter will kill the animal.", 18, 10));

    const res = await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ message: "Me conte uma história" })
      .expect(200);

    expect(res.body).toEqual({ reply: "The hunter will kill the animal." });
  });

  it("rejeita quando não há perfil ativo (403, Story 4.5)", async () => {
    await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${rawToken}`)
      .send({ message: "Oi" })
      .expect(403);
  });

  it("persiste AiSession com lessonId=null quando a dúvida é geral (Story 4.5, AC2)", async () => {
    generateContentMock.mockResolvedValueOnce(mockGeminiReply("Vamos ver o streak.", 25, 14));

    await request(app.getHttpServer())
      .post("/ai/chat/pt")
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ message: "Como funciona o streak?" })
      .expect(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const adultProfile = await prisma.profile.findFirstOrThrow({ where: { userId: user.id, type: "ADULT" } });

    const session = await prisma.aiSession.findFirstOrThrow({
      where: { profileId: adultProfile.id, language: "PT", promptTokens: 25 },
      include: { messages: true },
    });

    expect(session.lessonId).toBeNull();
    expect(session.completionTokens).toBe(14);
    expect(session.messages).toHaveLength(2);
  });

  it("bloqueia com 429 ao atingir AI_DAILY_LIMIT, compartilhado com /ai/chat/en (Story 4.5, AC1)", async () => {
    const originalLimit = process.env.AI_DAILY_LIMIT;
    process.env.AI_DAILY_LIMIT = "1";

    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
      // Trial expirado: perfil novo nasceria com trialStartedAt=now() (trial
      // ativo), o que isentaria o limite diário e mascararia este teste.
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const limitProfile = await prisma.profile.create({
        data: { userId: user.id, nickname: "Perfil do Limite PT", type: "ADULT", trialStartedAt: eightDaysAgo },
      });
      const selectRes = await request(app.getHttpServer())
        .post(`/profiles/${limitProfile.id}/select`)
        .set("Authorization", `Bearer ${rawToken}`)
        .expect(200);
      const limitToken = selectRes.body.accessToken;

      await request(app.getHttpServer())
        .post("/ai/chat/pt")
        .set("Authorization", `Bearer ${limitToken}`)
        .send({ message: "Primeira mensagem" })
        .expect(200);

      const callsBefore = generateContentMock.mock.calls.length;

      await request(app.getHttpServer())
        .post("/ai/chat/pt")
        .set("Authorization", `Bearer ${limitToken}`)
        .send({ message: "Segunda mensagem" })
        .expect(429);

      expect(generateContentMock.mock.calls.length).toBe(callsBefore);
    } finally {
      process.env.AI_DAILY_LIMIT = originalLimit;
    }
  });
});
