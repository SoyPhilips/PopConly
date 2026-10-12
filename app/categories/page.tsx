"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseFooter from "@/components/BrowseFooter";
import SearchResults from "@/components/SearchResults";
import TitleModal, { type TitleDetail } from "@/components/TitleModal";
import { PosterMiniCard } from "@/components/PrototypeCards";
import { useSearchScroll } from "@/lib/useSearchScroll";
import { CATEGORIES, CURATED_COLLECTIONS, type Category } from "@/lib/catalog";
import { allTitles } from "@/lib/findTitle";
import { slugify } from "@/lib/slugs";
import type { CatalogItem } from "@/lib/catalog";

const TABS = ["Todos", "Películas", "Series", "Documentales"] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "ACCIÓN": ["acción", "accion"],
  "ANIME": ["anime", "animación", "animacion"],
  "DOCUMENTALES": ["documental", "docuserie"],
  "CIENCIA FICCIÓN": ["ciencia ficción", "ciencia ficcion", "sci-fi", "cyber"],
  "COMEDIA": ["comedia"],
  "SUSPENSO": ["suspenso", "thriller", "misterio"],
  "TERROR": ["terror", "horror"],
  "DRAMA": ["drama"],
  "FANTASÍA": ["fantasía", "fantasia", "épica", "epica"],
};

const KIND_TABS = ["Todo", "Películas", "Series"] as const;

export default function CategoriesPage() {
  const [query, setQuery] = useState("");
  useSearchScroll(query);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  const [catSearch, setCatSearch] = useState("");
  const [surprise, setSurprise] = useState<string | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [kindFilter, setKindFilter] = useState<(typeof KIND_TABS)[number]>("Todo");
  const [detail, setDetail] = useState<TitleDetail | null>(null);

  // La selección vive en la URL (?cat=...): el botón atrás del navegador
  // vuelve a la cuadrícula en vez de sacarte de la sección.
  useEffect(() => {
    const fromUrl = () => {
      try {
        const v = new URLSearchParams(window.location.search).get("cat") ?? "";
        const found = CATEGORIES.find((c) => slugify(c.name) === v) ?? null;
        setSelected(found);
        if (found) setKindFilter("Todo");
      } catch {
        /* sin URL */
      }
    };
    fromUrl();
    window.addEventListener("popstate", fromUrl);
    return () => window.removeEventListener("popstate", fromUrl);
  }, []);

  const selectCategory = (c: Category | null) => {
    setSelected(c);
    setKindFilter("Todo");
    try {
      const url = c
        ? `/categories?cat=${encodeURIComponent(slugify(c.name))}`
        : "/categories";
      window.history.pushState(null, "", url);
    } catch {
      /* sin history */
    }
    window.scrollTo({ top: 0 });
  };

  const filtered = useMemo(() => {
    const s = catSearch.trim().toLowerCase();
    return CATEGORIES.filter((c) => {
      const okTab =
        tab === "Todos" ||
        (tab === "Películas" && c.tags.includes("movies")) ||
        (tab === "Series" && c.tags.includes("series")) ||
        (tab === "Documentales" && c.tags.includes("docs"));
      const okSearch =
        !s ||
        `${c.name} ${c.count} ${c.mood} ${c.badge}`.toLowerCase().includes(s) ||
        `${c.name} ${c.count}`.toLowerCase().includes(query.trim().toLowerCase());
      const okGlobal =
        !query.trim() ||
        `${c.name} ${c.mood}`.toLowerCase().includes(query.trim().toLowerCase());
      return okTab && okSearch && okGlobal;
    });
  }, [tab, catSearch, query]);

  const rollSurprise = () => {
    const pool = filtered.length > 0 ? filtered : CATEGORIES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSurprise(pick.name);
  };

  // Títulos de la categoría seleccionada (mismo catálogo de la plataforma).
  const categoryTitles = useMemo(() => {
    if (!selected) return [];
    const keys = CATEGORY_KEYWORDS[selected.name] ?? [selected.name.toLowerCase()];
    return allTitles().filter((t) => {
      const hay = `${t.title} ${(t.genres ?? []).join(" ")} ${t.type ?? ""}`.toLowerCase();
      const okKind =
        kindFilter === "Todo" ||
        (kindFilter === "Películas" && (t.type ?? "") === "Película") ||
        (kindFilter === "Series" && (t.type ?? "") !== "Película");
      return okKind && keys.some((k) => hay.includes(k));
    });
  }, [selected, kindFilter]);

  const openDetail = (item: CatalogItem) =>
    setDetail({
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

  const shell = (body: React.ReactNode) => (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <BrowseHeader query={query} onQueryChange={setQuery} />
      {body}
      <BrowseFooter />
      <TitleModal item={detail} onClose={() => setDetail(null)} />
    </div>
  );

  if (query.trim()) {
    return shell(
      <main className="w-full px-4 md:px-8 lg:px-14 pt-28 pb-10 max-w-[1800px] mx-auto">
        <SearchResults query={query} onQueryChange={setQuery} />
      </main>
    );
  }

  if (selected) {
    return shell(
      <main className="w-full px-4 md:px-8 lg:px-14 pt-28 pb-10 max-w-[1800px] mx-auto relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6">
          <button
            onClick={() => selectCategory(null)}
            className="self-start flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Todas las categorías
          </button>
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl">
            <span
              className="absolute inset-0 bg-cover bg-center block"
              style={{ backgroundImage: `url('${selected.image}')` }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/55 to-transparent block" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#0e0e12]/80 via-transparent to-transparent block" />
            <span className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-[#ffb3b3] uppercase">
                {selected.badge}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold uppercase">
                {selected.tech}
              </span>
            </span>
            <span className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col gap-1">
              <span className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter leading-none">
                {selected.name}
              </span>
              <span className="flex items-center gap-3 text-xs text-[#e7bcbc] mt-1">
                <span className="text-[#ffb3b3] font-bold">{categoryTitles.length} títulos aquí</span>
                <span>•</span>
                <span>{selected.mood}</span>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {KIND_TABS.map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  kindFilter === k
                    ? "bg-[#ff5262] text-white shadow-md"
                    : "bg-[#1b1b1f] text-[#e7bcbc] hover:text-white"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          {categoryTitles.length === 0 ? (
            <div className="rounded-2xl bg-[#1b1b1f] border border-white/5 p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-white/20">movie_filter</span>
              <p className="font-bold mt-3">Muy pronto por aquí</p>
              <p className="text-sm text-white/50 mt-1 max-w-sm mx-auto">
                Estamos curando los títulos de {selected.name.toLowerCase()} para esta vitrina.
                Mientras tanto explora el resto del catálogo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoryTitles.map((t) => (
                <PosterMiniCard key={t.title} item={t} onSelect={openDetail} />
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  return shell(
    <main className="w-full px-4 md:px-8 lg:px-14 pt-28 pb-10 max-w-[1800px] mx-auto relative overflow-hidden">
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#ff5262]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-[#917eff]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#ff5262] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb3b3]">
              Catálogo Curado 2025
            </span>
          </div>
          <h1 className="text-4xl md:text-[56px] md:leading-[60px] font-extrabold tracking-tight">
            Explora por Categorías
          </h1>
          <p className="text-base text-[#e7bcbc]/80">
            Encuentra tu próxima obsesión cinematográfica por género,
            temática y colecciones curadas con calidad de sala prémium.
          </p>
        </div>
        <div className="flex items-center gap-1 self-start md:self-auto bg-[#1b1b1f] p-1.5 rounded-full shadow-lg">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                tab === t
                  ? "bg-[#ff5262] text-white shadow-md"
                  : "text-[#e7bcbc] hover:text-white hover:bg-[#1f1f23]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1b1b1f]/70 backdrop-blur-xl p-2 sm:px-5 sm:py-4 rounded-xl shadow-xl">
        <div className="relative w-full sm:max-w-md flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#e7bcbc] text-xl">
            manage_search
          </span>
          <input
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            placeholder="Buscar categoría (ej. Acción, Suspenso, Cyberpunk)..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#1f1f23] placeholder:text-[#e7bcbc]/60 text-sm rounded-lg focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-5 text-[#e7bcbc] text-[10px] font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#feb700]" />
            {filtered.length} Categorías Activas
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="relative z-10 text-sm text-white/50">
          Sin categorías coincidentes.
        </p>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <button
              key={c.name}
              onClick={() => selectCategory(c)}
              className="group relative h-96 rounded-xl overflow-hidden cursor-pointer bg-[#2a292e] shadow-2xl transition-all duration-500 hover:-translate-y-1.5 block text-left w-full"
            >
              <span
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 block"
                style={{ backgroundImage: `url('${c.image}')` }}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/60 to-transparent opacity-90 block" />
              <span className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-[#ffb3b3] uppercase">
                  {c.badge}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold uppercase">
                  {c.tech}
                </span>
              </span>
              <span className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center group-hover:bg-[#ff5262] transition-colors">
                <span className="material-symbols-outlined text-lg">
                  arrow_outward
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end block">
                <span className="text-4xl font-extrabold tracking-tighter uppercase leading-none group-hover:translate-x-1 transition-transform block">
                  {c.name}
                </span>
                <span className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#ffb3b3] font-bold">
                    {c.count}
                  </span>
                  <span className="text-xs text-[#e7bcbc]">{c.mood}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-10 bg-[#1b1b1f] rounded-xl p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#ff5262]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <span className="text-[10px] text-[#ffb3b3] uppercase tracking-wider font-bold">
              Colecciones Curadas
            </span>
            <h2 className="text-[28px] font-bold">¿No sabes qué ver hoy?</h2>
            <p className="text-sm text-[#e7bcbc]">
              Prueba nuestras selecciones automáticas basadas en tu estado de
              ánimo o déjate sorprender con el Selector Aleatorio de
              PopConly.
            </p>
            {surprise && (
              <p className="text-sm">
                Tu destino:{" "}
                <span className="font-bold text-[#ffb3b3]">{surprise}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full lg:w-auto">
            <button
              onClick={rollSurprise}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#2a292e] hover:bg-[#353439] text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#feb700]">
                casino
              </span>
              Ruleta Sorpresa
            </button>
            <Link
              href="/browse"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#ff5262] hover:brightness-110 text-sm font-semibold rounded-lg shadow-[0_4px_24px_rgba(255,42,77,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              Top 10 Semanal
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6">
          {CURATED_COLLECTIONS.map((c) => (
            <div
              key={c.title}
              className="flex flex-col gap-1 p-4 bg-[#1f1f23] rounded-lg"
            >
              <span className="text-[10px] text-[#e7bcbc] uppercase">
                {c.label}
              </span>
              <span className="text-base font-semibold">{c.title}</span>
              <span className="text-xs text-[#ffb3b3]">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
