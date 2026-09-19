// Modo de comparação do admin: em vez do profile de teste fixo do protótipo
// original, o admin escolhe um perfil real num dropdown (GET /admin/profiles)
// e a tela passa a mostrar exatamente o que aquele perfil vê — sempre com
// bypass=false no server, mesmo sendo o admin quem está chamando a rota.
//
// Genérico sobre o tipo de preview (T) porque cada catálogo tem seu próprio
// endpoint/shape (GET /admin/access-preview pra Series, .../listening pra
// Listening) — a busca da lista de perfis e o estado do seletor são os
// mesmos, só a função de fetch do preview muda por chamador.
"use client";

import { useEffect, useState } from "react";
import type { AdminProfileOption } from "@ipp/shared";
import { listAdminProfiles } from "@/lib/api/admin";

export interface AdminAccessPreview<T> {
  profiles: AdminProfileOption[];
  previewProfileId: string | null;
  setPreviewProfileId: (profileId: string | null) => void;
  previewData: T | null;
  loadingPreview: boolean;
  // true = admin vendo tudo liberado (nenhum perfil selecionado pra simular).
  bypass: boolean;
}

export function useAdminAccessPreview<T>(
  isAdmin: boolean,
  fetchPreview: (profileId: string) => Promise<T>,
): AdminAccessPreview<T> {
  const [profiles, setProfiles] = useState<AdminProfileOption[]>([]);
  const [previewProfileId, setPreviewProfileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<T | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setProfiles([]);
      setPreviewProfileId(null);
      return;
    }

    let ativo = true;
    listAdminProfiles()
      .then((data) => {
        if (ativo) setProfiles(data);
      })
      .catch(() => {
        if (ativo) setProfiles([]);
      });

    return () => {
      ativo = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!previewProfileId) {
      setPreviewData(null);
      return;
    }

    let ativo = true;
    setLoadingPreview(true);
    fetchPreview(previewProfileId)
      .then((data) => {
        if (ativo) setPreviewData(data);
      })
      .catch(() => {
        if (ativo) setPreviewData(null);
      })
      .finally(() => {
        if (ativo) setLoadingPreview(false);
      });

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPreview é estável por chamador (função top-level de lib/api), incluí-la recriaria o efeito a cada render
  }, [previewProfileId]);

  return {
    profiles,
    previewProfileId,
    setPreviewProfileId,
    previewData,
    loadingPreview,
    bypass: isAdmin && !previewProfileId,
  };
}
