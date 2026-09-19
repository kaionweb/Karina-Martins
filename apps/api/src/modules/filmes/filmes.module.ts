import { Module } from "@nestjs/common";
import { TranscriptsModule } from "../transcripts/transcripts.module";
import { FilmesController } from "./filmes.controller";
import { FilmesService } from "./filmes.service";
import { AdminFilmesController } from "./admin-filmes.controller";
import { AdminFilmesService } from "./admin-filmes.service";

// Importa TranscriptsModule para o FilmesController injetar TranscriptsService
// na rota pública GET /filmes/:id/transcript (feature de repetição de frase).
@Module({
  imports: [TranscriptsModule],
  controllers: [FilmesController, AdminFilmesController],
  providers: [FilmesService, AdminFilmesService],
})
export class FilmesModule {}
