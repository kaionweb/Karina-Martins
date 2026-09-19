import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { TranscriptSentence } from "@ipp/shared";
import { useSentenceLoop } from "@/hooks/useSentenceLoop";
import type { PlayerControls } from "@/components/videos/PlayerFacade";

const sentences: TranscriptSentence[] = [
  {
    id: "s1",
    youtubeVideoId: "yt1",
    order: 1,
    startTime: 0,
    endTime: 4,
    textEn: "Hello",
    textPt: "Olá",
    needsReview: false,
  },
  {
    id: "s2",
    youtubeVideoId: "yt1",
    order: 2,
    startTime: 4,
    endTime: 8,
    textEn: "Good morning",
    textPt: "Bom dia",
    needsReview: false,
  },
];

function makeControls(currentTime: number) {
  const state = { time: currentTime };
  const controls: PlayerControls & { _set: (t: number) => void } = {
    getCurrentTime: () => state.time,
    seekTo: vi.fn((seconds: number) => {
      state.time = seconds;
    }),
    setPlaybackRate: vi.fn(),
    _set: (t: number) => {
      state.time = t;
    },
  };
  return controls;
}

describe("useSentenceLoop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("atualiza progress a partir do player mesmo com o loop desligado", () => {
    const controls = makeControls(2); // metade da frase 0 (0..4)
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    expect(result.current.loopActive).toBe(false);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.progress).toBeCloseTo(0.5, 5);
  });

  it("com loop ligado, faz seek de volta ao início ao passar do fim da frase", () => {
    const controls = makeControls(5); // além do endTime (4) da frase 0
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    act(() => {
      result.current.setLoopActive(true);
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(controls.seekTo).toHaveBeenCalledWith(0, true); // startTime da frase 0
  });

  it("sem loop, NÃO faz seek ao passar do fim", () => {
    const controls = makeControls(5);
    renderHook(() => useSentenceLoop({ sentences, controls }));

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(controls.seekTo).not.toHaveBeenCalled();
  });

  it("aplica setPlaybackRate quando a velocidade muda", () => {
    const controls = makeControls(0);
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    // Chamado ao montar com o default 1.
    expect(controls.setPlaybackRate).toHaveBeenCalledWith(1);

    act(() => {
      result.current.setSpeed(0.5);
    });
    expect(controls.setPlaybackRate).toHaveBeenCalledWith(0.5);
  });

  it("goToSentence muda a frase e faz seek sem alterar o estado do loop", () => {
    const controls = makeControls(0);
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    act(() => {
      result.current.setLoopActive(true);
    });
    act(() => {
      result.current.goToSentence(1);
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentSentence?.id).toBe("s2");
    expect(controls.seekTo).toHaveBeenCalledWith(4, true); // startTime da frase 1
    expect(result.current.loopActive).toBe(true); // loop preservado
  });

  it("goToSentence ignora índices fora dos limites", () => {
    const controls = makeControls(0);
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    act(() => {
      result.current.goToSentence(-1);
    });
    act(() => {
      result.current.goToSentence(99);
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it("sem loop, segue a frase correspondente ao tempo atual (modo legenda)", () => {
    const controls = makeControls(0);
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      controls._set(4); // início da frase 1 (4..8)
      vi.advanceTimersByTime(250);
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentSentence?.id).toBe("s2");
  });

  it("com loop ligado, NÃO segue o tempo — fica travado na frase escolhida", () => {
    const controls = makeControls(0);
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls }));

    act(() => {
      result.current.setLoopActive(true);
    });
    act(() => {
      controls._set(4); // entraria na frase 1 se não fosse o loop
      vi.advanceTimersByTime(250);
    });

    // O loop já deve ter feito seek de volta ao início da frase 0 (endTime 4)
    // em vez de deixar a legenda avançar pra frase 1.
    expect(result.current.currentIndex).toBe(0);
  });

  it("sem controls (player não iniciado), não quebra e não faz polling", () => {
    const { result } = renderHook(() => useSentenceLoop({ sentences, controls: null }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.currentSentence?.id).toBe("s1");
  });
});
