"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Crown, Loader2, Lock, Mic, Star, Trophy, Volume2 } from "lucide-react";
import { isTrialActive, trialDaysRemaining } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { TrialBanner } from "@/components/access-control/TrialBanner";
import { LEVEL_STYLES, levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { checkIsAdmin } from "@/lib/api/admin";
import { useProfileStore } from "@/stores/useProfileStore";
import { pronunciaMock, type MockPalavra } from "../_mock/content";

const NIVEIS: Nivel[] = ["Básico", "Intermediário", "Avançado"];

// Catálogo 100% mock (sem backend — ver comentário em _mock/content.ts): a
// trava aqui é só visual. Básico sempre livre; Intermediário/Avançado ficam
// bloqueados fora do trial (sem noção de "progresso", só nível).
function isNivelUnlocked(nivel: Nivel, trialActive: boolean, bypass: boolean): boolean {
  return bypass || trialActive || nivel === "Básico";
}

type Feedback = {
  message: string;
  tone: "success" | "error" | "neutral";
};

type RecordingResult = { transcript: string; stars: number } | { error: string };

// Ouça/grave usam as Web Speech APIs nativas do navegador (SpeechSynthesis +
// SpeechRecognition) — sem custo de API, sem chamada de rede. SpeechRecognition
// não é padronizada (não existe no lib.dom.d.ts do TS) e tem suporte instável
// no Safari/iOS — daí o banner de aviso quando supportsRecognition é false.
function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [supportsRecognition, setSupportsRecognition] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupportsRecognition(!!SpeechRecognitionCtor);
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // interrompe qualquer fala anterior
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85; // um pouco mais devagar — ajuda criança pequena
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const startRecording = useCallback((targetWord: string, onResult: (result: RecordingResult) => void) => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      onResult({ error: "unsupported" });
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      const target = targetWord.trim().toLowerCase();

      let stars: number;
      if (transcript === target) stars = 3;
      else if (transcript.includes(target) || target.includes(transcript)) stars = 2;
      else stars = 1;

      onResult({ transcript, stars });
    };

    recognition.onerror = (event: any) => {
      onResult({ error: event.error });
    };

    recognition.onend = () => setListening(false);

    try {
      recognition.start();
    } catch {
      setListening(false);
      onResult({ error: "start-failed" });
    }
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { speak, startRecording, stopRecording, speaking, listening, supportsRecognition };
}

export default function PronunciaPage() {
  const router = useRouter();
  const [nivel, setNivel] = useState<Nivel>("Básico");
  const [wordSets, setWordSets] = useState<MockPalavra[]>(pronunciaMock);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { speak, startRecording, stopRecording, speaking, listening, supportsRecognition } = useSpeech();

  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isAdult = activeProfile?.type === "ADULT";
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

  const trialActive = isTrialActive(activeProfile?.trialStartedAt);
  const bypass = isAdmin;
  const nivelUnlocked = isNivelUnlocked(nivel, trialActive, bypass);

  const words = useMemo(() => wordSets.filter((w) => w.nivel === nivel), [wordSets, nivel]);
  const current = words[index];
  const style = levelStyle(nivel);
  const isLast = index === words.length - 1;
  const totalStars = words.reduce((sum, w) => sum + w.estrelas, 0);

  function changeLevel(newNivel: Nivel) {
    setNivel(newNivel);
    setIndex(0);
    setFeedback(null);
  }

  function goPrev() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setFeedback(null);
  }

  function goNext() {
    if (isLast) return;
    setIndex((i) => i + 1);
    setFeedback(null);
  }

  function handlePlay() {
    speak(current.word);
  }

  function handleRecord() {
    if (listening) {
      stopRecording();
      return;
    }

    startRecording(current.word, (result) => {
      if ("error" in result) {
        const message =
          result.error === "unsupported"
            ? "Seu navegador não suporta gravação de voz. Tenta no Chrome."
            : result.error === "not-allowed"
              ? "Precisa permitir o uso do microfone."
              : "Não consegui ouvir. Tenta de novo!";
        setFeedback({ message, tone: "error" });
      } else {
        setWordSets((prev) =>
          prev.map((w) => (w.id === current.id ? { ...w, estrelas: Math.max(w.estrelas, result.stars) } : w)),
        );
        const msgByStars: Record<number, string> = { 3: "Perfeito! 🎉", 2: "Quase lá! 👍", 1: "Continue tentando!" };
        setFeedback({ message: msgByStars[result.stars], tone: result.stars >= 2 ? "success" : "neutral" });
      }

      setTimeout(() => setFeedback(null), 2500);
    });
  }

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 flex items-center justify-between border-b border-cinema-border px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface"
        >
          <ArrowLeft className="h-4 w-4 text-cinema-muted" />
        </button>
        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 sm:max-w-lg md:max-w-xl">
        <div className="pt-5">
          <div className="mb-1 flex items-center gap-2">
            <Mic className="h-5 w-5" style={{ color: "#DA233B" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Pronúncia</h1>
          </div>
          <p className="font-body text-sm text-cinema-muted">Ouça, repita e ganhe estrelas pela pronúncia</p>

          {!supportsRecognition && (
            <div className="mt-3 rounded-xl border border-cinema-amber/30 bg-cinema-amber/[0.1] px-3 py-2">
              <p className="font-body text-xs font-semibold text-cinema-amber">
                Seu navegador não suporta gravação de voz — tenta abrir no Chrome pra usar essa função.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <TrialBanner trialActive={trialActive} bypass={bypass} daysLeft={trialDaysRemaining(activeProfile?.trialStartedAt)} />
        </div>

        {/* Seletor de nível */}
        <div className="mt-4 flex gap-2">
          {NIVEIS.map((l) => {
            const unlocked = isNivelUnlocked(l, trialActive, bypass);
            return (
              <button
                key={l}
                type="button"
                onClick={() => changeLevel(l)}
                className="flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 font-body text-xs font-bold transition-all"
                style={
                  nivel === l
                    ? { background: LEVEL_STYLES[l].chipBg, color: "#ffffff", boxShadow: `0 4px 16px -4px ${LEVEL_STYLES[l].glow}` }
                    : { backgroundColor: "rgb(var(--cinema-surface-alt))", border: "1px solid rgb(var(--cinema-border))", color: "rgb(var(--cinema-muted))" }
                }
              >
                {!unlocked && <Crown className="h-2.5 w-2.5" />}
                {LEVEL_STYLES[l].label}
              </button>
            );
          })}
        </div>

        {!nivelUnlocked ? (
          <LockedLevelPanel style={style} />
        ) : (
          <>
        {/* Progresso do nível */}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-body text-xs font-bold text-cinema-muted">
            Palavra {index + 1} de {words.length}
          </span>
          <div className="flex items-center gap-1 rounded-full border border-cinema-amber/30 bg-cinema-amber/[0.12] px-2.5 py-1">
            <Trophy className="h-3 w-3" style={{ color: "#d97706" }} />
            <span className="font-body text-[10px] font-black" style={{ color: "#92400e" }}>
              {totalStars}/{words.length * 3} estrelas
            </span>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cinema-border">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((index + 1) / words.length) * 100}%`, background: style.chipBg }}
          />
        </div>

        {/* Card da palavra atual */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-cinema-border bg-cinema-surface p-8 text-center"
            style={{ boxShadow: `0 20px 50px -20px ${style.glow}` }}
          >
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${style.cardGradient}`}
              style={{ boxShadow: `0 12px 30px -10px ${style.glow}` }}
            >
              <span className="text-5xl">{current.emoji}</span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-cinema-text">{current.word}</h2>
              <p className="font-body text-sm font-semibold text-cinema-muted">{current.traducao}</p>
            </div>

            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Star
                  key={i}
                  className="h-5 w-5"
                  style={{ color: i < current.estrelas ? "#FBC607" : "rgb(var(--cinema-border))" }}
                  fill={i < current.estrelas ? "#FBC607" : "none"}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                disabled={speaking}
                aria-label={`Ouvir ${current.word}`}
                className={`flex h-12 w-12 items-center justify-center rounded-full border border-cinema-border transition-transform active:scale-90 ${
                  speaking ? "animate-pulse bg-cinema-primary/15" : "bg-cinema-surface-alt"
                }`}
              >
                <Volume2 className="h-5 w-5" style={{ color: speaking ? "#2D65AE" : "rgb(var(--cinema-muted))" }} />
              </button>
              <button
                type="button"
                onClick={handleRecord}
                aria-label={listening ? "Parar gravação" : `Gravar ${current.word}`}
                aria-pressed={listening}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-90 ${
                  listening ? "animate-pulse-ring bg-red-600" : ""
                }`}
                style={listening ? undefined : { background: "linear-gradient(135deg, #2D65AE, #4799C1)" }}
              >
                {listening ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-full px-4 py-1.5 font-body text-xs font-bold"
                  style={{
                    backgroundColor: feedback.tone === "success" ? "rgba(34,197,94,0.12)" : feedback.tone === "error" ? "rgba(239,68,68,0.12)" : "rgba(100,116,139,0.12)",
                    color: feedback.tone === "success" ? "#16a34a" : feedback.tone === "error" ? "#dc2626" : "#475569",
                  }}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Navegação — anterior / próxima palavra */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            aria-label="Palavra anterior"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-cinema-muted" />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-display text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
            style={{ background: style.chipBg }}
          >
            {isLast ? "Última palavra do nível" : "Próxima palavra"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {isLast && totalStars === words.length * 3 && (
          <div className="mt-4 rounded-2xl border border-green-500/25 bg-green-500/[0.08] p-4 text-center">
            <p className="font-display text-sm font-bold text-green-600">
              🎉 Nível {style.label} completo com 3 estrelas em tudo!
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

function LockedLevelPanel({ style }: { style: ReturnType<typeof levelStyle> }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 rounded-3xl border border-amber-400/30 bg-amber-400/5 p-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}
      >
        <Lock className="h-7 w-7 text-white" />
      </div>
      <p className="mt-2 font-display text-[15px] font-semibold text-cinema-text">Nível {style.label} bloqueado</p>
      <p className="font-body text-[13px] text-cinema-muted">
        Seu trial acabou e esse nível não está disponível no plano gratuito. Assine o Premium pra praticar pronúncia
        neste nível.
      </p>
    </div>
  );
}
