"use client";

import { useState } from "react";
import type { CatalogItem } from "@/lib/catalog";
import CoverImg from "./CoverImg";
import { loadMyList, saveMyList, toggleMyList } from "@/lib/myListStore";
import { pushFavorite } from "@/lib/myListSync";
import { thumb } from "@/lib/thumb";

function useInList(title: string) {
  const [added, setAdded] = useState<boolean | null>(null);
  const effective =
    added ?? loadMyListSafe().some((i) => i.title === title);
  const toggle = (item: CatalogItem) => {
    const next = toggleMyList(item, loadMyList());
    saveMyList(next);
    const added = next.some((i) => i.title === item.title);
    setAdded(added);
    pushFavorite(item.title, added);
  };
  return { effective, toggle };
}

function loadMyListSafe() {
  try {
    return loadMyList();
  } catch {
    return [];
  }
}

/* Mapas de metadatos exactos del prototipo HTML */

export const CRITICS_META: Record<
  string,
  { rating: string; tech: string; genre: string; runtime: string }
> = {
  "El Horizonte de Sombra": { rating: "9.8", tech: "4K HDR", genre: "Sci-Fi · Odisea", runtime: "2h 42m" },
  "Cadencia Obsesiva": { rating: "9.6", tech: "Atmos", genre: "Drama Psicológico", runtime: "1h 58m" },
  "El Murmullo del Brezo": { rating: "9.4", tech: "4K HDR", genre: "Terror Folk · Misterio", runtime: "2h 04m" },
  "Cenizas de Honor": { rating: "9.7", tech: "Dolby Vision", genre: "Épica Histórica", runtime: "2h 36m" },
};

export const POSTER_META: Record<
  string,
  { badge: string; fresh: boolean; date: string; genre: string }
> = {
  "Protocolo Sombra": { badge: "Recién agregado", fresh: true, date: "12 Ene 2026", genre: "Espionaje · Thriller" },
  "Mares de Kepler": { badge: "Recién agregado", fresh: true, date: "08 Ene 2026", genre: "Aventura · Sci-Fi" },
  "Vigía Nocturno": { badge: "Estreno", fresh: false, date: "04 Ene 2026", genre: "Acción · Vigilante" },
  "Neo Turbo": { badge: "Estreno", fresh: false, date: "01 Ene 2026", genre: "Animación · Acción" },
  "Jugada Ciega": { badge: "Estreno", fresh: false, date: "28 Dic 2025", genre: "Crimen · Suspenso" },
  "Reflejos Rotos": { badge: "Estreno", fresh: false, date: "24 Dic 2025", genre: "Terror Psicológico" },
};

export const PANORAMIC_META: Record<
  string,
  { badge: string; amber: boolean; rating: string; collection: string; runtime: string; tech: string }
> = {
  "Furia Táctica: Extinción Urbana": { badge: "TOP 1 HOY", amber: false, rating: "9.2", collection: "Colección Taquilla", runtime: "2h 20m", tech: "Ultra HD 4K · Atmos" },
  "Velocidad Terminal: El Último Tren": { badge: "MÁS POPULAR", amber: true, rating: "8.9", collection: "Artes Marciales", runtime: "1h 54m", tech: "IMAX Enhanced" },
};

export const BINGE_META: Record<
  string,
  { seasons: string; episodes: string; rating: string; match: string; marathon: string; chip: string }
> = {
  "Archivos Cero: Código Berlín": { seasons: "4 Temporadas completas", episodes: "42 Episodios", rating: "9.4", match: "97% de coincidencia", marathon: "~34h maratón", chip: "Crimen • Misterio" },
  "Extracción Kepler-89": { seasons: "3 Temporadas completas", episodes: "28 Episodios", rating: "9.2", match: "95% de coincidencia", marathon: "~22h maratón", chip: "Sci-Fi • Suspenso" },
  "La Mano Oculta: Dinastía": { seasons: "5 Temporadas completas", episodes: "35 Episodios", rating: "9.0", match: "93% de coincidencia", marathon: "~28h maratón", chip: "Crimen • Drama" },
  "Viento Ártico: Silencio": { seasons: "2 Temporadas completas", episodes: "16 Episodios", rating: "8.8", match: "91% de coincidencia", marathon: "~15h maratón", chip: "Misterio • Drama" },
};

export const MINI_META: Record<
  string,
  { badge: string; rating: string; meta: string }
> = {
  "El Último Voto Imperial": { badge: "Miniserie · 6 Episodios", rating: "9.2", meta: "Drama • Política" },
  "Crescendo Sombra": { badge: "Miniserie · 5 Episodios", rating: "9.0", meta: "Música • Thriller" },
  "Frecuencia Roja: 1974": { badge: "Miniserie · 4 Episodios", rating: "8.8", meta: "Espionaje • Años 70" },
};

export const WEEKLY_META: Record<string, { rating: string; ep: string; dur: string }> = {
  "Cerebro de Enjambre: Redux": { rating: "8.9", ep: "Episodio 1", dur: "64 min" },
  "Cántico de la Sombra": { rating: "8.7", ep: "Episodio 1", dur: "58 min" },
  "Distrito Ronin: Neo-Edo": { rating: "9.1", ep: "Episodio 1", dur: "61 min" },
};

export const MYLIST_META: Record<
  string,
  { kind: string; tech: string; rating: string; runtime: string; progress: number; saved: boolean }
> = {
  "Sombras del Neón": { kind: "Película", tech: "4K HDR", rating: "8.9", runtime: "2h 14m", progress: 65, saved: true },
  "Órbita Escarlata": { kind: "Serie", tech: "Dolby Atmos", rating: "9.3", runtime: "T2 · E6", progress: 25, saved: false },
  "Código Cero": { kind: "Serie", tech: "4K HDR", rating: "9.1", runtime: "T1 · E8", progress: 82, saved: true },
  "Faro del Abismo": { kind: "Película", tech: "Dolby Vision", rating: "8.7", runtime: "1h 58m", progress: 35, saved: false },
  "Génesis Carmesí": { kind: "Película", tech: "4K HDR", rating: "9.0", runtime: "2h 06m", progress: 50, saved: true },
  "Trono de Cenizas": { kind: "Serie", tech: "4K HDR", rating: "8.8", runtime: "T3 · E2", progress: 20, saved: false },
  "Horizonte Terminal": { kind: "Película", tech: "IMAX Enhanced", rating: "8.6", runtime: "2h 22m", progress: 0, saved: true },
  "Protocolo Espejo": { kind: "Serie", tech: "Dolby Atmos", rating: "8.5", runtime: "T1 · E4", progress: 0, saved: false },
  "Velocidad Sombra": { kind: "Película", tech: "4K HDR", rating: "8.4", runtime: "1h 47m", progress: 0, saved: false },
  "Dinastía de Sangre": { kind: "Serie", tech: "4K HDR", rating: "9.2", runtime: "T2 · E1", progress: 0, saved: true },
};

type Select = (item: CatalogItem) => void;

/* ---------- PELÍCULAS: carrusel Aclamadas (16/10, auto-cols 23.5%) ---------- */

export function CriticsCard({ item, onSelect }: { item: CatalogItem; onSelect: Select }) {
  const m = CRITICS_META[item.title] ?? { rating: item.rating ?? "9.0", tech: "4K HDR", genre: (item.genres ?? []).join(" · "), runtime: "2h 00m" };
  return (
    <article
      onClick={() => onSelect(item)}
      className="group relative flex flex-col bg-[#1b1b1f] rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer snap-start"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <CoverImg
          src={thumb(item.image, 640)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1f] via-transparent to-black/30" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[#ffba20] text-[10px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {m.rating}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold">{m.tech}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#131317]/40 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full bg-[#ff5262] text-white flex items-center justify-center shadow-lg shadow-[#ff5262]/50 transform group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[#e7bcbc] text-[10px] font-semibold">
          <span>{m.genre}</span>
          <span>{m.runtime}</span>
        </div>
        <h3 className="text-base font-bold truncate group-hover:text-[#ffb3b3] transition-colors">{item.title}</h3>
        <p className="text-xs text-[#e7bcbc] line-clamp-2">{item.synopsis}</p>
      </div>
    </article>
  );
}

/* ---------- PELÍCULAS: póster vertical 2/3, grid 2/3/4/6 ---------- */

export function PosterMiniCard({ item, onSelect }: { item: CatalogItem; onSelect: Select }) {
  const m = POSTER_META[item.title] ?? { badge: "Estreno", fresh: false, date: item.year ?? "", genre: (item.genres ?? []).join(" · ") };
  const { effective: saved, toggle } = useInList(item.title);
  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col bg-[#1b1b1f] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer"
    >
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <CoverImg
          src={thumb(item.posterUrl ?? item.image, 256)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1f] via-transparent to-black/20" />
        <span
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold shadow-md ${
            m.fresh ? "bg-[#ff5262] text-white" : "bg-[#353439]/80 backdrop-blur-md"
          }`}
        >
          {m.badge}
        </span>
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            aria-label={saved ? "Quitar de favoritos" : "Añadir a favoritos"}
            onClick={(e) => { e.stopPropagation(); toggle(item); }}
            className="w-9 h-9 rounded-full bg-[#353439]/90 hover:bg-[#ff5262] text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-base">{saved ? "check" : "bookmark_add"}</span>
          </button>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className={`text-[10px] font-bold ${m.fresh ? "text-[#ffb3b3]" : "text-[#e7bcbc]"}`}>{m.date}</span>
        <h4 className="text-base font-semibold truncate group-hover:text-[#ffb3b3] transition-colors">{item.title}</h4>
        <span className="text-xs text-[#e7bcbc] truncate">{m.genre}</span>
      </div>
    </div>
  );
}

/* ---------- PELÍCULAS: panorámica 21/9, grid 1/2 ---------- */

export function PanoramicActionCard({ item, onSelect }: { item: CatalogItem; onSelect: Select }) {
  const m = PANORAMIC_META[item.title] ?? { badge: "Destacado", amber: false, rating: item.rating ?? "", collection: "", runtime: "", tech: "" };
  return (
    <article
      onClick={() => onSelect(item)}
      className="group relative rounded-2xl overflow-hidden bg-[#1b1b1f] shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
    >
      <div className="relative w-full aspect-[21/9] overflow-hidden">
        <CoverImg
          src={thumb(item.image, 640)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1f] via-[#1b1b1f]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1b1b1f] via-transparent to-transparent" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${m.amber ? "bg-[#feb700] text-[#412d00]" : "bg-[#ff5262] text-white"}`}>
            {m.badge}
          </span>
          <span className="px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-[#ffba20]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {m.rating}
          </span>
        </div>
        <div className="absolute right-6 bottom-6 w-14 h-14 rounded-full bg-[#ff5262] text-white flex items-center justify-center shadow-xl shadow-[#ff5262]/40 transform group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-2 -mt-6 relative z-10">
        <div className="flex items-center gap-3 text-[#e7bcbc] text-[10px] font-semibold">
          <span className="text-[#ffb3b3] font-bold">{m.collection}</span>
          <span>•</span>
          <span>{m.runtime}</span>
          <span>•</span>
          <span>{m.tech}</span>
        </div>
        <h3 className="text-xl font-semibold group-hover:text-[#ffb3b3] transition-colors">{item.title}</h3>
        <p className="text-sm text-[#e7bcbc] max-w-xl line-clamp-2">{item.synopsis}</p>
      </div>
    </article>
  );
}

/* ---------- SERIES: maratoneables 16/10, grid 1/2/4 ---------- */

export function BingeCard({ item, onSelect }: { item: CatalogItem; onSelect: Select }) {
  const m = BINGE_META[item.title] ?? { seasons: "", episodes: "", rating: item.rating ?? "", match: "", marathon: "", chip: (item.genres ?? []).join(" • ") };
  const { effective: saved, toggle } = useInList(item.title);
  return (
    <article
      onClick={() => onSelect(item)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#1b1b1f] shadow-xl hover:shadow-2xl hover:shadow-black/80 transition-all duration-300 cursor-pointer"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#2a292e]">
        <CoverImg
          src={thumb(item.image, 640)}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1f] via-[#1b1b1f]/20 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span className="px-2.5 py-1 rounded bg-[#ff5262] text-white text-[10px] font-bold shadow-md shadow-[#ff5262]/30">{m.seasons}</span>
          <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[#ffba20] text-[10px]">{m.episodes}</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/80 backdrop-blur-md flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-[#ffba20]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[10px]">{m.rating}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#131317]/40 backdrop-blur-[2px] transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-[#ff5262] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[#e7bcbc] text-[10px] font-semibold">
            <span className="text-[#ffb3b3] font-semibold">{m.match}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">history</span> {m.marathon}</span>
          </div>
          <h3 className="text-base font-semibold group-hover:text-[#ffb3b3] transition-colors">{item.title}</h3>
          <p className="text-xs text-[#e7bcbc] line-clamp-2">{item.synopsis}</p>
        </div>
        <div className="pt-2 flex items-center justify-between text-[#e7bcbc] text-[10px] font-semibold">
          <span className="px-2 py-0.5 rounded bg-[#1f1f23]">{m.chip}</span>
          <div className="flex items-center gap-2">
            <button aria-label={saved ? "Quitar de Mi Lista" : "Guardar"} onClick={(e) => { e.stopPropagation(); toggle(item); }} className="hover:text-[#ff5262] transition-colors"><span className="material-symbols-outlined text-lg">{saved ? "check" : "bookmark_add"}</span></button>
            <button aria-label="Me gusta" onClick={(e) => e.stopPropagation()} className="hover:text-[#ff5262] transition-colors"><span className="material-symbols-outlined text-lg">favorite</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- SERIES: miniseries 3/4, grid 1/3 ---------- */

export function MiniseriesCard({ item, onSelect }: { item: CatalogItem; onSelect: Select }) {
  const m = MINI_META[item.title] ?? { badge: "Miniserie", rating: item.rating ?? "", meta: (item.genres ?? []).join(" • ") };
  return (
    <article
      onClick={() => onSelect(item)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#1b1b1f] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <CoverImg
          src={thumb(item.image, 640)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/30 to-transparent" />
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <span className="px-2.5 py-1 rounded bg-[#ff5262] text-white text-[10px] font-bold">{m.badge}</span>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/90 backdrop-blur-md">
          <span className="material-symbols-outlined text-xs text-[#ffba20]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[10px] font-bold">{m.rating}</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
          <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
          <span className="text-[10px] text-[#e7bcbc] font-semibold">{m.meta}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-[#e7bcbc] line-clamp-2">{item.synopsis}</p>
      </div>
    </article>
  );
}

/* ---------- SERIES: semanales aspect-video, grid 1/2/3 ---------- */

export function WeeklyCard({ item, onSelect }: { item: CatalogItem; onSelect: Select }) {
  const m = WEEKLY_META[item.title] ?? { rating: item.rating ?? "", ep: "Episodio 1", dur: "" };
  return (
    <article
      onClick={() => onSelect(item)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#1b1b1f] shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
    >
      <div className="relative w-full aspect-video overflow-hidden">
        <CoverImg
          src={thumb(item.image, 640)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded bg-black/80 text-[10px] font-bold">Nuevo episodio viernes</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/80 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-[#ffba20]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[10px] font-bold">{m.rating}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 justify-between flex-1">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-bold group-hover:text-[#ffb3b3] transition-colors">{item.title}</h3>
          <p className="text-xs text-[#e7bcbc] line-clamp-2">{item.synopsis}</p>
        </div>
        <div className="flex flex-col gap-2 pt-2 bg-black/40 p-3 rounded-xl mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            className="flex items-center gap-2 text-sm font-semibold hover:text-[#ffb3b3] transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            {m.ep} ({m.dur})
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- MI LISTA: grid 2/3/4/6, aspect 2/3 ---------- */

export function MyListCard({
  item,
  onSelect,
  onRemove,
}: {
  item: CatalogItem;
  onSelect: Select;
  onRemove: (title: string) => void;
}) {
  const m = MYLIST_META[item.title] ?? { kind: item.type ?? "", tech: "4K HDR", rating: item.rating ?? "", runtime: item.meta ?? "", progress: item.progress ?? 0, saved: !!item.downloaded };
  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#1b1b1f] transition-all duration-300 hover:scale-[1.03] hover:z-20 hover:shadow-2xl hover:shadow-[#ff5262]/10">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#1f1f23]" onClick={() => onSelect(item)}>
        <CoverImg
          src={thumb(item.posterUrl ?? item.image, 256)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          <span className="px-2 py-0.5 rounded bg-black/90 backdrop-blur-md text-[10px] uppercase">{m.kind}</span>
          <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[#ffb3b3] text-[10px] font-bold">{m.tech}</span>
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            aria-label="Eliminar de mi lista"
            onClick={(e) => { e.stopPropagation(); onRemove(item.title); }}
            className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md hover:bg-[#ff5262] hover:text-white flex items-center justify-center transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_remove</span>
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <button
            aria-label="Reproducir"
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            className="pointer-events-auto w-12 h-12 rounded-full bg-[#ff5262] text-white flex items-center justify-center shadow-lg shadow-[#ff5262]/40 hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </button>
        </div>
        {m.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 w-full bg-white/20 h-1">
            <div className="h-full bg-[#ff5262]" style={{ width: `${m.progress}%` }} />
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col justify-between flex-grow bg-[#1b1b1f]">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] text-[#feb700] flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {m.rating}
            </span>
            <span className="text-xs text-[#e7bcbc]/70">{m.runtime}</span>
          </div>
          <h3 className="text-base truncate group-hover:text-[#ffb3b3] transition-colors">{item.title}</h3>
        </div>
        <div className="flex items-center justify-between pt-2 mt-2 text-[#e7bcbc]/80">
          {m.saved ? (
            <span className="text-[10px] text-[#ffb3b3] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">offline_pin</span> Guardado
            </span>
          ) : (
            <span className="text-[10px] text-[#e7bcbc]">{m.kind === "Serie" ? "10 Episodios" : "Película"}</span>
          )}
          <button aria-label="Opciones" onClick={(e) => e.stopPropagation()} className="p-1 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-base">more_vert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
