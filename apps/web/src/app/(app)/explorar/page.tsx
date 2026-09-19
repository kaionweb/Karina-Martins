"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lock, Play, Search, SlidersHorizontal } from "lucide-react";
import { ChipFilter } from "@ipp/ui";
import type { AccessStatus, SeriesSummary } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { AccessLockBadge, AccessLockCaption } from "@/components/access-control/AccessLock";
import { AdminAccessPreviewToggle, AdminAccessPreviewHint } from "@/components/access-control/AdminAccessPreviewToggle";
import { GuestBanner } from "@/components/access-control/GuestBanner";
import { TrialBanner } from "@/components/access-control/TrialBanner";
import { useProfileStore } from "@/stores/useProfileStore";
import { LEVEL_STYLES, levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { LEVEL_ORDER, LEVEL_DB_TO_LABEL, useSeriesCatalog } from "@/lib/progression/useSeriesCatalog";

export default function ExplorarPage() {
  const router = useRouter();
  const isGuest = !useProfileStore((state) => state.activeProfile);
  const [busca, setBusca] = useState("");
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [genero, setGenero] = useState<string | null>(null);
  const [habilidade, setHabilidade] = useState<string | null>(null);

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

  // Gêneros/habilidades dos chips vêm do que existe de fato nos dados —
  // evita filtro morto (valor que não bate com nenhuma série) ou faltante
  // (gênero novo cadastrado que nunca apareceria no filtro).
  const generosDisponiveis = useMemo(
    () => Array.from(new Set(seriesList.map((s) => s.genre).filter((g): g is string => !!g))).sort(),
    [seriesList],
  );
  const habilidadesDisponiveis = useMemo(
    () => Array.from(new Set(seriesList.flatMap((s) => s.skills ?? []))).sort(),
    [seriesList],
  );

  const isItemUnlocked = (item: SeriesSummary) => statusById[item.id] === "unlocked";

  const destaques = seriesList.filter((s) => s.featured && isItemUnlocked(s));
  const itens = seriesList.filter((item) => {
    const label = LEVEL_DB_TO_LABEL[item.level];
    if (nivel && label !== nivel) return false;
    if (genero && item.genre !== genero) return false;
    if (habilidade && !(item.skills ?? []).includes(habilidade)) return false;
    if (busca && !item.title.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 px-5 pt-6">
        {/* header */}
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-cinema-text">Explorar</h1>
          <div className="flex items-center gap-3">
            {isAdmin && <AdminAccessPreviewToggle adminPreview={adminPreview} />}
            <span className="font-body text-xs font-bold text-cinema-muted">{seriesList.length} conteúdos</span>
          </div>
        </div>

        <div className="mt-4">
          <AdminAccessPreviewHint adminPreview={adminPreview} />
          {isGuest ? <GuestBanner /> : <TrialBanner trialActive={trialActive} bypass={bypass} daysLeft={trialDaysLeft} />}
        </div>

        {/* progressão por nível */}
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

        {/* busca */}
        <div className="mt-4 flex items-center gap-2">
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

        {/* filtros */}
        <div className="mt-5 space-y-3.5">
          <FilterRow label="Nível">
            {(Object.keys(LEVEL_STYLES) as Nivel[]).map((l) => (
              <LevelChip
                key={l}
                nivel={l}
                active={nivel === l}
                unlocked={unlocked[l]}
                onClick={() => setNivel(nivel === l ? null : l)}
              />
            ))}
          </FilterRow>

          {generosDisponiveis.length > 0 && (
            <FilterRow label="Gênero">
              {generosDisponiveis.map((g) => (
                <ChipFilter key={g} label={g} selected={genero === g} onSelect={() => setGenero(genero === g ? null : g)} />
              ))}
            </FilterRow>
          )}

          {habilidadesDisponiveis.length > 0 && (
            <FilterRow label="Habilidade">
              {habilidadesDisponiveis.map((s) => (
                <ChipFilter
                  key={s}
                  label={s}
                  selected={habilidade === s}
                  onSelect={() => setHabilidade(habilidade === s ? null : s)}
                />
              ))}
            </FilterRow>
          )}
        </div>

        {loading ? (
          <p className="mt-10 text-center font-body text-[13px] text-cinema-muted">Carregando…</p>
        ) : error ? (
          <p className="mt-10 text-center font-body text-[13px] text-cinema-muted">{error}</p>
        ) : (
          <>
            {/* em destaque */}
            {destaques.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-bold text-cinema-text">Em destaque</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {destaques.map((item) => (
                    <FeaturedCard key={item.id} item={item} onClick={() => router.push(`/series/${item.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* grade */}
            <div className="mb-7 mt-8">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-bold text-cinema-text">Todos os conteúdos</h2>
                <span className="font-body text-xs font-bold text-cinema-muted">
                  {itens.length} {itens.length === 1 ? "resultado" : "resultados"}
                </span>
              </div>
              {itens.length === 0 ? (
                <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Nenhum conteúdo encontrado.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {itens.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      status={statusById[item.id] ?? "locked-premium"}
                      onClick={() => router.push(`/series/${item.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-body text-[10px] font-black uppercase tracking-[0.15em] text-cinema-muted">{label}</div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
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
      {nivel}
    </button>
  );
}

function FeaturedCard({ item, onClick }: { item: SeriesSummary; onClick: () => void }) {
  const style = levelStyle(LEVEL_DB_TO_LABEL[item.level]);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-56 w-72 shrink-0 flex-col justify-end overflow-hidden rounded-3xl p-4 text-left transition-transform hover:scale-[1.02]"
      style={{ boxShadow: `0 20px 50px -20px ${style.glow}` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${style.cardGradient}`} />
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-black/30 blur-2xl" />

      <div className="absolute left-4 top-4">
        <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
          {style.label}
        </span>
      </div>

      <div className="relative">
        <h3 className="mb-1 font-display text-xl font-bold leading-tight text-white">{item.title}</h3>
        <p className="mb-3 font-body text-xs font-semibold text-white/85">
          {item.genre ?? "Série"} · {item.episodesCount} {item.episodesCount === 1 ? "episódio" : "episódios"}
        </p>
        <div className="flex h-9 w-fit items-center gap-1.5 rounded-full bg-white px-3 transition-transform group-hover:scale-105">
          <Play className="h-3 w-3 fill-neutral-900 text-neutral-900" />
          <span className="font-body text-xs font-black uppercase tracking-wider text-neutral-900">Assistir</span>
        </div>
      </div>
    </button>
  );
}

function ContentCard({
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
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl text-left transition-transform enabled:hover:scale-[1.03] disabled:cursor-not-allowed"
      style={{ boxShadow: isUnlocked ? `0 12px 30px -12px ${style.glow}` : "none" }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${style.cardGradient}`}
        style={{ filter: isUnlocked ? undefined : "grayscale(0.7) brightness(0.75)" }}
      />
      {isUnlocked && <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-5xl transition-transform group-enabled:group-hover:scale-110"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", opacity: isUnlocked ? 1 : 0.5 }}
        >
          {item.emoji}
        </div>
      </div>

      <div className="absolute left-2 top-2">
        <span className="rounded-full border border-white/15 bg-black/40 px-1.5 py-0.5 font-body text-[9px] font-black uppercase text-white backdrop-blur-sm">
          {style.label}
        </span>
      </div>

      <AccessLockBadge status={status} />

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="font-display text-sm font-bold leading-tight text-white">{item.title}</h3>
        <AccessLockCaption status={status} />
      </div>
    </button>
  );
}
