import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("shows")
  listShows() {
    return this.catalogService.listShows();
  }

  @UseGuards(JwtAuthGuard)
  @Get("shows/:id/tracks")
  getTracksForShow(@Param("id") id: string) {
    return this.catalogService.getTracksForShow(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("tracks/:id/lessons")
  getLessonsForTrack(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.catalogService.getLessonsForTrack(id, req.user.profileId);
  }
}
