import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import { apiErrorBody } from "../../common/errors/api-error";

@Injectable()
export class FilmesService {
  // Catálogo público, ordenado por título (browse alfabético). Filmes ocultos
  // não existem como conceito (sem `hidden`/`status`) — exclusão é definitiva.
  async listFilmes() {
    return prisma.filme.findMany({ orderBy: { title: "asc" } });
  }

  async getFilmeById(id: string) {
    const filme = await prisma.filme.findUnique({ where: { id } });
    if (!filme) {
      throw new NotFoundException(apiErrorBody("FILME_NOT_FOUND", "Filme não encontrado"));
    }
    return filme;
  }
}
