import { Module } from "@nestjs/common";
import { TranscriptsModule } from "../transcripts/transcripts.module";
import { YoutubeSyncController } from "./youtube-sync.controller";
import { YoutubeSyncService } from "./youtube-sync.service";
import { YoutubeClient } from "./youtube.client";
import { VideosController } from "./videos.controller";
import { VideosService } from "./videos.service";
import { VideoWatchController } from "./video-watch.controller";
import { VideoWatchService } from "./video-watch.service";
import { AdminPlaylistsController } from "./admin-playlists.controller";
import { AdminPlaylistsService } from "./admin-playlists.service";

@Module({
  imports: [TranscriptsModule],
  controllers: [YoutubeSyncController, VideosController, VideoWatchController, AdminPlaylistsController],
  providers: [YoutubeClient, YoutubeSyncService, VideosService, VideoWatchService, AdminPlaylistsService],
  // VideosService é reaproveitado pelo AdminModule (GET /admin/access-preview/listening).
  exports: [YoutubeSyncService, VideosService],
})
export class VideosModule {}
