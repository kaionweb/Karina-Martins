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

describe("GET /parent/profiles/:id/transcripts (Story 5.2)", () => {
  let app: INestApplication;
  const testEmail = `story-5.2-${Date.now()}@test.local`;
  const password = "senha-segura-123";
  const testShowTitle = `story-5.2-show-${Date.now()}`;

  let adultToken: string;
  let childToken: string;
  let adultProfileId: string;
  let childProfileId: string;
  let lessonId: string;
  let generateContentMock: jest.Mock;

  beforeAll(async () => {
    generateContentMock = jest.fn().mockResolvedValue(mockGeminiReply("Colors are fun to learn!", 20, 8));

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GEMINI_CLIENT)
      .useValue({ getGenerativeModel: () => ({ generateContent: generateContentMock }) })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: testEmail, password });
    const loginRes = await request(app.getHttpServer()).post("/auth/login").send({ email: testEmail, password });
    const rawToken = loginRes.body.accessToken;

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
      data: { trackId: track.id, title: "Colors in the Forest", order: 1, contentBody: "Learn colors with forest animals." },
    });
    lessonId = lesson.id;

    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${childToken}`)
      .send({ lessonId, message: "Tell me about colors" })
      .expect(200);

    generateContentMock.mockResolvedValueOnce(mockGeminiReply("The hunter will kill the animal.", 15, 9));

    await request(app.getHttpServer())
      .post("/ai/chat/en")
      .set("Authorization", `Bearer ${childToken}`)
      .send({ lessonId, message: "Tell me a violent story" })
      .expect(200);
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testShowTitle } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita sem token (401)", async () => {
    await request(app.getHttpServer()).get(`/parent/profiles/${childProfileId}/transcripts`).expect(401);
  });

  it("rejeita quando o perfil ativo é CHILD (403)", async () => {
    await request(app.getHttpServer())
      .get(`/parent/profiles/${childProfileId}/transcripts`)
      .set("Authorization", `Bearer ${childToken}`)
      .expect(403);
  });

  it("retorna 404 para perfil inexistente", async () => {
    await request(app.getHttpServer())
      .get("/parent/profiles/clnonexistentprofile00000/transcripts")
      .set("Authorization", `Bearer ${adultToken}`)
      .expect(404);
  });

  it("retorna 404 quando o perfil-alvo não é CHILD (é o próprio ADULT)", async () => {
    await request(app.getHttpServer())
      .get(`/parent/profiles/${adultProfileId}/transcripts`)
      .set("Authorization", `Bearer ${adultToken}`)
      .expect(404);
  });

  it("lista as transcrições do perfil CHILD, mais recente primeiro, com flaggedByFilter correto (AC1)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/parent/profiles/${childProfileId}/transcripts`)
      .set("Authorization", `Bearer ${adultToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);

    const [mostRecent, first] = res.body;

    expect(mostRecent.lessonId).toBe(lessonId);
    expect(mostRecent.lessonTitle).toBe("Colors in the Forest");
    expect(mostRecent.language).toBe("EN");
    expect(mostRecent.messages).toHaveLength(2);
    expect(mostRecent.messages[0]).toMatchObject({ role: "user", content: "Tell me a violent story", flaggedByFilter: false });
    expect(mostRecent.messages[1].role).toBe("assistant");
    expect(mostRecent.messages[1].flaggedByFilter).toBe(true);
    expect(mostRecent.messages[1].content).not.toBe("The hunter will kill the animal.");

    expect(first.messages).toHaveLength(2);
    expect(first.messages[0]).toMatchObject({ role: "user", content: "Tell me about colors", flaggedByFilter: false });
    expect(first.messages[1]).toMatchObject({
      role: "assistant",
      content: "Colors are fun to learn!",
      flaggedByFilter: false,
    });
  });
});
