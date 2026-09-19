"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, BookOpen, Check, Flame, LogOut, MessageCircle, Pencil, Play, Rocket, Settings, Star, Trophy, X } from "lucide-react";
import { ProgressBar } from "@ipp/ui";
import { deriveLevel, LEVEL_XP_STEP, type Badge } from "@ipp/shared";
import { logout } from "@/lib/auth";
import { useProfileStore } from "@/stores/useProfileStore";
import { getBadges, getXpTotal } from "@/lib/api/gamification";
import { getMyJourney, type JourneyTrackSummary } from "@/lib/api/journey";
import { updateProfileAvatar } from "@/lib/api/profiles";
import { checkIsAdmin } from "@/lib/api/admin";
import { avatarForProfile, useAvatarPhoto } from "@/lib/ui/profileAvatar";
import { gradientForIndex } from "@/lib/ui/posterGradients";
import { BrandGlow } from "@/components/decorative/brand-glow";

// Espelha os badges reais definidos em apps/api/.../gamification.service.ts —
// não existe endpoint de catálogo completo (só o de badges já conquistadas),
// então replicamos os mesmos 2 códigos aqui pra saber o que ainda falta
// desbloquear. Nada de inventar conquista que a API nunca vai conceder.
const BADGE_CATALOG: { code: string; title: string; icon: typeof Star }[] = [
  { code: "FIRST_LESSON", title: "Primeira Lição", icon: Star },
  { code: "STREAK_3", title: "Sequência de 3 dias", icon: Flame },
];

export default function PerfilPage() {
  const router = useRouter();
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
  const clearActiveProfile = useProfileStore((state) => state.clearActiveProfile);

  const nickname = activeProfile?.nickname ?? "";
  const streak = activeProfile?.currentStreak ?? 0;
  const isAdult = activeProfile?.type === "ADULT";
  const avatar = activeProfile && activeProfile.type === "CHILD" ? avatarForProfile(activeProfile.id) : null;

  const [xpTotal, setXpTotal] = useState<number | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [gamiLoading, setGamiLoading] = useState(true);

  const [journey, setJourney] = useState<JourneyTrackSummary[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(true);

  // Foto de perfil — só ADULT (CLAUDE.md: perfis CHILD não coletam foto).
  // Sem upload real: o campo guarda uma URL de imagem já hospedada em outro lugar.
  const { hasPhoto, onError: onPhotoError } = useAvatarPhoto(isAdult ? activeProfile?.avatarUrl : null);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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

  useEffect(() => {
    let ativo = true;
    setGamiLoading(true);

    Promise.all([getXpTotal(), getBadges()])
      .then(([xp, badgesRes]) => {
        if (!ativo) return;
        setXpTotal(xp.total);
        setBadges(badgesRes);
      })
      .catch(() => {
        /* seção de XP/conquistas fica em estado neutro; não bloqueia o resto da tela */
      })
      .finally(() => {
        if (ativo) setGamiLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    setJourneyLoading(true);

    getMyJourney()
      .then((res) => {
        if (ativo) setJourney(res);
      })
      .catch(() => {
        /* jornada é progressive enhancement; falha aqui não impede ver o resto do perfil */
      })
      .finally(() => {
        if (ativo) setJourneyLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function handleLogout() {
    await logout();
    clearActiveProfile();
    router.push("/login");
  }

  function openAvatarSheet() {
    setAvatarUrlInput(activeProfile?.avatarUrl ?? "");
    setAvatarError(null);
    setAvatarSheetOpen(true);
  }

  async function handleSaveAvatar(nextUrl: string | null) {
    if (!activeProfile) return;
    setAvatarSaving(true);
    setAvatarError(null);

    try {
      const updated = await updateProfileAvatar(activeProfile.id, nextUrl);
      setActiveProfile(updated);
      setAvatarSheetOpen(false);
    } catch {
      setAvatarError("Não foi possível salvar a foto. Confira o link e tente de novo.");
    } finally {
      setAvatarSaving(false);
    }
  }

  const levelInfo = deriveLevel(xpTotal ?? 0);
  const xpIntoLevel = (xpTotal ?? 0) % LEVEL_XP_STEP;

  const earnedCodes = new Set(badges.map((b) => b.code));
  const completedTracks = journey.filter((t) => t.status === "completed").length;

  // Cartão "sua tutora diz": só aparece com dado real por trás — a trilha com
  // mais lições concluídas — nunca um texto fixo desconectado do progresso.
  const highlightedTrack = [...journey].sort((a, b) => b.completedLessons - a.completedLessons)[0];
  const showTeacherMessage = !journeyLoading && highlightedTrack && highlightedTrack.completedLessons > 0;

  return (
    <div className="relative overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 px-5 pt-6 pb-8">
        <h1 className="font-display text-xl font-bold text-cinema-text">Perfil</h1>

        {/* cartão de identidade */}
        <div className="mt-4">
          <div
            className="relative overflow-hidden rounded-3xl border border-[#E5EAF2] bg-white p-6 text-center"
          >
            <div
              className={`pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-b opacity-20 blur-3xl ${avatar ? avatar.gradient : "from-cinema-amber to-cinema-primary"}`}
            />

            <div className="relative">
              <div className="relative mx-auto w-fit">
                <div
                  className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br shadow-2xl ring-4 ring-[#F7F9FC] ${avatar ? avatar.gradient : "from-cinema-amber to-cinema-primary"}`}
                >
                  {hasPhoto ? (
                    // <img> puro, não next/image: a URL é arbitrária (o usuário cola
                    // qualquer host), e o next.config.ts só permite o domínio fixo
                    // do YouTube — allowlistar host livre abriria mão dessa restrição.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeProfile?.avatarUrl ?? undefined}
                      alt={nickname}
                      className="h-full w-full object-cover"
                      onError={onPhotoError}
                    />
                  ) : avatar ? (
                    <span className="text-5xl">{avatar.emoji}</span>
                  ) : (
                    <span className="font-display text-3xl font-bold text-white">{nickname.charAt(0).toUpperCase() || "?"}</span>
                  )}
                </div>

                {isAdult ? (
                  <button
                    type="button"
                    onClick={openAvatarSheet}
                    aria-label="Editar foto de perfil"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110"
                  >
                    <Pencil className="h-3.5 w-3.5 text-cinema-primary" strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>

              <h2 className="mt-4 font-display text-2xl font-bold text-cinema-text">{nickname}</h2>

              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-cinema-amber" fill="currentColor" />
                <span className="font-display text-sm font-semibold text-cinema-amber">
                  Nível {gamiLoading ? "…" : levelInfo.level}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "text-cinema-primary-alt" : "text-cinema-muted"}`} />
                <span className="font-body text-xs font-bold text-cinema-muted">
                  {streak > 0 ? `${streak} dias seguidos` : "Comece sua sequência hoje"}
                </span>
              </div>

              <div className="mt-5 text-left">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">Progresso</span>
                  <span className="font-body text-[10px] font-black text-cinema-text">
                    {gamiLoading ? "…" : xpIntoLevel} / {LEVEL_XP_STEP} XP
                  </span>
                </div>
                <ProgressBar value={gamiLoading ? 0 : levelInfo.progressPercent} />
              </div>
            </div>
          </div>
        </div>

        {/* sua tutora diz */}
        {showTeacherMessage ? (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, rgba(218,35,59,0.08), rgba(251,198,7,0.1))", border: "1px solid rgba(218,35,59,0.2)" }}
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607]"
              style={{ boxShadow: "0 4px 16px -4px rgba(218,35,59,0.5)" }}
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 font-body text-[10px] font-black uppercase tracking-wider text-[#DA233B]">
                Sua jornada até aqui
              </div>
              <p className="font-body text-xs leading-relaxed text-cinema-text/75">
                Você já completou {highlightedTrack.completedLessons} de {highlightedTrack.totalLessons} lições em{" "}
                <strong>{highlightedTrack.title}</strong>! Continue nessa jornada.
              </p>
            </div>
          </div>
        ) : null}

        {/* sua jornada */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cinema-text">Sua jornada</h2>
            <div className="flex items-center gap-1">
              <Rocket className="h-3 w-3 text-cinema-muted" />
              <span className="font-body text-[10px] font-bold text-cinema-muted">
                {journeyLoading ? "…" : `${completedTracks}/${journey.length} trilhas`}
              </span>
            </div>
          </div>

          {journeyLoading ? (
            <p className="py-6 text-center text-[13px] text-cinema-muted">Carregando jornada…</p>
          ) : journey.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-cinema-muted">Nenhuma trilha disponível ainda.</p>
          ) : (
            <div className="space-y-3">
              {journey.map((item, index) => (
                <JourneyNode key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* conquistas */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cinema-text">Conquistas</h2>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-cinema-muted" />
              <span className="font-body text-[10px] font-bold text-cinema-muted">
                {gamiLoading ? "…" : `${earnedCodes.size}/${BADGE_CATALOG.length}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {BADGE_CATALOG.map((badge) => (
              <BadgeTile key={badge.code} badge={badge} earned={earnedCodes.has(badge.code)} />
            ))}
          </div>
        </section>

        {isAdmin ? (
          <div className="mx-auto mt-8 flex flex-col items-center gap-2">
            <span className="font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              Administração
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/series"
                className="flex items-center gap-1.5 rounded-full border border-[#E5EAF2] bg-white px-4 py-2 font-body text-xs font-bold text-cinema-muted transition-colors hover:border-cinema-primary/40 hover:text-cinema-text"
              >
                <Settings className="h-3 w-3" />
                Séries
              </Link>
              <Link
                href="/admin/filmes"
                className="flex items-center gap-1.5 rounded-full border border-[#E5EAF2] bg-white px-4 py-2 font-body text-xs font-bold text-cinema-muted transition-colors hover:border-cinema-primary/40 hover:text-cinema-text"
              >
                <Settings className="h-3 w-3" />
                Filmes
              </Link>
              <Link
                href="/admin/playlists"
                className="flex items-center gap-1.5 rounded-full border border-[#E5EAF2] bg-white px-4 py-2 font-body text-xs font-bold text-cinema-muted transition-colors hover:border-cinema-primary/40 hover:text-cinema-text"
              >
                <Settings className="h-3 w-3" />
                Playlists
              </Link>
              <Link
                href="/admin/transcripts"
                className="flex items-center gap-1.5 rounded-full border border-[#E5EAF2] bg-white px-4 py-2 font-body text-xs font-bold text-cinema-muted transition-colors hover:border-cinema-primary/40 hover:text-cinema-text"
              >
                <Settings className="h-3 w-3" />
                Transcripts
              </Link>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLogout}
          className="mx-auto mt-6 flex items-center gap-2 rounded-full border border-[#E5EAF2] bg-white px-5 py-2.5 font-body text-sm font-bold text-cinema-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>

      {avatarSheetOpen ? (
        <AvatarUrlSheet
          initialValue={avatarUrlInput}
          saving={avatarSaving}
          error={avatarError}
          canRemove={!!activeProfile?.avatarUrl}
          onClose={() => setAvatarSheetOpen(false)}
          onSave={(url) => handleSaveAvatar(url)}
          onRemove={() => handleSaveAvatar(null)}
        />
      ) : null}
    </div>
  );
}

function AvatarUrlSheet({
  initialValue,
  saving,
  error,
  canRemove,
  onClose,
  onSave,
  onRemove,
}: {
  initialValue: string;
  saving: boolean;
  error: string | null;
  canRemove: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  onRemove: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-[#E5EAF2] bg-white p-6 text-cinema-text sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-cinema-text">Foto de perfil</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F9FC]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-cinema-muted" />
          </button>
        </div>

        <label className="mb-1.5 block font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
          Link da imagem
        </label>
        <input
          type="url"
          inputMode="url"
          placeholder="https://exemplo.com/foto.jpg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-2xl border border-[#E5EAF2] bg-[#F7F9FC] px-4 py-3 font-body text-sm text-cinema-text placeholder-[#9AA7B5] outline-none focus:border-cinema-primary-alt/60"
        />
        {error ? <p className="mt-2 font-body text-xs text-red-400">{error}</p> : null}

        <button
          type="button"
          disabled={saving || value.trim().length === 0}
          onClick={() => onSave(value.trim())}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cinema-primary to-cinema-primary-alt py-3 font-display text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>

        {canRemove ? (
          <button
            type="button"
            disabled={saving}
            onClick={onRemove}
            className="mt-2 w-full rounded-2xl border border-[#E5EAF2] py-3 font-body text-sm font-bold text-cinema-muted disabled:opacity-50"
          >
            Remover foto
          </button>
        ) : null}
      </div>
    </div>
  );
}

function JourneyNode({ item, index }: { item: JourneyTrackSummary; index: number }) {
  const isCompleted = item.status === "completed";
  const isInProgress = item.status === "in_progress";

  const Icon = isCompleted ? Check : isInProgress ? Play : BookOpen;

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: isCompleted || isInProgress ? gradientForIndex(index) : "#EEF3F9",
          border: !isCompleted && !isInProgress ? "1px solid #E5EAF2" : "none",
          boxShadow: isCompleted || isInProgress ? "0 4px 16px -4px rgba(45,101,174,0.35)" : "none",
        }}
      >
        <Icon className={`h-4 w-4 ${isCompleted || isInProgress ? "text-white" : "text-cinema-muted"}`} strokeWidth={2.5} />
      </div>

      <div className="flex flex-1 items-center justify-between rounded-2xl border border-[#E5EAF2] bg-white px-4 py-3">
        <div>
          <div className="font-display text-sm font-semibold text-cinema-text">{item.title}</div>
          <div className="font-body text-[11px] font-bold text-cinema-muted">
            {item.showTitle} · {item.completedLessons}/{item.totalLessons} lições
          </div>
        </div>
        {isCompleted ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15">
            <Check className="h-3.5 w-3.5 text-green-400" strokeWidth={3} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BadgeTile({ badge, earned }: { badge: (typeof BADGE_CATALOG)[number]; earned: boolean }) {
  const Icon = earned ? badge.icon : Award;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#E5EAF2] bg-white p-3 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={
          earned
            ? { background: "linear-gradient(135deg, #DA233B, #FBC607)", boxShadow: "0 6px 20px -6px rgba(0,0,0,0.15)" }
            : { backgroundColor: "#F7F9FC", border: "1px dashed #D5DCE6" }
        }
      >
        <Icon className={`h-5 w-5 ${earned ? "text-white" : "text-cinema-muted"}`} />
      </div>
      <span className={`font-body text-[10px] font-bold leading-tight ${earned ? "text-cinema-text" : "text-cinema-muted"}`}>
        {badge.title}
      </span>
    </div>
  );
}
