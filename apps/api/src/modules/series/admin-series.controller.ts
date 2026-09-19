import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards, UsePipes } from "@nestjs/common";
import type { Series } from "@ipp/database";
import {
  setFreeAfterTrialSchema,
  setHiddenSchema,
  upsertSeriesSchema,
  type SetFreeAfterTrialInput,
  type SetHiddenInput,
  type UpsertSeriesInput,
} from "@ipp/shared";
import { AdminGuard } from "../../common/guards/admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AdminSeriesService, type SeriesWithEpisodesCount, type UpsertSeriesResult } from "./admin-series.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/series")
export class AdminSeriesController {
  constructor(private readonly adminSeriesService: AdminSeriesService) {}

  @Post()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(upsertSeriesSchema))
  upsertSeries(@Body() body: UpsertSeriesInput): Promise<UpsertSeriesResult> {
    return this.adminSeriesService.upsertSeries(body);
  }

  @Get()
  listSeries(): Promise<SeriesWithEpisodesCount[]> {
    return this.adminSeriesService.listSeriesWithCounts();
  }

  @Get(":id/episodes")
  getEpisodes(@Param("id") id: string) {
    return this.adminSeriesService.getEpisodesForSeries(id);
  }

  @Patch(":id/free-after-trial")
  setFreeAfterTrial(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setFreeAfterTrialSchema)) body: SetFreeAfterTrialInput,
  ): Promise<Series> {
    return this.adminSeriesService.setFreeAfterTrial(id, body.freeAfterTrial);
  }

  @Patch("episodes/:episodeId")
  setEpisodeHidden(
    @Param("episodeId") episodeId: string,
    @Body(new ZodValidationPipe(setHiddenSchema)) body: SetHiddenInput,
  ) {
    return this.adminSeriesService.setEpisodeHidden(episodeId, body.hidden);
  }

  @Patch("seasons/:seriesId/:season")
  setSeasonHidden(
    @Param("seriesId") seriesId: string,
    @Param("season") season: string,
    @Body(new ZodValidationPipe(setHiddenSchema)) body: SetHiddenInput,
  ) {
    return this.adminSeriesService.setSeasonHidden(seriesId, Number(season), body.hidden);
  }

  @Delete(":id")
  deleteSeries(@Param("id") id: string) {
    return this.adminSeriesService.deleteSeries(id);
  }
}
