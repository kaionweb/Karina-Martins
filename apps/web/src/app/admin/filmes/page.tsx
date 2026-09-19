"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { filmeLevelSchema, type FilmeLevel } from "@ipp/shared";
import { ChevronDown, Film, Trash2 } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { deleteFilme, listAdminFilmes, upsertFilme, type AdminFilme } from "@/lib/api/admin";

const LEVEL_OPTIONS = filmeLevelSchema.options;

const LEVEL_LABEL: Record<FilmeLevel, string> = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

// Mesmo código visual de nível do resto do app rebrand: Básico azul,
// Intermediário vermelho, Avançado azul-escuro.
const LEVEL_STYLES: Record<FilmeLevel, { bg: string; text: string; border: string }> = {
  BASICO: { bg: "bg-[#2D65AE]/15", text: "text-[#2D65AE]", border: "border-[#2D65AE]/30" },
  INTERMEDIARIO: { bg: "bg-[#DA233B]/15", text: "text-[#DA233B]", border: "border-[#DA233B]/30" },
  AVANCADO: { bg: "bg-[#1E4A85]/15", text: "text-[#1E4A85]", border: "border-[#1E4A85]/30" },
};

function isForbidden(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === 403;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString().padStart(hours > 0 ? 2 : 1, "0");
  const ss = seconds.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function AdminFilmesPage() {
  const { ready } = useAuthGuard();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [level, setLevel] = useState<FilmeLevel>(LEVEL_OPTIONS[0]);
  const [ageRange, setAgeRange] = useState("");
  const [videoUrlOrId, setVideoUrlOrId] = useState("");
  const [duration, setDuration] = useState("");

  const [filmes, setFilmes] = useState<AdminFilme[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refreshFilmes() {
    try {
      const data = await listAdminFilmes();
      setFilmes(data);
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setFilmes([]);
        return;
      }
      setFormError("Não foi possível carregar os filmes.");
    }
  }

  useEffect(() => {
    if (!ready) return;
    refreshFilmes();
    // refreshFilmes é estável para o efeito de carga inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setConfirmation(null);

    try {
      const result = await upsertFilme({ title, emoji, level, ageRange, videoUrlOrId, duration });
      setConfirmation(`Filme salvo: "${result.title}" (${formatDuration(result.durationSeconds)}).`);
      setTitle("");
      setEmoji("");
      setAgeRange("");
      setVideoUrlOrId("");
      setDuration("");
      await refreshFilmes();
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setFilmes([]);
        return;
      }
      setFormError("Não foi possível salvar o filme. Verifique a URL/ID do vídeo e a duração.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(filme: AdminFilme) {
    const confirmed = window.confirm(`Apagar "${filme.title}" definitivamente? Não tem como desfazer.`);
    if (!confirmed) return;

    setDeletingId(filme.id);
    setFormError(null);
    try {
      await deleteFilme(filme.id);
      await refreshFilmes();
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        setFilmes([]);
        return;
      }
      setFormError("Não foi possível apagar o filme.");
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
        <Film className="h-8 w-8 text-cinema-primary" />
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
            <Film className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-cinema-text">
            Filmes <span className="font-body text-sm font-semibold text-cinema-muted">(admin)</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Título" placeholder="ex.: A Grande Aventura" value={title} onChange={setTitle} />
              <Field label="Emoji" placeholder="🎈" value={emoji} onChange={setEmoji} />

              <SelectField
                label="Nível"
                value={level}
                onChange={(v) => setLevel(v as FilmeLevel)}
                options={LEVEL_OPTIONS.map((option) => ({ value: option, label: LEVEL_LABEL[option] }))}
              />
              <Field label="Faixa etária" placeholder="ex.: 3+" value={ageRange} onChange={setAgeRange} />

              <Field
                label="Duração (mm:ss, hh:mm:ss ou segundos)"
                placeholder="ex.: 42:30"
                value={duration}
                onChange={setDuration}
              />
            </div>

            <div>
              <Field
                label="URL ou ID do vídeo do YouTube"
                placeholder="https://www.youtube.com/watch?v=… ou o ID"
                value={videoUrlOrId}
                onChange={setVideoUrlOrId}
                fullWidth
              />
              <p className="mt-1.5 pl-1 font-body text-[11px] text-cinema-muted">
                Reenviar o mesmo vídeo atualiza os dados do filme em vez de duplicar.
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
                  <Film className="h-4 w-4" strokeWidth={2.5} />
                  <span>Salvar filme</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cinema-text">Filmes cadastrados</h2>
            <span className="rounded-full border border-[#E5EAF2] bg-[#EEF3F9] px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {filmes.length} filme{filmes.length === 1 ? "" : "s"}
            </span>
          </div>

          {filmes.length === 0 ? (
            <EmptyState label="Nenhum filme cadastrado ainda." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E5EAF2]">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="bg-[#EEF3F9]">
                    <Th>Título</Th>
                    <Th>Nível</Th>
                    <Th>Faixa</Th>
                    <Th align="center">Duração</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {filmes.map((filme, i) => (
                    <FilmeRow
                      key={filme.id}
                      item={filme}
                      isLast={i === filmes.length - 1}
                      deleting={deletingId === filme.id}
                      onDelete={() => handleDelete(filme)}
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

function FilmeRow({
  item,
  isLast,
  deleting,
  onDelete,
}: {
  item: AdminFilme;
  isLast: boolean;
  deleting: boolean;
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
        <span className="font-body text-xs font-semibold text-cinema-muted">{formatDuration(item.durationSeconds)}</span>
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
      <Film className="h-5 w-5 text-cinema-muted" />
      <span className="font-body text-sm font-semibold text-cinema-muted">{label}</span>
    </div>
  );
}
