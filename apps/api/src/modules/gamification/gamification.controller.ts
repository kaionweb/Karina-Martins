import { Controller, ForbiddenException, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { apiErrorBody } from "../../common/errors/api-error";
import { GamificationService } from "./gamification.service";

@UseGuards(JwtAuthGuard)
@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get("xp")
  getXpTotal(@Req() req: AuthenticatedRequest) {
    if (!req.user.profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    return this.gamificationService.getXpTotal(req.user.profileId);
  }

  @Get("badges")
  getBadges(@Req() req: AuthenticatedRequest) {
    if (!req.user.profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    return this.gamificationService.getBadges(req.user.profileId);
  }

  @Get("ranking")
  getRanking(@Req() req: AuthenticatedRequest) {
    if (!req.user.profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    return this.gamificationService.getRanking(req.user.profileId);
  }
}
