import { Module } from "@nestjs/common";
import { SeriesModule } from "../series/series.module";
import { VideosModule } from "../videos/videos.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [SeriesModule, VideosModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
