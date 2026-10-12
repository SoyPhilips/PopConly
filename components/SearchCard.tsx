"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CatalogItem } from "@/lib/catalog";
import { loadMyList, saveMyList, toggleMyList } from "@/lib/myListStore";
import { pushFavorite } from "@/lib/myListSync";
import { LikeButton, PlusCheckButton } from "./ActionButtons";
import YoutubePlayer from "./YoutubePlayer";
import { warmTrailer } from "@/lib/preloadTrailer";
import { thumb } from "@/lib/thumb";

function SearchPreviewVideo({
  src,
  onSound,
  onReady,
  ready,
}: {
  src: string;
  onSound: () => void;
  onReady: () => void;
  ready: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onPlaying={onReady}
      onCanPlay={() => {
        // Al escribir hubo teclas (gesto válido): intenta con sonido por defecto.
        const v = ref.current;
        if (!v) return;
        v.muted = false;
        v.play()
          .then(() => onSound())
          .catch(() => {});
      }}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export function SearchCard({
  item,
  onSelect,
}: {
  item: CatalogItem;
  onSelect: (item: CatalogItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [inList, setInList] = useState(false);
  const [pvMuted, setPvMuted] = useState(true);
  const [pvReady, setPvReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const watchUrl = `/watch?title=${encodeURIComponent(item.title)}`;

  useEffect(() => {
    if (expanded) {
      setInList(loadMyList().some((i) => i.title === item.title));
    }
  }, [expanded, item.title]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const enter = () => {
    warmTrailer(item.title);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setExpanded(true), 450);
  };

  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    setExpanded(false);
    setPvMuted(true);
    setPvReady(false);
  };

  const genres = (item.genres ?? []).slice(0, 3);

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>      {/* Carátula base 16:9 */}
      <button
        onClick={() => onSelect(item)}
        className="block w-full aspect-video rounded-lg overflow-hidden bg-[#1b1b1f] cursor-pointer group"
      >
        <span className="relative block w-full h-full">
          <img
            src={thumb(item.image, 640)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          {typeof item.progress === "number" && item.progress > 0 && (
            <span className="absolute bottom-0 inset-x-0 h-1 bg-white/25 block">
              <span className="h-full bg-[#e50914] block" style={{ width: `${item.progress}%` }} />
            </span>
          )}
        </span>
      </button>

      {/* Vista previa expandida */}
      {expanded && (
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button,a")) return;
            router.push(watchUrl);
          }}
          className="preview-in absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[54%] w-[136%] z-40 rounded-xl overflow-hidden bg-[#1b1b1f] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <div className="relative aspect-video">
            <img src={thumb(item.image, 640)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {expanded && item.trailerYoutube ? (
              <YoutubePlayer
                videoId={item.trailerYoutube}
                autoplay
                muted
                loop
                controls={false}
                className="absolute inset-0"
                onPlaying={() => {
                  setPvReady(true);
                  setPvMuted(false);
                }}
              />
            ) : null}
            {expanded && !item.trailerYoutube && item.trailerUrl && (
              <SearchPreviewVideo
                src={item.trailerUrl}
                onSound={() => setPvMuted(false)}
                onReady={() => setPvReady(true)}
                ready={pvReady}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1f] via-transparent to-transparent" />
            <p className="absolute bottom-2 left-3 right-3 font-extrabold uppercase tracking-wide truncate text-sm drop-shadow">
              {item.title}
            </p>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Link
                href={watchUrl}
                aria-label="Reproducir"
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </Link>
              <PlusCheckButton
                key={`pc-${item.title}-${inList}`}
                outline
                className="w-9 h-9 [&_svg]:w-5 [&_svg]:h-5"
                initialOn={inList}
                onToggle={() => {
                  const next = toggleMyList(item, loadMyList());
                  saveMyList(next);
                  const added = next.some((i) => i.title === item.title);
                  setInList(added);
                  pushFavorite(item.title, added);
                }}
              />
              <LikeButton outline className="w-9 h-9 [&_span]:text-[20px]" />
              <div className="flex-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const v = (
                    e.currentTarget.closest(".preview-in") as HTMLElement | null
                  )?.querySelector("video") as HTMLVideoElement | null;
                  if (v) {
                    v.muted = !v.muted;
                    if (!v.muted) v.play().catch(() => {});
                    setPvMuted(v.muted);
                  }
                }}
                aria-label={pvMuted ? "Activar sonido" : "Silenciar"}
                className="w-9 h-9 rounded-full border-2 border-white/40 hover:border-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {pvMuted ? "volume_off" : "volume_up"}
                </span>
              </button>
              <button
                onClick={() => {
                  setExpanded(false);
                  onSelect(item);
                }}
                aria-label="Más información"
                className="w-9 h-9 rounded-full border-2 border-white/40 hover:border-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs">
              {item.match && (
                <span className="font-bold text-[#7ee2a8]">{item.match}</span>
              )}
              {item.age && (
                <span className="px-1.5 py-0.5 border border-white/40 text-[10px]">{item.age}</span>
              )}
              <span className="text-white/80">{item.meta ?? `${item.year ?? ""} • ${item.type ?? ""}`}</span>
              <span className="px-1 rounded border border-white/40 text-[9px] font-bold">HD</span>
            </div>

            {genres.length > 0 && (
              <p className="text-xs text-white/80 mt-2">
                {genres.map((g, i) => (
                  <span key={g}>
                    {i > 0 && <span className="text-white/30"> • </span>}
                    {g}
                  </span>
                ))}
              </p>
            )}

            {typeof item.progress === "number" && item.progress > 0 && (
              <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[#e50914]" style={{ width: `${item.progress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
