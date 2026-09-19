"use client";

import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { seriesLevelSchema, type AdminSeriesEpisode, type SeriesLevel } from "@ipp/shared";
import { ChevronDown, Settings, Trash2, Tv } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  deleteSeries,
  getAdminSeriesEpisodes,
  listAdminSeries,
  setEpisodeHidden,
  setSeasonHidden,
  upsertSeries,
  type AdminSeries,
} from "@/lib/api/admin";

const LEVEL_OPTIONS = seriesLevelSchema.options;

const LEVEL_LABEL: Record<SeriesLevel, string> = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

// Cores fixas (não os tokens cinema-*) pra manter o mesmo código visual de
// nível usado em todo o app rebrand (explorar/séries/filmes/etc.): Básico
// azul, Intermediário vermelho, Avançado azul-escuro.
const LEVEL_STYLES: Record<SeriesLevel, { bg: string; text: string; border: string }> = {
  BASICO: { bg: "bg-[#2D65AE]/15", text: "text-[#2D65AE]", border: "border-[#2D65AE]/30" },
  INTERMEDIARIO: { bg: "bg-[#DA233B]/15", text: "text-[#DA233B]", border: "border-[#DA233B]/30" },
  AVANCADO: { bg: "bg-[#1E4A85]/15", text: "text-[#1E4A85]", border: "border-[#1E4A85]/30" },
};

function isForbidden(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === 403;
}

export default function AdminSeriesPage() {
  const { ready } = useAuthGuard();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [level, setLevel] = useState<SeriesLevel>(LEVEL_OPTIONS[0]);
  const [ageRange, setAgeRange] = useState("");
  const [seasons, setSeasons] = useState("1");
  const [season, setSeason] = useState("1");
  const [playlistUrlOrId, setPlaylistUrlOrId] = useState("");

  const [seriesList, setSeriesList] = useState<AdminSeries[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refreshSeries() {
    try {
      const data = await listAdminSeries();
      setSeriesList(data);
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setSeriesList([]);
        return;
      }
      setFormError("Não foi possível carregar as séries.");
    }
  }

  useEffect(() => {
    if (!ready) return;
    refreshSeries();
    // refreshSeries é estável para o efeito de carga inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setConfirmation(null);

    try {
      const result = await upsertSeries({
        title,
        emoji,
        level,
        ageRange,
        seasons: Number(seasons),
        playlistUrlOrId,
        season: Number(season),
      });
      setConfirmation(`Série cadastrada: ${result.sync.episodesAvailable} episódio(s) disponível(is).`);
      setTitle("");
      setEmoji("");
      setAgeRange("");
      setSeasons("1");
      setSeason("1");
      setPlaylistUrlOrId("");
      await refreshSeries();
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setSeriesList([]);
        return;
      }
      setFormError("Não foi possível cadastrar a série.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(series: AdminSeries) {
    const confirmed = window.confirm(
      `Apagar "${series.title}" definitivamente? Isso remove a série e todos os ${series.episodesCount} episódio(s) sincronizados. Não tem como desfazer.`,
    );
    if (!confirmed) return;

    setDeletingId(series.id);
    setFormError(null);
    try {
      await deleteSeries(series.id);
      if (expandedSeriesId === series.id) setExpandedSeriesId(null);
      await refreshSeries();
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setSeriesList([]);
        return;
      }
      setFormError("Não foi possível apagar a série.");
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
        <Tv className="h-8 w-8 text-cinema-primary" />
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
            <Tv className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-cinema-text">
            Séries <span className="font-body text-sm font-semibold text-cinema-muted">(admin)</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Título" placeholder="ex.: Pequenos Heróis" value={title} onChange={setTitle} />
              <Field label="Emoji" placeholder="🦸" value={emoji} onChange={setEmoji} />

              <SelectField
                label="Nível"
                value={level}
                onChange={(v) => setLevel(v as SeriesLevel)}
                options={LEVEL_OPTIONS.map((option) => ({ value: option, label: LEVEL_LABEL[option] }))}
              />
              <Field label="Faixa etária" placeholder="ex.: 3+" value={ageRange} onChange={setAgeRange} />

              <Field
                label="Temporadas (total da série)"
                placeholder="1"
                type="number"
                value={seasons}
                onChange={setSeasons}
              />
              <Field label="Temporada desta playlist" placeholder="1" type="number" value={season} onChange={setSeason} />
            </div>

            <div>
              <Field
                label="URL ou ID da playlist"
                placeholder="https://www.youtube.com/playlist?list=… ou o ID"
                value={playlistUrlOrId}
                onChange={setPlaylistUrlOrId}
                fullWidth
              />
              <p className="mt-1.5 pl-1 font-body text-[11px] text-cinema-muted">
                A qual temporada os episódios desta playlist pertencem — sincronizar não mexe nas outras temporadas.
              </p>
            </div>

            {confirmation ? (
              <div className="flex items-start gap-2 rounded-xl border border-green-400/30 bg-green-400/10 px-3 py-2.5">
                <span className="font-body text-xs font-semibold text-green-700">{confirmation}</span>
              </div>
            ) : null}
            {formError ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5">
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
                  <span>Salvando…</span>
                </>
              ) : (
                <>
                  <Tv className="h-4 w-4" strokeWidth={2.5} />
                  <span>Salvar série</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cinema-text">Séries cadastradas</h2>
            <span className="rounded-full border border-[#E5EAF2] bg-[#EEF3F9] px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {seriesList.length} série{seriesList.length === 1 ? "" : "s"}
            </span>
          </div>

          {seriesList.length === 0 ? (
            <EmptyState label="Nenhuma série cadastrada ainda." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E5EAF2]">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="bg-[#EEF3F9]">
                    <Th>Título</Th>
                    <Th>Nível</Th>
                    <Th>Faixa</Th>
                    <Th align="center">Temp.</Th>
                    <Th align="center">Episódios</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {seriesList.map((series, i) => (
                    <Fragment key={series.id}>
                      <SeriesRow
                        item={series}
                        isLast={i === seriesList.length - 1 && expandedSeriesId !== series.id}
                        expanded={expandedSeriesId === series.id}
                        deleting={deletingId === series.id}
                        onToggleExpand={() => setExpandedSeriesId(expandedSeriesId === series.id ? null : series.id)}
                        onDelete={() => handleDelete(series)}
                      />
                      {expandedSeriesId === series.id ? (
                        <tr className={i === seriesList.length - 1 ? "" : "border-b border-[#E5EAF2]"}>
                          <td colSpan={6} className="bg-[#F7F9FC] px-4 py-4">
                            <EpisodeManager seriesId={series.id} onAccessDenied={() => setAccessDenied(true)} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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
  type = "text",
  fullWidth,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wide text-cinema-muted">
        {label}
      </label>
      <input
        type={type}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wide text-cinema-muted">
        {label}
      </label>
      <div className="relative">
        <select
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

function SeriesRow({
  item,
  isLast,
  expanded,
  deleting,
  onToggleExpand,
  onDelete,
}: {
  item: AdminSeries;
  isLast: boolean;
  expanded: boolean;
  deleting: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}) {
  const level = LEVEL_STYLES[item.level];
  return (
    <tr className={`transition-colors hover:bg-[#F7F9FC] ${isLast ? "" : "border-b border-[#E5EAF2]"}`}>
      <td className="px-4 py-3">
        <span className="font-body text-sm font-bold text-cinema-text">
          {item.emoji} {item.title}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full border px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wide ${level.bg} ${level.text} ${level.border}`}
        >
          {LEVEL_LABEL[item.level]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-body text-xs font-semibold text-cinema-muted">{item.ageRange}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-body text-xs font-semibold text-cinema-muted">{item.seasons}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`font-body text-xs font-semibold ${item.episodesCount > 0 ? "text-cinema-green" : "text-cinema-muted"}`}>
          {item.episodesCount}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-body text-[11px] font-bold text-[#2D65AE] transition-colors hover:bg-[#F7F9FC]"
          >
            <Settings className="h-3 w-3" />
            {expanded ? "Fechar" : "Gerenciar"}
          </button>
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
      <Tv className="h-5 w-5 text-cinema-muted" />
      <span className="font-body text-sm font-semibold text-cinema-muted">{label}</span>
    </div>
  );
}

function EpisodeManager({ seriesId, onAccessDenied }: { seriesId: string; onAccessDenied: () => void }) {
  const [episodes, setEpisodes] = useState<AdminSeriesEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingSeason, setPendingSeason] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminSeriesEpisodes(seriesId);
      setEpisodes(data);
    } catch (err) {
      if (isForbidden(err)) {
        onAccessDenied();
        return;
      }
      setError("Não foi possível carregar os episódios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Carrega uma vez ao montar (série fixa por instância deste componente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  async function handleToggleEpisode(episode: AdminSeriesEpisode) {
    setPendingId(episode.id);
    try {
      await setEpisodeHidden(episode.id, !episode.hidden);
      setEpisodes((prev) => prev.map((e) => (e.id === episode.id ? { ...e, hidden: !episode.hidden } : e)));
    } catch (err) {
      if (isForbidden(err)) {
        onAccessDenied();
        return;
      }
      setError("Não foi possível atualizar o episódio.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleToggleSeason(season: number, hideAll: boolean) {
    setPendingSeason(season);
    try {
      await setSeasonHidden(seriesId, season, hideAll);
      setEpisodes((prev) => prev.map((e) => (e.season === season ? { ...e, hidden: hideAll } : e)));
    } catch (err) {
      if (isForbidden(err)) {
        onAccessDenied();
        return;
      }
      setError("Não foi possível atualizar a temporada.");
    } finally {
      setPendingSeason(null);
    }
  }

  if (loading) {
    return <p className="font-body text-xs text-cinema-muted">Carregando episódios…</p>;
  }

  if (error) {
    return <p className="font-body text-xs text-red-500">{error}</p>;
  }

  if (episodes.length === 0) {
    return <p className="font-body text-xs text-cinema-muted">Nenhum episódio sincronizado ainda.</p>;
  }

  const seasonNumbers = [...new Set(episodes.map((e) => e.season))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-5">
      {seasonNumbers.map((seasonNumber) => {
        const seasonEpisodes = episodes.filter((e) => e.season === seasonNumber);
        const allHidden = seasonEpisodes.every((e) => e.hidden);

        return (
          <div key={seasonNumber} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-bold uppercase tracking-wide text-cinema-text">
                Temporada {seasonNumber}
              </span>
              <button
                type="button"
                disabled={pendingSeason === seasonNumber}
                onClick={() => handleToggleSeason(seasonNumber, !allHidden)}
                className="font-body text-[11px] font-bold text-[#2D65AE] underline decoration-[#2D65AE]/40 underline-offset-2 disabled:opacity-50"
              >
                {pendingSeason === seasonNumber ? "Salvando…" : allHidden ? "Reexibir temporada" : "Ocultar temporada"}
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#E5EAF2]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#EEF3F9]">
                    <Th>EP</Th>
                    <Th>Título</Th>
                    <Th>Status</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {seasonEpisodes.map((episode, i) => (
                    <tr
                      key={episode.id}
                      className={i === seasonEpisodes.length - 1 ? "" : "border-b border-[#E5EAF2]"}
                      style={{ opacity: episode.hidden ? 0.5 : 1 }}
                    >
                      <td className="px-4 py-2 font-body text-xs font-semibold text-cinema-muted">{episode.number}</td>
                      <td className="px-4 py-2 font-body text-xs font-semibold text-cinema-text">{episode.title}</td>
                      <td className="px-4 py-2 font-body text-xs font-semibold text-cinema-muted">
                        {episode.status === "UNAVAILABLE" ? "Indisponível no YouTube" : episode.hidden ? "Oculto" : "Visível"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          disabled={pendingId === episode.id}
                          onClick={() => handleToggleEpisode(episode)}
                          className="font-body text-[11px] font-bold text-[#2D65AE] underline decoration-[#2D65AE]/40 underline-offset-2 disabled:opacity-50"
                        >
                          {pendingId === episode.id ? "Salvando…" : episode.hidden ? "Reexibir" : "Ocultar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
