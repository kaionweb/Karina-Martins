"use client";

import Link from "next/link";
import { useProfileStore } from "@/stores/useProfileStore";
import { avatarForProfile, useAvatarPhoto } from "@/lib/ui/profileAvatar";

// Nome + avatar do perfil ativo, usado no header das telas de "afunilamento"
// (drill-down) que saem do shell principal — trilha e lição. Extraído porque
// a mesma lógica (foto real se ADULT, mascote se CHILD, inicial em último
// caso) já se repetia idêntica em duas telas.
//
// Sem perfil ativo = visitante (modo guest, Parte 2) — só acontece nas rotas
// liberadas sem conta (ver GUEST_ALLOWED_* em (app)/layout.tsx). Em vez do
// avatar vazio, vira um convite direto pra criar conta.
export function ProfileHeaderBadge() {
  const activeProfile = useProfileStore((state) => state.activeProfile);

  if (!activeProfile) {
    return (
      <Link
        href="/register"
        className="rounded-full bg-cinema-primary px-3 py-1.5 font-body text-xs font-bold text-white"
      >
        Criar conta
      </Link>
    );
  }

  const nickname = activeProfile?.nickname ?? "";
  const isAdult = activeProfile?.type === "ADULT";
  const avatar = activeProfile && activeProfile.type === "CHILD" ? avatarForProfile(activeProfile.id) : null;
  const { hasPhoto, onError } = useAvatarPhoto(isAdult ? activeProfile?.avatarUrl : null);

  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-sm font-bold text-cinema-text">{nickname}</span>
      <div
        className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ring-2 ring-cinema-border ${avatar ? avatar.gradient : "from-cinema-amber to-cinema-primary"}`}
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeProfile?.avatarUrl ?? undefined} alt={nickname} className="h-full w-full object-cover" onError={onError} />
        ) : avatar ? (
          <span className="text-sm">{avatar.emoji}</span>
        ) : (
          <span className="font-display text-xs font-bold text-white">{nickname.charAt(0).toUpperCase() || "?"}</span>
        )}
      </div>
    </div>
  );
}
