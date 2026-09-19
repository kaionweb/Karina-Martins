import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import { apiErrorBody } from "../../common/errors/api-error";

@Injectable()
export class CatalogService {
  listShows() {
    return prisma.show.findMany({ orderBy: { createdAt: "asc" } });
  }

  async getTracksForShow(showId: string) {
    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException(apiErrorBody("SHOW_NOT_FOUND", "Show não encontrado"));
    }

    return prisma.track.findMany({ where: { showId }, orderBy: { order: "asc" } });
  }

  async getLessonsForTrack(trackId: string, profileId?: string) {
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      throw new NotFoundException(apiErrorBody("TRACK_NOT_FOUND", "Trilha não encontrada"));
    }

    const lessons = await prisma.lesson.findMany({ where: { trackId }, orderBy: { order: "asc" } });

    if (!profileId) {
      return lessons.map((lesson) => ({ ...lesson, completed: false }));
    }

    // Story 10.3: a mera existência do registro não significa mais conclusão
    // (pode ter sido apenas acessado). Só `completed: true` conta como concluída.
    const progress = await prisma.lessonProgress.findMany({
      where: { profileId, completed: true, lessonId: { in: lessons.map((lesson) => lesson.id) } },
    });
    const completedLessonIds = new Set(progress.map((p) => p.lessonId));

    return lessons.map((lesson) => ({ ...lesson, completed: completedLessonIds.has(lesson.id) }));
  }
}
