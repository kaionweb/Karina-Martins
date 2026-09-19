"use client";

import Link from "next/link";
import { useProfileStore } from "@/stores/useProfileStore";

export function AppHeader() {
  const activeProfile = useProfileStore((state) => state.activeProfile);

  return (
    <header
      className="flex items-center justify-between border-b p-4"
      style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
    >
      <Link href="/home" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="Colégio Karina Martins" className="h-16 w-16 object-contain" />
      </Link>
      {activeProfile ? <span className="text-sm">{activeProfile.nickname}</span> : null}
    </header>
  );
}
