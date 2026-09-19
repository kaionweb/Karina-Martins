import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";
import { YoutubeClient } from "../../src/modules/videos/youtube.client";

describe("POST /internal/cron/videos-sync (Story 9.1)", () => {
  let app: INestApplication;
  let curatedPlaylistDbId: string;
  const cronSecret = process.env.CRON_SECRET as string;
  const playlistId = `int-9.1-${Date.now()}`;
  const youtubeClient = new YoutubeClient();

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(YoutubeClient)
      .useValue(youtubeClient)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const curatedPlaylist = await prisma.curatedPlaylist.create({
      data: {
        playlistId,
        channel: "Canal Integração",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "VOCABULARIO",
        theme: "Teste",
      },
    });
    curatedPlaylistDbId = curatedPlaylist.id;
  });

  afterAll(async () => {
    await prisma.curatedPlaylist.deleteMany({ where: { playlistId } });
    await prisma.$disconnect();
    await app.close();
  });

  it("rejeita sem header X-Cron-Secret (401) e não chama a YouTube API", async () => {
    const listPlaylistItemsSpy = jest.spyOn(youtubeClient, "listPlaylistItems");

    await request(app.getHttpServer()).post("/internal/cron/videos-sync").expect(401);

    expect(listPlaylistItemsSpy).not.toHaveBeenCalled();
  });

  it("rejeita com X-Cron-Secret incorreto (401) e não chama a YouTube API", async () => {
    const listPlaylistItemsSpy = jest.spyOn(youtubeClient, "listPlaylistItems");

    await request(app.getHttpServer())
      .post("/internal/cron/videos-sync")
      .set("X-Cron-Secret", "secret-errado")
      .expect(401);

    expect(listPlaylistItemsSpy).not.toHaveBeenCalled();
  });

  it("sincroniza com X-Cron-Secret correto (200), sem golpear a API real", async () => {
    // mockImplementation keyed por playlistId (não mockResolvedValueOnce): o
    // banco tem outras CuratedPlaylist ativas reais (Epic 9) além desta —
    // sem isolar por id, a rota alcançaria a API real do YouTube pra elas.
    // Devolver [] pras demais é seguro agora: o guard de zero-itens em
    // syncPlaylist() (ver youtube-sync.service.ts) não marca UNAVAILABLE quando
    // a busca não voltou nenhum item, então isso não zera a disponibilidade de
    // vídeo real nenhum — era exatamente esse padrão de mock que zerou a
    // playlist "Inglês com Histórias" em produção antes do guard existir (este
    // teste roda contra a mesma DATABASE_URL de produção).
    jest.spyOn(youtubeClient, "listPlaylistItems").mockImplementation(async (id) =>
      id === playlistId
        ? { videoIds: ["vid-int"], nextPageToken: undefined }
        : { videoIds: [], nextPageToken: undefined },
    );
    jest.spyOn(youtubeClient, "listVideos").mockResolvedValueOnce([
      {
        id: "vid-int",
        title: "Vídeo Integração",
        channelTitle: "Canal Integração",
        durationIso: "PT2M",
        thumbnailUrl: "https://i.ytimg.com/vi/vid-int/hqdefault.jpg",
        privacyStatus: "public",
      },
    ]);

    const res = await request(app.getHttpServer())
      .post("/internal/cron/videos-sync")
      .set("X-Cron-Secret", cronSecret)
      .expect(200);

    expect(res.body.summary).toContainEqual({ playlistId, videosAvailable: 1 });

    const video = await prisma.video.findUnique({ where: { videoId: "vid-int" } });
    expect(video?.status).toBe("AVAILABLE");
    expect(video?.durationSeconds).toBe(120);

    await prisma.video.deleteMany({ where: { videoId: "vid-int" } });
  });

  it("não marca vídeos existentes como UNAVAILABLE quando a playlist volta vazia (guarda contra zeramento)", async () => {
    // Reproduz o cenário real do bug: listPlaylistItems() devolve 0 itens numa
    // rodada (glitch de API/quota), mas a playlist tem vídeo AVAILABLE de uma
    // sincronização anterior. Sem o guard em syncPlaylist(), esse vídeo seria
    // marcado UNAVAILABLE mesmo sem confirmação de que ele saiu do ar de fato.
    await prisma.video.create({
      data: {
        videoId: "vid-int-preexistente",
        playlistId: curatedPlaylistDbId,
        title: "Vídeo já sincronizado antes",
        channel: "Canal Integração",
        durationSeconds: 60,
        thumbnailUrl: "https://i.ytimg.com/vi/vid-int-preexistente/hqdefault.jpg",
        status: "AVAILABLE",
      },
    });

    // Toda playlist ativa (a de teste e as demais reais) volta vazia nesta
    // rodada — cenário do bug real. O guard de zero-itens garante que nenhuma
    // delas perde disponibilidade de vídeo por isso.
    jest.spyOn(youtubeClient, "listPlaylistItems").mockResolvedValue({
      videoIds: [],
      nextPageToken: undefined,
    });

    const res = await request(app.getHttpServer())
      .post("/internal/cron/videos-sync")
      .set("X-Cron-Secret", cronSecret)
      .expect(200);

    expect(res.body.summary).toContainEqual({ playlistId, videosAvailable: 0 });

    const video = await prisma.video.findUnique({ where: { videoId: "vid-int-preexistente" } });
    expect(video?.status).toBe("AVAILABLE");

    await prisma.video.deleteMany({ where: { videoId: "vid-int-preexistente" } });
  });
});
