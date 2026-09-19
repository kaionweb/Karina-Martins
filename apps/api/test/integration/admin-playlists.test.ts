import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";
import { YoutubeClient } from "../../src/modules/videos/youtube.client";

describe("Admin Playlists (Story 10.5)", () => {
  let app: INestApplication;
  const youtubeClient = new YoutubeClient();

  const stamp = Date.now();
  const adminEmail = `admin-10.5-${stamp}@test.local`;
  const nonAdminEmail = `user-10.5-${stamp}@test.local`;
  const password = "senha-segura-123";

  const urlPlaylistId = `PLadmin105url-${stamp}`;
  const purePlaylistId = `PLadmin105pure-${stamp}`;

  let adminToken: string;
  let nonAdminToken: string;
  let originalAdminEmail: string | undefined;

  beforeAll(async () => {
    originalAdminEmail = process.env.ADMIN_EMAIL;

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(YoutubeClient)
      .useValue(youtubeClient)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post("/auth/register").send({ email: adminEmail, password });
    const adminLogin = await request(app.getHttpServer()).post("/auth/login").send({ email: adminEmail, password });
    adminToken = adminLogin.body.accessToken;

    await request(app.getHttpServer()).post("/auth/register").send({ email: nonAdminEmail, password });
    const nonAdminLogin = await request(app.getHttpServer()).post("/auth/login").send({ email: nonAdminEmail, password });
    nonAdminToken = nonAdminLogin.body.accessToken;

    // Mock keyed por playlistId: o banco tem CuratedPlaylist reais (seed/Epic 9);
    // sem isolar por id, syncPlaylist alcançaria a API real do YouTube pra elas.
    jest.spyOn(youtubeClient, "listPlaylistItems").mockImplementation(async (id) =>
      id === urlPlaylistId || id === purePlaylistId
        ? { videoIds: [`vid-${id}`], nextPageToken: undefined }
        : { videoIds: [], nextPageToken: undefined },
    );
    jest.spyOn(youtubeClient, "listVideos").mockImplementation(async (ids) =>
      ids.map((id) => ({
        id,
        title: `Título ${id}`,
        channelTitle: "Canal Admin",
        durationIso: "PT1M",
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        privacyStatus: "public" as const,
      })),
    );

    process.env.ADMIN_EMAIL = adminEmail;
  });

  afterAll(async () => {
    // Restaura a env var para não vazar estado entre suítes (fail-closed depende dela).
    if (originalAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = originalAdminEmail;
    }

    await prisma.video.deleteMany({ where: { videoId: { in: [`vid-${urlPlaylistId}`, `vid-${purePlaylistId}`] } } });
    await prisma.curatedPlaylist.deleteMany({ where: { playlistId: { in: [urlPlaylistId, purePlaylistId] } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, nonAdminEmail] } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("(a) POST /admin/playlists sem token → 401", async () => {
    await request(app.getHttpServer())
      .post("/admin/playlists")
      .send({
        playlistUrlOrId: urlPlaylistId,
        channel: "Canal",
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: "Cores",
      })
      .expect(401);
  });

  it("(b) POST com token de não-admin → 403 e não chama o YoutubeClient", async () => {
    const spy = jest.spyOn(youtubeClient, "listPlaylistItems");
    const callsBefore = spy.mock.calls.length;

    await request(app.getHttpServer())
      .post("/admin/playlists")
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .send({
        playlistUrlOrId: urlPlaylistId,
        channel: "Canal",
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: "Cores",
      })
      .expect(403);

    expect(spy.mock.calls.length).toBe(callsBefore);
  });

  it("(c) POST com token de admin e URL completa → 200, playlistId extraído da URL, sync reflete o mock", async () => {
    const res = await request(app.getHttpServer())
      .post("/admin/playlists")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        playlistUrlOrId: `https://www.youtube.com/playlist?list=${urlPlaylistId}`,
        channel: "Canal Admin",
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: "Cores",
      })
      .expect(200);

    expect(res.body.playlist.playlistId).toBe(urlPlaylistId);
    expect(res.body.sync).toEqual({ playlistId: urlPlaylistId, videosAvailable: 1 });

    const video = await prisma.video.findUnique({ where: { videoId: `vid-${urlPlaylistId}` } });
    expect(video?.status).toBe("AVAILABLE");
  });

  it("(d) reenviar o mesmo playlistId → 200, mesmo registro (upsert, não duplicata)", async () => {
    const first = await prisma.curatedPlaylist.findUniqueOrThrow({ where: { playlistId: urlPlaylistId } });

    const res = await request(app.getHttpServer())
      .post("/admin/playlists")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        playlistUrlOrId: `https://www.youtube.com/playlist?list=${urlPlaylistId}`,
        channel: "Canal Admin Atualizado",
        level: "INTERMEDIARIO",
        ageRange: "6-8",
        skill: "LISTENING",
        theme: "Rotina",
      })
      .expect(200);

    expect(res.body.playlist.id).toBe(first.id);
    expect(res.body.playlist.channel).toBe("Canal Admin Atualizado");

    const count = await prisma.curatedPlaylist.count({ where: { playlistId: urlPlaylistId } });
    expect(count).toBe(1);
  });

  it("(e) POST com id puro (sem URL) → 200, extração cobre o outro formato", async () => {
    const res = await request(app.getHttpServer())
      .post("/admin/playlists")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        playlistUrlOrId: purePlaylistId,
        channel: "Canal Admin",
        level: "INICIANTE",
        ageRange: "2-4",
        skill: "MUSICA",
        theme: "Músicas",
      })
      .expect(200);

    expect(res.body.playlist.playlistId).toBe(purePlaylistId);
    expect(res.body.sync).toEqual({ playlistId: purePlaylistId, videosAvailable: 1 });
  });

  it("(f) GET /admin/playlists com token de admin → 200, playlist criada aparece com videosCount", async () => {
    const res = await request(app.getHttpServer())
      .get("/admin/playlists")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const created = (res.body as Array<{ playlistId: string; videosCount: number }>).find(
      (p) => p.playlistId === urlPlaylistId,
    );
    expect(created).toBeDefined();
    expect(created?.videosCount).toBe(1);
  });

  it("(g) GET /admin/playlists com token de não-admin → 403", async () => {
    await request(app.getHttpServer()).get("/admin/playlists").set("Authorization", `Bearer ${nonAdminToken}`).expect(403);
  });

  it("(fail-closed, AC1) ADMIN_EMAIL ausente → 403 mesmo para o email que seria admin", async () => {
    delete process.env.ADMIN_EMAIL;

    try {
      await request(app.getHttpServer()).get("/admin/playlists").set("Authorization", `Bearer ${adminToken}`).expect(403);
    } finally {
      // Restaura imediatamente para não afetar os demais asserts / suítes.
      process.env.ADMIN_EMAIL = adminEmail;
    }
  });
});
