import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards, UsePipes } from "@nestjs/common";
import { createPlaylistSchema, setFreeAfterTrialSchema, type CreatePlaylistInput, type SetFreeAfterTrialInput } from "@ipp/shared";
import { AdminGuard } from "../../common/guards/admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AdminPlaylistsService } from "./admin-playlists.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/playlists")
export class AdminPlaylistsController {
  constructor(private readonly adminPlaylistsService: AdminPlaylistsService) {}

  @Post()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(createPlaylistSchema))
  createPlaylist(@Body() body: CreatePlaylistInput) {
    return this.adminPlaylistsService.createOrUpdatePlaylist(body);
  }

  @Get()
  listPlaylists() {
    return this.adminPlaylistsService.listPlaylistsWithCounts();
  }

  @Patch(":id/free-after-trial")
  setFreeAfterTrial(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setFreeAfterTrialSchema)) body: SetFreeAfterTrialInput,
  ) {
    return this.adminPlaylistsService.setFreeAfterTrial(id, body.freeAfterTrial);
  }

  @Delete(":id")
  deletePlaylist(@Param("id") id: string) {
    return this.adminPlaylistsService.deletePlaylist(id);
  }
}
