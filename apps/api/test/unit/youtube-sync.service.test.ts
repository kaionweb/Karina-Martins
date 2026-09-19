import { prisma } from "@ipp/database";
import { YoutubeSyncService } from "../../src/modules/videos/youtube-sync.service";
import { YoutubeClient } from "../../src/modules/videos/youtube.client";

describe("YoutubeSyncService (Story 9.1)", () => {
  const runId = Date.now();
  const playlistIdPrefix = `unit-9.1-${runId}`;

  afterEach(async () => {
    // Cascade de CuratedPlaylist -> Video limpa os vídeos criados no teste.
    await prisma.curatedPlaylist.deleteMany({ where: { playlistId: { startsWith: playlistIdPrefix } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("faz upsert de um vídeo novo com duração convertida do ISO 8601 (AC1)", async () => {
    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId: `${playlistIdPrefix}-a`,
        channel: "Canal Infantil",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "VOCABULARIO",
        theme: "Cores",
      },
    });

    const client = new YoutubeClient();
    // mockImplementation keyed por playlistId (não mockResolvedValueOnce): o
    // banco tem outras CuratedPlaylist ativas reais (Epic 9, conteúdo curado
    // permanente) além desta — sem isolar por id, syncAll() as alcançaria de
    // verdade (rede real ao YouTube + timeout do teste).
    jest.spyOn(client, "listPlaylistItems").mockImplementation(async (playlistId) =>
      playlistId === playlist.playlistId
        ? { videoIds: ["vid-new"], nextPageToken: undefined }
        : { videoIds: [], nextPageToken: undefined },
    );
    jest.spyOn(client, "listVideos").mockResolvedValueOnce([
      {
        id: "vid-new",
        title: "Aprendendo Cores",
        channelTitle: "Canal Infantil",
        durationIso: "PT4M13S",
        thumbnailUrl: "https://i.ytimg.com/vi/vid-new/hqdefault.jpg",
        privacyStatus: "public",
      },
    ]);

    const service = new YoutubeSyncService(client);
    const result = await service.syncAll();

    expect(result.summary).toContainEqual({ playlistId: playlist.playlistId, videosAvailable: 1 });

    const video = await prisma.video.findUnique({ where: { videoId: "vid-new" } });
    expect(video).not.toBeNull();
    expect(video?.status).toBe("AVAILABLE");
    expect(video?.durationSeconds).toBe(253);
    expect(video?.playlistId).toBe(playlist.id);
  });

  it("marca como UNAVAILABLE o vídeo que sumiu da playlist, sem deletar o registro (AC2)", async () => {
    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId: `${playlistIdPrefix}-b`,
        channel: "Canal Infantil",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "LISTENING",
        theme: "Animais",
      },
    });

    await prisma.video.create({
      data: {
        videoId: "vid-sumiu",
        playlistId: playlist.id,
        title: "Antigo",
        channel: "Canal Infantil",
        durationSeconds: 100,
        thumbnailUrl: "https://i.ytimg.com/vi/vid-sumiu/hqdefault.jpg",
        status: "AVAILABLE",
      },
    });

    const client = new YoutubeClient();
    // A playlist ainda devolve OUTRO vídeo ("vid-ainda-la") nesta rodada — só
    // "vid-sumiu" está ausente. Isso é o cenário real de "vídeo sumiu": a busca
    // funcionou (videoIds não veio vazio), só que esse ID específico não veio
    // mais. Ver guard de zero-itens em youtube-sync.service.ts: se a busca
    // inteira voltasse vazia, isso NÃO indicaria remoção (poderia ser glitch de
    // API), então não marcaríamos nada como UNAVAILABLE nesse caso.
    jest.spyOn(client, "listPlaylistItems").mockImplementation(async (playlistId) =>
      playlistId === playlist.playlistId
        ? { videoIds: ["vid-ainda-la"], nextPageToken: undefined }
        : { videoIds: [], nextPageToken: undefined },
    );
    jest.spyOn(client, "listVideos").mockResolvedValueOnce([
      {
        id: "vid-ainda-la",
        title: "Ainda na playlist",
        channelTitle: "Canal Infantil",
        durationIso: "PT1M",
        thumbnailUrl: "https://i.ytimg.com/vi/vid-ainda-la/hqdefault.jpg",
        privacyStatus: "public",
      },
    ]);

    const service = new YoutubeSyncService(client);
    await service.syncAll();

    const video = await prisma.video.findUnique({ where: { videoId: "vid-sumiu" } });
    expect(video?.status).toBe("UNAVAILABLE");

    await prisma.video.deleteMany({ where: { videoId: "vid-ainda-la" } });
  });

  it("nunca marca vídeos como UNAVAILABLE quando a playlist volta vazia na rodada (guarda contra falso-zeramento)", async () => {
    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId: `${playlistIdPrefix}-h`,
        channel: "Canal Infantil",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "LISTENING",
        theme: "Animais",
      },
    });

    await prisma.video.create({
      data: {
        videoId: "vid-nao-deve-zerar",
        playlistId: playlist.id,
        title: "Não deve zerar",
        channel: "Canal Infantil",
        durationSeconds: 100,
        thumbnailUrl: "https://i.ytimg.com/vi/vid-nao-deve-zerar/hqdefault.jpg",
        status: "AVAILABLE",
      },
    });

    const client = new YoutubeClient();
    // mockResolvedValue (não Once): lista vazia serve tanto para esta playlist
    // quanto para as demais CuratedPlaylist ativas reais no banco (Epic 9).
    jest.spyOn(client, "listPlaylistItems").mockResolvedValue({ videoIds: [], nextPageToken: undefined });
    const listVideosSpy = jest.spyOn(client, "listVideos");

    const service = new YoutubeSyncService(client);
    await service.syncAll();

    expect(listVideosSpy).not.toHaveBeenCalled();

    const video = await prisma.video.findUnique({ where: { videoId: "vid-nao-deve-zerar" } });
    expect(video?.status).toBe("AVAILABLE");
  });

  it("nunca deleta um Video — apenas marca status (histórico de XpEvent/VideoWatch preservado)", async () => {
    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId: `${playlistIdPrefix}-e`,
        channel: "Canal Infantil",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "LISTENING",
        theme: "Animais",
      },
    });

    const created = await prisma.video.create({
      data: {
        videoId: "vid-preservado",
        playlistId: playlist.id,
        title: "Preservado",
        channel: "Canal Infantil",
        durationSeconds: 100,
        thumbnailUrl: "https://i.ytimg.com/vi/vid-preservado/hqdefault.jpg",
        status: "AVAILABLE",
      },
    });

    const client = new YoutubeClient();
    // A playlist ainda devolve outro vídeo nesta rodada — só "vid-preservado"
    // está ausente (mesmo cenário do teste AC2 acima: busca não veio vazia).
    jest.spyOn(client, "listPlaylistItems").mockImplementation(async (playlistId) =>
      playlistId === playlist.playlistId
        ? { videoIds: ["vid-outro"], nextPageToken: undefined }
        : { videoIds: [], nextPageToken: undefined },
    );
    jest.spyOn(client, "listVideos").mockResolvedValueOnce([
      {
        id: "vid-outro",
        title: "Outro vídeo",
        channelTitle: "Canal Infantil",
        durationIso: "PT1M",
        thumbnailUrl: "https://i.ytimg.com/vi/vid-outro/hqdefault.jpg",
        privacyStatus: "public",
      },
    ]);

    const service = new YoutubeSyncService(client);
    await service.syncAll();

    const stillExists = await prisma.video.findUnique({ where: { id: created.id } });
    expect(stillExists).not.toBeNull();
    expect(stillExists?.status).toBe("UNAVAILABLE");

    await prisma.video.deleteMany({ where: { videoId: "vid-outro" } });
  });

  it("ignora CuratedPlaylist com active:false — nunca descobre playlist nova sozinha", async () => {
    const inactivePlaylistId = `${playlistIdPrefix}-c`;
    await prisma.curatedPlaylist.create({
      data: {
        playlistId: inactivePlaylistId,
        channel: "Canal Infantil",
        active: false,
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "MUSICA",
        theme: "Canções",
      },
    });

    const client = new YoutubeClient();
    // Default seguro para as demais CuratedPlaylist ativas reais no banco
    // (Epic 9) — o que importa aqui é que ESTA playlist (active:false) nunca
    // seja consultada, não que listPlaylistItems nunca seja chamado com nada.
    const listPlaylistItemsSpy = jest
      .spyOn(client, "listPlaylistItems")
      .mockResolvedValue({ videoIds: [], nextPageToken: undefined });

    const service = new YoutubeSyncService(client);
    const result = await service.syncAll();

    expect(result.summary.map((s) => s.playlistId)).not.toContain(inactivePlaylistId);
    expect(listPlaylistItemsSpy).not.toHaveBeenCalledWith(inactivePlaylistId, undefined);
  });

  it("isola falha de uma playlist e continua sincronizando as demais (REL-001)", async () => {
    const failingSuffix = `${playlistIdPrefix}-f`;
    const okSuffix = `${playlistIdPrefix}-g`;

    await prisma.curatedPlaylist.create({
      data: {
        playlistId: failingSuffix,
        channel: "Canal Infantil",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "VOCABULARIO",
        theme: "Falha",
      },
    });
    await prisma.curatedPlaylist.create({
      data: {
        playlistId: okSuffix,
        channel: "Canal Infantil",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "VOCABULARIO",
        theme: "OK",
      },
    });

    const client = new YoutubeClient();
    // Fallback vazio (não a resposta fake de okSuffix) para qualquer outra
    // CuratedPlaylist ativa real no banco (Epic 9) — senão "vid-isolado"
    // seria upsertado repetidamente sob playlists de conteúdo real.
    jest.spyOn(client, "listPlaylistItems").mockImplementation(async (playlistId) => {
      if (playlistId === failingSuffix) {
        throw new Error("YouTube playlistItems.list falhou (500) simulado");
      }
      if (playlistId === okSuffix) {
        return { videoIds: ["vid-isolado"], nextPageToken: undefined };
      }
      return { videoIds: [], nextPageToken: undefined };
    });
    jest.spyOn(client, "listVideos").mockResolvedValue([
      {
        id: "vid-isolado",
        title: "Sobrevive à falha da outra playlist",
        channelTitle: "Canal Infantil",
        durationIso: "PT2M",
        thumbnailUrl: "https://i.ytimg.com/vi/vid-isolado/hqdefault.jpg",
        privacyStatus: "public",
      },
    ]);

    const service = new YoutubeSyncService(client);
    const result = await service.syncAll();

    expect(result.summary).toContainEqual({ playlistId: okSuffix, videosAvailable: 1 });
    expect(result.summary.some((s) => s.playlistId === failingSuffix)).toBe(false);

    const video = await prisma.video.findUnique({ where: { videoId: "vid-isolado" } });
    expect(video?.status).toBe("AVAILABLE");
  });

  it("respeita o teto de 50 ids por chamada de videos.list", async () => {
    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId: `${playlistIdPrefix}-d`,
        channel: "Canal Infantil",
        level: "INTERMEDIARIO",
        ageRange: "6-8",
        skill: "VOCABULARIO",
        theme: "Números",
      },
    });

    const videoIds = Array.from({ length: 62 }, (_, i) => `vid-${i}`);

    const client = new YoutubeClient();
    // keyed por playlistId — demais CuratedPlaylist ativas reais (Epic 9) não
    // devem gerar chamadas extras a listVideos, senão quebra o toHaveBeenCalledTimes(2).
    jest.spyOn(client, "listPlaylistItems").mockImplementation(async (id) =>
      id === playlist.playlistId ? { videoIds, nextPageToken: undefined } : { videoIds: [], nextPageToken: undefined },
    );
    // privacyStatus "private" faz o serviço pular o upsert — este teste só
    // verifica o loteamento das chamadas a videos.list, não o resultado no banco
    // (já coberto pelo teste de upsert acima), evitando 62 upserts sequenciais
    // reais contra o banco remoto.
    const listVideosSpy = jest.spyOn(client, "listVideos").mockImplementation(async (ids) =>
      ids.map((id) => ({
        id,
        title: id,
        channelTitle: "Canal Infantil",
        durationIso: "PT1M",
        thumbnailUrl: "https://i.ytimg.com/vi/x/hqdefault.jpg",
        privacyStatus: "private",
      })),
    );

    const service = new YoutubeSyncService(client);
    await service.syncAll();

    expect(listVideosSpy).toHaveBeenCalledTimes(2);
    expect(listVideosSpy.mock.calls[0][0]).toHaveLength(50);
    expect(listVideosSpy.mock.calls[1][0]).toHaveLength(12);
  });
});
