"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import YoutubePlayer from "./YoutubePlayer";
import CoverImg from "./CoverImg";
import { loadMyList, saveMyList, toggleMyList } from "@/lib/myListStore";
import { pushFavorite } from "@/lib/myListSync";
import { slugify } from "@/lib/slugs";
import { thumb } from "@/lib/thumb";
export type TitleDetail = {
  title: string;
  image: string;
  year?: string;
  age?: string;
  type?: string;
  genres?: string[];
  synopsis?: string;
  match?: string;
  rating?: string;
  meta?: string;
};

type Props = {
  item: TitleDetail | null;
  onClose: () => void;
  /** En landing no hay Mi Lista: se oculta el botón. */
  hideWatchlist?: boolean;
};

function WatchlistToggle({ item }: { item: TitleDetail }) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setInList(
      loadMyList().some((i) => i.title === item.title)
    );
  }, [item.title]);

  return (
    <button
      onClick={() => {
        const next = toggleMyList(
          {
            title: item.title,
            image: item.image,
            year: item.year,
            age: item.age,
            type: item.type,
            genres: item.genres,
            synopsis: item.synopsis,
            rating: item.rating,
            meta: item.meta,
          },
          loadMyList()
        );
        saveMyList(next);
        const added = next.some((i) => i.title === item.title);
        setInList(added);
        pushFavorite(item.title, added);
      }}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
    >
      <span className="material-symbols-outlined">
        {inList ? "check" : "add"}
      </span>
      {inList ? "En tu lista" : "Mi lista"}
    </button>
  );
}

function ModalBackdrop({ title, image }: { title: string; image: string }) {
  const [trailer, setTrailer] = useState<string | null>(null);
  const [ytId, setYtId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    setTrailer(null);
    setYtId(null);
    setMuted(true);
    setShowVideo(false);
    setVideoReady(false);
    (async () => {
      try {
        const res = await fetch(`/api/titles?slug=${encodeURIComponent(slugify(title))}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          doc?: { trailerUrl?: string; trailerYoutube?: string };
        };
        if (cancelled) return;
        if (data.doc?.trailerYoutube) setYtId(data.doc.trailerYoutube);
        else if (data.doc?.trailerUrl) setTrailer(data.doc.trailerUrl);
      } catch {
        /* imagen fija */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [title]);

  // Retardo fijo con fundido: el preview siempre aparece igual, sin importar la red.
  useEffect(() => {
    if (!trailer && !ytId) return;
    const id = setTimeout(() => setShowVideo(true), 600);
    return () => clearTimeout(id);
  }, [trailer, ytId]);

  const trySound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play()
      .then(() => setMuted(false))
      .catch(() => {
        v.muted = true;
        setMuted(true);
      });
  };

  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-2xl bg-black">
        <CoverImg
          src={thumb(image, 1280)}
          alt={title}
          loading="eager"
          wrapperClassName="absolute inset-0"
          className="w-full h-full object-cover"
        />
      {showVideo && ytId ? (
        <YoutubePlayer
          videoId={ytId}
          autoplay
          muted
          loop
          controls
          className={`absolute inset-0 transition-opacity duration-500 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          onPlaying={() => {
            setVideoReady(true);
            setMuted(false);
          }}
        />
      ) : null}
      {showVideo && !ytId && trailer && (
        <video
          key={trailer}
          ref={videoRef}
          src={trailer}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={trySound}
          onPlaying={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
      <h2 className="absolute bottom-5 left-6 md:left-10 right-6 text-4xl md:text-6xl font-extrabold tracking-[0.08em] uppercase drop-shadow-2xl">
        {title}
      </h2>
      {trailer && !ytId && (
        <button
          onClick={() => {
            const v = videoRef.current;
            const next = !muted;
            if (v) {
              v.muted = next;
              if (!next) v.play().catch(() => {});
            }
            setMuted(next);
          }}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          className="absolute bottom-5 right-6 md:right-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">
            {muted ? "volume_off" : "volume_up"}
          </span>
        </button>
      )}
    </div>
  );
}

export default function TitleModal({ item, onClose, hideWatchlist = false }: Props) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const genres = item.genres ?? [];
  const year = item.year ?? "2026";
  const age = item.age ?? "16+";
  const kind = item.type ?? "Serie";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes popIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div
        className="relative w-full max-w-[880px] max-h-[92vh] overflow-y-auto rounded-2xl bg-[#141416] border border-white/10 shadow-2xl animate-[popIn_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop (con preview si existe) */}
        <ModalBackdrop title={item.title} image={item.image} />
        <div className="relative">
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Info */}
        <div className="px-6 md:px-10 pt-4 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {Array.from(new Set([year, age, kind, ...genres])).map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="px-2.5 py-1.5 rounded-md bg-white/10 text-[13px] font-semibold text-white/90"
              >
                {t}
              </span>
            ))}
            {item.match && (
              <span className="px-2.5 py-1.5 rounded-md bg-[#feb700]/15 text-[13px] font-bold text-[#ffba20]">
                {item.match}
              </span>
            )}
            {item.rating && (
              <span className="px-2.5 py-1.5 rounded-md bg-white/10 text-[13px] font-bold text-[#ffba20] flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {item.rating}
              </span>
            )}
          </div>

          <p className="mt-5 text-[15px] md:text-base leading-relaxed text-white/90 max-w-3xl">
            {item.synopsis ??
              "Una historia intensa que mezcla conspiración, familia y poder. Cuando todo parece perdido, un giro inesperado obliga a elegir entre la lealtad y la verdad."}
          </p>
          {item.meta && (
            <p className="mt-3 text-xs text-white/50">{item.meta}</p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch?title=${encodeURIComponent(item.title)}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white text-lg font-medium transition-colors cursor-pointer"
            >
              Comienza ya
              <span className="material-symbols-outlined text-2xl">
                chevron_right
              </span>
            </Link>
            {!hideWatchlist && <WatchlistToggle item={item} />}
          </div>
          <Link
            href={`/titulo/${slugify(item.title)}`}
            onClick={onClose}
            className="inline-block mt-4 text-xs text-white/60 hover:text-white underline underline-offset-4"
          >
            Ver ficha completa
          </Link>
        </div>
      </div>
    </div>
  );
}
