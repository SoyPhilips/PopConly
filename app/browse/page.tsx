"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import BrowseHeader from "@/components/BrowseHeader";
import TitleModal, { type TitleDetail } from "@/components/TitleModal";
import SearchResults from "@/components/SearchResults";
import { PosterMiniCard } from "@/components/PrototypeCards";
import CoverImg from "@/components/CoverImg";
import { LikeButton, PlusCheckButton } from "@/components/ActionButtons";
import { useSearchScroll } from "@/lib/useSearchScroll";
import { allTitles } from "@/lib/findTitle";
import { slugify } from "@/lib/slugs";
import { warmTrailer } from "@/lib/preloadTrailer";
import { thumb } from "@/lib/thumb";
import { getActiveProfile } from "@/lib/activeProfile";
import { useSmartHero } from "@/lib/useSmartHero";
import { readRecsCache, sameRecs, writeRecsCache } from "@/lib/recsCache";
import type { CatalogItem } from "@/lib/catalog";
import {
  BROWSE_HERO,
  CONTINUE_WATCHING,
  TOP_FIVE,
  RECENTLY_ADDED,
} from "@/lib/realPicks";
import { GENRES, SYNOPSIS } from "@/lib/data";

export default function BrowsePage() {
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [activeGenre, setActiveGenre] = useState(GENRES[0]);
  const [query, setQuery] = useState("");
  useSearchScroll(query);
  const [selected, setSelected] = useState<TitleDetail | null>(null);
  const [serverContinue, setServerContinue] = useState<typeof CONTINUE_WATCHING | null>(null);
  const [progressDone, setProgressDone] = useState(false);
  const [recs, setRecs] = useState<{ items: CatalogItem[]; reason: string | null }>({
    items: [],
    reason: null,
  });
  const [recsDone, setRecsDone] = useState(false);
  const [needsPlan, setNeedsPlan] = useState(false);
  // Top 5 global y Recién llegados: datos reales (null = cargando → skeletons).
  type TopRow = {
    rank: number;
    title: string;
    genre: string;
    meta?: string;
    rating: string;
    match?: string;
    age?: string;
    tech?: string;
    image: string;
    alt?: string;
  };
  const [top5, setTop5] = useState<TopRow[] | null>(null);
  const [recent, setRecent] = useState<typeof RECENTLY_ADDED | null>(null);
  const { status } = useSession();

  // Top global + recientes: públicos, sin sesión. Nunca demos que se reemplazan.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // --- Top 5 más vistos en toda la plataforma ---
      try {
        const r = await fetch("/api/top");
        if (r.ok) {
          const d = (await r.json()) as { slugs?: string[] };
          if (d.slugs && d.slugs.length > 0) {
            const t = await fetch(`/api/titles?slugs=${encodeURIComponent(d.slugs.slice(0, 5).join(","))}`);
            if (t.ok) {
              const docs = (await t.json()) as { items?: CatalogItem[] };
              const mapped = (docs.items ?? []).map((x, i) => ({
                rank: i + 1,
                title: x.title,
                genre: (x.genres ?? []).slice(0, 2).join(" • ") || "Destacado",
                meta: `${x.year ?? ""} • ${(x.genres ?? [])[0] ?? ""}`.trim(),
                rating: x.rating ?? "",
                match: x.match,
                age: x.age ?? "16+",
                tech: "4K HDR",
                image: x.image,
                alt: `Póster de ${x.title}`,
              }));
              if (!cancelled && mapped.length > 0) {
                setTop5(mapped);
              }
            }
          }
        }
      } catch {
        /* vitrina de respaldo abajo */
      }
      if (!cancelled) {
        // Sin vistas aún: lo mejor valorado (real) en vez de hueco.
        setTop5((prev) => {
          if (prev) return prev;
          return TOP_FIVE;
        });
      }
      // --- Agregados recientemente (últimos sincronizados en DB) ---
      try {
        const r = await fetch("/api/recent?limit=6");
        if (r.ok) {
          const d = (await r.json()) as { items?: CatalogItem[] };
          const mapped = (d.items ?? []).slice(0, 6).map((x) => ({
            title: x.title,
            desc: (x.synopsis ?? "").slice(0, 90),
            meta: x.meta ?? `${x.year ?? ""} • ${x.type ?? ""}`.trim(),
            tag: "NUEVO",
            rating: x.rating ?? "",
            tech: "4K HDR",
            badgeStyle: "red" as const,
            image: x.image,
          }));
          if (!cancelled && mapped.length > 0) {
            setRecent(mapped);
          }
        }
      } catch {
        /* vitrina de respaldo abajo */
      }
      if (!cancelled) {
        setRecent((prev) => prev ?? RECENTLY_ADDED);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Módulo 3: historial real + recomendados (solo con sesión; si no, datos locales).
  // Los recomendados se pintan de caché al instante y solo cambian si el
  // servidor trae otros distintos (nunca reemplazos visibles en recarga).
  useEffect(() => {
    if (status !== "authenticated") return;
    const cached = readRecsCache();
    if (cached && cached.items.length > 0) {
      setRecs({ items: cached.items, reason: cached.reason });
    }
    (async () => {
      try {
        const s = await fetch("/api/me/subscription");
        if (s.ok) {
          const sub = (await s.json()) as { active?: boolean; billing?: boolean };
          if (sub.billing && !sub.active) setNeedsPlan(true);
        }
      } catch {
        /* sin facturación: no se bloquea */
      }
      try {
        const profile = encodeURIComponent(getActiveProfile());
        const r = await fetch(`/api/progress?profile=${profile}`);
        if (r.ok) {
          const d = (await r.json()) as {
            items?: { slug: string; pos: number; total: number }[];
          };
          const entries = (d.items ?? []).slice(0, 4);
          if (entries.length > 0) {
            const t = await fetch(
              `/api/titles?slugs=${encodeURIComponent(entries.map((e) => e.slug).join(","))}`
            );
            if (t.ok) {
              const docs = (await t.json()) as { items?: CatalogItem[] };
              const bySlug = new Map(
                (docs.items ?? []).map((x) => [slugify(x.title), x])
              );
              const resolved = entries
                .map((e) => {
                  const item = bySlug.get(e.slug);
                  if (!item) return null;
                  // Línea roja REAL: % del trailer que este perfil vio (pos/total
                  // guardados desde el reproductor YouTube, por segundo).
                  const pct = e.total > 0 ? Math.round((e.pos / e.total) * 100) : 0;
                  const restSecs = Math.max(0, Math.round(e.total - e.pos));
                  const isTrailer = e.total > 0 && e.total < 600;
                  const leftLabel =
                    restSecs >= 60
                      ? `Quedan ${Math.round(restSecs / 60)} min`
                      : `Quedan ${restSecs} s`;
                  return {
                    title: item.title,
                    episode: `${isTrailer ? "Trailer" : (item.type ?? "Serie")} • ${leftLabel}`,
                    desc: (item.synopsis ?? "").slice(0, 70),
                    progress: pct,
                    tech: "4K",
                    image: item.image,
                  };
                })
                .filter((x): x is (typeof CONTINUE_WATCHING)[number] => x !== null);
              if (resolved.length > 0) setServerContinue(resolved);
              else setServerContinue([]);
            } else {
              setServerContinue([]);
            }
          } else {
            setServerContinue([]);
          }
        }
        } catch {
          /* fallback local */
        }
        setProgressDone(true);
      try {
        const r = await fetch(`/api/recommendations?profile=${encodeURIComponent(getActiveProfile())}`);
        if (r.ok) {
          const d = (await r.json()) as { slugs?: string[]; reason?: string | null; genre?: string | null };
          if (d.slugs && d.slugs.length > 0) {
            const t = await fetch(`/api/titles?slugs=${encodeURIComponent(d.slugs.join(","))}`);
            if (t.ok) {
              const docs = (await t.json()) as { items?: CatalogItem[] };
              const fresh = docs.items ?? [];
              if (fresh.length > 0) {
                setRecs((prev) => {
                  if (sameRecs(prev.items, fresh) && prev.reason === (d.reason ?? null)) {
                    return prev; // idénticos: sin re-render ni reemplazos
                  }
                  writeRecsCache(fresh, d.reason ?? null, d.genre ?? null);
                  return { items: fresh, reason: d.reason ?? null };
                });
              }
            }
          }
        }
      } catch {
        /* sin recomendados */
      }
      setRecsDone(true);
    })();
  }, [status]);

  // Fila estable, sin "aparecen y desaparecen":
  //  - cargando sesión/historial → skeletons (nunca tarjetas que luego se van).
  //  - con sesión → SOLO progreso real del perfil (línea roja = trailer visto).
  //  - sin sesión → vitrina demo local, como siempre.
  const continueLoading = status === "loading" || (status === "authenticated" && !progressDone);
  const continueBase =
    status === "authenticated" ? (serverContinue ?? []) : CONTINUE_WATCHING;
  const continueEmptyHint =
    status === "authenticated" && progressDone && (serverContinue?.length ?? 0) === 0;

  const q = query.trim().toLowerCase();

  const filteredContinue = useMemo(
    () =>
      q
        ? continueBase.filter((c) =>
            `${c.title} ${c.desc} ${c.episode}`.toLowerCase().includes(q)
          )
        : continueBase,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, continueBase]
  );
  const filteredTop = useMemo(
    () => {
      const base = top5 ?? [];
      return q
        ? base.filter((t) =>
            `${t.title} ${t.genre}`.toLowerCase().includes(q)
          )
        : base;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, top5]
  );
  const filteredRecent = useMemo(
    () => {
      const base = recent ?? [];
      return q
        ? base.filter((r) =>
            `${r.title} ${r.desc} ${r.meta}`.toLowerCase().includes(q)
          )
        : base;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, recent]
  );

  const openHeroInfo = () =>
    setSelected({
      title: hero.title,
      image: hero.image,
      year: hero.year,
      age: hero.age,
      type: hero.type,
      genres: hero.genres,
      synopsis: hero.synopsis,
      rating: hero.rating,
      meta: hero.meta,
    });

  // Héroe inteligente: rota a lo que el algoritmo recomienda para este perfil.
  const { hero, reason: heroReason, personalized, ready: heroReady } = useSmartHero(BROWSE_HERO, undefined, 0);

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <BrowseHeader query={query} onQueryChange={setQuery} />

      {query.trim() ? (
        <main className="w-full px-4 md:px-8 lg:px-14 pt-24 pb-10 max-w-[1800px] mx-auto">
          <SearchResults query={query} onQueryChange={setQuery} />
        </main>
      ) : (
        <>
      {/* Hero Billboard */}
      <section className="relative w-full min-h-[870px] lg:min-h-[942px] flex items-end overflow-hidden">
        <div
          key={heroReady ? hero.title : "cargando"}
          className="absolute inset-0 bg-cover bg-center w-full h-full scale-105 hero-fade"
          style={heroReady ? { backgroundImage: `url('${hero.image}')` } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D11] via-[#0D0D11]/70 via-40% to-transparent" />

        <div className="relative z-10 w-full px-4 md:px-8 lg:px-14 pb-16 pt-44 flex flex-col justify-end max-w-[1800px] mx-auto">
          <div className="max-w-3xl flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff5262]/20 text-[#ffb3b3] text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#ff5262] animate-pulse" />
                Original de PopConly
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2a292e]/60 text-[#ffdb9d] text-[10px] font-bold tracking-wide uppercase backdrop-blur-md">
                <span
                  className="material-symbols-outlined text-sm text-[#feb700]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                {personalized && heroReason ? `Porque viste ${heroReason}` : "Top 1 Hoy en tu país"}
              </span>
            </div>
            <h1 className="text-4xl md:text-[56px] md:leading-[64px] font-extrabold tracking-tight uppercase drop-shadow-2xl">
              {hero.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap text-xs font-semibold text-[#e7bcbc]">
              <span className="text-[#ffba20] font-bold flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {hero.rating}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white">{hero.year}</span>
              <span className="text-white/40">•</span>
              <span className="px-2 py-0.5 rounded bg-[#353439] text-[10px]">
                4K Dolby Vision
              </span>
              <span className="px-2 py-0.5 rounded bg-[#353439] text-[10px]">
                16+
              </span>
              <span className="text-white/40">•</span>
              <span>{hero.type ?? "Película"}</span>
              <span className="text-white/40">•</span>
              <span className="text-[#ffb3b3]">{hero.genres?.[0] ?? "Acción"}</span>
            </div>
            <p className="text-base text-white/90 max-w-2xl line-clamp-3 leading-relaxed drop-shadow">
              {hero.synopsis}
            </p>
            <div className="flex items-center gap-4 pt-2 flex-wrap">
              <Link
                href={`/watch?title=${encodeURIComponent(hero.title)}`}
                className="group flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[#ff5262] text-white font-semibold text-base shadow-[0_4px_24px_rgba(255,42,77,0.45)] hover:shadow-[0_8px_32px_rgba(255,42,77,0.65)] hover:scale-105 transition-all cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
                <span>Reproducir</span>
              </Link>
              <button
                onClick={openHeroInfo}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">
                  info
                </span>
                <span className="font-semibold">Más información</span>
              </button>
              <PlusCheckButton />
              <LikeButton />
            </div>
          </div>
          <div className="hidden lg:flex absolute right-14 bottom-16 items-center gap-2 z-20">
            <button
              aria-label="Silenciar / Activar sonido"
              onClick={() => setMuted((v) => !v)}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1b1b1f]/80 hover:bg-[#353439] backdrop-blur-xl transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined text-xl">
                {muted ? "volume_off" : "volume_up"}
              </span>
            </button>
            <div className="px-3.5 py-1.5 rounded-lg bg-black/80 text-xs font-semibold backdrop-blur-md">
              16+ | Violencia e intensidad Sci-Fi
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <div className="w-full flex flex-col gap-16 px-4 md:px-8 lg:px-14 -mt-8 relative z-20 pb-16 max-w-[1800px] mx-auto">
        {needsPlan && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#feb700]/40 bg-[#feb700]/10 px-4 py-3">
            <p className="text-sm">
              <span className="font-bold">Activa tu membresía</span> para seguir
              viendo sin límites.
            </p>
            <Link
              href="/signup/planes"
              className="px-5 py-2 rounded-lg bg-[#e50914] hover:bg-[#f6121d] text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              Ver planes
            </Link>
          </div>
        )}
        {/* Continuar viendo */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#ff5262]" />
              <h2 className="text-xl font-semibold tracking-tight">
                Continuar Viendo para Ti
              </h2>
            </div>
            <Link
              href="/my-list"
              className="group flex items-center gap-1 text-sm text-[#ffb3b3] hover:text-[#ffb3b3]"
            >
              <span>Ver todo</span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </Link>
          </div>
          {continueLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1b1b1f] rounded-xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-video bg-[#2a292e]" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3 w-1/3 rounded bg-[#2a292e]" />
                    <div className="h-4 w-2/3 rounded bg-[#2a292e]" />
                    <div className="h-3 w-full rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContinue.length === 0 ? (
            <p className="text-sm text-white/50">
              {continueEmptyHint
                ? "Reproduce un trailer y tu avance aparecerá aquí con la línea roja real."
                : "Sin coincidencias en esta fila."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredContinue.map((c) => (
                <button
                  key={c.title}
                  onClick={() =>
                    setSelected({
                      title: c.title,
                      image: c.image,
                      year: "2024",
                      age: "16+",
                      type: c.episode.includes("Película")
                        ? "Película"
                        : c.episode.includes("Docuserie")
                          ? "Docuserie"
                          : "Serie",
                      genres: [c.episode.split("•")[0].trim()],
                      synopsis: SYNOPSIS[c.title] ?? c.desc,
                      meta: c.episode,
                    })
                  }
                  className="group relative flex flex-col bg-[#1b1b1f] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.04] text-left cursor-pointer"
                >
                  <div className="relative w-full aspect-video overflow-hidden">
                    <CoverImg
                      src={thumb(c.image, 640)}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-transparent opacity-80 pointer-events-none" />
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold backdrop-blur-sm">
                      {c.tech}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#353439]">
                      <div
                        className="h-full bg-[#ff5262]"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#ffb3b3] font-bold">
                        {c.episode}
                      </span>
                      <span className="text-[#e7bcbc]">
                        <span className="material-symbols-outlined text-lg">
                          more_vert
                        </span>
                      </span>
                    </div>
                    <h3 className="text-base font-semibold truncate">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[#e7bcbc] line-clamp-1">
                      {c.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Recomendado para ti: algoritmo guardado por usuario+perfil.
            Sin reemplazos visibles: caché instantánea, skeletons si es nuevo. */}
        {status === "authenticated" && !recsDone && recs.items.length === 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#c9bfff]" />
              <div className="h-6 w-48 rounded bg-[#2a292e] animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-[#1b1b1f] animate-pulse">
                  <div className="w-full aspect-[2/3] bg-[#2a292e]" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3 w-2/3 rounded bg-[#2a292e]" />
                    <div className="h-3 w-1/2 rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : recs.items.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#c9bfff]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Recomendado para ti
                </h2>
                {recs.reason && (
                  <p className="text-xs text-[#e7bcbc]">
                    Porque viste {recs.reason}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recs.items.map((item) => (
                <PosterMiniCard
                  key={item.title}
                  item={item}
                  onSelect={() =>
                    setSelected({
                      title: item.title,
                      image: item.image,
                      year: item.year,
                      age: item.age,
                      type: item.type,
                      genres: item.genres,
                      synopsis: item.synopsis,
                      rating: item.rating,
                      match: item.match,
                      meta: item.meta,
                    })
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Top 5 */}
        <section className="flex flex-col gap-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#ffba20]" />
              <h2 className="text-xl font-semibold tracking-tight">
                Top 5 Más Vistos en PopConly
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-[#1b1b1f] hover:bg-[#353439] flex items-center justify-center transition-colors shadow-md">
                <span className="material-symbols-outlined text-lg">
                  chevron_left
                </span>
              </button>
              <button className="w-9 h-9 rounded-full bg-[#1b1b1f] hover:bg-[#353439] flex items-center justify-center transition-colors shadow-md">
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
            {top5 === null ? (
              [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="relative pl-10">
                  <div className="w-full aspect-[2/3] rounded-xl bg-[#1b1b1f] animate-pulse overflow-hidden">
                    <div className="w-full h-full bg-[#2a292e]" />
                  </div>
                </div>
              ))
            ) : (
            filteredTop.map((t) => (
              <button
                key={t.rank}
                onClick={() =>
                  setSelected({
                    title: t.title,
                    image: t.image,
                    year:
                      allTitles().find((x) => x.title === t.title)?.year ?? "2024",
                    age:
                      allTitles().find((x) => x.title === t.title)?.age ?? "16+",
                    type:
                      allTitles().find((x) => x.title === t.title)?.type ?? "Serie",
                    genres: t.genre.split("•").map((g) => g.trim()),
                    synopsis: allTitles().find((x) => x.title === t.title)?.synopsis,
                    rating: t.rating,
                  })
                }
                className="group relative flex items-end pl-10 cursor-pointer text-left"
              >
                <span className="absolute left-0 bottom-4 text-[96px] lg:text-[120px] font-black leading-none text-transparent select-none z-0 [-webkit-text-stroke:2px_white] group-hover:[-webkit-text-stroke:2px_#ffb3b3] transition-all drop-shadow-md">
                  {t.rank}
                </span>
                <span className="relative z-10 w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-[#1b1b1f] transition-all duration-300 group-hover:scale-[1.05] group-hover:shadow-[0_20px_40px_rgba(255,42,77,0.3)] block">
                  <CoverImg
                    src={thumb(t.image, 256)}
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-left">
                    <span className="text-[#ffba20] font-bold text-[10px] flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-xs"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>{" "}
                      {t.rating}
                    </span>
                    <span className="font-semibold truncate block">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-[#e7bcbc] block">
                      {t.genre}
                    </span>
                  </span>
                </span>
              </button>
            ))
            )}
          </div>
        </section>

        {/* Recientes */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#c9bfff]" />
              <h2 className="text-xl font-semibold tracking-tight">
                Agregados Recientemente
              </h2>
            </div>
            <span className="text-xs text-[#e7bcbc]">
              Estrenos de esta semana
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recent === null ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="bg-[#1b1b1f] rounded-xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-video bg-[#2a292e]" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-4 w-1/2 rounded bg-[#2a292e]" />
                    <div className="h-3 w-full rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))
            ) : (
            filteredRecent.map((r) => (
              <button
                key={r.title}
                onMouseEnter={() => warmTrailer(r.title)}
                onClick={() =>
                  setSelected({
                    title: r.title,
                    image: r.image,
                    year: "2026",
                    age: "16+",
                    type: r.meta.includes("Serie") ? "Serie" : "Película",
                    genres: r.meta.split("•").map((g) => g.trim()),
                    synopsis: SYNOPSIS[r.title] ?? r.desc,
                    rating: r.rating,
                    meta: r.meta,
                  })
                }
                className="group relative flex flex-col bg-[#1b1b1f] rounded-xl overflow-hidden shadow-lg transition-all hover:scale-[1.03] cursor-pointer text-left"
              >
                <span className="relative w-full aspect-video overflow-hidden block">
                  <CoverImg
                    src={thumb(r.image, 640)}
                    alt={r.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold shadow-md ${
                        r.badgeStyle === "red"
                          ? "bg-[#ff5262] text-white"
                          : "bg-[#feb700] text-[#412d00]"
                      }`}
                    >
                      {r.tag}
                    </span>
                  </span>
                  <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] backdrop-blur-sm">
                      {r.tech}
                    </span>
                    <span className="text-[#ffba20] font-bold text-[10px] flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-xs"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>{" "}
                      {r.rating}
                    </span>
                  </span>
                </span>
                <span className="p-4 flex flex-col gap-1.5 block">
                  <span className="flex items-center justify-between">
                    <span className="text-base font-semibold group-hover:text-[#ffb3b3] transition-colors">
                      {r.title}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#2a292e] flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">
                        bookmark_add
                      </span>
                    </span>
                  </span>
                  <span className="text-xs text-[#e7bcbc] line-clamp-2 block">
                    {r.desc}
                  </span>
                  <span className="text-[#e7bcbc]/70 text-[10px] font-semibold block">
                    {r.meta}
                  </span>
                </span>
              </button>
            ))
            )}
          </div>
        </section>

        {/* Géneros */}
        <section className="flex flex-col gap-2 pt-4 border-t border-white/10">
          <span className="text-sm text-[#e7bcbc] uppercase tracking-wider font-semibold">
            Explorar por Colección
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setActiveGenre(g);
                  if (g !== GENRES[0]) {
                    const kw = g
                      .replace("&", "")
                      .split(" ")
                      .slice(0, 2)
                      .join(" ");
                    router.push(`/search?q=${encodeURIComponent(kw)}`);
                  }
                }}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all hover:scale-105 ${
                  activeGenre === g
                    ? "bg-[#ff5262] text-white shadow-md"
                    : "bg-[#1b1b1f] hover:bg-[#353439]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      </div>

      </>
      )}
      {/* Footer browse */}
      <footer className="w-full bg-[#0e0e12] mt-16">
        <div className="w-full px-4 md:px-8 lg:px-14 py-10 max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Logo size="sm" />
              <p className="text-sm text-[#e7bcbc] max-w-sm">
                Tu portal cinematográfico definitivo. Miles de películas y
                series originales en ultra alta definición sin límites ni
                interrupciones.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[#e7bcbc] text-lg">
                  language
                </span>
                <select
                  aria-label="Seleccionar idioma"
                  className="bg-[#1b1b1f] text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="es">Español (Latinoamérica)</option>
                  <option value="es-es">Español (España)</option>
                  <option value="en">English (US)</option>
                  <option value="pt">Português (Brasil)</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase">Navegación</h3>
              <Link
                href="/browse"
                className="text-xs text-[#e7bcbc] hover:text-white"
              >
                Inicio
              </Link>
              <Link href="/movies" className="text-xs text-[#e7bcbc] hover:text-white">
                Películas
              </Link>
              <Link href="/series" className="text-xs text-[#e7bcbc] hover:text-white">
                Series
              </Link>
              <Link href="/categories" className="text-xs text-[#e7bcbc] hover:text-white">
                Categorías
              </Link>
              <Link href="/" className="text-xs text-[#e7bcbc] hover:text-white">
                Landing pública
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase">Legal y Soporte</h3>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                Términos de servicio
              </Link>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                Política de privacidad
              </Link>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                Preferencias de cookies
              </Link>
              <Link href="/help" className="text-xs text-[#e7bcbc] hover:text-white">
                Centro de ayuda
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase">Descarga la App</h3>
              <p className="text-xs text-[#e7bcbc]">
                Lleva el mejor cine en tu bolsillo en cualquier dispositivo.
              </p>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1b1b1f] rounded-lg hover:bg-[#1f1f23] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-2xl">
                    phone_iphone
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#e7bcbc] uppercase">
                      Disponible en
                    </span>
                    <span className="text-sm font-semibold">App Store</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1b1b1f] rounded-lg hover:bg-[#1f1f23] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-2xl">
                    smart_display
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#e7bcbc] uppercase">
                      Disponible en
                    </span>
                    <span className="text-sm font-semibold">Google Play</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#e7bcbc]/80 text-xs">
            <span>© 2025 PopConly Inc. Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
              <span>Audio Dolby Atmos</span>
              <span>Ultra HD 4K</span>
              <span>HDR10+</span>
            </div>
          </div>
        </div>
      </footer>

      <TitleModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
