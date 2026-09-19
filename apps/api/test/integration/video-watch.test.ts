import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

describe("Video heartbeat & gamification (Story 9.3)", () => {
  let app: INestApplication;

  const stamp = Date.now();
  const testEmail = `story-9.3-${stamp}@test.local`;
  const password = "senha-segura-123";
  const playlistId = `story-9.3-pl-${stamp}`;

  let scopedToken: string;
  let profileId: string;
  let videoDbId: string;

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

    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId,
        channel: "Canal 9.3",
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: `tema-9.3-${stamp}`,
      },
    });

    const video = await prisma.video.create({
      data: {
        videoId: `vid-int-9.3-${stamp}`,
        playlistId: playlist.id,
        title: "Vídeo integração 9.3",
        channel: "Canal 9.3",
        durationSeconds: 100,
        thumbnailUrl: `https://i.ytimg.com/vi/vid-int-9.3-${stamp}/hqdefault.jpg`,
        status: "AVAILABLE",
      },
    });
    videoDbId = video.id;
  });

  afterAll(async () => {
    await prisma.videoWatch.deleteMany({ where: { profileId } });
    await prisma.curatedPlaylist.deleteMany({ where: { playlistId } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita POST /videos/:id/heartbeat sem token (401, AC5)", async () => {
    await request(app.getHttpServer())
      .post(`/videos/${videoDbId}/heartbeat`)
      .send({ positionSeconds: 10 })
      .expect(401);
  });

  it("GET /videos/:id retorna o detalhe do vídeo sem token (público, AC1)", async () => {
    const res = await request(app.getHttpServer()).get(`/videos/${videoDbId}`).expect(200);
    expect(res.body.id).toBe(videoDbId);
    expect(res.body.status).toBe("AVAILABLE");
    expect(res.body.durationSeconds).toBe(100);
  });

  it("GET /videos/:id retorna 404 para id inexistente (AC1)", async () => {
    await request(app.getHttpServer()).get("/videos/id-que-nao-existe").expect(404);
  });

  it("acumula watchedSeconds e emite XP ao cruzar 80% da duração (AC4)", async () => {
    const below = await request(app.getHttpServer())
      .post(`/videos/${videoDbId}/heartbeat`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ positionSeconds: 50 })
      .expect(200);
    expect(below.body.watchedSeconds).toBe(50);
    expect(below.body.completed).toBe(false);
    expect(below.body.xpAwarded).toBe(0);

    const crossing = await request(app.getHttpServer())
      .post(`/videos/${videoDbId}/heartbeat`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ positionSeconds: 85 })
      .expect(200);
    expect(crossing.body.watchedSeconds).toBe(85);
    expect(crossing.body.completed).toBe(true);
    expect(crossing.body.xpAwarded).toBe(10);
    expect(crossing.body.xpCapped).toBe(false);

    const events = await prisma.xpEvent.findMany({ where: { profileId, source: "VIDEO_COMPLETED" } });
    expect(events).toHaveLength(1);
  });

  it("heartbeats repetidos no mesmo dia não duplicam XP (AC6)", async () => {
    const repeat = await request(app.getHttpServer())
      .post(`/videos/${videoDbId}/heartbeat`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ positionSeconds: 99 })
      .expect(200);
    expect(repeat.body.completed).toBe(true);
    expect(repeat.body.xpAwarded).toBe(0);

    const events = await prisma.xpEvent.count({ where: { profileId, source: "VIDEO_COMPLETED" } });
    expect(events).toBe(1);
  });

  it("rejeita corpo inválido com 400 (positionSeconds negativo)", async () => {
    await request(app.getHttpServer())
      .post(`/videos/${videoDbId}/heartbeat`)
      .set("Authorization", `Bearer ${scopedToken}`)
      .send({ positionSeconds: -5 })
      .expect(400);
  });
});
