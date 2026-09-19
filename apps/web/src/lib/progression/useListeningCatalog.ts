// Fonte única de dados pra Listening: catálogo + controle de acesso
// (trial/premium/grandfathering/trava de nível) + modo de comparação do
// admin. Mesmo padrão de useSeriesCatalog.ts — mas aqui o server já devolve
// accessStatus calculado por item (ver VideosService.toSummary), então não
// precisamos recomputar no client: só decidir qual fonte usar (catálogo
// próprio vs. preview do admin).
"use client";

import { useEffect, useState } from "react";
import type { AccessStatus, ListeningAccessPreviewResponse, VideoSummary } from "@ipp/shared";
import { isTrialActive, trialDaysRemaining } from "@ipp/shared";
import { listVideos } from "@/lib/api/videos";
import { checkIsAdmin, getListeningAccessPreview } from "@/lib/api/admin";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAdminAccessPreview, type AdminAccessPreview } from "@/lib/admin/useAdminAccessPreview";

export interface ListeningCatalog {
  videos: VideoSummary[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  statusById: Record<string, AccessStatus>;
  trialActive: boolean;
  trialDaysLeft: number;
  bypass: boolean;
  adminPreview: AdminAccessPreview<ListeningAccessPreviewResponse>;
}

export function useListeningCatalog(): ListeningCatalog {
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isAdult = activeProfile?.type === "ADULT";

  const [isAdmin, setIsAdmin] = useState(false);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
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

    // Sem filtro de nível na query — igual a Series/Explorar, busca o
    // catálogo Listening inteiro (o server já resolve accessStatus por
    // item) e filtra por nível no client. /videos não pagina mais (ver
    // videoListQuerySchema) — antes o limit=50 truncava silenciosamente os
    // níveis Intermediário/Avançado quando o catálogo passou de 50 itens.
    listVideos({ skill: "LISTENING" })
      .then((res) => {
        if (ativo) setVideos(res.items);
      })
      .catch(() => {
        if (ativo) setError("Não foi possível carregar as faixas.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const adminPreview = useAdminAccessPreview(isAdmin, getListeningAccessPreview);

  const previewing = Boolean(adminPreview.previewProfileId && adminPreview.previewData);
  const previewData = adminPreview.previewData;

  const displayVideos = previewing && previewData ? previewData.videos : videos;
  const statusById: Record<string, AccessStatus> =
    previewing && previewData
      ? previewData.statusById
      : Object.fromEntries(displayVideos.map((v) => [v.id, v.accessStatus]));

  const trialActive =
    previewing && previewData ? previewData.trialActive : isTrialActive(activeProfile?.trialStartedAt);
  const trialDaysLeft =
    previewing && previewData ? previewData.trialDaysRemaining : trialDaysRemaining(activeProfile?.trialStartedAt);

  return {
    videos: displayVideos,
    loading,
    error,
    isAdmin,
    statusById,
    trialActive,
    trialDaysLeft,
    bypass: adminPreview.bypass,
    adminPreview,
  };
}
