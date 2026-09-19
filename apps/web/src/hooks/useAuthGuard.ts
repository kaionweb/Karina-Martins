"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getActiveProfileHint, setActiveProfileHint } from "@/lib/auth";
import { useProfileStore } from "@/stores/useProfileStore";

interface UseAuthGuardOptions {
  requireProfile?: boolean;
  // Rotas de visitante (sem conta): não redireciona pra /login quando não há
  // token — `ready` fica true com `activeProfile` continuando null. Quem
  // chama decide o que isso libera (ver GUEST_ALLOWED_PATHS em (app)/layout.tsx).
  allowGuest?: boolean;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const router = useRouter();
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        if (options.allowGuest) {
          if (!cancelled) setReady(true);
          return;
        }
        router.replace("/login");
        return;
      }

      if (options.requireProfile && !activeProfile) {
        // Após um reload, a store (100% em memória) está vazia mesmo com sessão
        // válida. Se /auth/refresh trouxe o perfil ativo (Story 10.4), repopula a
        // store direto com ele — sem chamar GET /profiles, que um token CHILD não
        // tem permissão de usar (SEC-002, Story 1.4). O hint é consumido aqui.
        const hint = getActiveProfileHint();
        if (hint) {
          setActiveProfileHint(null);
          if (!cancelled) {
            setActiveProfile(hint);
            setReady(true);
          }
          return;
        }

        router.replace("/select-profile");
        return;
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    check();

    return () => {
      cancelled = true;
    };
    // `router` (Next.js) é estável entre renders — não precisa entrar nas deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, options.requireProfile, options.allowGuest]);

  return { ready };
}
