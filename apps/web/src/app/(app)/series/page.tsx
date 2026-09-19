"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layers, Lock, Play, Search, SlidersHorizontal, Tv } from "lucide-react";
import type { AccessStatus, SeriesSummary } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { AccessLockBadge, AccessLockCaption } from "@/components/access-control/AccessLock";
import { AdminAccessPreviewToggle, AdminAccessPreviewHint } from "@/components/access-control/AdminAccessPreviewToggle";
import { TrialBanner } from "@/components/access-control/TrialBanner";
import { LEVEL_STYLES, levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { LEVEL_ORDER, LEVEL_DB_TO_LABEL, useSeriesCatalog } from "@/lib/progression/useSeriesCatalog";

export default function SeriesPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [nivel, setNivel] = useState<Nivel | null>(null);

  const {
    seriesList,
    loading,
    error,
    isAdmin,
    statusById,
    trialActive,
    trialDaysLeft,
    bypass,
    unlocked,
    progressByLevel,
    adminPreview,
  } = useSeriesCatalog();

  const itens = seriesList.filter((item) => {
    const label = LEVEL_DB_TO_LABEL[item.level];
    if (nivel && label !== nivel) return false;
    if (busca && !item.title.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 flex items-center justify-between border-b border-cinema-border px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface-alt"
        >
          <ArrowLeft className="h-4 w-4 text-cinema-text/80" />
        </button>
        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="pt-5">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-cinema-primary" />
              <h1 className="font-display text-2xl font-bold text-cinema-text">Séries</h1>
            </div>
            {isAdmin && <AdminAccessPreviewToggle adminPreview={adminPreview} />}
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Temporadas completas pra imersão em inglês</p>
            <span className="mt-1 flex-shrink-0 rounded-full border border-cinema-border bg-cinema-surface-alt px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {seriesList.length} séries
            </span>
          </div>
        </div>

        <div className="mt-4">
          <AdminAccessPreviewHint adminPreview={adminPreview} />
          <TrialBanner trialActive={trialActive} bypass={bypass} daysLeft={trialDaysLeft} />
        </div>

        {!loading && !error && seriesList.length > 0 && (
          <div className="mt-4 rounded-2xl border border-cinema-border bg-cinema-surface-alt p-4">
            <div className="grid grid-cols-3 gap-3">
              {LEVEL_ORDER.map((level) => {
                const style = LEVEL_STYLES[level];
                const { completed, total } = progressByLevel[level];
                const isUnlocked = unlocked[level];
                const pct = total > 0 ? (completed / total) * 100 : 0;
                return (
                  <div key={level}>
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`font-body text-[10px] font-black uppercase tracking-wide ${
                          isUnlocked ? "text-cinema-text" : "text-cinema-muted"
                        }`}
                      >
                        {style.label}
                      </span>
                      {!isUnlocked && <Lock className="h-2.5 w-2.5 text-cinema-muted" />}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cinema-border">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: isUnlocked ? style.chipBg : "#cbd5e1" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <div
            className={`flex flex-1 items-center rounded-2xl border transition-all ${
              buscaFocada ? "border-cinema-primary-alt/40 bg-white shadow-[0_0_0_4px_rgba(45,101,174,0.1)]" : "border-cinema-border bg-cinema-surface-alt"
            }`}
          >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center ${buscaFocada ? "text-cinema-primary" : "text-cinema-muted"}`}>
              <Search className="h-4 w-4" />
            </div>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setBuscaFocada(true)}
              onBlur={() => setBuscaFocada(false)}
              placeholder="Buscar séries…"
              className="h-11 flex-1 bg-transparent pr-3 font-body text-sm font-semibold text-cinema-text placeholder-cinema-muted/60 outline-none"
            />
          </div>
          <button
            type="button"
            aria-label="Filtros avançados"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-cinema-border bg-cinema-surface-alt text-cinema-muted"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(Object.keys(LEVEL_STYLES) as Nivel[]).map((l) => (
            <LevelChip
              key={l}
              nivel={l}
              active={nivel === l}
              unlocked={unlocked[l]}
              onClick={() => setNivel(nivel === l ? null : l)}
            />
          ))}
        </div>

        <div className="mb-7 mt-6">
          {loading ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Carregando…</p>
          ) : error ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">{error}</p>
          ) : itens.length === 0 ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Nenhuma série encontrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {itens.map((item) => (
                <SeriesCard
                  key={item.id}
                  item={item}
                  status={statusById[item.id] ?? "locked-premium"}
                  onClick={() => router.push(`/series/${item.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelChip({
  nivel,
  active,
  unlocked,
  onClick,
}: {
  nivel: Nivel;
  active: boolean;
  unlocked: boolean;
  onClick: () => void;
}) {
  const style = LEVEL_STYLES[nivel];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 font-body text-xs font-bold transition-all"
      style={
        active
          ? { background: style.chipBg, color: "#ffffff", boxShadow: `0 4px 16px -4px ${style.glow}`, borderColor: "rgba(255,255,255,0.2)" }
          : { backgroundColor: "#EEF3F9", borderColor: "#E5EAF2", color: unlocked ? "#5C6B7D" : "#94a3b8" }
      }
    >
      {!unlocked && <Lock className="h-2.5 w-2.5" />}
      {style.label}
    </button>
  );
}

function SeriesCard({
  item,
  status,
  onClick,
}: {
  item: SeriesSummary;
  status: AccessStatus;
  onClick: () => void;
}) {
  const style = levelStyle(LEVEL_DB_TO_LABEL[item.level]);
  const isUnlocked = status === "unlocked";
  return (
    <button
      type="button"
      disabled={!isUnlocked}
      onClick={onClick}
      className="group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-2xl text-left transition-transform enabled:hover:scale-[1.03] disabled:cursor-not-allowed"
      style={{ boxShadow: isUnlocked ? `0 12px 30px -12px ${style.glow}` : "none" }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${style.cardGradient}`}
        style={{ filter: isUnlocked ? undefined : "grayscale(0.7) brightness(0.75)" }}
      />
      {isUnlocked && <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />}

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-6xl transition-transform group-enabled:group-hover:scale-110"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", opacity: isUnlocked ? 1 : 0.5 }}
        >
          {item.emoji}
        </div>
      </div>

      {isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/20 group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white" style={{ boxShadow: "0 8px 20px -4px rgba(0,0,0,0.5)" }}>
            <Play className="ml-0.5 h-4 w-4 fill-current text-neutral-900" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />

      <div className="absolute left-2 top-2">
        <span className="rounded-full border border-white/15 bg-black/40 px-1.5 py-0.5 font-body text-[9px] font-black uppercase text-white backdrop-blur-sm">
          {style.label}
        </span>
      </div>

      <AccessLockBadge status={status} />

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="mb-0.5 font-display text-sm font-bold leading-tight text-white">{item.title}</h3>
        {isUnlocked ? (
          <div className="flex items-center gap-1">
            <Layers className="h-2.5 w-2.5 text-white/70" />
            <span className="font-body text-[10px] font-bold text-white/70">
              {item.seasons} {item.seasons > 1 ? "temporadas" : "temporada"} · {item.episodesCount} eps
            </span>
          </div>
        ) : (
          <AccessLockCaption status={status} />
        )}
      </div>
    </button>
  );
}
