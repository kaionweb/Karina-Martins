"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ListVideo, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { videoLevelSchema, videoSkillSchema, type VideoLevel, type VideoSkill } from "@ipp/shared";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createPlaylist, deletePlaylist, listPlaylists, type AdminPlaylist } from "@/lib/api/admin";

const LEVEL_OPTIONS = videoLevelSchema.options;
const SKILL_OPTIONS = videoSkillSchema.options;

const LEVEL_LABEL: Record<VideoLevel, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

// Cores fixas (não os tokens cinema-*) pra bater com o mesmo código visual de
// nível usado em todo o app rebrand: Iniciante azul, Intermediário vermelho,
// Avançado azul-escuro/vermelho (mesma combinação de Séries e Filmes).
const LEVEL_STYLES: Record<VideoLevel, { bg: string; text: string; border: string }> = {
  INICIANTE: { bg: "bg-[#2D65AE]/15", text: "text-[#2D65AE]", border: "border-[#2D65AE]/30" },
  INTERMEDIARIO: { bg: "bg-[#DA233B]/15", text: "text-[#DA233B]", border: "border-[#DA233B]/30" },
  AVANCADO: { bg: "bg-[#1E4A85]/15", text: "text-[#1E4A85]", border: "border-[#1E4A85]/30" },
};

const SKILL_STYLES: Record<VideoSkill, { bg: string; text: string }> = {
  VOCABULARIO: { bg: "bg-purple-500/15", text: "text-purple-200" },
  LISTENING: { bg: "bg-pink-500/15", text: "text-pink-200" },
  MUSICA: { bg: "bg-cinema-green/15", text: "text-cinema-green" },
};

function isForbidden(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === 403;
}

export default function AdminPlaylistsPage() {
  const { ready } = useAuthGuard();

  const [playlistUrlOrId, setPlaylistUrlOrId] = useState("");
  const [channel, setChannel] = useState("");
  const [level, setLevel] = useState<VideoLevel>(LEVEL_OPTIONS[0]);
  const [ageRange, setAgeRange] = useState("");
  const [skill, setSkill] = useState<VideoSkill>(SKILL_OPTIONS[0]);
  const [theme, setTheme] = useState("");

  const [playlists, setPlaylists] = useState<AdminPlaylist[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refreshPlaylists() {
    try {
      const data = await listPlaylists();
      setPlaylists(data);
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setPlaylists([]);
        return;
      }
      setFormError("Não foi possível carregar as playlists.");
    }
  }

  useEffect(() => {
    if (!ready) return;
    refreshPlaylists();
    // refreshPlaylists é estável para o efeito de carga inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setConfirmation(null);

    try {
      const result = await createPlaylist({ playlistUrlOrId, channel, level, ageRange, skill, theme });
      setConfirmation(`Playlist cadastrada: ${result.sync.videosAvailable} vídeo(s) disponível(is).`);
      setPlaylistUrlOrId("");
      setChannel("");
      setAgeRange("");
      setTheme("");
      await refreshPlaylists();
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setPlaylists([]);
        return;
      }
      setFormError("Não foi possível cadastrar a playlist.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(playlist: AdminPlaylist) {
    const confirmed = window.confirm(
      `Apagar a playlist "${playlist.theme}" definitivamente? Isso remove os ${playlist.videosCount} vídeo(s) sincronizados. Não tem como desfazer.`,
    );
    if (!confirmed) return;

    setDeletingId(playlist.id);
    setFormError(null);
    try {
      await deletePlaylist(playlist.id);
      await refreshPlaylists();
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setPlaylists([]);
        return;
      }
      setFormError("Não foi possível apagar a playlist.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!ready) {
    return null;
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-cinema-bg p-6 font-body text-cinema-text">
        <ShieldAlert className="h-8 w-8 text-cinema-primary" />
        <p className="font-display text-lg font-bold">Acesso restrito</p>
        <p className="text-sm text-cinema-muted">Esta área é exclusiva pra administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-cinema-bg font-body text-cinema-text">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cinema-primary to-cinema-primary-alt">
            <ListVideo className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-cinema-text">
            Playlists curadas <span className="font-body text-sm font-semibold text-cinema-muted">(admin)</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              label="URL ou ID da playlist"
              placeholder="https://www.youtube.com/playlist?list=… ou o ID"
              value={playlistUrlOrId}
              onChange={setPlaylistUrlOrId}
              fullWidth
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Canal" placeholder="Nome do canal" value={channel} onChange={setChannel} />
              <Field label="Tema" placeholder="ex.: Vocabulário geral" value={theme} onChange={setTheme} />

              <SelectField
                label="Nível"
                value={level}
                onChange={(v) => setLevel(v as VideoLevel)}
                options={LEVEL_OPTIONS.map((option) => ({ value: option, label: LEVEL_LABEL[option] }))}
              />
              <Field label="Faixa etária" placeholder="ex.: 4-6" value={ageRange} onChange={setAgeRange} />

              <SelectField
                label="Habilidade"
                value={skill}
                onChange={(v) => setSkill(v as VideoSkill)}
                options={SKILL_OPTIONS.map((option) => ({ value: option, label: option }))}
                fullWidth
              />
            </div>

            {confirmation ? (
              <div className="flex items-start gap-2 rounded-xl border border-green-400/30 bg-green-400/10 px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="font-body text-xs font-semibold text-green-700">{confirmation}</span>
              </div>
            ) : null}
            {formError ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <span className="font-body text-xs font-semibold text-red-600">{formError}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cinema-primary to-cinema-primary-alt px-6 py-3 font-display text-sm font-bold text-white shadow-cinema-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Cadastrando…</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  <span>Cadastrar playlist</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cinema-text">Playlists cadastradas</h2>
            <span className="rounded-full border border-[#E5EAF2] bg-[#EEF3F9] px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {playlists.length} playlist{playlists.length === 1 ? "" : "s"}
            </span>
          </div>

          {playlists.length === 0 ? (
            <EmptyState label="Nenhuma playlist cadastrada ainda." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E5EAF2]">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="bg-[#EEF3F9]">
                    <Th>Tema</Th>
                    <Th>Canal</Th>
                    <Th>Nível</Th>
                    <Th>Habilidade</Th>
                    <Th align="center">Faixa</Th>
                    <Th align="center">Vídeos</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {playlists.map((playlist, i) => (
                    <PlaylistRow
                      key={playlist.id}
                      item={playlist}
                      isLast={i === playlists.length - 1}
                      deleting={deletingId === playlist.id}
                      onDelete={() => handleDelete(playlist)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  fullWidth,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  const inputId = useId();

  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label htmlFor={inputId} className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wide text-cinema-muted">
        {label}
      </label>
      <input
        id={inputId}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] px-3 font-body text-sm font-semibold text-cinema-text outline-none transition-all placeholder-[#9AA7B5] focus:border-cinema-primary-alt/60 focus:bg-white focus:ring-4 focus:ring-cinema-primary/10"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  fullWidth,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}) {
  const selectId = useId();

  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label htmlFor={selectId} className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wide text-cinema-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] px-3 pr-8 font-body text-sm font-semibold text-cinema-text outline-none transition-all focus:border-cinema-primary-alt/60 focus:bg-white focus:ring-4 focus:ring-cinema-primary/10"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-white text-cinema-text">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <th
      className="border-b border-[#E5EAF2] px-4 py-2.5 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

function PlaylistRow({
  item,
  isLast,
  deleting,
  onDelete,
}: {
  item: AdminPlaylist;
  isLast: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const level = LEVEL_STYLES[item.level];
  const skill = SKILL_STYLES[item.skill];
  return (
    <tr className={`transition-colors hover:bg-[#F7F9FC] ${isLast ? "" : "border-b border-[#E5EAF2]"}`}>
      <td className="px-4 py-3">
        <span className="font-body text-sm font-bold text-cinema-text">{item.theme}</span>
      </td>
      <td className="px-4 py-3">
        <span className="font-body text-xs font-semibold text-cinema-muted">{item.channel}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full border px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wide ${level.bg} ${level.text} ${level.border}`}
        >
          {LEVEL_LABEL[item.level]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wide ${skill.bg} ${skill.text}`}>
          {item.skill}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-body text-xs font-semibold text-cinema-muted">{item.ageRange}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-body text-xs font-semibold text-cinema-green">{item.videosCount}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-body text-[11px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            {deleting ? "Apagando…" : "Excluir"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#D5DCE6] bg-[#F7F9FC] py-10 text-center">
      <ListVideo className="h-5 w-5 text-cinema-muted" />
      <span className="font-body text-sm font-semibold text-cinema-muted">{label}</span>
    </div>
  );
}
