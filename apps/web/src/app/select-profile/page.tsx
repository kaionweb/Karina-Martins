"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Plus, Settings, X } from "lucide-react";
import type { ProfileSummary } from "@ipp/shared";
import { createChildProfile, listProfiles } from "@/lib/api/profiles";
import { selectProfile } from "@/lib/auth";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useProfileStore } from "@/stores/useProfileStore";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { avatarForProfile, useAvatarPhoto } from "@/lib/ui/profileAvatar";

const AGE_RANGES = ["2-4", "4-6", "6-8", "8-10", "10-12"];

export default function SelectProfilePage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      try {
        const data = await listProfiles();
        setProfiles(data);
      } catch {
        setError("Não foi possível carregar os perfis da conta.");
      }
    }

    load();
  }, [ready]);

  async function handleSelect(profile: ProfileSummary) {
    setSelectingId(profile.id);
    try {
      await selectProfile(profile.id);
      setActiveProfile(profile);
      router.push("/home");
    } catch {
      setError("Não foi possível selecionar este perfil.");
      setSelectingId(null);
    }
  }

  function handleCreated(newProfile: ProfileSummary) {
    setProfiles((current) => [...(current ?? []), newProfile]);
    setShowForm(false);
  }

  if (!ready) {
    return null;
  }

  const hasChildProfile = profiles?.some((p) => p.type === "CHILD") ?? false;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-cinema-bg p-6 font-body text-cinema-text">
      <BrandGlow />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <div className="mb-12 animate-fade-in-up-lg text-center" style={{ animationDelay: "0.05s" }}>
          <div className="mb-6 inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="Colégio Karina Martins" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="mb-3 font-display text-4xl font-bold text-cinema-text md:text-6xl">Quem vai brincar hoje?</h1>
          <p className="font-body text-base text-cinema-muted md:text-lg">Escolha seu perfil pra continuar a aventura</p>
        </div>

        {error ? (
          <div className="mb-8 rounded-xl border border-[#DA233B]/30 bg-[#DA233B]/10 px-4 py-3 font-body text-sm font-semibold text-[#DA233B]">
            {error}
          </div>
        ) : null}

        {!profiles && !error ? (
          <div className="flex items-center gap-2 text-cinema-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-body text-sm">Carregando perfis…</span>
          </div>
        ) : profiles ? (
          <div className="grid w-full max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {profiles.map((profile, i) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                index={i}
                isSelecting={selectingId === profile.id}
                disabled={selectingId !== null}
                onSelect={() => handleSelect(profile)}
              />
            ))}
            <AddProfileCard index={profiles.length} highlight={!hasChildProfile} onClick={() => setShowForm(true)} />
          </div>
        ) : null}

        <button
          type="button"
          className="mt-14 flex animate-fade-in-up-lg items-center gap-2 font-body text-sm font-semibold text-cinema-muted transition-colors hover:text-cinema-text"
          style={{ animationDelay: "0.8s" }}
        >
          <Settings className="h-4 w-4" />
          Gerenciar perfis
        </button>
      </div>

      {showForm ? <AddProfileModal onClose={() => setShowForm(false)} onCreated={handleCreated} /> : null}
    </div>
  );
}

function ProfileCard({
  profile,
  index,
  isSelecting,
  disabled,
  onSelect,
}: {
  profile: ProfileSummary;
  index: number;
  isSelecting: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const isGuardian = profile.type === "ADULT";
  const avatar = avatarForProfile(profile.id);
  const gradient = isGuardian ? "from-slate-500 to-slate-700" : avatar.gradient;
  const { hasPhoto, onError: onPhotoError } = useAvatarPhoto(isGuardian ? profile.avatarUrl : null);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="group relative flex animate-fade-in-up-lg flex-col items-center gap-4 focus:outline-none disabled:opacity-50"
      style={{ animationDelay: `${0.15 + index * 0.1}s` }}
    >
      <div
        className={`pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-b ${gradient} opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-40`}
      />

      <div className="relative">
        <div
          className={`relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br shadow-cinema-elevated ring-4 ring-black/5 transition-all duration-300 md:h-36 md:w-36 ${gradient} group-hover:scale-110 group-hover:ring-black/10`}
        >
          {isSelecting ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl ?? undefined} alt={profile.nickname} className="h-full w-full object-cover" onError={onPhotoError} />
          ) : isGuardian ? (
            <span className="font-display text-4xl font-bold text-white/95 md:text-5xl">
              {profile.nickname.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className="text-5xl transition-transform group-hover:animate-wave md:text-7xl">{avatar.emoji}</span>
          )}
        </div>

        {isGuardian ? (
          <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-cinema-bg bg-cinema-amber shadow-lg transition-transform group-hover:rotate-12">
            <Crown className="h-4 w-4 text-[#B8860B]" strokeWidth={2.5} />
          </div>
        ) : null}
      </div>

      <div className="text-center">
        <div className="mb-1 font-display text-lg font-semibold text-cinema-text md:text-xl">{profile.nickname}</div>
        <div className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-cinema-muted">
          {isGuardian ? "Responsável" : profile.ageRange ? `${profile.ageRange} anos` : "Criança"}
        </div>
      </div>
    </button>
  );
}

function AddProfileCard({ index, highlight, onClick }: { index: number; highlight: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex animate-fade-in-up-lg flex-col items-center gap-4 focus:outline-none"
      style={{ animationDelay: `${0.15 + index * 0.1}s` }}
    >
      <div className="relative">
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed transition-all duration-300 group-hover:scale-110 md:h-36 md:w-36 ${
            highlight
              ? "animate-pulse-ring border-[#DA233B]/70 bg-[#DA233B]/10 group-hover:border-[#DA233B] group-hover:bg-[#DA233B]/20"
              : "border-[#D5DCE6] group-hover:border-cinema-primary/50 group-hover:bg-cinema-primary/5"
          }`}
        >
          <Plus
            className={`h-10 w-10 transition-all md:h-14 md:w-14 ${
              highlight ? "text-[#DA233B] group-hover:text-[#DA233B]/80" : "text-cinema-muted group-hover:text-cinema-primary"
            }`}
            strokeWidth={2.5}
          />
        </div>

        {highlight ? (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-[#DA233B] px-3 py-0.5 font-body text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-lg">
            Novo
          </div>
        ) : null}
      </div>

      <div className="text-center">
        <div className="mb-1 font-display text-lg font-semibold text-cinema-text md:text-xl">
          {highlight ? "Novo aventureiro" : "Adicionar perfil"}
        </div>
        <div className={`font-body text-[11px] font-bold uppercase tracking-[0.12em] ${highlight ? "text-[#DA233B]/85" : "text-cinema-muted"}`}>
          {highlight ? "Comece a aventura" : "Criar perfil"}
        </div>
      </div>
    </button>
  );
}

function AddProfileModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (profile: ProfileSummary) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [ageRange, setAgeRange] = useState(AGE_RANGES[0]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const nicknameId = useId();
  const ageRangeId = useId();

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const newProfile = await createChildProfile(nickname, ageRange);
      onCreated(newProfile);
    } catch {
      setCreateError("Não foi possível adicionar o perfil.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-cinema-border bg-cinema-surface p-6 shadow-cinema-elevated sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-cinema-muted transition-colors hover:bg-cinema-surface-alt hover:text-cinema-text"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-1 font-display text-xl font-bold text-cinema-text">Novo aventureiro</h2>
        <p className="mb-6 font-body text-sm text-cinema-muted">Crie o perfil da criança pra começar a jornada</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor={nicknameId} className="mb-1.5 block font-body text-xs font-bold uppercase tracking-wider text-cinema-muted">
              Apelido
            </label>
            <input
              id={nicknameId}
              type="text"
              required
              maxLength={60}
              placeholder="Como a criança gosta de ser chamada"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-11 w-full rounded-xl border border-cinema-border bg-cinema-surface-alt px-3 font-body text-sm font-semibold text-cinema-text placeholder-cinema-muted/60 outline-none transition-colors focus:border-cinema-primary/50 focus:bg-cinema-surface"
            />
          </div>

          <div>
            <label htmlFor={ageRangeId} className="mb-1.5 block font-body text-xs font-bold uppercase tracking-wider text-cinema-muted">
              Faixa etária
            </label>
            <select
              id={ageRangeId}
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="h-11 w-full rounded-xl border border-cinema-border bg-cinema-surface-alt px-3 font-body text-sm font-semibold text-cinema-text outline-none transition-colors focus:border-cinema-primary/50 focus:bg-cinema-surface"
            >
              {AGE_RANGES.map((range) => (
                <option key={range} value={range} className="bg-cinema-surface">
                  {range} anos
                </option>
              ))}
            </select>
          </div>

          {createError ? <p className="font-body text-xs font-semibold text-[#DA233B]">{createError}</p> : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-cinema-lg border border-cinema-border bg-cinema-surface-alt px-5 py-3 font-display text-sm font-semibold text-cinema-text transition-colors hover:border-cinema-primary/30 hover:bg-cinema-primary/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 rounded-cinema-lg bg-gradient-to-r from-cinema-primary to-cinema-primary-alt px-5 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
            >
              {creating ? "Adicionando…" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
