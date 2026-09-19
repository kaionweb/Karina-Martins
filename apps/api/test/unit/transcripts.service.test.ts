import { prisma } from "@ipp/database";
import { TranscriptsService } from "../../src/modules/transcripts/transcripts.service";

/**
 * Cobertura do TranscriptsService (feature de repetição de frase).
 * Hita o banco de dev (mesmo padrão dos demais testes de service da API).
 */
describe("TranscriptsService", () => {
  const service = new TranscriptsService();
  const youtubeVideoId = `unit-transcript-${Date.now()}`;

  afterAll(async () => {
    await prisma.transcriptSentence.deleteMany({ where: { youtubeVideoId } });
  });

  it("getByYoutubeVideoId retorna lista vazia quando não há transcript", async () => {
    const result = await service.getByYoutubeVideoId(youtubeVideoId);
    expect(result).toEqual([]);
  });

  it("replaceForYoutubeVideoId insere as frases com order = índice + 1, ordenadas", async () => {
    const result = await service.replaceForYoutubeVideoId(youtubeVideoId, {
      sentences: [
        { order: 1, startTime: 0, endTime: 3.5, textEn: "Hello", textPt: "Olá" },
        { order: 2, startTime: 3.5, endTime: 7, textEn: "Good morning", textPt: "Bom dia" },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.order)).toEqual([1, 2]);
    expect(result[0]).toMatchObject({ youtubeVideoId, textEn: "Hello", textPt: "Olá", startTime: 0, endTime: 3.5 });
    expect(result[1]).toMatchObject({ order: 2, textEn: "Good morning" });
  });

  it("replace substitui tudo (apaga as antigas e insere as novas)", async () => {
    await service.replaceForYoutubeVideoId(youtubeVideoId, {
      sentences: [{ order: 1, startTime: 0, endTime: 2, textEn: "One only", textPt: "Só uma" }],
    });

    const result = await service.getByYoutubeVideoId(youtubeVideoId);
    expect(result).toHaveLength(1);
    expect(result[0].textEn).toBe("One only");
  });

  it("re-deriva order a partir do índice, mesmo com orders repetidos/embaralhados no input", async () => {
    const result = await service.replaceForYoutubeVideoId(youtubeVideoId, {
      sentences: [
        { order: 5, startTime: 0, endTime: 1, textEn: "A", textPt: "A" },
        { order: 5, startTime: 1, endTime: 2, textEn: "B", textPt: "B" },
        { order: 2, startTime: 2, endTime: 3, textEn: "C", textPt: "C" },
      ],
    });

    expect(result.map((s) => s.order)).toEqual([1, 2, 3]);
    expect(result.map((s) => s.textEn)).toEqual(["A", "B", "C"]);
  });

  it("replace com lista vazia zera o transcript", async () => {
    await service.replaceForYoutubeVideoId(youtubeVideoId, { sentences: [] });
    const result = await service.getByYoutubeVideoId(youtubeVideoId);
    expect(result).toEqual([]);
  });

  it("replaceForYoutubeVideoId sempre grava needsReview: false (conteúdo digitado por humano no admin)", async () => {
    const result = await service.replaceForYoutubeVideoId(youtubeVideoId, {
      sentences: [{ order: 1, startTime: 0, endTime: 2, textEn: "Hi", textPt: "Oi" }],
    });
    expect(result[0].needsReview).toBe(false);
  });
});

describe("TranscriptsService — needsReview (pipeline automático / revisão)", () => {
  const service = new TranscriptsService();
  const youtubeVideoId = `unit-transcript-review-${Date.now()}`;

  afterAll(async () => {
    await prisma.transcriptSentence.deleteMany({ where: { youtubeVideoId } });
  });

  beforeAll(async () => {
    await prisma.transcriptSentence.createMany({
      data: [
        {
          youtubeVideoId,
          order: 1,
          startTime: 0,
          endTime: 2,
          textEn: "Reviewed sentence",
          textPt: "Frase revisada",
          needsReview: false,
        },
        {
          youtubeVideoId,
          order: 2,
          startTime: 2,
          endTime: 4,
          textEn: "Pending sentence",
          textPt: "",
          needsReview: true,
        },
      ],
    });
  });

  it("getByYoutubeVideoId (admin) devolve todas as frases, incluindo pendentes", async () => {
    const result = await service.getByYoutubeVideoId(youtubeVideoId);
    expect(result).toHaveLength(2);
  });

  it("getPublicByYoutubeVideoId nunca devolve frases com needsReview: true", async () => {
    const result = await service.getPublicByYoutubeVideoId(youtubeVideoId);
    expect(result).toHaveLength(1);
    expect(result[0].textEn).toBe("Reviewed sentence");
  });

  it("markReviewed corrige o textPt e zera needsReview", async () => {
    const pending = await prisma.transcriptSentence.findFirstOrThrow({
      where: { youtubeVideoId, needsReview: true },
    });

    const reviewed = await service.markReviewed(pending.id, "Frase pendente");
    expect(reviewed.needsReview).toBe(false);
    expect(reviewed.textPt).toBe("Frase pendente");

    const publicNow = await service.getPublicByYoutubeVideoId(youtubeVideoId);
    expect(publicNow).toHaveLength(2);
  });

  it("markReviewed lança NotFoundException pra id inexistente", async () => {
    await expect(service.markReviewed("id-inexistente", "x")).rejects.toMatchObject({
      response: { error: { code: "SENTENCE_NOT_FOUND" } },
    });
  });
});

describe("TranscriptsService — getPendingReview (agrupamento por fonte)", () => {
  const service = new TranscriptsService();
  const videoId = `unit-transcript-pending-${Date.now()}`;

  afterAll(async () => {
    await prisma.transcriptSentence.deleteMany({ where: { youtubeVideoId: videoId } });
    await prisma.filme.deleteMany({ where: { videoId } });
  });

  beforeAll(async () => {
    await prisma.filme.create({
      data: {
        title: "Filme de teste (unit)",
        emoji: "🎬",
        level: "BASICO",
        ageRange: "3-6",
        videoId,
        durationSeconds: 600,
      },
    });

    await prisma.transcriptSentence.createMany({
      data: [
        { youtubeVideoId: videoId, order: 1, startTime: 0, endTime: 2, textEn: "A", textPt: "", needsReview: true },
        {
          youtubeVideoId: videoId,
          order: 2,
          startTime: 2,
          endTime: 4,
          textEn: "B",
          textPt: "Já revisada",
          needsReview: false,
        },
      ],
    });
  });

  it("agrupa frases pendentes pelo título/kind do Filme de origem, sem incluir as já revisadas", async () => {
    const groups = await service.getPendingReview();
    const group = groups.find((g) => g.youtubeVideoId === videoId);

    expect(group).toBeDefined();
    expect(group?.title).toBe("Filme de teste (unit)");
    expect(group?.kind).toBe("filme");
    expect(group?.sentences).toHaveLength(1);
    expect(group?.sentences[0].textEn).toBe("A");
  });
});
