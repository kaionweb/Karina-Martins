import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { prisma } from "../src/index";

function runSeedTranscripts(dir: string) {
  execSync(`npx tsx scripts/seed-transcripts.mjs --dir "${dir}"`, {
    cwd: path.resolve(__dirname, ".."),
    stdio: "pipe",
  });
}

// Cobertura do scripts/seed-transcripts.mjs: roda o script de verdade (novo
// processo node + tsx) contra uma pasta de fixtures temporária, mesmo padrão
// de seed.integration.test.ts (Story 2.4).
describe("seed-transcripts.mjs (script)", () => {
  const videoId = `unit-seed-transcripts-${Date.now()}`;
  const missingVideoId = `unit-seed-transcripts-missing-${Date.now()}`;
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "seed-transcripts-"));
    return prisma.filme
      .create({
        data: {
          title: "Filme seed script (unit)",
          emoji: "🎬",
          level: "BASICO",
          ageRange: "3-6",
          videoId,
          durationSeconds: 300,
        },
      })
      .then(() => {
        // Frases fora de ordem no JSON (order: 2 antes de order: 1) — o script
        // precisa reordenar antes de re-derivar order = índice + 1.
        fs.writeFileSync(
          path.join(tmpDir, `${videoId}.json`),
          JSON.stringify({
            videoId,
            title: "Filme seed script (unit)",
            sentences: [
              { order: 2, start: 2, end: 4, textEn: "Second", textPt: "" },
              { order: 1, start: 0, end: 2, textEn: "First", textPt: "Primeiro" },
            ],
          }),
        );

        // videoId sem Video/SeriesEpisode/Filme cadastrado — deve ser pulado.
        fs.writeFileSync(
          path.join(tmpDir, `${missingVideoId}.json`),
          JSON.stringify({
            videoId: missingVideoId,
            title: "Sem fonte cadastrada",
            sentences: [{ order: 1, start: 0, end: 1, textEn: "X", textPt: "" }],
          }),
        );
      })
      .then(() => {
        runSeedTranscripts(tmpDir);
      });
  });

  afterAll(async () => {
    await prisma.transcriptSentence.deleteMany({ where: { youtubeVideoId: { in: [videoId, missingVideoId] } } });
    await prisma.filme.deleteMany({ where: { videoId } });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("faz upsert das frases pro Filme existente, reordenando pelo `order` do JSON", async () => {
    const sentences = await prisma.transcriptSentence.findMany({
      where: { youtubeVideoId: videoId },
      orderBy: { order: "asc" },
    });

    expect(sentences).toHaveLength(2);
    expect(sentences[0]).toMatchObject({ order: 1, textEn: "First", textPt: "Primeiro", needsReview: false });
    expect(sentences[1]).toMatchObject({ order: 2, textEn: "Second", textPt: "", needsReview: true });
  });

  it("pula videoId sem Video/SeriesEpisode/Filme cadastrado, sem criar frases nem lançar erro", async () => {
    const sentences = await prisma.transcriptSentence.findMany({ where: { youtubeVideoId: missingVideoId } });
    expect(sentences).toHaveLength(0);
  });

  it("roda de novo sem duplicar (replace idempotente)", async () => {
    expect(() => runSeedTranscripts(tmpDir)).not.toThrow();

    const sentences = await prisma.transcriptSentence.findMany({ where: { youtubeVideoId: videoId } });
    expect(sentences).toHaveLength(2);
  });
});
