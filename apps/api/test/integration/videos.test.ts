import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

interface VideoItem {
  id: string;
  videoId: string;
  title: string;
  level: string;
  skill: string;
  theme: string;
  ageRange: string;
  durationSeconds: number;
  thumbnailUrl: string;
}

describe("Videos listing (Story 9.2)", () => {
  let app: INestApplication;

  const stamp = Date.now();
  const themeA = `story-9.2-theme-a-${stamp}`;
  const themeB = `story-9.2-theme-b-${stamp}`;
  const channel = `Canal 9.2 ${stamp}`;

  const playlistAId = `pl-a-${stamp}`;
  const playlistBId = `pl-b-${stamp}`;

  const videoAvailableA1 = `vid-a1-${stamp}`;
  const videoAvailableA2 = `vid-a2-${stamp}`;
  const videoAvailableB1 = `vid-b1-${stamp}`;
  const videoUnavailable = `vid-unavail-${stamp}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const playlistA = await prisma.curatedPlaylist.create({
      data: {
        playlistId: playlistAId,
        channel,
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: themeA,
      },
    });

    const playlistB = await prisma.curatedPlaylist.create({
      data: {
        playlistId: playlistBId,
        channel,
        level: "INTERMEDIARIO",
        ageRange: "7-9",
        skill: "MUSICA",
        theme: themeB,
      },
    });

    await prisma.video.createMany({
      data: [
        {
          videoId: videoAvailableA1,
          playlistId: playlistA.id,
          title: "Available A1",
          channel,
          durationSeconds: 125,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoAvailableA1}/hqdefault.jpg`,
          status: "AVAILABLE",
        },
        {
          videoId: videoAvailableA2,
          playlistId: playlistA.id,
          title: "Available A2",
          channel,
          durationSeconds: 60,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoAvailableA2}/hqdefault.jpg`,
          status: "AVAILABLE",
        },
        {
          videoId: videoAvailableB1,
          playlistId: playlistB.id,
          title: "Available B1",
          channel,
          durationSeconds: 200,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoAvailableB1}/hqdefault.jpg`,
          status: "AVAILABLE",
        },
        {
          videoId: videoUnavailable,
          playlistId: playlistA.id,
          title: "Unavailable A3",
          channel,
          durationSeconds: 90,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoUnavailable}/hqdefault.jpg`,
          status: "UNAVAILABLE",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.video.deleteMany({
      where: { videoId: { in: [videoAvailableA1, videoAvailableA2, videoAvailableB1, videoUnavailable] } },
    });
    await prisma.curatedPlaylist.deleteMany({ where: { playlistId: { in: [playlistAId, playlistBId] } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("GET /videos responde 200 sem token (endpoint público, AC1)", async () => {
    const res = await request(app.getHttpServer()).get("/videos").expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.page).toBe("number");
    expect(typeof res.body.limit).toBe("number");
    expect(typeof res.body.total).toBe("number");
  });

  it("nunca retorna vídeos com status UNAVAILABLE (caso obrigatório)", async () => {
    const res = await request(app.getHttpServer()).get(`/videos?theme=${themeA}&limit=50`).expect(200);
    const videoIds = res.body.items.map((v: VideoItem) => v.videoId);

    expect(videoIds).toContain(videoAvailableA1);
    expect(videoIds).toContain(videoAvailableA2);
    expect(videoIds).not.toContain(videoUnavailable);
  });

  it("achata os campos de classificação vindos da playlist (AC2)", async () => {
    const res = await request(app.getHttpServer()).get(`/videos?theme=${themeA}`).expect(200);
    const item = res.body.items.find((v: VideoItem) => v.videoId === videoAvailableA1) as VideoItem;

    expect(item).toBeDefined();
    expect(item.level).toBe("INICIANTE");
    expect(item.skill).toBe("VOCABULARIO");
    expect(item.ageRange).toBe("4-6");
    expect(item.theme).toBe(themeA);
    expect(item.durationSeconds).toBe(125);
    expect(item.thumbnailUrl).toContain("i.ytimg.com");
  });

  it("aplica o filtro theme (isola a playlist B, AC1)", async () => {
    const res = await request(app.getHttpServer()).get(`/videos?theme=${themeB}&limit=50`).expect(200);
    const videoIds = res.body.items.map((v: VideoItem) => v.videoId);

    expect(videoIds).toEqual([videoAvailableB1]);
  });

  it("aplica os filtros level e skill combinados (AC1)", async () => {
    const match = await request(app.getHttpServer())
      .get(`/videos?theme=${themeA}&level=INICIANTE&skill=VOCABULARIO&limit=50`)
      .expect(200);
    expect(match.body.items.map((v: VideoItem) => v.videoId).sort()).toEqual(
      [videoAvailableA1, videoAvailableA2].sort(),
    );

    const mismatch = await request(app.getHttpServer())
      .get(`/videos?theme=${themeA}&level=INTERMEDIARIO&limit=50`)
      .expect(200);
    expect(mismatch.body.items).toEqual([]);
  });

  it("aplica o filtro ageRange (AC1)", async () => {
    const res = await request(app.getHttpServer()).get(`/videos?ageRange=7-9&theme=${themeB}`).expect(200);
    expect(res.body.items.map((v: VideoItem) => v.videoId)).toEqual([videoAvailableB1]);
  });

  // Sem paginação de propósito (mesmo padrão do /series — ver comentário em
  // VideosService.listVideos): devolve o catálogo inteiro que casa com os
  // filtros. `page`/`limit` nem existem em videoListQuerySchema.
  it("devolve o catálogo inteiro que casa o filtro, sem paginação (AC1)", async () => {
    const res = await request(app.getHttpServer()).get(`/videos?theme=${themeA}`).expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(2);
  });

  it("retorna items vazio (200, não erro) quando nenhum vídeo casa o filtro (AC4)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/videos?theme=inexistente-${stamp}`)
      .expect(200);

    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("GET /videos/themes retorna os temas de playlist ativos, independente de paginação/volume", async () => {
    const res = await request(app.getHttpServer()).get("/videos/themes").expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain(themeA);
    expect(res.body).toContain(themeB);
  });

  it("GET /videos/themes não conflita com a rota :id (não tenta buscar vídeo 'themes')", async () => {
    const res = await request(app.getHttpServer()).get("/videos/themes").expect(200);
    expect(res.body).not.toEqual(expect.objectContaining({ error: expect.anything() }));
  });
});
