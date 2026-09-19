"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Lock, MessageCircle, Search, Users } from "lucide-react";
import { isTrialActive, trialDaysRemaining } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { AccessLockBadge, AccessLockCaption } from "@/components/access-control/AccessLock";
import { TrialBanner } from "@/components/access-control/TrialBanner";
import { LEVEL_STYLES, levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { checkIsAdmin } from "@/lib/api/admin";
import { useProfileStore } from "@/stores/useProfileStore";
import { conversacaoMock, type MockCenario } from "../_mock/content";

// Catálogo 100% mock (sem backend — ver comentário em _mock/content.ts): a
// trava aqui é só visual, calculada no client. Básico sempre livre;
// Intermediário/Avançado ficam com coroa fora do trial (sem noção de
// "progresso" aqui, só nível — diferente de Séries).
function isNivelUnlocked(nivel: Nivel, trialActive: boolean, bypass: boolean): boolean {
  return bypass || trialActive || nivel === "Básico";
}

export default function ConversacaoPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isAdult = activeProfile?.type === "ADULT";
  const [isAdmin, setIsAdmin] = useState(false);

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

  const trialActive = isTrialActive(activeProfile?.trialStartedAt);
  const bypass = isAdmin;

  const itens = conversacaoMock.filter((item) => {
    if (nivel && item.nivel !== nivel) return false;
    if (busca && !item.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface"
        >
          <ArrowLeft className="h-4 w-4 text-cinema-muted" />
        </button>
        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="pt-5">
          <div className="mb-1 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" style={{ color: "#4799C1" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Conversação</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Cenários do dia a dia pra praticar com a tutora</p>
            <span className="mt-1 flex-shrink-0 rounded-full border border-cinema-border bg-cinema-surface-alt px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {conversacaoMock.length} cenários
            </span>
          </div>
        </div>

        <div className="mt-4">
          <TrialBanner trialActive={trialActive} bypass={bypass} daysLeft={trialDaysRemaining(activeProfile?.trialStartedAt)} />
        </div>

        <div className="mt-5 flex items-center rounded-2xl border border-cinema-border bg-cinema-surface">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-cinema-muted">
            <Search className="h-4 w-4" />
          </div>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cenário…"
            className="h-11 flex-1 bg-transparent pr-3 font-body text-sm font-semibold text-cinema-text placeholder:text-cinema-muted outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(Object.keys(LEVEL_STYLES) as Nivel[]).map((l) => (
            <LevelChip
              key={l}
              nivel={l}
              active={nivel === l}
              unlocked={isNivelUnlocked(l, trialActive, bypass)}
              onClick={() => setNivel(nivel === l ? null : l)}
            />
          ))}
        </div>

        <div className="mb-7 mt-6">
          {itens.length === 0 ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Nenhum cenário encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((item) => {
                const unlocked = isNivelUnlocked(item.nivel as Nivel, trialActive, bypass);
                return (
                  <ScenarioCard
                    key={item.id}
                    item={item}
                    unlocked={unlocked}
                    onClick={() => {
                      if (!unlocked) return;
                      router.push(`/ia?scenario=${encodeURIComponent(item.titulo)}`);
                    }}
                  />
                );
              })}
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
          ? { background: style.chipBg, color: "#ffffff", boxShadow: `0 4px 16px -4px ${style.glow}`, borderColor: "rgba(255,255,255,0.4)" }
          : { backgroundColor: "rgb(var(--cinema-surface-alt))", borderColor: "rgb(var(--cinema-border))", color: "rgb(var(--cinema-muted))" }
      }
    >
      {!unlocked && <Lock className="h-2.5 w-2.5" />}
      {style.label}
    </button>
  );
}

function ScenarioCard({ item, unlocked, onClick }: { item: MockCenario; unlocked: boolean; onClick: () => void }) {
  const style = levelStyle(item.nivel);
  return (
    <button
      type="button"
      disabled={!unlocked}
      onClick={onClick}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface p-4 text-left transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      style={{ boxShadow: unlocked ? `0 8px 24px -12px ${style.glow}` : "none" }}
    >
      <div
        className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.cardGradient}`}
        style={{ filter: unlocked ? undefined : "grayscale(0.7) brightness(0.85)" }}
      >
        <span className="text-2xl">{item.emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-sm font-bold text-cinema-text">{item.titulo}</h3>
          <span className="flex-shrink-0 rounded-full bg-cinema-surface-alt px-1.5 py-0.5 font-body text-[9px] font-black uppercase text-cinema-muted">
            {item.faixaEtaria}
          </span>
        </div>
        {unlocked ? (
          <div className="mt-1 flex items-center gap-1.5">
            <Users className="h-3 w-3 text-cinema-muted" />
            <span className="font-body text-[11px] font-bold text-cinema-muted">{item.frases} frases pra praticar</span>
          </div>
        ) : (
          <div className="mt-1">
            <AccessLockCaption status="locked-premium" />
          </div>
        )}
      </div>
      {unlocked ? (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-cinema-muted transition-transform group-hover:translate-x-1" />
      ) : (
        <AccessLockBadge status="locked-premium" />
      )}
    </button>
  );
}
