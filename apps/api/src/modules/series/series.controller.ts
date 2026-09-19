import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { isAdminBypass } from "../../common/guards/admin.guard";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard, type OptionallyAuthenticatedRequest } from "../../common/guards/optional-jwt-auth.guard";
import { TranscriptsService } from "../transcripts/transcripts.service";
import { SeriesService, type SeriesWithEpisodesCount } from "./series.service";

@Controller("series")
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly transcriptsService: TranscriptsService,
  ) {}

  // Guest (sem sessão) também pode listar — só vê freeAfterTrial liberado,
  // o resto vem com status locked-* (ver computeSeriesAccessStatus).
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  listSeries(@Req() req: OptionallyAuthenticatedRequest): Promise<SeriesWithEpisodesCount[]> {
    return this.seriesService.listSeries(req.user?.profileId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id/episodes")
  async getEpisodes(@Param("id") id: string, @Req() req: OptionallyAuthenticatedRequest) {
    const bypass = req.user ? await isAdminBypass(req.user.sub, req.user.profileId) : false;
    return this.seriesService.getEpisodesForSeries(id, req.user?.profileId, bypass);
  }

  @UseGuards(JwtAuthGuard)
  @Post("episodes/:episodeId/watched")
  @HttpCode(200)
  async toggleWatched(@Param("episodeId") episodeId: string, @Req() req: AuthenticatedRequest) {
    const bypass = await isAdminBypass(req.user.sub, req.user.profileId);
    return this.seriesService.toggleWatched(req.user.profileId, episodeId, bypass);
  }

  // Transcript do episódio (feature de repetição de frase). Mesmo nível de
  // auth das outras rotas de episódio (JwtAuthGuard) + a mesma trava de
  // acesso da série-dona (ver assertSeriesUnlocked em SeriesService) — vazio
  // quando não há transcript cadastrado, 403 quando o episódio está
  // bloqueado pro perfil.
  @UseGuards(JwtAuthGuard)
  @Get("episodes/:episodeId/transcript")
  async getEpisodeTranscript(@Param("episodeId") episodeId: string, @Req() req: AuthenticatedRequest) {
    const bypass = await isAdminBypass(req.user.sub, req.user.profileId);
    const youtubeVideoId = await this.seriesService.getEpisodeYoutubeIdForTranscript(
      episodeId,
      req.user.profileId,
      bypass,
    );
    return this.transcriptsService.getPublicByYoutubeVideoId(youtubeVideoId);
  }
}
