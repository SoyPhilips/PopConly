"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseFooter from "@/components/BrowseFooter";
import TitleModal, { type TitleDetail } from "@/components/TitleModal";
import SearchResults from "@/components/SearchResults";
import { CriticsCard, PosterMiniCard, PanoramicActionCard } from "@/components/PrototypeCards";
import { MOVIES_HERO, MOVIE_ROWS } from "@/lib/realPicks";
import { useSmartHero } from "@/lib/useSmartHero";
import { useLang } from "@/lib/i18n";
import { MOVIE_FILTERS } from "@/lib/catalog";
import { loadMyList, saveMyList, toggleMyList } from "@/lib/myListStore";
import { pushFavorite } from "@/lib/myListSync";
import { useSearchScroll } from "@/lib/useSearchScroll";
import { thumb } from "@/lib/thumb";
import type { CatalogItem } from "@/lib/catalog";

export default function MoviesPage() {
  const [query, setQuery] = useState("");
  useSearchScroll(query);
  const [filter, setFilter] = useState(MOVIE_FILTERS[0]);
  const [sort, setSort] = useState("relevancia");
  const [selected, setSelected] = useState<TitleDetail | null>(null);
  const [inList, setInList] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Héroe inteligente: rota a la película que el algoritmo recomienda.
  const { hero: movieHero, reason: movieReason, personalized: moviePersonal, ready: movieReady } = useSmartHero(MOVIES_HERO, "Película", 5);
  const { t } = useLang();

  const MOVIE_FILTER_LABELS: Record<string, string> = {
    Todos: t("mv_fTodos"),
    "Acción": t("mv_fAccion"),
    "Ciencia Ficción": t("mv_fScifi"),
    Drama: t("mv_fDrama"),
    Terror: t("mv_fTerror"),
    Comedia: t("mv_fComedia"),
    "Animación": t("mv_fAnim"),
  };

  useEffect(() => {
    setInList(
      loadMyList().some((i) => i.title === movieHero.title)
    );
  }, [movieHero.title]);

  const toggleHeroList = () => {
    const next = toggleMyList(movieHero, loadMyList());
    saveMyList(next);
    const added = next.some((i) => i.title === movieHero.title);
    setInList(added);
    pushFavorite(movieHero.title, added);
  };

  const q = query.trim().toLowerCase();
  const FILTER_KEYS: Record<string, string[]> = {
    Todos: [],
    Acción: ["acción"],
    "Ciencia Ficción": ["ciencia ficción", "sci-fi"],
    Drama: ["drama"],
    Terror: ["terror"],
    Comedia: ["comedia"],
    Animación: ["animación", "anime"],
  };
  const matches = (item: CatalogItem) => {
    const hay = `${item.title} ${item.synopsis ?? ""} ${(item.genres ?? []).join(" ")}`.toLowerCase();
    const okQ = !q || hay.includes(q);
    const keys = FILTER_KEYS[filter] ?? [];
    const okF =
      keys.length === 0 || keys.some((k) => hay.includes(k));
    return okQ && okF;
  };

  const sortItems = (arr: CatalogItem[]) => {
    const a = [...arr];
    if (sort === "calificacion") a.sort((x, y) => parseFloat(y.rating ?? "0") - parseFloat(x.rating ?? "0"));
    else if (sort === "vistas") a.reverse();
    else if (sort === "estreno") a.sort((x, y) => (y.year ?? "").localeCompare(x.year ?? ""));
    return a;
  };

  // Filas reales desde la DB (/api/rows); sin ellas, vitrina local.
  const [rowsBase, setRowsBase] = useState<{
    acclaimed: CatalogItem[];
    launches: CatalogItem[];
    specials: CatalogItem[];
  } | null>(null);
  const [launchesTotal, setLaunchesTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const get = async (qs: string) => {
          const r = await fetch(`/api/rows?${qs}`);
          if (!r.ok) return null;
          return (await r.json()) as { items?: CatalogItem[]; total?: number };
        };
        const [a, l, s] = await Promise.all([
          get(`type=${encodeURIComponent("Película")}&limit=120`),
          get(`year=2026&type=${encodeURIComponent("Película")}&limit=200`),
          get(`genre=${encodeURIComponent("Acción")}&type=${encodeURIComponent("Película")}&limit=60`),
        ]);
        if (!cancelled && a?.items?.length && l?.items?.length && s?.items?.length) {
          const byRating = (arr: CatalogItem[]) =>
            [...arr].sort((x, y) => parseFloat(y.rating ?? "0") - parseFloat(x.rating ?? "0"));
          setRowsBase({
            acclaimed: byRating(a.items).slice(0, 12),
            launches: l.items.slice(0, 12),
            specials: s.items.slice(0, 4),
          });
          setLaunchesTotal(typeof l.total === "number" ? l.total : l.items.length);
        }
      } catch {
        /* vitrina local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [acclaimed, launches, specials] = useMemo(() => {
    const base = rowsBase ?? {
      acclaimed: MOVIE_ROWS[0].items,
      launches: MOVIE_ROWS[1].items,
      specials: MOVIE_ROWS[2].items,
    };
    return [
      sortItems(base.acclaimed.filter(matches)),
      sortItems(base.launches.filter(matches)),
      sortItems(base.specials.filter(matches)),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, sort, rowsBase]);

  const open = (item: CatalogItem) =>
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
    });

  const scrollSlider = (dir: number) =>
    sliderRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <BrowseHeader query={query} onQueryChange={setQuery} />

      {query.trim() ? (
        <main className="w-full px-4 md:px-8 lg:px-14 pt-24 pb-10 max-w-[1800px] mx-auto">
          <SearchResults query={query} onQueryChange={setQuery} />
        </main>
      ) : (
        <>
      {/* HERO compacto prototipo */}
      <section className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-end overflow-hidden">
        <div
          key={movieReady ? movieHero.title : "cargando"}
          className="absolute inset-0 bg-cover bg-center scale-105 hero-fade"
          style={movieReady ? { backgroundImage: `url('${thumb(movieHero.image, 1280)}')` } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D11] via-[#0D0D11]/70 to-transparent" />
        <div className="relative z-10 w-full px-4 md:px-8 lg:px-14 pb-12 pt-36 max-w-[1800px] mx-auto">
          <div className="max-w-3xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#e7bcbc]">
              <span className="flex items-center gap-1 text-[#ffba20]">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-white">{movieHero.rating ?? "9.5"}</span>
              </span>
              <span className="text-[#e7bcbc]/60 text-xs">
                {moviePersonal && movieReason ? `${t("hero_because")} ${movieReason}` : t("mv_reviews")}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-white font-semibold">{movieHero.year ?? "2h 15m"}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="px-1.5 py-0.5 rounded bg-[#1f1f23] text-[#ffb3b3] font-bold text-xs">{movieHero.age ?? "16+"}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{movieHero.genres?.join(" · ") ?? "Ciencia Ficción · Ciberpunk · Neo-Noir"}</span>
            </div>
            <h1 className="text-4xl md:text-[56px] md:leading-[60px] font-extrabold tracking-tight uppercase">
              {movieHero.title}
            </h1>
            <p className="text-base text-[#e7bcbc] line-clamp-2 max-w-2xl">
              {movieHero.synopsis}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href={`/watch?title=${encodeURIComponent(movieHero.title)}`}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#ff5262] text-white text-base font-bold shadow-xl shadow-[#ff5262]/40 hover:scale-105 hover:brightness-110 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                {t("mv_watchNow")}
              </Link>
              <button
                onClick={toggleHeroList}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl backdrop-blur-md transition-all font-semibold cursor-pointer ${
                  inList ? "bg-[#ff5262]/20 text-[#ffb3b3]" : "bg-[#2a292e]/70 hover:bg-[#353439]"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{inList ? "check" : "playlist_add"}</span>
                <span>{inList ? t("mv_inList") : t("mv_add")}</span>
              </button>
              <button
                aria-label={t("mv_infoAria")}
                onClick={() => open(movieHero)}
                className="w-12 h-12 rounded-xl bg-[#2a292e]/60 hover:bg-[#353439] flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">info</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BARRA DE FILTROS sticky */}
      <section className="sticky top-[68px] z-30 w-full bg-[#0e0e12]/90 backdrop-blur-xl px-4 md:px-8 lg:px-14 py-4 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {MOVIE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === f
                    ? "bg-[#ff5262] text-white font-bold shadow-md shadow-[#ff5262]/20"
                    : "bg-[#1b1b1f] text-[#e7bcbc] hover:text-white hover:bg-[#1f1f23]"
                }`}
              >
                {MOVIE_FILTER_LABELS[f] ?? f}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#1b1b1f] px-3 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[#e7bcbc] text-sm">swap_vert</span>
              <span className="text-[10px] text-[#e7bcbc] uppercase font-bold">{t("mv_sortBy")}</span>
              <select
                aria-label={t("mv_sortAria")}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer pr-2"
              >
                <option className="bg-[#2a292e]" value="relevancia">{t("mv_optRel")}</option>
                <option className="bg-[#2a292e]" value="estreno">{t("mv_optYear")}</option>
                <option className="bg-[#2a292e]" value="calificacion">{t("mv_optRate")}</option>
                <option className="bg-[#2a292e]" value="vistas">{t("mv_optViews")}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-16 px-4 md:px-8 lg:px-14 pt-10 pb-4 max-w-[1800px] mx-auto">
        {/* SECCIÓN 1: ACLAMADAS carrusel */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#feb700] mb-1">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                <span className="text-[10px] uppercase tracking-widest font-extrabold">{t("mv_accK")}</span>
              </div>
              <h2 className="text-[28px] font-bold tracking-tight">{t("mv_accT")}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label={t("mv_prev")} onClick={() => scrollSlider(-1)} className="w-10 h-10 rounded-full bg-[#1b1b1f] hover:bg-[#1f1f23] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button aria-label={t("mv_next")} onClick={() => scrollSlider(1)} className="w-10 h-10 rounded-full bg-[#1b1b1f] hover:bg-[#1f1f23] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div ref={sliderRef} className="grid grid-flow-col auto-cols-[82%] sm:auto-cols-[45%] lg:auto-cols-[30%] xl:auto-cols-[23.5%] gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {rowsBase === null
              ? [0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-[#1b1b1f] animate-pulse snap-start">
                    <div className="w-full aspect-[16/10] bg-[#2a292e]" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-3 w-1/3 rounded bg-[#2a292e]" />
                      <div className="h-4 w-2/3 rounded bg-[#2a292e]" />
                    </div>
                  </div>
                ))
              : acclaimed.map((item) => (
              <CriticsCard key={item.title} item={item} onSelect={open} />
            ))}
          </div>
        </section>

        {/* SECCIÓN 2: LANZAMIENTOS grid 6 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#ffb3b3] text-[10px] uppercase tracking-wider font-extrabold mb-1">
                <span className="w-2 h-2 rounded-full bg-[#ffb3b3] animate-pulse" />
                {t("mv_lauK")}
              </div>
              <h2 className="text-[28px] font-bold tracking-tight">{t("mv_lauT")}</h2>
            </div>
            <Link href="/search?q=2026" className="text-sm text-[#ffb3b3] hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
              {t("mv_seeAll")} ({launchesTotal ?? 48})
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {rowsBase === null ? (
              [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-[#1b1b1f] animate-pulse">
                  <div className="w-full aspect-[2/3] bg-[#2a292e]" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3 w-2/3 rounded bg-[#2a292e]" />
                    <div className="h-3 w-1/2 rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))
            ) : (
            launches.map((item) => (
              <PosterMiniCard key={item.title} item={item} onSelect={open} />
            ))
            )}
          </div>
        </section>

        {/* SECCIÓN 3: ESPECIALES panorámicas 21/9 */}
        <section className="flex flex-col gap-4 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-[#ff5262] rounded-full" />
              <div>
                <h2 className="text-[28px] font-bold tracking-tight">{t("mv_speT")}</h2>
                <p className="text-xs text-[#e7bcbc]">{t("mv_speS")}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rowsBase === null ? (
              [0, 1].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-[#1b1b1f] animate-pulse">
                  <div className="w-full aspect-[21/9] bg-[#2a292e]" />
                  <div className="p-6 flex flex-col gap-2">
                    <div className="h-4 w-1/3 rounded bg-[#2a292e]" />
                    <div className="h-3 w-full rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))
            ) : (
            specials.map((item) => (
              <PanoramicActionCard key={item.title} item={item} onSelect={open} />
            ))
            )}
          </div>
        </section>
      </div>

      </>
      )}
      <BrowseFooter />
      <TitleModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
