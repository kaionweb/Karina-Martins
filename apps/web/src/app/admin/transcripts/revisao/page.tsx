"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Captions, CheckCircle2 } from "lucide-react";
import type { PendingTranscriptGroup } from "@ipp/shared";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { listPendingTranscripts, reviewTranscriptSentence } from "@/lib/api/admin";

const kindLabel: Record<PendingTranscriptGroup["kind"], string> = {
  video: "Vídeo",
  episode: "Episódio",
  filme: "Filme",
};

function isForbidden(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === 403;
}

export default function AdminTranscriptsReviewPage() {
  const { ready } = useAuthGuard();

  const [groups, setGroups] = useState<PendingTranscriptGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) return;
    let ativo = true;
    listPendingTranscripts()
      .then((data) => {
        if (!ativo) return;
        setGroups(data);
        setDrafts(Object.fromEntries(data.flatMap((g) => g.sentences.map((s) => [s.id, s.textPt]))));
      })
      .catch((error) => {
        if (!ativo) return;
        if (isForbidden(error)) {
          setAccessDenied(true);
          return;
        }
        setLoadError("Não foi possível carregar as frases pendentes.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [ready]);

  async function handleReview(sentenceId: string) {
    const textPt = (drafts[sentenceId] ?? "").trim();
    if (!textPt) {
      setRowError((prev) => ({ ...prev, [sentenceId]: "Preencha a tradução antes de marcar como revisado." }));
      return;
    }

    setSavingId(sentenceId);
    setRowError((prev) => ({ ...prev, [sentenceId]: "" }));
    try {
      await reviewTranscriptSentence(sentenceId, { textPt });
      setGroups((prev) =>
        prev
          .map((group) => ({ ...group, sentences: group.sentences.filter((s) => s.id !== sentenceId) }))
          .filter((group) => group.sentences.length > 0),
      );
    } catch (error) {
      if (isForbidden(error)) {
        setAccessDenied(true);
        return;
      }
      setRowError((prev) => ({ ...prev, [sentenceId]: "Não foi possível salvar. Tente novamente." }));
    } finally {
      setSavingId(null);
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

  const totalPending = groups.reduce((acc, g) => acc + g.sentences.length, 0);

  return (
    <div className="min-h-screen w-full bg-cinema-bg font-body text-cinema-text">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2.5">
          <Link
            href="/admin/transcripts"
            aria-label="Voltar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5EAF2] bg-white"
          >
            <ArrowLeft className="h-4 w-4 text-cinema-text/80" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cinema-primary to-cinema-primary-alt">
            <Captions className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-cinema-text">
            Revisão de transcripts <span className="font-body text-sm font-semibold text-cinema-muted">(admin)</span>
          </h1>
        </div>

        {loading ? (
          <p className="font-body text-sm text-cinema-muted">Carregando frases pendentes…</p>
        ) : loadError ? (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5">
            <span className="font-body text-xs font-semibold text-red-600">{loadError}</span>
          </div>
        ) : totalPending === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#E5EAF2] bg-white px-5 py-14 text-center">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <p className="font-display text-[15px] font-semibold text-cinema-text">Tudo revisado</p>
            <p className="font-body text-[13px] text-cinema-muted">Nenhuma frase pendente de revisão no momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="font-body text-xs font-bold uppercase tracking-wide text-cinema-muted">
              {totalPending} frase(s) pendente(s) em {groups.length} conteúdo(s)
            </p>

            {groups.map((group) => (
              <div key={group.youtubeVideoId} className="rounded-2xl border border-[#E5EAF2] bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-cinema-surface-alt px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
                    {kindLabel[group.kind]}
                  </span>
                  <h2 className="font-display text-sm font-bold text-cinema-text">{group.title}</h2>
                </div>

                <div className="flex flex-col gap-3">
                  {group.sentences.map((sentence) => (
                    <div key={sentence.id} className="rounded-xl border border-[#E5EAF2] bg-[#F7F9FC] p-3">
                      <p className="font-body text-sm font-semibold text-cinema-text">{sentence.textEn}</p>
                      <textarea
                        value={drafts[sentence.id] ?? ""}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [sentence.id]: e.target.value }))}
                        placeholder="Digite a tradução em português…"
                        rows={2}
                        className="mt-2 w-full resize-none rounded-lg border border-[#E5EAF2] bg-white px-2.5 py-2 font-body text-sm text-cinema-text outline-none transition-all placeholder-[#9AA7B5] focus:border-cinema-primary-alt/60 focus:ring-4 focus:ring-cinema-primary/10"
                      />
                      {rowError[sentence.id] ? (
                        <p className="mt-1 font-body text-[11px] font-semibold text-red-600">{rowError[sentence.id]}</p>
                      ) : null}
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleReview(sentence.id)}
                          disabled={savingId === sentence.id}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cinema-primary to-cinema-primary-alt px-3 py-1.5 font-body text-xs font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {savingId === sentence.id ? "Salvando…" : "Marcar como revisado"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
