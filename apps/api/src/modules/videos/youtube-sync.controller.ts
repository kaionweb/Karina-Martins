import { Controller, HttpCode, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { CronSecretGuard } from "../../common/guards/cron-secret.guard";
import { YoutubeSyncService } from "./youtube-sync.service";

@UseGuards(CronSecretGuard)
@Controller("internal/cron")
export class YoutubeSyncController {
  constructor(private readonly youtubeSyncService: YoutubeSyncService) {}

  @Post("videos-sync")
  @HttpCode(200)
  async syncVideos(@Res({ passthrough: true }) res: Response) {
    const result = await this.youtubeSyncService.syncAll();
    // Status não-2xx quando alguma playlist falhou: permite que o serviço de
    // cron externo (cron-job.org) detecte e alerte a falha, já que o try/catch
    // por playlist em syncAll() nunca deixa a rota lançar.
    if (result.failedPlaylistIds.length > 0) {
      res.status(207); // Multi-Status: sincronização parcial (nem toda playlist ativa foi atualizada)
    }
    return result;
  }
}
