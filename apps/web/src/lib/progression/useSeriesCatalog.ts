// Fonte única de dados pra Séries e Explorar: catálogo + controle de acesso
// (trial/premium/grandfathering/trava de nível) + modo de comparação do
// admin. As duas telas usam este hook em vez de cada uma buscar e computar
// tudo por conta própria — evita divergência entre elas (mesmo espírito do
// comentário em useContentProgression.ts).
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccessControlItem, AccessStatus, SeriesLevel, SeriesSummary } from "@ipp/shared";
import { trialDaysRemaining } from "@ipp/shared";
import type { AccessPreviewResponse } from "@ipp/shared";
import { listSeries } from "@/lib/api/series";
import { checkIsAdmin, getAccessPreview } from "@/lib/api/admin";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAdminAccessPreview, type AdminAccessPreview } from "@/lib/admin/useAdminAccessPreview";
import { useAccessControl } from "@/lib/progression/useAccessControl";
import { useContentProgression, LEVEL_ORDER, type ProgressByLevel, type UnlockedLevels } from "@/lib/progression/useContentProgression";
import type { Nivel } from "@/lib/ui/levelStyles";

export const LEVEL_DB_TO_LABEL: Record<SeriesLevel, Nivel> = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

export interface SeriesCatalog {
  seriesList: SeriesSummary[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  statusById: Record<string, AccessStatus>;
  trialActive: boolean;
  trialDaysLeft: number;
  bypass: boolean;
  unlocked: UnlockedLevels;
  progressByLevel: ProgressByLevel;
  adminPreview: AdminAccessPreview<AccessPreviewResponse>;
}

export function useSeriesCatalog(): SeriesCatalog {
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isAdult = activeProfile?.type === "ADULT";

  const [isAdmin, setIsAdmin] = useState(false);
  const [seriesList, setSeriesList] = useState<SeriesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdult) {
      setIsAdmin(false);
      return;
    }

    let ativo = true;
    checkIsAdmin().then((result) => {
      if (ativo) setIsAdmin(result);
    });

    return () => {
      ativo = false;
    };
  }, [isAdult]);

  useEffect(() => {
    let ativo = true;

    listSeries()
      .then((data) => {
        if (ativo) setSeriesList(data);
      })
      .catch(() => {
        if (ativo) setError("Não foi possível carregar o catálogo.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const adminPreview = useAdminAccessPreview(isAdmin, getAccessPreview);

  const accessItems: AccessControlItem<SeriesLevel>[] = useMemo(
    () =>
      seriesList.map((s) => ({
        id: s.id,
        level: s.level,
        hasContent: s.episodesCount > 0,
        completed: s.completed,
        freeAfterTrial: s.freeAfterTrial,
        hasStartedProgress: s.hasStartedProgress,
      })),
    [seriesList],
  );

  const ownAccess = useAccessControl(
    accessItems,
    { trialStartedAt: activeProfile?.trialStartedAt ?? null },
    adminPreview.bypass,
  );

  const previewing = Boolean(adminPreview.previewProfileId && adminPreview.previewData);
  const previewData = adminPreview.previewData;

  const displaySeries = previewing && previewData ? previewData.series : seriesList;
  const statusById = previewing && previewData ? previewData.statusById : ownAccess.statusById;
  const trialActive = previewing && previewData ? previewData.trialActive : ownAccess.trialActive;
  const trialDaysLeft =
    previewing && previewData ? previewData.trialDaysRemaining : trialDaysRemaining(activeProfile?.trialStartedAt);

  const progressionItems = useMemo(
    () =>
      displaySeries.map((s) => ({
        level: LEVEL_DB_TO_LABEL[s.level],
        hasContent: s.episodesCount > 0,
        completed: s.completed,
      })),
    [displaySeries],
  );
  const { unlocked, progressByLevel } = useContentProgression(progressionItems, adminPreview.bypass);

  return {
    seriesList: displaySeries,
    loading,
    error,
    isAdmin,
    statusById,
    trialActive,
    trialDaysLeft,
    bypass: adminPreview.bypass,
    unlocked,
    progressByLevel,
    adminPreview,
  };
}

export { LEVEL_ORDER };
