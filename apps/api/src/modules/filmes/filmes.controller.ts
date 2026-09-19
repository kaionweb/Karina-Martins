import { Controller, Get, Param } from "@nestjs/common";
import { TranscriptsService } from "../transcripts/transcripts.service";
import { FilmesService } from "./filmes.service";

@Controller("filmes")
export class FilmesController {
  constructor(
    private readonly filmesService: FilmesService,
    private readonly transcriptsService: TranscriptsService,
  ) {}

  @Get()
  listFilmes() {
    return this.filmesService.listFilmes();
  }

  @Get(":id")
  getFilme(@Param("id") id: string) {
    return this.filmesService.getFilmeById(id);
  }

  // Frases do transcript para a feature de repetição (A-B repeat). Resolve o
  // Filme pelo id interno (cuid), pega o videoId do YouTube e delega. Vazio
  // quando não há transcript — a tela esconde a feature nesse caso.
  @Get(":id/transcript")
  async getTranscript(@Param("id") id: string) {
    const filme = await this.filmesService.getFilmeById(id);
    return this.transcriptsService.getPublicByYoutubeVideoId(filme.videoId);
  }
}
