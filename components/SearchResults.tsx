"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TitleModal, { type TitleDetail } from "./TitleModal";
import { SearchCard } from "./SearchCard";
import type { CatalogItem } from "@/lib/catalog";

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

  const q = query.trim().toLowerCase();

  // Catálogo vía API (Mongo si existe, local si no). Sin esto, títulos nuevos
  // en Mongo serían invisibles al buscar.
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
        <p className="font-semibold mt-3">Busca en todo PopConly</p>
        <p className="text-sm text-white/50 mt-1">
          Títulos, géneros, personas y años de películas y series.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {SUGGESTIONS.map((s) => (
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
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] mb-6">
          <span className="text-white/50">Más contenido para explorar:</span>
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
          <p className="font-semibold">Sin coincidencias para “{query.trim()}”</p>
          <p className="text-sm text-white/50 mt-1">
            Prueba con otro título, género o año.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {SUGGESTIONS.map((s) => (
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
                Más títulos de la misma categoría
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
