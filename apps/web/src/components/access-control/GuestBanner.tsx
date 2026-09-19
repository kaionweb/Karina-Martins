import Link from "next/link";
import { UserPlus } from "lucide-react";

// Lembrete persistente de conversão pra visitante navegando sem conta
// (Parte 2, modo visitante) — mesmo espírito visual do TrialBanner, mas sem
// concorrer com ele (um visitante nunca tem trial ativo pra mostrar).
export function GuestBanner() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-cinema-primary/25 bg-cinema-primary/5 p-4">
      <UserPlus className="h-5 w-5 flex-shrink-0 text-cinema-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-cinema-text">Você está navegando sem conta</p>
        <p className="font-body text-xs text-cinema-muted">Crie uma conta grátis pra desbloquear todo o catálogo e salvar seu progresso</p>
      </div>
      <Link
        href="/register"
        className="flex-shrink-0 rounded-full bg-cinema-primary px-3 py-1.5 font-body text-xs font-bold text-white"
      >
        Criar conta
      </Link>
    </div>
  );
}
