import { Body, Controller, Get, Param, Patch, Put, UseGuards } from "@nestjs/common";
import { prisma } from "@ipp/database";
import {
  reviewTranscriptSentenceSchema,
  saveTranscriptSchema,
  type PendingTranscriptGroup,
  type ReviewTranscriptSentenceInput,
  type SaveTranscriptInput,
  type TranscriptSentence,
  type TranscriptSource,
} from "@ipp/shared";
import { AdminGuard } from "../../common/guards/admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { TranscriptsService } from "./transcripts.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/transcripts")
export class AdminTranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  // ATENÇÃO: precisa vir ANTES de "@Get(:youtubeVideoId)" — senão "/pending"
  // seria capturado pela rota :youtubeVideoId (mesmo cuidado de VideosController).
  @Get("pending")
  async listPending(): Promise<PendingTranscriptGroup[]> {
    return this.transcriptsService.getPendingReview();
  }

  // Lista de vídeos avulsos + episódios de série + filmes para o dropdown do
  // admin. Query nova e isolada — não toca nos services de playlists/séries/filmes.
  @Get("sources")
  async listSources(): Promise<TranscriptSource[]> {
    const [videos, episodes, filmes] = await Promise.all([
      prisma.video.findMany({ select: { videoId: true, title: true }, orderBy: { title: "asc" } }),
      prisma.seriesEpisode.findMany({ select: { videoId: true, title: true }, orderBy: { title: "asc" } }),
      prisma.filme.findMany({ select: { videoId: true, title: true }, orderBy: { title: "asc" } }),
    ]);

    return [
      ...videos.map((v): TranscriptSource => ({ youtubeVideoId: v.videoId, title: v.title, kind: "video" })),
      ...episodes.map((e): TranscriptSource => ({ youtubeVideoId: e.videoId, title: e.title, kind: "episode" })),
      ...filmes.map((f): TranscriptSource => ({ youtubeVideoId: f.videoId, title: f.title, kind: "filme" })),
    ];
  }

  @Get(":youtubeVideoId")
  getTranscript(@Param("youtubeVideoId") youtubeVideoId: string) {
    return this.transcriptsService.getByYoutubeVideoId(youtubeVideoId);
  }

  @Put(":youtubeVideoId")
  saveTranscript(
    @Param("youtubeVideoId") youtubeVideoId: string,
    @Body(new ZodValidationPipe(saveTranscriptSchema)) body: SaveTranscriptInput,
  ) {
    return this.transcriptsService.replaceForYoutubeVideoId(youtubeVideoId, body);
  }

  // Corrige UMA frase pendente (tela de revisão) e marca needsReview: false —
  // não mexe nas demais frases do vídeo, diferente do PUT acima.
  @Patch("review/:sentenceId")
  reviewSentence(
    @Param("sentenceId") sentenceId: string,
    @Body(new ZodValidationPipe(reviewTranscriptSentenceSchema)) body: ReviewTranscriptSentenceInput,
  ): Promise<TranscriptSentence> {
    return this.transcriptsService.markReviewed(sentenceId, body.textPt);
  }
}
