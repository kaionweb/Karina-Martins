"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptSentence } from "@ipp/shared";
import type { PlayerControls } from "@/components/videos/PlayerFacade";

const POLL_INTERVAL_MS = 250;

interface UseSentenceLoopOptions {
  sentences: TranscriptSentence[];
  controls: PlayerControls | null;
}

interface UseSentenceLoopResult {
  currentSentence: TranscriptSentence | null;
  currentIndex: number;
  total: number;
  loopActive: boolean;
  setLoopActive: (active: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  progress: number;
  goToSentence: (index: number) => void;
}

/**
 * Feature de repetição de frase (A-B repeat) sobre o player real (PlayerFacade).
 *
 * Diferente do componente de referência (que "tickava" tempo simulado só com o
 * loop ligado), aqui o player real sempre sabe a posição de verdade: o polling
 * roda sempre que há `controls`, atualizando `progress` da frase atual o tempo
 * todo — e, quando `loopActive`, faz o seek de volta ao início ao passar do fim.
 *
 * Modo "legenda": enquanto o loop NÃO está ativo, a frase atual acompanha
 * automaticamente a posição real do vídeo (como legenda sincronizada) — assim
 * que o usuário aperta play, o card já mostra a frase certa sem precisar
 * navegar manualmente. Ao clicar em "Repetir", trava na frase que está
 * tocando naquele momento.
 */
export function useSentenceLoop({ sentences, controls }: UseSentenceLoopOptions): UseSentenceLoopResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopActive, setLoopActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const total = sentences.length;
  const currentSentence = total > 0 ? (sentences[currentIndex] ?? null) : null;

  // Refs para o polling ler o estado mais recente sem recriar o intervalo.
  const loopActiveRef = useRef(loopActive);
  const currentIndexRef = useRef(currentIndex);
  const currentSentenceRef = useRef(currentSentence);
  const sentencesRef = useRef(sentences);
  loopActiveRef.current = loopActive;
  currentIndexRef.current = currentIndex;
  currentSentenceRef.current = currentSentence;
  sentencesRef.current = sentences;

  // Polling: enquanto houver player, lê a posição real e (a) sem loop, segue
  // a frase que corresponde ao tempo atual (modo legenda); (b) atualiza o
  // progresso da frase atual; (c) com loop ligado, faz o seek de volta ao
  // início ao passar do fim.
  useEffect(() => {
    if (!controls) return;

    const interval = setInterval(() => {
      const time = controls.getCurrentTime();

      if (!loopActiveRef.current) {
        const list = sentencesRef.current;
        // Cues sobrepostos (legenda automática "rolante" do YouTube) fazem
        // mais de uma frase bater no mesmo instante — busca de trás pra
        // frente pra ficar com a mais recente/completa, não a mais antiga.
        let matchIndex = -1;
        for (let i = list.length - 1; i >= 0; i--) {
          const s = list[i];
          if (time >= s.startTime && time < s.endTime) {
            matchIndex = i;
            break;
          }
        }
        if (matchIndex !== -1 && matchIndex !== currentIndexRef.current) {
          setCurrentIndex(matchIndex);
        }
      }

      const sentence = currentSentenceRef.current;
      if (!sentence) return;

      const span = sentence.endTime - sentence.startTime;
      const ratio = span > 0 ? (time - sentence.startTime) / span : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));

      if (loopActiveRef.current && time >= sentence.endTime) {
        controls.seekTo(sentence.startTime, true);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [controls]);

  // Aplica a velocidade no player sempre que ela muda.
  useEffect(() => {
    controls?.setPlaybackRate(speed);
  }, [controls, speed]);

  // Navega para outra frase sem mexer no estado do loop: se estava ligado,
  // continua ligado na frase nova (o polling re-escopa pro novo endTime porque
  // currentSentence mudou).
  const goToSentence = useCallback(
    (index: number) => {
      if (index < 0 || index >= sentences.length) return;
      setCurrentIndex(index);
      setProgress(0);
      controls?.seekTo(sentences[index].startTime, true);
    },
    [controls, sentences],
  );

  return {
    currentSentence,
    currentIndex,
    total,
    loopActive,
    setLoopActive,
    speed,
    setSpeed,
    progress,
    goToSentence,
  };
}
