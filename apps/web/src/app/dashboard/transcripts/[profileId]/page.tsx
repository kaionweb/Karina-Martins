"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AiSessionTranscript } from "@ipp/shared";
import { getTranscripts } from "@/lib/api/parent";
import { TranscriptList } from "@/components/parent/TranscriptList";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function TranscriptsPage() {
  const { ready } = useAuthGuard({ requireProfile: true });
  const params = useParams<{ profileId: string }>();
  const [sessions, setSessions] = useState<AiSessionTranscript[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      try {
        const data = await getTranscripts(params.profileId);
        setSessions(data);
      } catch {
        setError("Não foi possível carregar as transcrições.");
      }
    }

    load();
  }, [ready, params.profileId]);

  if (!ready) {
    return null;
  }

  if (error) {
    return <main className="p-6">{error}</main>;
  }

  if (!sessions) {
    return <main className="p-6">Carregando...</main>;
  }

  return (
    <>
      <AppHeader />
      <main className="flex flex-col gap-6 p-6 pb-24">
        <h1 className="text-2xl font-bold">Transcrições de conversas com a IA</h1>
        <TranscriptList sessions={sessions} />
      </main>
      <BottomNav />
    </>
  );
}
