import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { ParentService } from "./parent.service";

@UseGuards(JwtAuthGuard)
@Controller("parent")
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get("profiles/:id/journey")
  getJourney(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.parentService.getJourney(req.user, id);
  }

  @Get("profiles/:id/transcripts")
  getTranscripts(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.parentService.getTranscripts(req.user, id);
  }
}
