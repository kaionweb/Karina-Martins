import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { videoListQuerySchema, type VideoListQuery } from "@ipp/shared";
import { isAdminBypass } from "../../common/guards/admin.guard";
import { OptionalJwtAuthGuard, type OptionallyAuthenticatedRequest } from "../../common/guards/optional-jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { TranscriptsService } from "../transcripts/transcripts.service";
import { VideosService } from "./videos.service";

// Guest (sem sessão) também acessa — mesmo padrão do SeriesController (Parte
// 2, modo visitante): a trava de Listening já é calculada com profileId
// undefined (trialStartedAt null, sem progresso) pelo VideosService, então
// reabrir a rota pra visitante não muda o resultado pra quem já tem conta,
// só deixa de dar 401 pra quem não tem (restaura AC1 das Stories 9.2/9.3).
@UseGuards(OptionalJwtAuthGuard)
@Controller("videos")
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly transcriptsService: TranscriptsService,
  ) {}

  @Get()
  async listVideos(
    @Query(new ZodValidationPipe(videoListQuerySchema)) query: VideoListQuery,
    @Req() req: OptionallyAuthenticatedRequest,
  ) {
    const bypass = await isAdminBypass(req.user?.sub, req.user?.profileId);
    return this.videosService.listVideos(query, req.user?.profileId, bypass);
  }

  // ATENÇÃO: precisa vir ANTES de "@Get(:id)" — senão "/videos/themes" seria
  // capturado pela rota :id (getVideoById("themes") -> 404 indevido).
  @Get("themes")
  listThemes() {
    return this.videosService.listThemes();
  }

  @Get(":id")
  async getVideo(@Param("id") id: string, @Req() req: OptionallyAuthenticatedRequest) {
    const bypass = await isAdminBypass(req.user?.sub, req.user?.profileId);
    return this.videosService.getVideoById(id, req.user?.profileId, bypass);
  }

  // Frases do transcript para a feature de repetição (A-B repeat). Resolve o
  // Video pelo id interno (cuid), checa a trava de acesso e só então pega o
  // videoId do YouTube e delega. Vazio quando não há transcript — a tela
  // esconde a feature nesse caso.
  @Get(":id/transcript")
  async getTranscript(@Param("id") id: string, @Req() req: OptionallyAuthenticatedRequest) {
    const bypass = await isAdminBypass(req.user?.sub, req.user?.profileId);
    // getVideoById já lança 403 se bloqueado — se chegou aqui, videoId vem
    // preenchido (não-nulo).
    const video = await this.videosService.getVideoById(id, req.user?.profileId, bypass);
    return this.transcriptsService.getPublicByYoutubeVideoId(video.videoId as string);
  }
}
