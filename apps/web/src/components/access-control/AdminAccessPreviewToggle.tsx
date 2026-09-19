"use client";

import { Eye, ShieldCheck } from "lucide-react";
import type { AdminAccessPreview } from "@/lib/admin/useAdminAccessPreview";

// Seletor de comparação do admin: em vez de um profile de teste fixo, um
// dropdown com os perfis reais da plataforma. Sem seleção = bypass total
// (admin vê tudo liberado); com um perfil selecionado = a tela passa a
// mostrar exatamente o que aquele perfil vê (GET /admin/access-preview,
// sempre bypass=false no server).
export function AdminAccessPreviewToggle({ adminPreview }: { adminPreview: AdminAccessPreview<unknown> }) {
  const { profiles, previewProfileId, setPreviewProfileId, bypass } = adminPreview;

  return (
    <div className="flex flex-shrink-0 items-center gap-1.5">
      {bypass ? (
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Eye className="h-3.5 w-3.5 text-blue-500" />
      )}
      <select
        value={previewProfileId ?? ""}
        onChange={(event) => setPreviewProfileId(event.target.value || null)}
        className="max-w-[220px] truncate rounded-full border px-2.5 py-1.5 font-body text-[11px] font-bold outline-none"
        style={
          bypass
            ? { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", color: "#16a34a" }
            : { backgroundColor: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.3)", color: "#2563eb" }
        }
      >
        <option value="">Acesso admin (tudo liberado)</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            Ver como: {profile.nickname} · {profile.familyEmail}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminAccessPreviewHint({ adminPreview }: { adminPreview: AdminAccessPreview<unknown> }) {
  if (!adminPreview.previewProfileId) return null;

  return (
    <div className="mb-3 rounded-xl border border-dashed border-blue-400/40 bg-blue-500/5 px-3 py-2">
      <p className="font-body text-[11px] font-semibold text-blue-600">
        🔍 Modo comparação: esta tela mostra exatamente o que este perfil veria — respeitando trial, progresso e itens
        premium.
      </p>
    </div>
  );
}
