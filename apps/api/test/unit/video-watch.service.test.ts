import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import { VideoWatchService } from "../../src/modules/videos/video-watch.service";
import { VideosService } from "../../src/modules/videos/videos.service";

describe("VideoWatchService (Story 9.3)", () => {
  const runId = Date.now();
  const email = `unit-9.3-${runId}@test.local`;
  const playlistId = `unit-9.3-pl-${runId}`;

  let profileId: string;
  let videoDbId: string; // Video.id (100s de duração → limiar de conclusão = 80s)
  let shortVideoDbId: string; // Video.id (10s de duração → limiar = 8s)

  // VideoWatchService depende de VideosService (assertVideoUnlockedById) desde
  // a trava de acesso de Listening — instancia real (sem mock) porque os vídeos
  // de teste aqui são skill=VOCABULARIO, que a trava ignora (só se aplica a
  // LISTENING), então não precisa de perfil/trial de verdade pra passar.
  const service = new VideoWatchService(new VideosService());
  const originalCap = process.env.VIDEO_XP_DAILY_CAP;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: "hash-de-teste",
        profiles: { create: { nickname: "Kiddo", type: "CHILD", ageRange: "4-6" } },
      },
      include: { profiles: true },
    });
    profileId = user.profiles[0].id;

    const playlist = await prisma.curatedPlaylist.create({
      data: {
        playlistId,
        channel: "Canal 9.3",
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: `tema-9.3-${runId}`,
      },
    });

    const video = await prisma.video.create({
      data: {
        videoId: `vid-9.3-${runId}`,
        playlistId: playlist.id,
        title: "Vídeo de teste 9.3",
        channel: "Canal 9.3",
        durationSeconds: 100,
        thumbnailUrl: `https://i.ytimg.com/vi/vid-9.3-${runId}/hqdefault.jpg`,
        status: "AVAILABLE",
      },
    });
    videoDbId = video.id;

    const shortVideo = await prisma.video.create({
      data: {
        videoId: `vid-short-9.3-${runId}`,
        playlistId: playlist.id,
        title: "Vídeo curto 9.3",
        channel: "Canal 9.3",
        durationSeconds: 10,
        thumbnailUrl: `https://i.ytimg.com/vi/vid-short-9.3-${runId}/hqdefault.jpg`,
        status: "AVAILABLE",
      },
    });
    shortVideoDbId = shortVideo.id;
  });

  afterEach(async () => {
    await prisma.videoWatch.deleteMany({ where: { profileId } });
    await prisma.xpEvent.deleteMany({ where: { profileId } });
    if (originalCap === undefined) {
      delete process.env.VIDEO_XP_DAILY_CAP;
    } else {
      process.env.VIDEO_XP_DAILY_CAP = originalCap;
    }
  });

  afterAll(async () => {
    await prisma.curatedPlaylist.deleteMany({ where: { playlistId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("lança 403 NO_ACTIVE_PROFILE quando não há perfil ativo", async () => {
    await expect(service.registerHeartbeat(undefined, videoDbId, 10, false)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lança 404 quando o vídeo não existe", async () => {
    await expect(service.registerHeartbeat(profileId, "id-inexistente", 10, false)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("não conclui abaixo de 80% da duração e não emite XP", async () => {
    const res = await service.registerHeartbeat(profileId, videoDbId, 79, false); // 79 < 80
    expect(res.completed).toBe(false);
    expect(res.watchedSeconds).toBe(79);
    expect(res.xpAwarded).toBe(0);
    expect(res.xpCapped).toBe(false);

    const xp = await prisma.xpEvent.count({ where: { profileId, source: "VIDEO_COMPLETED" } });
    expect(xp).toBe(0);
  });

  it("conclui exatamente nos 80% e emite 10 XP (VIDEO_COMPLETED)", async () => {
    const res = await service.registerHeartbeat(profileId, videoDbId, 80, false); // 80 == 0.8 * 100
    expect(res.completed).toBe(true);
    expect(res.xpAwarded).toBe(10);
    expect(res.xpCapped).toBe(false);

    const events = await prisma.xpEvent.findMany({ where: { profileId, source: "VIDEO_COMPLETED" } });
    expect(events).toHaveLength(1);
    expect(events[0].amount).toBe(10);
  });

  it("conclui acima de 80% e emite 10 XP", async () => {
    const res = await service.registerHeartbeat(profileId, videoDbId, 95, false);
    expect(res.completed).toBe(true);
    expect(res.xpAwarded).toBe(10);
  });

  it("não duplica XP em heartbeats repetidos no mesmo dia após a conclusão (dedup)", async () => {
    const first = await service.registerHeartbeat(profileId, videoDbId, 90, false);
    expect(first.xpAwarded).toBe(10);

    const second = await service.registerHeartbeat(profileId, videoDbId, 99, false);
    expect(second.completed).toBe(true);
    expect(second.xpAwarded).toBe(0);
    expect(second.xpCapped).toBe(false);

    const xp = await prisma.xpEvent.count({ where: { profileId, source: "VIDEO_COMPLETED" } });
    expect(xp).toBe(1);
  });

  it("nunca reduz watchedSeconds quando chega um positionSeconds menor (fora de ordem)", async () => {
    const forward = await service.registerHeartbeat(profileId, videoDbId, 50, false);
    expect(forward.watchedSeconds).toBe(50);

    const rewind = await service.registerHeartbeat(profileId, videoDbId, 20, false); // rebobinou
    expect(rewind.watchedSeconds).toBe(50); // permanece no máximo já visto

    const watch = await prisma.videoWatch.findFirst({ where: { profileId, videoId: videoDbId } });
    expect(watch?.watchedSeconds).toBe(50);
  });

  it("respeita o teto diário: marca concluído mas não emite XP quando soma + 10 > cap", async () => {
    process.env.VIDEO_XP_DAILY_CAP = "10"; // cap = 10 → só o primeiro vídeo ganha XP

    const first = await service.registerHeartbeat(profileId, videoDbId, 90, false);
    expect(first.xpAwarded).toBe(10);
    expect(first.xpCapped).toBe(false);

    // Segundo vídeo concluído no mesmo dia: soma já é 10, 10 + 10 = 20 > 10 → capado.
    const second = await service.registerHeartbeat(profileId, shortVideoDbId, 10, false);
    expect(second.completed).toBe(true); // ainda marcado como concluído
    expect(second.xpAwarded).toBe(0);
    expect(second.xpCapped).toBe(true);

    const totalXp = await prisma.xpEvent.aggregate({
      _sum: { amount: true },
      where: { profileId, source: "VIDEO_COMPLETED" },
    });
    expect(totalXp._sum.amount).toBe(10);

    const secondWatch = await prisma.videoWatch.findFirst({ where: { profileId, videoId: shortVideoDbId } });
    expect(secondWatch?.completedAt).not.toBeNull();
  });
});
