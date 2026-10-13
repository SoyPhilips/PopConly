"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import YoutubePlayer, { type YTController } from "@/components/YoutubePlayer";
import { findTitle } from "@/lib/findTitle";
import type { CatalogItem } from "@/lib/catalog";
import { slugify } from "@/lib/slugs";
import { getActiveProfile } from "@/lib/activeProfile";
import { thumb } from "@/lib/thumb";

function fmt(totalSecs: number) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function WatchPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [flash, setFlash] = useState(0);
  const [controls, setControls] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [resumed, setResumed] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const { status } = useSession();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTitle(sp.get("title") ?? "");
    const id = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(id);
  }, []);

  const localItem = useMemo(() => findTitle(title), [title]);
  const [remoteItem, setRemoteItem] = useState<CatalogItem | null>(null);
  const [remoteTried, setRemoteTried] = useState(false);

  // Si el título no está en el catálogo local, se intenta en Mongo
  // (/api/titles) antes de mostrar "Título no encontrado".
  useEffect(() => {
    if (!title || localItem || remoteTried) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/titles?slug=${encodeURIComponent(slugify(title))}`
        );
        if (res.ok) {
          const data = (await res.json()) as { doc?: CatalogItem };
          if (!cancelled && data.doc) setRemoteItem(data.doc);
        }
      } catch {
        /* sin conexión */
      } finally {
        if (!cancelled) setRemoteTried(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [title, localItem, remoteTried]);

  // El doc remoto solo entra si el local no lo tiene (el local manda).
  const item = localItem ?? remoteItem;
  const resolved = Boolean(item);
  const fakeTotal = useMemo(
    () => (item ? 4500 + (hashStr(item.title) % 3600) : 5400),
    [item]
  );
  const [realTotal, setRealTotal] = useState<number | null>(null);
  const [knownTrailerSecs, setKnownTrailerSecs] = useState<number | null>(null);
  // Duración conocida del trailer (sincronizada) > total real del player > simulado.
  const total = realTotal ?? knownTrailerSecs ?? fakeTotal;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trailerYt, setTrailerYt] = useState<string | null>(null);
  const [searchingTrailer, setSearchingTrailer] = useState(false);
  const [trailerAlts, setTrailerAlts] = useState<{ videoId: string; durationSecs: number }[]>([]);
  const [altIndex, setAltIndex] = useState(0);
  const [ytBlocked, setYtBlocked] = useState(false);
  const [ytCode, setYtCode] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytRef = useRef<YTController | null>(null);
  const resumeRef = useRef<number | null>(null);
  const hasVideo = Boolean(videoUrl);
  const ytMode = !hasVideo && Boolean(trailerYt);
  const [pos, setPos] = useState(0);
  const ended = pos >= total;

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const saveProgress = useCallback(
    async (p: number) => {
      if (status !== "authenticated" || !item || p <= 0) return;
      try {
        await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slugify(item.title),
            pos: p,
            total,
            profile: getActiveProfile(),
          }),
        });
      } catch {
        /* sin servidor: no se guarda */
      }
    },
    [status, item, total]
  );

  // URL real del video o trailer de YouTube (Módulo 2). Sin ellas, simulación.
  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/titles?slug=${encodeURIComponent(slugify(item.title))}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          doc?: {
            videoUrl?: string;
            trailerYoutube?: string;
            trailerDurationSecs?: number;
            trailerAlts?: { videoId: string; durationSecs: number }[];
          };
        };
        if (cancelled) return;
        setYtBlocked(false);
        setYtCode(0);
        setAltIndex(0);
        if (typeof data.doc?.trailerDurationSecs === "number" && data.doc.trailerDurationSecs > 0) {
          setKnownTrailerSecs(data.doc.trailerDurationSecs);
        }
        setTrailerAlts(
          Array.isArray(data.doc?.trailerAlts)
            ? data.doc.trailerAlts.filter((a) => a?.videoId).slice(0, 2)
            : []
        );
        if (data.doc?.videoUrl) setVideoUrl(data.doc.videoUrl);
        else if (data.doc?.trailerYoutube) setTrailerYt(data.doc.trailerYoutube);
        else if (status === "authenticated") {
          // Sin trailer: se pide sincronizarlo en segundo plano (una vez por
          // visita) y se espera hasta 20s a que aparezca. Si la cuota se
          // agota, queda la vista previa y se intenta otro día (sin marcar fallo).
          void (async () => {
            const slug = slugify(item.title);
            try {
              setSearchingTrailer(true);
              const post = await fetch("/api/admin/trailers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slugs: [slug], limit: 1 }),
              });
              if (!post.ok) return; // 401/429/503: se queda la vista previa
              for (let i = 0; i < 4; i++) {
                await new Promise((r) => setTimeout(r, 5000));
                if (cancelled) return;
                try {
                  const g = await fetch(`/api/titles?slug=${encodeURIComponent(slug)}`);
                  if (!g.ok) continue;
                  const jd = (await g.json()) as {
                    doc?: {
                      trailerYoutube?: string;
                      trailerDurationSecs?: number;
                      trailerAlts?: { videoId: string; durationSecs: number }[];
                    };
                  };
                  if (jd.doc?.trailerYoutube) {
                    if (typeof jd.doc.trailerDurationSecs === "number" && jd.doc.trailerDurationSecs > 0) {
                      setKnownTrailerSecs(jd.doc.trailerDurationSecs);
                    }
                    setTrailerAlts(
                      Array.isArray(jd.doc.trailerAlts)
                        ? jd.doc.trailerAlts.filter((a) => a?.videoId).slice(0, 2)
                        : []
                    );
                    setTrailerYt(jd.doc.trailerYoutube);
                    return;
                  }
                } catch {
                  /* reintenta */
                }
              }
            } catch {
              /* vista previa */
            } finally {
              if (!cancelled) setSearchingTrailer(false);
            }
          })();
        }
      } catch {
        /* simulación */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item, status]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (status === "authenticated" && item) {
        try {
          const res = await fetch(
            `/api/progress?slug=${encodeURIComponent(slugify(item.title))}&profile=${encodeURIComponent(getActiveProfile())}`
          );
          if (res.ok) {
            const data = (await res.json()) as { pos?: number };
            if (!cancelled && typeof data.pos === "number" && data.pos > 0) {
              const p = Math.min(data.pos, total);
              setPos(p);
              resumeRef.current = p;
              setResumed(true);
              return;
            }
          }
        } catch {
          /* cae al progreso local */
        }
      }
      if (!cancelled && item?.progress) {
        const p = Math.floor((total * item.progress) / 100);
        setPos(p);
        resumeRef.current = p;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, status]);

  useEffect(() => {
    if (hasVideo || !playing || ended) return;
    const id = setInterval(() => setPos((p) => Math.min(total, p + 1)), 1000);
    return () => clearInterval(id);
  }, [hasVideo, playing, ended, total]);

  // Guardar minuto exacto: cada 10s viendo, al pausar y al salir.
  useEffect(() => {
    if (!playing || ended) {
      if (!playing) saveProgress(posRef.current);
      return;
    }
    const id = setInterval(() => saveProgress(posRef.current), 10000);
    return () => clearInterval(id);
  }, [playing, ended, saveProgress]);

  useEffect(() => {
    return () => {
      saveProgress(posRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poke = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 2800);
  }, []);

  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [poke]);

  // Polling del reproductor YouTube: posición, duración y fin real.
  useEffect(() => {
    if (!ytMode || !playing || ended) return;
    const id = setInterval(() => {
      const c = ytRef.current;
      if (!c) return;
      const t = c.getTotal();
      if (t > 0) setRealTotal(t);
      setPos(Math.min(c.getPos(), t > 0 ? t : Number.MAX_SAFE_INTEGER));
      if (!c.isPlaying()) setPlaying(false);
    }, 1000);
    return () => clearInterval(id);
  }, [ytMode, playing, ended]);

  // Reanudar el trailer de YouTube donde quedó el perfil (línea roja real).
  useEffect(() => {
    if (!ytMode || !resumed) return;
    const target = resumeRef.current ?? 0;
    if (target <= 0) return;
    let tries = 0;
    const id = setInterval(() => {
      const c = ytRef.current;
      tries += 1;
      if (c && c.getTotal() > 0) {
        if (target < c.getTotal()) {
          c.seek(target);
          setPos(target);
        }
        clearInterval(id);
      } else if (tries > 20) {
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [ytMode, resumed, trailerYt]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    const yc = ytMode ? ytRef.current : null;
    if (yc) {
      if (ended) {
        yc.seek(0);
        setPos(0);
        yc.play();
        setPlaying(true);
      } else if (yc.isPlaying()) {
        yc.pause();
        setPlaying(false);
      } else {
        yc.play();
        setPlaying(true);
      }
    } else if (hasVideo && v) {
      if (ended) {
        v.currentTime = 0;
        setPos(0);
        v.play().catch(() => {});
      } else if (v.paused) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    } else if (ended) {
      setPos(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
    setFlash((f) => f + 1);
    poke();
  }, [ended, hasVideo, ytMode, poke]);

  // El <video> manda sobre el estado cuando hay URL real.
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.currentTime)) setPos(Math.floor(v.currentTime));
  };
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    const dur = Math.floor(v.duration);
    setRealTotal(dur);
    const resume = resumeRef.current ?? 0;
    if (resume > 0 && resume < dur) {
      v.currentTime = resume;
      setPos(resume);
    }
    v.play().catch(() => setPlaying(false));
  };
  const onPlayEvt = () => setPlaying(true);
  const onPauseEvt = () => setPlaying(false);
  const onEndedEvt = () => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration)) setPos(Math.floor(v.duration));
    setPlaying(false);
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
    if (ytMode && ytRef.current) ytRef.current.setMuted(muted);
  }, [muted, ytMode]);

  useEffect(() => {
    if (flash === 0) return;
    const id = setTimeout(() => setFlash(0), 650);
    return () => clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = hasVideo ? videoRef.current : null;
      const yc = ytMode ? ytRef.current : null;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") {
        if (yc) yc.seek(Math.min(yc.getTotal(), yc.getPos() + 10));
        else if (v) v.currentTime = Math.min(v.duration || total, v.currentTime + 10);
        else setPos((p) => Math.min(total, p + 10));
        poke();
      } else if (e.key === "ArrowLeft") {
        if (yc) yc.seek(Math.max(0, yc.getPos() - 10));
        else if (v) v.currentTime = Math.max(0, v.currentTime - 10);
        else setPos((p) => Math.max(0, p - 10));
        poke();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, total, hasVideo, ytMode, poke]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = hasVideo ? videoRef.current : null;
    const yc = ytMode ? ytRef.current : null;
    if (yc && yc.getTotal() > 0) {
      yc.seek(Math.floor(ratio * yc.getTotal()));
    } else if (v && Number.isFinite(v.duration)) {
      v.currentTime = Math.floor(ratio * v.duration);
    } else {
      setPos(Math.floor(ratio * total));
    }
    poke();
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else boxRef.current?.requestFullscreen?.().catch(() => {});
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/browse");
  };

  if (title && !resolved && remoteTried) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo size="md" />
        <p className="text-lg font-semibold">Título no encontrado</p>
        <p className="text-sm text-white/60 max-w-md">
          “{title}” no está en el catálogo actual. Puede que haya sido retirado o
          el enlace sea de una versión anterior.
        </p>
        <Link href="/browse" className="px-6 py-3 rounded-lg bg-[#e50914] font-semibold">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!item) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div
      ref={boxRef}
      onMouseMove={poke}
      className={`fixed inset-0 bg-black text-white overflow-hidden select-none ${
        !controls && playing ? "cursor-none" : ""
      }`}
    >
      {/* Video real > trailer de YouTube > simulación */}
      {hasVideo && videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={item.image}
          playsInline
          preload="auto"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={onPlayEvt}
          onPause={onPauseEvt}
          onEnded={onEndedEvt}
          className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-[1500ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : ytMode && trailerYt ? (
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-[1500ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <YoutubePlayer
            videoId={trailerYt}
            autoplay
            muted={muted}
            loop={false}
            controls
            showMute={false}
            className="absolute inset-0"
            controllerRef={ytRef}
            onPlaying={() => setPlaying(true)}
            onEnded={() => {
              const c = ytRef.current;
              if (c && c.getTotal() > 0) setPos(c.getTotal());
              setPlaying(false);
            }}
            onError={(code) => {
              // Ante error se intenta el siguiente candidato solo (bloqueos
              // por dueño/dominio). Solo si no queda ninguno se avisa.
              const next = altIndex + 1;
              if (next <= trailerAlts.length && trailerAlts[next - 1]) {
                const alt = trailerAlts[next - 1];
                setAltIndex(next);
                setKnownTrailerSecs(alt.durationSecs > 0 ? alt.durationSecs : null);
                setTrailerYt(alt.videoId);
                setPlaying(true);
              } else {
                setYtBlocked(true);
                setYtCode(code);
                setPlaying(false);
              }
            }}
          />
          {ytBlocked && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-[#ffdb9d]">hide_source</span>
              <p className="font-semibold">Este trailer no permite reproducirse aquí</p>
              <p className="text-sm text-white/60 max-w-md">
                El dueño del video lo bloqueó fuera de YouTube. Puedes verlo
                directamente en YouTube.
              </p>
              {ytCode > 0 && (
                <p className="text-[11px] text-white/30 font-mono">código {ytCode}</p>
              )}
              <div className="flex gap-3">
                <a
                  href={`https://www.youtube.com/watch?v=${trailerYt}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-[#ff0000] font-semibold text-sm"
                >
                  Ver en YouTube
                </a>
                <button
                  onClick={back}
                  className="px-5 py-2.5 rounded-lg bg-white/10 font-semibold text-sm cursor-pointer"
                >
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-out ${
            mounted ? "opacity-100" : "opacity-0"
          } ${playing ? "scale-110" : "scale-100"}`}
          style={{ backgroundImage: `url('${thumb(item.image, 1280)}')` }}
        />
      )}
      <div
        className={`absolute inset-0 bg-black/45 transition-opacity duration-[1500ms] ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 to-transparent" />

      {/* Aviso honesto cuando aún no hay trailer sincronizado para este título */}
      {!hasVideo && !ytMode && mounted && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#feb700]/15 border border-[#feb700]/40 backdrop-blur-md text-xs font-semibold text-[#ffdb9d] flex items-center gap-2 pointer-events-none">
          <span className={`material-symbols-outlined text-sm ${searchingTrailer ? "animate-spin" : ""}`}>
            {searchingTrailer ? "sync" : "movie_edit"}
          </span>
          {searchingTrailer
            ? "Buscando el trailer en YouTube…"
            : "Trailer pendiente: se sincroniza con YouTube desde /admin/trailers"}
        </div>
      )}

      {/* Click central */}
      <button aria-label={playing ? "Pausar" : "Reproducir"} onClick={toggle} className="absolute inset-0 w-full h-full cursor-pointer">
        <span key={flash} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {flash > 0 && (
            <span className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {playing ? "pause" : "play_arrow"}
              </span>
            </span>
          )}
        </span>
      </button>

      {/* Barra superior */}
      <div
        className={`absolute top-0 inset-x-0 p-4 md:p-6 flex items-center gap-4 transition-opacity duration-300 ${
          controls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={back}
          aria-label="Volver"
          className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <div className="min-w-0">
          <p className="font-bold truncate text-lg leading-tight">{item.title}</p>
          <p className="text-xs text-white/60 truncate">
            {item.meta ?? `${item.year ?? ""} • ${item.type ?? ""}`} ·{" "}
            {ytMode ? "Tráiler oficial" : hasVideo ? "Reproduciendo" : "Vista previa (trailer pendiente de sincronizar)"}
            {resumed && (
              <span className="ml-2 px-2 py-0.5 rounded bg-white/15 text-white font-semibold">
                Reanudado donde lo dejaste
              </span>
            )}
          </p>
        </div>
        <div className="flex-1" />
        <Logo size="sm" />
      </div>

      {/* Estado final */}
      {ended && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
          <p className="text-xl font-bold">¿Ver de nuevo?</p>
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#e50914] font-semibold cursor-pointer hover:brightness-110"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              replay
            </span>
            Repetir
          </button>
          <button onClick={back} className="text-sm text-white/70 hover:text-white underline underline-offset-4 cursor-pointer">
            Volver al catálogo
          </button>
        </div>
      )}

      {/* Controles inferiores */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 md:p-6 flex flex-col gap-3 transition-opacity duration-300 ${
          controls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span>{fmt(pos)}</span>
          <div onClick={seek} className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group/bar">
            <div
              className="h-full bg-[#e50914] rounded-full relative group-hover/bar:h-2 transition-all"
              style={{ width: `${(pos / total) * 100}%` }}
            >
              <span className="absolute -right-2 -top-[5px] w-4 h-4 rounded-full bg-[#e50914] opacity-0 group-hover/bar:opacity-100" />
            </div>
          </div>
          <span>{fmt(total)}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggle} aria-label={playing ? "Pausar" : "Reproducir"} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {playing && !ended ? "pause" : "play_arrow"}
            </span>
          </button>
          <button onClick={() => {
            const yc = ytMode ? ytRef.current : null;
            const v = videoRef.current;
            if (yc) yc.seek(Math.max(0, yc.getPos() - 10));
            else if (v) v.currentTime = Math.max(0, v.currentTime - 10);
            else setPos((p) => Math.max(0, p - 10));
          }} aria-label="Retroceder 10 segundos" className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined">replay_10</span>
          </button>
          <button onClick={() => {
            const yc = ytMode ? ytRef.current : null;
            const v = videoRef.current;
            if (yc && yc.getTotal() > 0) yc.seek(Math.min(yc.getTotal(), yc.getPos() + 10));
            else if (v && Number.isFinite(v.duration)) v.currentTime = Math.min(v.duration, v.currentTime + 10);
            else setPos((p) => Math.min(total, p + 10));
          }} aria-label="Adelantar 10 segundos" className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined">forward_10</span>
          </button>
          <button onClick={() => {
            if (ytMode && ytRef.current) {
              const yc = ytRef.current;
              yc.setMuted(!muted);
              setMuted(!muted);
            } else {
              setMuted((m) => !m);
            }
          }} aria-label={muted ? "Activar sonido" : "Silenciar"} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined">{muted ? "volume_off" : "volume_up"}</span>
          </button>
          <span className="hidden sm:block text-sm font-semibold truncate">{item.title}</span>
          <div className="flex-1" />
          <span className="hidden md:inline px-2 py-0.5 rounded bg-white/15 text-[10px] font-bold">4K</span>
          <button onClick={fullscreen} aria-label="Pantalla completa" className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined">fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
