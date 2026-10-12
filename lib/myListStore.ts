import type { CatalogItem } from "./catalog";

// v2: Mi Lista NUNCA se prellena con demos. Solo lo que el usuario añade
// con + (la v1 traía títulos automáticos; esa cola vieja queda abandonada).
const KEY = "popconly:my-list:v2";

function isValid(items: unknown): items is CatalogItem[] {
  return (
    Array.isArray(items) &&
    items.every(
      (i) =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CatalogItem).title === "string" &&
        typeof (i as CatalogItem).image === "string"
    )
  );
}

export function loadMyList(fallback: CatalogItem[] = []): CatalogItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveMyList(items: CatalogItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function toggleMyList(item: CatalogItem, items: CatalogItem[]): CatalogItem[] {
  return items.some((i) => i.title === item.title)
    ? items.filter((i) => i.title !== item.title)
    : [...items, { ...item, downloaded: false }];
}
