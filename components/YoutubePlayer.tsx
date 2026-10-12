"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
            onError?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  destroy: () => void;
};

export type YTController = {
  getPos: () => number;
  getTotal: () => number;
  play: () => void;
  pause: () => void;
  seek: (s: number) => void;
  setMuted: (m: boolean) => void;
  isMuted: () => boolean;
  isPlaying: () => boolean;
  getState: () => number;
};

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window !== "undefined" && window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

/** Reproductor YouTube con marca mínima (modestbranding, sin relacionados).
 *  Nota honesta: YouTube siempre muestra su logo pequeño en la barra de
 *  controles; no existe embed oficial sin nada de marca. */
export default function YoutubePlayer({
  videoId,
  autoplay = true,
  muted = true,
  loop = true,
  controls = true,
  className = "",
  controllerRef,
  onPlaying,
  onEnded,
  onError,
  showMute = true,
}: {
  videoId: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  controllerRef?: React.MutableRefObject<YTController | null>;
  onPlaying?: () => void;
  onEnded?: () => void;
  onError?: (code: number) => void;
  showMute?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(muted);

  useEffect(() => {
    let player: YTPlayer | null = null;
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      player = new window.YT.Player(hostRef.current, {
        videoId,
        // La API de YouTube REEMPLAZA el div por el iframe con tamaño
        // 640×360 por defecto: se le ordena 100% para que llene la pantalla.
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: muted ? 1 : 0,
          loop: loop ? 1 : 0,
          playlist: videoId,
          modestbranding: 1,
          rel: 0,
          controls: controls ? 1 : 0,
          playsinline: 1,
          disablekb: 0,
        },
        events: {
          onReady: (e) => {
            // Volumen al 100% al arrancar (YouTube a veces hereda un nivel
            // bajo de la cookie; esto no quita el mute inicial).
            try {
              (e.target as unknown as { setVolume?: (v: number) => void }).setVolume?.(100);
            } catch {
              /* mejor esfuerzo */
            }
            if (controllerRef) {
              controllerRef.current = {
                getPos: () => Math.floor(e.target.getCurrentTime() ?? 0),
                getTotal: () => Math.floor(e.target.getDuration() ?? 0),
                play: () => e.target.playVideo(),
                pause: () => e.target.pauseVideo(),
                seek: (s) => e.target.seekTo(s, true),
                setMuted: (m) => {
                  if (m) e.target.mute();
                  else e.target.unMute();
                  setIsMuted(m);
                },
                isMuted: () => e.target.isMuted(),
                isPlaying: () => e.target.getPlayerState() === 1,
                getState: () => e.target.getPlayerState(),
              };
            }
            if (autoplay) e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === 1) onPlaying?.();
            if (e.data === 0) onEnded?.();
          },
          // 101/150 = el dueño no permite embeber; 100 = no existe/privado.
          onError: (e) => onError?.(e.data),
        },
      });
    });
    return () => {
      cancelled = true;
      if (controllerRef) controllerRef.current = null;
      try {
        player?.destroy();
      } catch {
        /* ya destruido */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-black ${className}`}>
      {/* La API de YouTube reemplaza este div por el iframe (ya viene con
          width/height 100% desde el constructor). Sin `relative` en conflicto:
          el contenedor siempre tiene tamaño definido y el alto ya no colapsa a 0. */}
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />
      {showMute && (
        <button
        onClick={() => {
          const c = controllerRef?.current;
          if (!c) return;
          const next = !isMuted;
          c.setMuted(next);
          setIsMuted(next);
        }}
        aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center transition-colors cursor-pointer z-10"
      >
        <span className="material-symbols-outlined text-[20px]">
          {isMuted ? "volume_off" : "volume_up"}
        </span>
      </button>
      )}
    </div>
  );
}
