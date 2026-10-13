"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TitleModal, { type TitleDetail } from "./TitleModal";
import { SearchCard } from "./SearchCard";
import type { CatalogItem } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";

const SUGGESTIONS = ["Ciencia ficción", "Thriller", "Comedia", "2026", "Anime", "Drama"];

export default function SearchResults({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const [selected, setSelected] = useState<TitleDetail | null>(null);
  const [exact, setExact] = useState<CatalogItem[]>([]);
  const [related, setRelated] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  // Lo más buscado por todos (con respaldo local).
  const [hotSearches, setHotSearches] = useState<string[]>(SUGGESTIONS);
  const { t } = useLang();

  const q = query.trim().toLowerCase();

  // Catálogo vía API (Mongo si existe, local si no). Sin esto, títulos nuevos
  // en Mongo serían invisibles al buscar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/top");
        if (!r.ok) return;
        const d = (await r.json()) as { topSearches?: string[] };
        if (!cancelled && d.topSearches && d.topSearches.length > 0) {
          setHotSearches(
            d.topSearches.slice(0, 6).map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          );
        }
      } catch {
        /* sugerencias locales */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!q) {
      setExact([]);
      setRelated([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/titles?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return;
        const data = (await res.json()) as { items?: CatalogItem[]; related?: CatalogItem[] };
        if (cancelled) return;
        if (Array.isArray(data.items)) setExact(data.items);
        if (Array.isArray(data.related)) setRelated(data.related);
      } catch {
        /* se mantiene lo anterior */
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips = useMemo(() => {
    const list: string[] = [];
    exact.slice(0, 2).forEach((t) => list.push(t.title));
    if (exact[0]) list.push(`Colección de ${exact[0].title}`);
    return list.slice(0, 4);
  }, [exact]);

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

  const total = exact.length + related.length;

  if (!q) {
    return (
      <div className="rounded-xl bg-[#1b1b1f] p-10 text-center">
        <span className="material-symbols-outlined text-5xl text-white/30">search</span>
        <p className="font-semibold mt-3">{t("sr_searchTitle")}</p>
        <p className="text-sm text-white/50 mt-1">
          {t("sr_searchSub")}
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {hotSearches.map((s) => (
            <button
              key={s}
              onClick={() => onQueryChange(s)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
        <Link href="/browse" className="inline-block mt-6 text-xs text-white/60 hover:text-white underline underline-offset-4">
          {t("sr_back")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] mb-6">
          <span className="text-white/50">{t("sr_more")}</span>
          {chips.map((c, i) => (
            <span key={c} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-5 bg-white/20" />}
              <button
                onClick={() => onQueryChange(c.replace(/^Colección de /, ""))}
                className="hover:text-white text-white/90 text-left cursor-pointer"
              >
                {c}
              </button>
            </span>
          ))}
        </div>
      )}

      {total === 0 ? (
        searching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mt-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-[#1b1b1f] animate-pulse">
                <div className="w-full aspect-video bg-[#2a292e]" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-3 w-2/3 rounded bg-[#2a292e]" />
                  <div className="h-3 w-full rounded bg-[#2a292e]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="rounded-xl bg-[#1b1b1f] p-10 text-center mt-6">
          <p className="font-semibold">{t("sr_noRes")} “{query.trim()}”</p>
          <p className="text-sm text-white/50 mt-1">
            {t("sr_try")}
          </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {hotSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => onQueryChange(s)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {exact.map((item) => (
              <SearchCard key={item.title} item={item} onSelect={open} />
            ))}
          </div>
          {related.length > 0 && (
            <>
              <p className="text-white/50 text-sm mt-8 mb-3">
                {t("sr_sameCat")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {related.map((item) => (
                  <SearchCard key={item.title} item={item} onSelect={open} />
                ))}
              </div>
            </>
          )}
        </>
      )}
      <TitleModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
