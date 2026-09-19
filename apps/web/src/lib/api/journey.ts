import { getLessonsForTrack, getTracksForShow, listShows } from "@/lib/api/catalog";

export type JourneyTrackStatus = "not_started" | "in_progress" | "completed";

export interface JourneyTrackSummary {
  id: string;
  title: string;
  showTitle: string;
  totalLessons: number;
  completedLessons: number;
  status: JourneyTrackStatus;
}

// Não existe endpoint dedicado de "jornada" pro próprio perfil (o que existe,
// GET /parent/profiles/:id/journey, é bloqueado pra sessões CHILD por design —
// é o painel do responsável). Então montamos a jornada a partir dos endpoints
// de catálogo já existentes: show -> trilhas -> lições com progresso.
// Em escala de demo (2 shows, poucas trilhas) o N+1 é aceitável.
export async function getMyJourney(): Promise<JourneyTrackSummary[]> {
  const shows = await listShows();

  const tracksPerShow = await Promise.all(
    shows.map(async (show) => {
      const tracks = await getTracksForShow(show.id);
      return tracks.map((track) => ({ track, showTitle: show.title }));
    }),
  );

  return Promise.all(
    tracksPerShow.flat().map(async ({ track, showTitle }) => {
      const lessons = await getLessonsForTrack(track.id);
      const completedLessons = lessons.filter((lesson) => lesson.completed).length;
      const totalLessons = lessons.length;

      const status: JourneyTrackStatus =
        completedLessons === 0 ? "not_started" : completedLessons === totalLessons ? "completed" : "in_progress";

      return {
        id: track.id,
        title: track.title,
        showTitle,
        totalLessons,
        completedLessons,
        status,
      };
    }),
  );
}
