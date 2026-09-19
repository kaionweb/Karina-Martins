"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { loadIframeApi, type YTPlayer } from "@/lib/youtube-iframe";

export interface PlayerControls {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
}

interface PlayerFacadeProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  onPlayingChange?: (playing: boolean) => void;
  onReady?: (controls: PlayerControls) => void;
}

export function PlayerFacade({ videoId, title, thumbnailUrl, onPlayingChange, onReady }: PlayerFacadeProps) {
  const [activated, setActivated] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  // Mantém os callbacks em refs para não recriar o player a cada render do pai.
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onReadyRef = useRef(onReady);
  onPlayingChangeRef.current = onPlayingChange;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!activated || !containerRef.current) return;
    let cancelled = false;

    void loadIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        // Domínio sem cookies + sem autoplay: nenhum dado do perfil-criança vai
        // ao player além do embed padrão (CLAUDE.md, seção Perfis CHILD).
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          // Só é seguro chamar métodos do player (getCurrentTime/seekTo/
          // setPlaybackRate) depois desse evento — antes dele, o objeto
          // devolvido por `new YT.Player()` é só um stub, o iframe ainda não
          // terminou de inicializar a ponte com a API.
          onReady: () => {
            onReadyRef.current?.({
              getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
              seekTo: (seconds, allowSeekAhead) => playerRef.current?.seekTo(seconds, allowSeekAhead),
              setPlaybackRate: (rate) => playerRef.current?.setPlaybackRate(rate),
            });
          },
          onStateChange: (event) => {
            onPlayingChangeRef.current?.(event.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [activated, videoId]);

  if (!activated) {
    return (
      <button
        type="button"
        onClick={() => setActivated(true)}
        className="relative block aspect-video w-full overflow-hidden rounded-cinema-md bg-cinema-surface-alt"
        aria-label={`Assistir ${title}`}
      >
        <Image src={thumbnailUrl} alt={title} fill sizes="100vw" className="object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-cinema-full bg-white/90 text-2xl text-black">
            ▶
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-cinema-md bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
