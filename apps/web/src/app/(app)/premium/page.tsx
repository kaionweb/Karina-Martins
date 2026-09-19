"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Check, Crown, Gamepad2, Mic, Sparkles, Tv } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { premiumBeneficios, premiumPlanos } from "../_mock/content";

const BENEFICIO_ICONS = [Tv, Bot, Mic, Gamepad2];

export default function PremiumPage() {
  const router = useRouter();
  const [planoSelecionado, setPlanoSelecionado] = useState("yearly");

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 flex items-center justify-between border-b border-[#E5EAF2] px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5EAF2] bg-white"
        >
          <ArrowLeft className="h-4 w-4 text-cinema-text" />
        </button>
        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12">
        <div className="mt-4 flex flex-col items-center text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)", boxShadow: "0 10px 40px -10px rgba(45,101,174,0.5)" }}
          >
            <Crown className="h-9 w-9 text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-cinema-text">Desbloqueie tudo com o Premium</h1>
          <p className="mt-2 font-body text-sm text-cinema-muted">Mais conteúdo, mais prática, sem limites pro seu filho</p>
        </div>

        <div className="mt-8 space-y-3">
          {premiumBeneficios.map((beneficio, index) => {
            const Icon = BENEFICIO_ICONS[index];
            return (
              <div
                key={beneficio.titulo}
                className="flex items-center gap-3 rounded-2xl border border-[#E5EAF2] bg-white p-3.5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#2D65AE]/25 bg-[#2D65AE]/10">
                  <Icon className="h-4 w-4 text-[#2D65AE]" />
                </div>
                <div>
                  <div className="font-display text-sm font-semibold text-cinema-text">{beneficio.titulo}</div>
                  <div className="font-body text-xs text-cinema-muted">{beneficio.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 space-y-3">
          {premiumPlanos.map((plano) => {
            const selecionado = planoSelecionado === plano.id;
            return (
              <button
                key={plano.id}
                type="button"
                onClick={() => setPlanoSelecionado(plano.id)}
                className="flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all"
                style={{
                  backgroundColor: selecionado ? "rgba(251,198,7,0.15)" : "#FFFFFF",
                  border: selecionado ? "2px solid rgba(251,198,7,0.7)" : "1px solid #E5EAF2",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: selecionado ? "#FBC607" : "transparent",
                      border: selecionado ? "none" : "2px solid #D5DCE6",
                    }}
                  >
                    {selecionado ? <Check className="h-3 w-3" style={{ color: "#B8860B" }} strokeWidth={3.5} /> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-cinema-text">{plano.label}</span>
                    {plano.badge ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 font-body text-[9px] font-black uppercase tracking-wider text-green-600">
                        {plano.badge}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-base font-bold text-cinema-text">{plano.preco}</span>
                  <span className="font-body text-xs text-cinema-muted">{plano.periodo}</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)", boxShadow: "0 12px 32px -10px rgba(45,101,174,0.5)" }}
        >
          <Sparkles className="h-4 w-4" />
          Assinar Premium
        </button>

        <p className="mt-3 text-center font-body text-[11px] font-semibold text-cinema-muted">
          Cancele quando quiser · Sem taxas escondidas
        </p>
      </div>
    </div>
  );
}
