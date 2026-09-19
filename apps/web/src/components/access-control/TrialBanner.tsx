import { Sparkles } from "lucide-react";

// Só aparece com trial ativo E fora do bypass (admin com "acesso total" não
// precisa ver isso; em modo comparação o banner reflete o perfil simulado).
export function TrialBanner({ trialActive, bypass, daysLeft }: { trialActive: boolean; bypass: boolean; daysLeft: number }) {
  if (!trialActive || bypass) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-orange-500/5 p-4">
      <Sparkles className="h-5 w-5 flex-shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-amber-700">Trial gratuito ativo — tudo liberado!</p>
        <p className="font-body text-xs text-amber-600">
          {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"}` : "Último dia"} pra explorar todo o
          catálogo
        </p>
      </div>
    </div>
  );
}
