import { Crown, Lock } from "lucide-react";
import type { AccessStatus } from "@ipp/shared";

// Dois cadeados visualmente diferentes: cinza (trava de progresso — falta
// completar o nível anterior) e coroa dourada (trava premium — trial acabou
// e o item não é grátis-permanente nem tem progresso iniciado).
export function AccessLockBadge({ status }: { status: AccessStatus }) {
  if (status === "unlocked") return null;

  if (status === "locked-progress") {
    return (
      <div
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-sm"
        title="Complete o nível anterior pra desbloquear"
      >
        <Lock className="h-3 w-3 text-white" />
      </div>
    );
  }

  return (
    <div
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full"
      style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", boxShadow: "0 4px 12px -2px rgba(217,119,6,0.6)" }}
      title="Disponível no Premium"
    >
      <Crown className="h-3.5 w-3.5 text-white" />
    </div>
  );
}

export function AccessLockCaption({ status }: { status: AccessStatus }) {
  if (status === "locked-progress") {
    return <span className="font-body text-[10px] font-bold text-white/60">Complete o nível anterior</span>;
  }
  if (status === "locked-premium") {
    return <span className="font-body text-[10px] font-bold text-amber-300">Assine o Premium</span>;
  }
  return null;
}
