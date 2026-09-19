import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { videoHeartbeatSchema, type VideoHeartbeat } from "@ipp/shared";
import { isAdminBypass } from "../../common/guards/admin.guard";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { VideoWatchService } from "./video-watch.service";

@UseGuards(JwtAuthGuard)
@Controller("videos")
export class VideoWatchController {
  constructor(private readonly videoWatchService: VideoWatchService) {}

  @Post(":id/heartbeat")
  @HttpCode(200)
  async registerHeartbeat(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(videoHeartbeatSchema)) body: VideoHeartbeat,
    @Req() req: AuthenticatedRequest,
  ) {
    const bypass = await isAdminBypass(req.user.sub, req.user.profileId);
    return this.videoWatchService.registerHeartbeat(req.user.profileId, id, body.positionSeconds, bypass);
  }
}
