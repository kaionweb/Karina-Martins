"use client";

import { useEffect, useState } from "react";
import type { JourneyResponse } from "@ipp/shared";
import { listProfiles } from "@/lib/api/profiles";
import { getJourney } from "@/lib/api/parent";
import { JourneyCard } from "@/components/parent/JourneyCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DashboardPage() {
  const { ready } = useAuthGuard({ requireProfile: true });
  const [journeys, setJourneys] = useState<JourneyResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      try {
        const profiles = await listProfiles();
        const childProfiles = profiles.filter((profile) => profile.type === "CHILD");
        const data = await Promise.all(childProfiles.map((profile) => getJourney(profile.id)));
        setJourneys(data);
      } catch {
        setError("Não foi possível carregar o painel do responsável.");
      }
    }

    load();
  }, [ready]);

  if (!ready) {
    return null;
  }

  if (error) {
    return <main className="p-6">{error}</main>;
  }

  if (!journeys) {
    return <main className="p-6">Carregando...</main>;
  }

  return (
    <>
      <AppHeader />
      <main className="flex flex-col gap-6 p-6 pb-24">
        <h1 className="text-2xl font-bold">Painel do responsável</h1>
        {journeys.length === 0 ? (
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Nenhum perfil infantil nesta conta.</p>
        ) : (
          journeys.map((journey) => <JourneyCard key={journey.profile.id} journey={journey} />)
        )}
      </main>
      <BottomNav />
    </>
  );
}
