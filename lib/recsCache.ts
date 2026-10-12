import type { CatalogItem } from "./catalog";
import { getActiveProfile } from "./activeProfile";

/** Caché local de recomendados por perfil (pinta instantáneo; el servidor
 *  manda si cambia). Con fecha: solo vale el día actual. */

export type RecsCache = {
  day: number;
  items: CatalogItem[];
  reason: string | null;
  genre: string | null;
};

export function todayDay(): number {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000
  );
}

function key(): string {
  return `popconly:recsc:${getActiveProfile().toLowerCase().slice(0, 32)}`;
}

export function readRecsCache(): RecsCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key());
    if (!raw) return null;
    const d = JSON.parse(raw) as RecsCache;
    if (!d || d.day !== todayDay() || !Array.isArray(d.items)) return null;
    return d;
  } catch {
    return null;
  }
}

export function writeRecsCache(items: CatalogItem[], reason: string | null, genre: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      key(),
      JSON.stringify({ day: todayDay(), items, reason, genre } satisfies RecsCache)
    );
  } catch {
    /* almacenamiento no disponible */
  }
}

export function sameRecs(a: CatalogItem[], b: CatalogItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x.title === b[i]?.title);
}
