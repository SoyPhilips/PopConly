"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseFooter from "@/components/BrowseFooter";
import TitleModal, { type TitleDetail } from "@/components/TitleModal";
import SearchResults from "@/components/SearchResults";
import { useSearchScroll } from "@/lib/useSearchScroll";
import { BingeCard, MiniseriesCard, WeeklyCard } from "@/components/PrototypeCards";
import { SERIES_HERO, SERIES_ROWS, BINGE_PATCH, WEEKLY_PATCH } from "@/lib/realPicks";
import { useSmartHero } from "@/lib/useSmartHero";
import { SERIES_FILTERS } from "@/lib/catalog";
import { BINGE_META, WEEKLY_META } from "@/components/PrototypeCards";
import type { CatalogItem } from "@/lib/catalog";

export default function SeriesPage() {
  const [query, setQuery] = useState("");
  useSearchScroll(query);
  const [filter, setFilter] = useState(SERIES_FILTERS[0]);
  const [selected, setSelected] = useState<TitleDetail | null>(null);

  // Héroe inteligente: rota a la serie que el algoritmo recomienda.
  const { hero: seriesHero, reason: seriesReason, personalized: seriesPersonal, ready: seriesReady } = useSmartHero(SERIES_HERO, "Serie", 11);

  const q = query.trim().toLowerCase();
  const FILTER_KEYS: Record<string, string[]> = {
    "Todas las Series": [],
    "Sci-Fi & Cybernoir": ["ciencia ficción", "sci-fi", "cyber"],
    "Thriller Psicológico": ["thriller", "suspenso", "misterio"],
    "Dramas Criminales": ["crimen", "drama"],
    "Fantasía Oscura": ["fantasía", "terror", "épica"],
  };
  const matches = (item: CatalogItem) => {
    const hay = `${item.title} ${item.synopsis ?? ""} ${(item.genres ?? []).join(" ")}`.toLowerCase();
    const okQ = !q || hay.includes(q);
    const keys = FILTER_KEYS[filter] ?? [];
    const okF = keys.length === 0 || keys.some((k) => hay.includes(k));
    return okQ && okF;
  };

  // Enriquecer tarjetas con datos de temporada para los títulos reales.
  for (const row of SERIES_ROWS) {
    for (const it of row.items) {
      const b = BINGE_PATCH[it.title];
      if (b && !BINGE_META[it.title]) {
        BINGE_META[it.title] = {
          seasons: b.seasons,
          episodes: b.episodes,
          rating: it.rating ?? "",
          match: b.match,
          marathon: b.marathon,
          chip: (it.genres ?? []).join(" • "),
        };
      }
      const w = WEEKLY_PATCH[it.title];
      if (w) {
        const cur = WEEKLY_META[it.title] ?? {
          rating: it.rating ?? "",
          ep: "Episodio 1",
          dur: "",
        };
        WEEKLY_META[it.title] = { ...cur, ...w };
      }
    }
  }

  const [binge, mini, weekly] = useMemo(
    () => SERIES_ROWS.map((r) => r.items.filter(matches)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, filter]
  );

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
      meta: item.meta,
    });

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <BrowseHeader query={query} onQueryChange={setQuery} />

      {query.trim() ? (
        <main className="w-full px-4 md:px-8 lg:px-14 pt-24 pb-10 max-w-[1800px] mx-auto">
          <SearchResults query={query} onQueryChange={setQuery} />
        </main>
      ) : (
        <>
      {/* HERO series */}
      <section className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-end overflow-hidden">
        <div
          key={seriesReady ? seriesHero.title : "cargando"}
          className="absolute inset-0 bg-cover bg-center scale-105 hero-fade"
          style={seriesReady ? { backgroundImage: `url('${seriesHero.image}')` } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D11] via-[#0D0D11]/70 to-transparent" />
        <div className="relative z-10 w-full px-4 md:px-8 lg:px-14 pb-12 pt-36 max-w-[1800px] mx-auto">
          <div className="w-full max-w-4xl flex flex-col gap-4 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a292e]/90 backdrop-blur-md shadow-lg shadow-black/40 self-start">
              <span className="w-2 h-2 rounded-full bg-[#ff5262] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {seriesPersonal && seriesReason ? `Porque viste ${seriesReason}` : "Serie original PopConly"}
              </span>
            </div>
            <h1 className="text-4xl md:text-[56px] md:leading-[60px] font-extrabold tracking-tight uppercase">
              {seriesHero.title}
            </h1>
            <p className="text-base text-white/90 max-w-2xl line-clamp-3">{seriesHero.synopsis}</p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href={`/watch?title=${encodeURIComponent(seriesHero.title)}`}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#ff5262] font-bold hover:brightness-110 hover:scale-105 transition-all shadow-[0_4px_24px_rgba(255,42,77,0.45)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                Ver Temporada 1
              </Link>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl transition-all font-semibold cursor-pointer">
                <span className="material-symbols-outlined">smart_display</span>
                Tráiler oficial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros + ordenar */}
      <div className="w-full px-4 md:px-8 lg:px-14 max-w-[1800px] mx-auto pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e0e12] p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {SERIES_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === f ? "bg-[#ff5262] text-white shadow-md" : "bg-[#1b1b1f] text-[#e7bcbc] hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-[#e7bcbc]">Ordenar por:</span>
            <div className="flex items-center gap-1 bg-[#1f1f23] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#2a292e] transition-colors">
              <span>Más Vistas Este Mes</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-14 px-4 md:px-8 lg:px-14 py-10 max-w-[1800px] mx-auto">
        {/* Maratoneables */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff5262] text-xl">bolt</span>
                <span className="text-[10px] text-[#ffb3b3] uppercase tracking-widest">Inmersión Continua</span>
              </div>
              <h2 className="text-[28px] font-bold">Series Maratoneables</h2>
              <p className="text-xs text-[#e7bcbc]">Historias completas listas para consumir de inicio a fin sin pausas.</p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Anterior" className="w-10 h-10 rounded-full bg-[#1b1b1f] hover:bg-[#1f1f23] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button aria-label="Siguiente" className="w-10 h-10 rounded-full bg-[#1b1b1f] hover:bg-[#1f1f23] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {binge.map((item) => (
              <BingeCard key={item.title} item={item} onSelect={open} />
            ))}
          </div>
        </section>

        {/* Miniseries */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#c9bfff] uppercase tracking-widest font-bold">Obras maestras autoconclusivas</span>
              <h2 className="text-[28px] font-bold">Miniseries Exclusivas</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            {mini.map((item) => (
              <MiniseriesCard key={item.title} item={item} onSelect={open} />
            ))}
          </div>
        </section>

        {/* Semanales */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#ffb3b3] uppercase tracking-widest font-bold">Sigue el ritmo de emisión mundial</span>
              <h2 className="text-[28px] font-bold">Episodios Semanales</h2>
            </div>
            <span className="text-xs text-[#e7bcbc]">Nuevas revelaciones cada semana, sin spoilers.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weekly.map((item) => (
              <WeeklyCard key={item.title} item={item} onSelect={open} />
            ))}
          </div>
          <button className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b1b1f] text-xs font-semibold hover:bg-[#2a292e] transition-colors">
            <span className="material-symbols-outlined text-base">notifications_active</span>
            Recordarme el viernes
          </button>
        </section>
      </div>

      </>
      )}
      <BrowseFooter />
      <TitleModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
