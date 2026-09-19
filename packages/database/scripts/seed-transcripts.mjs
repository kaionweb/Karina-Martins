// Lê os JSONs gerados pelo pipeline externo de extração (extract-transcripts.mjs,
// formato { videoId, title, sentences: [{ order, start, end, textEn, textPt }] })
// e faz upsert das frases em TranscriptSentence, vinculadas a um Video, SeriesEpisode
// ou Filme já existente (nessa ordem de prioridade — mesma ordem de listSources em
// admin-transcripts.controller.ts).
//
// NÃO cria Video/SeriesEpisode/Filme: esses precisam existir antes (playlist já
// sincronizada via /admin/playlists, série via /admin/series, ou filme via
// /admin/filmes) — Video em especial tem FK obrigatória pra CuratedPlaylist e
// campos obrigatórios (channel/duração/thumbnail) que só a sincronização real com
// a YouTube Data API preenche corretamente. Um videoId sem fonte cadastrada é
// avisado no console e pulado, nunca criado com dados inventados.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.join(__dirname, "..", "transcripts");

function parseArgs(argv) {
  const dirFlagIndex = argv.indexOf("--dir");
  const dir = dirFlagIndex >= 0 ? argv[dirFlagIndex + 1] : undefined;
  return { dir: dir ? path.resolve(dir) : DEFAULT_DIR };
}

async function findSource(videoId) {
  const video = await prisma.video.findUnique({ where: { videoId }, select: { videoId: true } });
  if (video) return "video";

  const episode = await prisma.seriesEpisode.findUnique({ where: { videoId }, select: { videoId: true } });
  if (episode) return "episode";

  const filme = await prisma.filme.findUnique({ where: { videoId }, select: { videoId: true } });
  if (filme) return "filme";

  return null;
}

async function seedOneFile(filePath) {
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  const { videoId, title, sentences } = data;

  if (!videoId || !Array.isArray(sentences)) {
    console.warn(`[seed-transcripts] ${path.basename(filePath)}: formato inválido (faltam videoId/sentences), pulando.`);
    return { skipped: true, needsReviewCount: 0 };
  }

  const source = await findSource(videoId);
  if (!source) {
    console.warn(
      `[seed-transcripts] "${title ?? videoId}" (${videoId}): não encontrado em Video/SeriesEpisode/Filme. ` +
        `Sincronize a playlist em /admin/playlists (ou cadastre em /admin/series ou /admin/filmes) antes de rodar o seed. Pulando.`,
    );
    return { skipped: true, needsReviewCount: 0 };
  }

  const ordered = [...sentences].sort((a, b) => a.order - b.order);
  const needsReviewCount = ordered.filter((s) => (s.textPt ?? "").trim() === "").length;

  await prisma.$transaction(async (tx) => {
    await tx.transcriptSentence.deleteMany({ where: { youtubeVideoId: videoId } });

    if (ordered.length > 0) {
      await tx.transcriptSentence.createMany({
        data: ordered.map((sentence, index) => ({
          youtubeVideoId: videoId,
          order: index + 1,
          startTime: sentence.start,
          endTime: sentence.end,
          textEn: sentence.textEn,
          textPt: sentence.textPt ?? "",
          needsReview: (sentence.textPt ?? "").trim() === "",
        })),
      });
    }
  });

  console.log(
    `[seed-transcripts] "${title ?? videoId}" (${videoId}, ${source}): ${ordered.length} frase(s), ` +
      `${needsReviewCount} pendente(s) de revisão.`,
  );

  return { skipped: false, needsReviewCount };
}

async function main() {
  const { dir } = parseArgs(process.argv.slice(2));

  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    console.error(`[seed-transcripts] Pasta não encontrada: ${dir}`);
    process.exitCode = 1;
    return;
  }

  if (files.length === 0) {
    console.warn(`[seed-transcripts] Nenhum .json encontrado em ${dir}`);
    return;
  }

  let processed = 0;
  let skipped = 0;
  let totalNeedsReview = 0;

  for (const file of files) {
    const result = await seedOneFile(path.join(dir, file));
    if (result.skipped) {
      skipped += 1;
    } else {
      processed += 1;
      totalNeedsReview += result.needsReviewCount;
    }
  }

  console.log(
    `[seed-transcripts] Concluído: ${processed} vídeo(s) processado(s), ${skipped} pulado(s), ` +
      `${totalNeedsReview} frase(s) marcada(s) needsReview.`,
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[seed-transcripts] Erro inesperado:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
