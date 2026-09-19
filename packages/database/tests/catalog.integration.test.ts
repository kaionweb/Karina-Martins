import { prisma } from "../src/index";

describe("Show + Track + Lesson (Story 2.1)", () => {
  const testTitle = `story-2.1-show-${Date.now()}`;
  let showId: string;
  let trackId: string;
  let lessonId: string;

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testTitle } });
    await prisma.$disconnect();
  });

  it("cria um Show com metadados factuais originais (AC2)", async () => {
    const show = await prisma.show.create({
      data: {
        title: testTitle,
        synopsis: "Sinopse original escrita para esta demo.",
        thumbnailKey: "design-system/thumb-01",
      },
    });
    showId = show.id;

    // AC2: apenas metadados factuais — nenhum campo de imagem/pôster/URL de terceiros no shape do Show
    const allowedKeys = ["id", "title", "synopsis", "thumbnailKey", "createdAt"];
    expect(Object.keys(show).sort()).toEqual(allowedKeys.sort());
  });

  it("cria uma Track vinculada ao Show (relação 1:N)", async () => {
    const track = await prisma.track.create({
      data: { showId, title: "Trilha 1", order: 1 },
    });
    trackId = track.id;

    expect(track.showId).toBe(showId);
  });

  it("cria uma Lesson vinculada à Track (relação 1:N)", async () => {
    const lesson = await prisma.lesson.create({
      data: { trackId, title: "Lição 1", order: 1, contentBody: "Conteúdo original da lição." },
    });
    lessonId = lesson.id;

    expect(lesson.trackId).toBe(trackId);
  });

  it("Show → Track → Lesson formam a cadeia 1:N completa via include (AC1)", async () => {
    const show = await prisma.show.findUniqueOrThrow({
      where: { id: showId },
      include: { tracks: { include: { lessons: true } } },
    });

    expect(show.tracks).toHaveLength(1);
    expect(show.tracks[0].id).toBe(trackId);
    expect(show.tracks[0].lessons).toHaveLength(1);
  });

  it("apagar o Show remove a Track e a Lesson associadas (cascade)", async () => {
    await prisma.show.delete({ where: { id: showId } });

    const remainingTracks = await prisma.track.findMany({ where: { showId } });
    expect(remainingTracks).toHaveLength(0);

    const remainingLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    expect(remainingLesson).toBeNull();
  });
});
