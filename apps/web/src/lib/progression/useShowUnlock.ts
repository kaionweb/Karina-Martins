// Trava de progressão das trilhas da Home (model Show/Track/Lesson — "Trilhas
// pra você"), independente da trava por nível de Séries/Explorar
// (ver useContentProgression.ts).
//
// REGRA: só a primeira trilha (shows[0], mesma ordem por createdAt que a Home
// já usa pra colorir os cards) vem destravada por padrão. As demais destravam
// juntas quando TODAS as lições de TODAS as trilhas da primeira estiverem
// concluídas (`completed`) pro perfil ativo.
import { useEffect, useState } from "react";
import type { LessonWithProgress, Show } from "@ipp/shared";
import { getLessonsForTrack, getTracksForShow } from "@/lib/api/catalog";

export function isFirstShowComplete(lessonsByTrack: LessonWithProgress[][]): boolean {
  const allLessons = lessonsByTrack.flat();
  return allLessons.length > 0 && allLessons.every((lesson) => lesson.completed);
}

export function useShowUnlock(shows: Show[]): {
  isShowUnlocked: (index: number) => boolean;
  loading: boolean;
} {
  const [firstShowCompleted, setFirstShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const firstShowId = shows[0]?.id;

  useEffect(() => {
    if (!firstShowId) {
      setLoading(false);
      return;
    }

    let ativo = true;
    setLoading(true);

    getTracksForShow(firstShowId)
      .then((tracks) => Promise.all(tracks.map((track) => getLessonsForTrack(track.id))))
      .then((lessonsByTrack) => {
        if (ativo) setFirstShowCompleted(isFirstShowComplete(lessonsByTrack));
      })
      .catch(() => {
        if (ativo) setFirstShowCompleted(false);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [firstShowId]);

  return { isShowUnlocked: (index: number) => index === 0 || firstShowCompleted, loading };
}
