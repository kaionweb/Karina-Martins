import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { LessonsModule } from "./modules/lessons/lessons.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { AiModule } from "./modules/ai/ai.module";
import { ParentModule } from "./modules/parent/parent.module";
import { VideosModule } from "./modules/videos/videos.module";
import { SeriesModule } from "./modules/series/series.module";
import { FilmesModule } from "./modules/filmes/filmes.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    HealthModule,
    AuthModule,
    ProfilesModule,
    CatalogModule,
    LessonsModule,
    GamificationModule,
    AiModule,
    ParentModule,
    VideosModule,
    SeriesModule,
    FilmesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
