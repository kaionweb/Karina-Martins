import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../../common/guards/admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { apiErrorBody } from "../../common/errors/api-error";
import { SeriesService } from "../series/series.service";
import { VideosService } from "../videos/videos.service";
import { AdminService } from "./admin.service";

// Endpoint mínimo pra telas do front decidirem se mostram atalhos de admin
// (ex.: Perfil) sem duplicar a lógica de ADMIN_EMAIL no cliente — os guards
// são a mesma dupla usada por /admin/series e /admin/playlists.
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seriesService: SeriesService,
    private readonly videosService: VideosService,
  ) {}

  @Get("whoami")
  whoami() {
    return { isAdmin: true };
  }

  // Dropdown do modo comparação (ver AdminAccessPreviewToggle no web).
  @Get("profiles")
  listProfiles() {
    return this.adminService.listProfilesForPreview();
  }

  // Catálogo + status de acesso calculados como o perfil escolhido veria de
  // verdade — SEMPRE bypass=false (o admin nunca herda o próprio bypass
  // durante a simulação, mesmo sendo ele quem está chamando a rota).
  @Get("access-preview")
  async getAccessPreview(@Query("profileId") profileId: string) {
    if (!profileId) {
      throw new BadRequestException(apiErrorBody("PROFILE_ID_REQUIRED", "profileId é obrigatório"));
    }

    await this.adminService.requireProfile(profileId);
    return this.seriesService.getAccessPreviewForProfile(profileId);
  }

  // Mesma ideia, pro catálogo de Listening (Video/CuratedPlaylist).
  @Get("access-preview/listening")
  async getListeningAccessPreview(@Query("profileId") profileId: string) {
    if (!profileId) {
      throw new BadRequestException(apiErrorBody("PROFILE_ID_REQUIRED", "profileId é obrigatório"));
    }

    await this.adminService.requireProfile(profileId);
    return this.videosService.getListeningAccessPreviewForProfile(profileId);
  }
}
