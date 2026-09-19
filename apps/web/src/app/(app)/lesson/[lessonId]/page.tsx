"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Languages, MessageCircle, Sparkles, Star } from "lucide-react";
import type { Lesson } from "@ipp/shared";
import { completeLesson, getLesson, getLessonsForTrack, resolveShowIndexForTrack } from "@/lib/api/catalog";
import { chatEn, chatPt } from "@/lib/api/ai";
import { LESSON_COMPLETION_XP } from "@/components/catalog/LessonRow";
import { accentForIndex } from "@/lib/ui/posterGradients";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { LessonChat } from "@/components/chat/LessonChat";
import { useXpToastStore } from "@/stores/useXpToastStore";
import { XpGainToast } from "@/components/gamification/XpGainToast";

type ChatMode = "en" | "pt";

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams<{ lessonId: string }>();
  const showXpGain = useXpToastStore((state) => state.showXpGain);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [showIndex, setShowIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chatMode, setChatMode] = useState<ChatMode>("en");

  useEffect(() => {
    let ativo = true;

    async function load() {
      try {
        const lessonData = await getLesson(params.lessonId);
        if (!ativo) return;
        setLesson(lessonData);

        // Cor de acento (progressive enhancement — falha aqui não impede ver a lição).
        resolveShowIndexForTrack(lessonData.trackId)
          .then((index) => {
            if (ativo) setShowIndex(index);
          })
          .catch(() => {});

        // Status real de conclusão (não assumir "não concluída" se a criança
        // já tinha terminado essa lição antes e só voltou pra revisar).
        getLessonsForTrack(lessonData.trackId)
          .then((siblings) => {
            const match = siblings.find((l) => l.id === params.lessonId);
            if (ativo && match) setCompleted(match.completed);
          })
          .catch(() => {});
      } catch {
        if (ativo) setError("Não foi possível carregar a lição.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    load();
    return () => {
      ativo = false;
    };
  }, [params.lessonId]);

  async function handleComplete() {
    setCompleting(true);
    try {
      const result = await completeLesson(params.lessonId);
      setCompleted(true);
      if (result.xpAwarded > 0) {
        showXpGain(result.xpAwarded);
      }
    } catch {
      setError("Não foi possível concluir a lição.");
    } finally {
      setCompleting(false);
    }
  }

  const accent = accentForIndex(showIndex);

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 flex items-center justify-between border-b border-cinema-border px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-full font-body text-sm font-bold text-cinema-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12">
        {loading ? (
          <p className="py-10 text-center text-[13px] text-cinema-muted">Carregando…</p>
        ) : error || !lesson ? (
          <p className="py-10 text-center text-[13px] text-cinema-muted">{error ?? "Lição não encontrada."}</p>
        ) : (
          <>
            {/* hero da lição */}
            <div className="mt-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: accent.solid, boxShadow: `0 8px 24px -8px ${accent.glow}` }}
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-cinema-text">{lesson.title}</h1>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-cinema-amber/30 bg-cinema-amber/[0.12] px-3 py-1.5">
                  <Star className="h-3.5 w-3.5 text-cinema-amber" fill="currentColor" />
                  <span className="font-body text-xs font-black text-cinema-amber">{LESSON_COMPLETION_XP} XP</span>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
                <p className="font-body text-sm leading-relaxed text-cinema-text/80">{lesson.contentBody}</p>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                disabled={completed || completing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-display text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100"
                style={
                  completed
                    ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#4ade80" }
                    : {
                        background: "linear-gradient(135deg, #2D65AE, #4799C1)",
                        color: "#ffffff",
                        boxShadow: "0 8px 24px -8px rgba(45,101,174,0.5)",
                      }
                }
              >
                {completed ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} />
                    Lição concluída
                  </>
                ) : completing ? (
                  "Concluindo…"
                ) : (
                  "Concluir lição"
                )}
              </button>
            </div>

            {/* toggle de modo */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setChatMode("en")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 font-body text-xs font-bold transition-all"
                style={
                  chatMode === "en"
                    ? { background: "linear-gradient(135deg, #2D65AE, #4799C1)", color: "#ffffff", boxShadow: "0 4px 16px -4px rgba(45,101,174,0.4)" }
                    : { backgroundColor: "#F7F9FC", border: "1px solid #E5EAF2", color: "#5C6B7D" }
                }
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Praticar em inglês
              </button>
              <button
                type="button"
                onClick={() => setChatMode("pt")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 font-body text-xs font-bold transition-all"
                style={
                  chatMode === "pt"
                    ? { backgroundColor: "#E5EAF2", border: "1px solid #D5DCE6", color: "#1A2433" }
                    : { backgroundColor: "#F7F9FC", border: "1px solid #E5EAF2", color: "#5C6B7D" }
                }
              >
                <Languages className="h-3.5 w-3.5" />
                Tirar dúvidas em português
              </button>
            </div>

            {/* chat com o tutor — key={chatMode} força remontar (e limpar
                histórico) ao trocar de modo, mesmo comportamento de antes */}
            <div className="mt-5">
              <LessonChat
                key={chatMode}
                title="Tutor de inglês"
                subtitle={chatMode === "en" ? "Modo prática · English" : "Modo dúvidas · Português"}
                placeholder={chatMode === "en" ? "Type a message…" : "Digite sua dúvida…"}
                onSend={(message) =>
                  chatMode === "en"
                    ? chatEn({ lessonId: params.lessonId }, message).then((r) => r.reply)
                    : chatPt(message, params.lessonId).then((r) => r.reply)
                }
              />
            </div>
          </>
        )}
      </div>

      <XpGainToast />
    </div>
  );
}
