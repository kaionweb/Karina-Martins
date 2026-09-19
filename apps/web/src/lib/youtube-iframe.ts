// Tipos mínimos da IFrame Player API do YouTube (evita depender de @types externos).
// Compartilhado entre PlayerFacade (vídeo visível) e o player oculto de Listening.
export interface YTPlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

export interface YTPlayerEvent {
  data: number;
}

export interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

// Carrega a IFrame API apenas uma vez, de forma preguiçosa (após clique do usuário).
export function loadIframeApi(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      document.head.appendChild(script);
    }
  });
}
