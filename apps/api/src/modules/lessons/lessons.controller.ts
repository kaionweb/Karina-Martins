import { Controller, ForbiddenException, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { apiErrorBody } from "../../common/errors/api-error";
import { LessonsService } from "./lessons.service";

@UseGuards(JwtAuthGuard)
@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // IMPORTANTE: declarado ANTES de `@Get(":id")` — no Nest/Express uma rota com
  // segmento dinâmico (`:id`) capturaria "continue-learning" como um id literal.
  @Get("continue-learning")
  getContinueLearning(@Req() req: AuthenticatedRequest) {
    if (!req.user.profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    return this.lessonsService.getContinueLearning(req.user.profileId);
  }

  @Get(":id")
  getLesson(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.lessonsService.getLesson(id, req.user.profileId);
  }

  @Post(":id/complete")
  @HttpCode(200)
  completeLesson(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.lessonsService.completeLesson(id, req.user.profileId);
  }
}
