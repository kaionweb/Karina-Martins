"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Captions, ChevronDown, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import type { SaveTranscriptSentenceInput, TranscriptSource } from "@ipp/shared";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getAdminTranscript, listTranscriptSources, saveTranscript } from "@/lib/api/admin";

// Linha editável (strings nos inputs; convertidas na hora de salvar).
interface EditableRow {
  startTime: string;
  endTime: string;
  textEn: string;
  textPt: string;
}

const EMPTY_ROW: EditableRow = { startTime: "", endTime: "", textEn: "", textPt: "" };

function isForbidden(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === 403;
}

export default function AdminTranscriptsPage() {
  const { ready } = useAuthGuard();

  const [sources, setSources] = useState<TranscriptSource[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let ativo = true;
    listTranscriptSources()
      .then((data) => {
        if (ativo) setSources(data);
      })
      .catch((error) => {
        if (!ativo) return;
        if (isForbidden(error)) {
          setAccessDenied(true);
          return;
        }
        setFormError("Não foi possível carregar os vídeos.");
      });
    return () => {
      ativo = false;
    };
  }, [ready]);

  async function handleSelect(youtubeVideoId: string) {
    setSelected(youtubeVideoId);
    setConfirmation(null);
    setFormError(null);
    if (!youtubeVideoId) {
      setRows([]);
      return;
    }
    setLoadingRows(true);
    try {
      const existing = await getAdminTranscript(youtubeVideoId);
      setRows(
        existing.map((sentence) => ({
          startTime: String(sentence.startTime),
          endTime: String(sentence.endTime),
          textEn: sentence.textEn,
          textPt: sentence.textPt,
        })),
      );
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        return;
      }
      setFormError("Não foi possível carregar as frases.");
    } finally {
      setLoadingRows(false);
    }
  }

  function updateRow(index: number, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!selected) return;
    setSubmitting(true);
    setFormError(null);
    setConfirmation(null);

    // order = índice + 1 (o backend re-deriva de qualquer forma); a posição na
    // lista é a ordem das frases.
    const sentences: SaveTranscriptSentenceInput[] = rows.map((row, index) => ({
      order: index + 1,
      startTime: Number(row.startTime),
      endTime: Number(row.endTime),
      textEn: row.textEn.trim(),
      textPt: row.textPt.trim(),
    }));

    const invalid = sentences.some(
      (s) => Number.isNaN(s.startTime) || Number.isNaN(s.endTime) || !s.textEn || !s.textPt,
    );
    if (invalid) {
      setFormError("Preencha tempo (início/fim) e os dois textos em cada frase.");
      setSubmitting(false);
      return;
    }

    try {
      await saveTranscript(selected, { sentences });
      setConfirmation(`Transcript salvo: ${sentences.length} frase(s).`);
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        return;
      }
      setFormError("Não foi possível salvar o transcript.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return null;
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-cinema-bg p-6 font-body text-cinema-text">
        <Captions className="h-8 w-8 text-cinema-primary" />
        <p className="font-display text-lg font-bold">Acesso restrito</p>
        <p className="text-sm text-cinema-muted">Esta área é exclusiva pra administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-cinema-bg font-body text-cinema-text">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cinema-primary to-cinema-primary-alt">
              <Captions className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-display text-xl font-bold text-cinema-text">
              Transcripts <span className="font-body text-sm font-semibold text-cinema-muted">(admin)</span>
            </h1>
          </div>
          <Link
            href="/admin/transcripts/revisao"
            className="flex items-center gap-1.5 rounded-lg border border-[#E5EAF2] bg-white px-3 py-1.5 font-body text-xs font-bold text-cinema-text transition-colors hover:border-cinema-primary/40"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Revisar pendentes
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5">
          <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wide text-cinema-muted">
            Vídeo ou episódio
          </label>
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => handleSelect(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] px-3 pr-8 font-body text-sm font-semibold text-cinema-text outline-none transition-all focus:border-cinema-primary-alt/60 focus:bg-white focus:ring-4 focus:ring-cinema-primary/10"
            >
              <option value="">Selecione um vídeo…</option>
              {sources.map((source) => (
                <option key={`${source.kind}-${source.youtubeVideoId}`} value={source.youtubeVideoId}>
                  {source.kind === "episode" ? "[Episódio] " : source.kind === "filme" ? "[Filme] " : "[Vídeo] "}
                  {source.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
          </div>

          {selected ? (
            <div className="mt-5 flex flex-col gap-3">
              {loadingRows ? (
                <p className="font-body text-xs text-cinema-muted">Carregando frases…</p>
              ) : (
                <>
                  {rows.length === 0 ? (
                    <p className="font-body text-xs text-cinema-muted">
                      Nenhuma frase ainda. Adicione a primeira abaixo.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {rows.map((row, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-[#E5EAF2] bg-[#F7F9FC] p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
                              Frase {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 font-body text-[11px] font-bold text-red-500 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remover
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <RowInput
                              label="Início (s)"
                              type="number"
                              value={row.startTime}
                              onChange={(v) => updateRow(index, { startTime: v })}
                            />
                            <RowInput
                              label="Fim (s)"
                              type="number"
                              value={row.endTime}
                              onChange={(v) => updateRow(index, { endTime: v })}
                            />
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            <RowInput
                              label="Inglês"
                              value={row.textEn}
                              onChange={(v) => updateRow(index, { textEn: v })}
                            />
                            <RowInput
                              label="Português"
                              value={row.textPt}
                              onChange={(v) => updateRow(index, { textPt: v })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#D5DCE6] bg-white px-3 py-2 font-body text-xs font-bold text-cinema-primary transition-colors hover:border-cinema-primary/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar frase
                  </button>
                </>
              )}

              {confirmation ? (
                <div className="rounded-xl border border-green-400/30 bg-green-400/10 px-3 py-2.5">
                  <span className="font-body text-xs font-semibold text-green-700">{confirmation}</span>
                </div>
              ) : null}
              {formError ? (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5">
                  <span className="font-body text-xs font-semibold text-red-600">{formError}</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cinema-primary to-cinema-primary-alt px-6 py-3 font-display text-sm font-bold text-white shadow-cinema-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
              >
                {submitting ? "Salvando…" : "Salvar transcript"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RowInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}): ReactNode {
  return (
    <div>
      <label className="mb-1 block font-body text-[10px] font-bold uppercase tracking-wide text-cinema-muted">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-[#E5EAF2] bg-white px-2.5 font-body text-sm font-semibold text-cinema-text outline-none transition-all placeholder-[#9AA7B5] focus:border-cinema-primary-alt/60 focus:ring-4 focus:ring-cinema-primary/10"
      />
    </div>
  );
}
