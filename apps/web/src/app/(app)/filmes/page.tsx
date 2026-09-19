"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Film, Play, Search, SlidersHorizontal } from "lucide-react";
import type { FilmeLevel, FilmeSummary } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { formatDuration } from "@/components/videos/VideoCard";
import { LEVEL_STYLES, levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { listFilmes } from "@/lib/api/filmes";

const LEVEL_DB_TO_LABEL: Record<FilmeLevel, Nivel> = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

export default function FilmesPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [nivel, setNivel] = useState<Nivel | null>(null);

  const [filmes, setFilmes] = useState<FilmeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    listFilmes()
      .then((res) => {
        if (ativo) setFilmes(res);
      })
      .catch(() => {
        if (ativo) setErro(true);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const itens = filmes.filter((item) => {
    if (nivel && LEVEL_DB_TO_LABEL[item.level] !== nivel) return false;
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
          <div className="mb-1 flex items-center gap-2">
            <Film className="h-5 w-5" style={{ color: "#DA233B" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Filmes</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Histórias completas pra imersão em inglês</p>
            <span className="mt-1 flex-shrink-0 rounded-full border border-cinema-border bg-cinema-surface-alt px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {filmes.length} filmes
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div
            className={`flex flex-1 items-center rounded-2xl border transition-all ${
              buscaFocada ? "bg-white shadow-[0_0_0_4px_rgba(218,35,59,0.1)]" : "border-cinema-border bg-cinema-surface-alt"
            }`}
            style={buscaFocada ? { borderColor: "rgba(218,35,59,0.4)" } : undefined}
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center" style={{ color: buscaFocada ? "#DA233B" : "#5C6B7D" }}>
              <Search className="h-4 w-4" />
            </div>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setBuscaFocada(true)}
              onBlur={() => setBuscaFocada(false)}
              placeholder="Buscar filmes…"
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
            <LevelChip key={l} nivel={l} active={nivel === l} onClick={() => setNivel(nivel === l ? null : l)} />
          ))}
        </div>

        <div className="mb-7 mt-6">
          {loading ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Carregando filmes…</p>
          ) : erro ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">
              Não foi possível carregar os filmes. Tente novamente.
            </p>
          ) : itens.length === 0 ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Nenhum filme encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {itens.map((item) => (
                <MovieCard key={item.id} item={item} onOpen={() => router.push(`/filmes/${item.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelChip({ nivel, active, onClick }: { nivel: Nivel; active: boolean; onClick: () => void }) {
  const style = LEVEL_STYLES[nivel];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-full border px-3.5 py-1.5 font-body text-xs font-bold transition-all"
      style={
        active
          ? { background: style.chipBg, color: "#ffffff", boxShadow: `0 4px 16px -4px ${style.glow}`, borderColor: "rgba(255,255,255,0.2)" }
          : { backgroundColor: "#EEF3F9", borderColor: "#E5EAF2", color: "#5C6B7D" }
      }
    >
      {style.label}
    </button>
  );
}

function MovieCard({ item, onOpen }: { item: FilmeSummary; onOpen: () => void }) {
  const style = levelStyle(LEVEL_DB_TO_LABEL[item.level]);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex aspect-[2/3] w-full flex-col justify-end overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.03]"
      style={{ boxShadow: `0 12px 30px -12px ${style.glow}` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${style.cardGradient}`} />
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl transition-transform group-hover:scale-110" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}>
          {item.emoji}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/20 group-hover:opacity-100">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white" style={{ boxShadow: "0 8px 20px -4px rgba(0,0,0,0.5)" }}>
          <Play className="ml-0.5 h-4 w-4 fill-current text-neutral-900" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />

      <div className="absolute left-2 top-2">
        <span className="rounded-full border border-white/15 bg-black/40 px-1.5 py-0.5 font-body text-[9px] font-black uppercase text-white backdrop-blur-sm">
          {style.label}
        </span>
      </div>

      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-sm">
        <span className="font-body text-[9px] font-black text-white">{item.ageRange}</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="mb-0.5 font-display text-sm font-bold leading-tight text-white">{item.title}</h3>
        <div className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5 text-white/70" />
          <span className="font-body text-[10px] font-bold text-white/70">{formatDuration(item.durationSeconds)}</span>
        </div>
      </div>
    </button>
  );
}
