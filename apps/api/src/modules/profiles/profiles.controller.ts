import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, Res, UseGuards, UsePipes } from "@nestjs/common";
import type { Response } from "express";
import {
  CreateChildProfileSchema,
  UpdateProfileAvatarSchema,
  type CreateChildProfileInput,
  type UpdateProfileAvatarInput,
} from "@ipp/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "../../common/auth/refresh-cookie";
import { ProfilesService } from "./profiles.service";

@UseGuards(JwtAuthGuard)
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.profilesService.listForUser(req.user);
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(CreateChildProfileSchema))
  create(@Body() body: CreateChildProfileInput, @Req() req: AuthenticatedRequest) {
    return this.profilesService.createChildProfile(req.user, body);
  }

  @Patch(":id/avatar")
  @HttpCode(200)
  updateAvatar(
    // Pipe escopado no @Body(), não @UsePipes() no método: @UsePipes()
    // validaria TODOS os parâmetros (inclusive o @Param("id"), que não é o
    // shape do UpdateProfileAvatarSchema) contra o mesmo schema.
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateProfileAvatarSchema)) body: UpdateProfileAvatarInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.profilesService.updateAvatar(req.user, id, body.avatarUrl);
  }

  @Post(":id/select")
  @HttpCode(200)
  async select(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.profilesService.selectProfile(req.user, id);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }
}
