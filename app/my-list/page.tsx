"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseFooter from "@/components/BrowseFooter";
import TitleModal, { type TitleDetail } from "@/components/TitleModal";
import SearchResults from "@/components/SearchResults";
import { thumb } from "@/lib/thumb";
import { useSearchScroll } from "@/lib/useSearchScroll";
import { MyListCard } from "@/components/PrototypeCards";
import CoverImg from "@/components/CoverImg";
import { loadMyList, saveMyList } from "@/lib/myListStore";
import { pullFavorites, pushFavorite } from "@/lib/myListSync";
import { slugify } from "@/lib/slugs";
import { getActiveProfile } from "@/lib/activeProfile";
import { readRecsCache, sameRecs, writeRecsCache } from "@/lib/recsCache";
import { useLang } from "@/lib/i18n";
import type { CatalogItem } from "@/lib/catalog";

const TABS = ["Todos", "Películas", "Series", "Descargados"] as const;

export default function MyListPage() {
  const [query, setQuery] = useState("");
  useSearchScroll(query);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  // Mi Lista = SOLO lo que el usuario añade con + (vacía por defecto).
  // Con sesión, el servidor (DB) manda y lo local solo complementa.
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [recs, setRecs] = useState<{ items: CatalogItem[]; genre: string | null }>({
    items: [],
    genre: null,
  });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<TitleDetail | null>(null);
  const { t } = useLang();

  useEffect(() => {
    setItems(loadMyList());
    (async () => {
      // 1. Favoritos del servidor (DB): fuente de verdad con sesión.
      const slugs = await pullFavorites();
      if (slugs && slugs.length > 0) {
        try {
          const res = await fetch(`/api/titles?slugs=${encodeURIComponent(slugs.join(","))}`);
          if (res.ok) {
            const data = (await res.json()) as { items?: CatalogItem[] };
            const serverItems = data.items ?? [];
            setItems((prev) => {
              const known = new Set(serverItems.map((i) => slugify(i.title)));
              // Lo local no sincronizado (sin conexión al añadirlo) se sube.
              const pending = prev.filter((i) => !known.has(slugify(i.title)));
              pending.forEach((i) => pushFavorite(i.title, true));
              return [...serverItems, ...pending];
            });
          }
        } catch {
          /* sin servidor: queda lo local */
        }
      }
      setLoaded(true);
      // 2. Progreso REAL por perfil: la línea roja mide lo visto de verdad.
      try {
        const profile = encodeURIComponent(getActiveProfile());
        const r = await fetch(`/api/progress?profile=${profile}`);
        if (r.ok) {
          const d = (await r.json()) as {
            items?: { slug: string; pos: number; total: number }[];
          };
          const map: Record<string, number> = {};
          for (const e of d.items ?? []) {
            map[e.slug] = e.total > 0 ? Math.round((e.pos / e.total) * 100) : 0;
          }
          setProgressMap(map);
        }
      } catch {
        /* sin historial: se usa el progreso local */
      }
      // 3. Recomendados reales del algoritmo (mismo motor que el inicio).
      // Caché instantánea + solo cambia si difieren (sin reemplazos).
      const cachedRecs = readRecsCache();
      if (cachedRecs && cachedRecs.items.length > 0) {
        setRecs({ items: cachedRecs.items, genre: cachedRecs.genre });
      }
      try {
        const r = await fetch(
          `/api/recommendations?profile=${encodeURIComponent(getActiveProfile())}`
        );
        if (r.ok) {
          const d = (await r.json()) as { slugs?: string[]; genre?: string | null };
          if (d.slugs && d.slugs.length > 0) {
            const t = await fetch(`/api/titles?slugs=${encodeURIComponent(d.slugs.slice(0, 4).join(","))}`);
            if (t.ok) {
              const docs = (await t.json()) as { items?: CatalogItem[] };
              const fresh = docs.items ?? [];
              if (fresh.length > 0) {
                setRecs((prev) => {
                  if (sameRecs(prev.items, fresh)) return prev;
                  writeRecsCache(fresh, null, d.genre ?? null);
                  return { items: fresh, genre: d.genre ?? null };
                });
              }
            }
          }
        }
      } catch {
        /* sin recomendados */
      }
    })();
  }, []);

  useEffect(() => {
    saveMyList(items);
  }, [items]);

  const q = query.trim().toLowerCase();

  // Línea roja REAL: el progreso del servidor manda sobre el local.
  const withProgress = useMemo(
    () =>
      items.map((it) => {
        const real = progressMap[slugify(it.title)];
        return typeof real === "number" ? { ...it, progress: real } : it;
      }),
    [items, progressMap]
  );

  const filtered = useMemo(
    () =>
      withProgress.filter((it) => {
        const okTab =
          tab === "Todos" ||
          (tab === "Películas" && it.type === "Película") ||
          (tab === "Series" && it.type !== "Película") ||
          (tab === "Descargados" && it.downloaded);
        const okQ =
          !q ||
          `${it.title} ${it.synopsis ?? ""}`.toLowerCase().includes(q);
        return okTab && okQ;
      }),
    [items, tab, q]
  );

  const counts = useMemo(
    () => ({
      Todos: items.length,
      Películas: items.filter((i) => i.type === "Película").length,
      Series: items.filter((i) => i.type !== "Película").length,
      Descargados: items.filter((i) => i.downloaded).length,
    }),
    [items]
  );

  const TABS_I18N = [
    { key: "Todos" as const, label: t("ml_all") },
    { key: "Películas" as const, label: t("ml_movies") },
    { key: "Series" as const, label: t("ml_series") },
    { key: "Descargados" as const, label: t("ml_downloaded") },
  ];

  const remove = (title: string) => {
    setItems((prev) => prev.filter((i) => i.title !== title));
    pushFavorite(title, false);
  };

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

      <main className="w-full px-4 md:px-8 lg:px-14 pt-28 pb-10 max-w-[1800px] mx-auto">
        {query.trim() ? (
          <SearchResults query={query} onQueryChange={setQuery} />
        ) : (
          <>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs text-[#e7bcbc]">
              {recs.genre
                ? `${t("row_because")} ${recs.genre}.`
                : t("ml_sub")}
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-1">
              {t("ml_title")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("grid")}
              aria-label={t("ml_gridView")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                view === "grid" ? "bg-[#ff5262]" : "bg-[#1b1b1f] hover:bg-[#2a292e]"
              }`}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={() => setView("list")}
              aria-label={t("ml_listView")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                view === "list" ? "bg-[#ff5262]" : "bg-[#1b1b1f] hover:bg-[#2a292e]"
              }`}
            >
              <span className="material-symbols-outlined">view_agenda</span>
            </button>
            <span className="ml-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1b1b1f] text-xs font-semibold">
              <span className="material-symbols-outlined text-base">
                download_for_offline
              </span>
              {t("ml_dlActive")} {counts.Descargados}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8">
          {TABS_I18N.map(({ key: k, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                tab === k
                  ? "bg-[#ff5262] text-white shadow-md"
                  : "bg-[#1b1b1f] hover:bg-[#353439]"
              }`}
            >
              {label} ({counts[k]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          !loaded ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-[#1b1b1f] animate-pulse">
                  <div className="w-full aspect-[2/3] bg-[#2a292e]" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3 w-1/3 rounded bg-[#2a292e]" />
                    <div className="h-4 w-2/3 rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="rounded-xl bg-[#1b1b1f] p-10 text-center">
            <p className="font-semibold">
              {items.length === 0 ? t("ml_empty") : t("ml_emptyFilter")}
            </p>
            <p className="text-sm text-white/50 mt-1">
              {items.length === 0
                ? t("ml_emptyMsg")
                : t("ml_emptyFilterMsg")}
            </p>
          </div>
          )
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
            {filtered.map((it) => (
              <MyListCard key={it.title} item={it} onSelect={open} onRemove={remove} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((it) => (
              <div
                key={it.title}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#1b1b1f] hover:bg-[#1f1f23] transition-colors"
              >
                <button onClick={() => open(it)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                  <CoverImg
                    src={thumb(it.image, 256)}
                    alt={it.title}
                    wrapperClassName="w-20 h-28 rounded-lg shrink-0"
                    className="w-full h-full object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold truncate">{it.title}</span>
                    <span className="block text-xs text-white/50 truncate">
                      {it.meta}
                    </span>
                    <span className="block text-xs text-white/60 line-clamp-1 mt-1">
                      {it.synopsis}
                    </span>
                  </span>
                </button>
                <Link
                  href={`/watch?title=${encodeURIComponent(it.title)}`}
                  title={t("ml_play")}
                  className="w-11 h-11 rounded-full bg-[#ff5262] hover:brightness-110 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </Link>
                <button
                  onClick={() => remove(it.title)}
                  title={t("ml_remove")}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 hidden sm:flex items-center justify-center shrink-0"
                >
                  <span className="material-symbols-outlined">bookmark_remove</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {recs.items.length > 0 && (
          <section className="mt-14 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              {t("ml_recs")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recs.items.map((r) => (
                <button
                  key={r.title}
                  onClick={() => open(r)}
                  className="group rounded-xl overflow-hidden bg-[#1b1b1f] text-left hover:scale-[1.03] transition-transform"
                >
                  <span className="block aspect-video overflow-hidden">
                    <CoverImg
                      src={thumb(r.image, 640)}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </span>
                  <span className="block p-3 font-semibold text-sm truncate">
                    {r.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        </>)}
      </main>

      <BrowseFooter />
      <TitleModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
