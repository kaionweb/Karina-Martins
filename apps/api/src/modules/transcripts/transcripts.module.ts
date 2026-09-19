import { Module } from "@nestjs/common";
import { AdminTranscriptsController } from "./admin-transcripts.controller";
import { TranscriptsService } from "./transcripts.service";

// Exporta o TranscriptsService para as rotas públicas de leitura em
// VideosModule (GET /videos/:id/transcript) e SeriesModule
// (GET /series/episodes/:episodeId/transcript). O controller de admin
// (/admin/transcripts) vive aqui.
@Module({
  controllers: [AdminTranscriptsController],
  providers: [TranscriptsService],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}
