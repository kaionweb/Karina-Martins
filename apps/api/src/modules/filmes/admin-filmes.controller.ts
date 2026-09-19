import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards, UsePipes } from "@nestjs/common";
import { upsertFilmeSchema, type UpsertFilmeInput } from "@ipp/shared";
import { AdminGuard } from "../../common/guards/admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AdminFilmesService } from "./admin-filmes.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/filmes")
export class AdminFilmesController {
  constructor(private readonly adminFilmesService: AdminFilmesService) {}

  @Post()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(upsertFilmeSchema))
  upsertFilme(@Body() body: UpsertFilmeInput) {
    return this.adminFilmesService.upsertFilme(body);
  }

  @Get()
  listFilmes() {
    return this.adminFilmesService.listFilmes();
  }

  @Delete(":id")
  deleteFilme(@Param("id") id: string) {
    return this.adminFilmesService.deleteFilme(id);
  }
}
