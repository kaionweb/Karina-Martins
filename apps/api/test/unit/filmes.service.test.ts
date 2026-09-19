import { BadRequestException, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import { FilmesService } from "../../src/modules/filmes/filmes.service";
import {
  AdminFilmesService,
  extractYoutubeVideoId,
  parseDurationToSeconds,
} from "../../src/modules/filmes/admin-filmes.service";

/**
 * Cobertura do catálogo de filmes. As funções puras (extração de videoId /
 * parse de duração) são testadas isoladamente; os services hitam o banco de dev
 * (mesmo padrão dos demais testes de service da API, ex.: transcripts.service).
 */
describe("extractYoutubeVideoId", () => {
  it("URL watch?v= → extrai o id", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=abc123XYZ")).toBe("abc123XYZ");
  });

  it("URL youtu.be/ → extrai o id do path", () => {
    expect(extractYoutubeVideoId("https://youtu.be/abc123XYZ")).toBe("abc123XYZ");
  });

  it("URL /embed/ → extrai o id seguinte", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/embed/abc123XYZ")).toBe("abc123XYZ");
  });

  it("id puro (sem URL) → retorna a própria string", () => {
    expect(extractYoutubeVideoId("abc123XYZ")).toBe("abc123XYZ");
  });

  it("URL colada sem protocolo com v= → fallback via regex", () => {
    expect(extractYoutubeVideoId("watch?v=abc123XYZ")).toBe("abc123XYZ");
  });

  it("watch?v= no meio de outros params → extrai corretamente", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?t=10&v=abc123XYZ&feature=x")).toBe("abc123XYZ");
  });

  it("espaços em volta são removidos (trim)", () => {
    expect(extractYoutubeVideoId("  abc123XYZ  ")).toBe("abc123XYZ");
    expect(extractYoutubeVideoId("  https://youtu.be/abc123XYZ  ")).toBe("abc123XYZ");
  });
});

describe("parseDurationToSeconds", () => {
  it("segundos puros", () => {
    expect(parseDurationToSeconds("2550")).toBe(2550);
  });

  it("mm:ss", () => {
    expect(parseDurationToSeconds("42:30")).toBe(2550);
  });

  it("hh:mm:ss", () => {
    expect(parseDurationToSeconds("1:05:00")).toBe(3900);
  });

  it("aceita espaços em volta e entre os campos", () => {
    expect(parseDurationToSeconds(" 42 : 30 ")).toBe(2550);
  });

  it("lança em entrada não-numérica", () => {
    expect(() => parseDurationToSeconds("abc")).toThrow(BadRequestException);
  });

  it("lança em valor negativo", () => {
    expect(() => parseDurationToSeconds("-5")).toThrow(BadRequestException);
  });

  it("lança com mais de 3 campos", () => {
    expect(() => parseDurationToSeconds("1:2:3:4")).toThrow(BadRequestException);
  });
});

describe("FilmesService + AdminFilmesService (banco de dev)", () => {
  const filmesService = new FilmesService();
  const adminFilmesService = new AdminFilmesService();
  const videoId = `unit-filme-${Date.now()}`;
  let createdId = "";

  afterAll(async () => {
    await prisma.filme.deleteMany({ where: { videoId } });
  });

  it("upsertFilme cria o filme (extrai videoId da URL e converte a duração)", async () => {
    const filme = await adminFilmesService.upsertFilme({
      title: "Unit Filme",
      emoji: "🎬",
      level: "BASICO",
      ageRange: "3+",
      videoUrlOrId: `https://www.youtube.com/watch?v=${videoId}`,
      duration: "42:30",
    });

    createdId = filme.id;
    expect(filme.videoId).toBe(videoId);
    expect(filme.durationSeconds).toBe(2550);
    expect(filme.title).toBe("Unit Filme");
  });

  it("upsertFilme reenviando o mesmo videoId (id puro) atualiza em vez de duplicar", async () => {
    const filme = await adminFilmesService.upsertFilme({
      title: "Unit Filme (editado)",
      emoji: "🎥",
      level: "AVANCADO",
      ageRange: "8+",
      videoUrlOrId: videoId,
      duration: "3600",
    });

    expect(filme.id).toBe(createdId);
    expect(filme.title).toBe("Unit Filme (editado)");
    expect(filme.durationSeconds).toBe(3600);

    const all = await adminFilmesService.listFilmes();
    expect(all.filter((f) => f.videoId === videoId)).toHaveLength(1);
  });

  it("getFilmeById retorna o filme e listFilmes o inclui", async () => {
    const filme = await filmesService.getFilmeById(createdId);
    expect(filme.videoId).toBe(videoId);

    const list = await filmesService.listFilmes();
    expect(list.some((f) => f.id === createdId)).toBe(true);
  });

  it("getFilmeById lança NotFound para id inexistente", async () => {
    await expect(filmesService.getFilmeById("nao-existe-id")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deleteFilme remove o filme definitivamente", async () => {
    const result = await adminFilmesService.deleteFilme(createdId);
    expect(result).toEqual({ deleted: true });
    await expect(filmesService.getFilmeById(createdId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deleteFilme lança NotFound para id inexistente", async () => {
    await expect(adminFilmesService.deleteFilme("nao-existe-id")).rejects.toBeInstanceOf(NotFoundException);
  });
});
