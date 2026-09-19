import { Module } from "@nestjs/common";
import { TranscriptsModule } from "../transcripts/transcripts.module";
import { YoutubeClient } from "../videos/youtube.client";
import { SeriesController } from "./series.controller";
import { SeriesService } from "./series.service";
import { SeriesSyncService } from "./series-sync.service";
import { AdminSeriesController } from "./admin-series.controller";
import { AdminSeriesService } from "./admin-series.service";

@Module({
  imports: [TranscriptsModule],
  controllers: [SeriesController, AdminSeriesController],
  providers: [YoutubeClient, SeriesService, SeriesSyncService, AdminSeriesService],
  // SeriesService é reaproveitado pelo AdminModule (GET /admin/access-preview)
  // pra computar o mesmo controle de acesso usado pelas rotas públicas.
  exports: [SeriesService],
})
export class SeriesModule {}
