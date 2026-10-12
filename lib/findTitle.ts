import type { CatalogItem } from "./catalog";
import { RECENTLY_ADDED } from "./data";
import { REAL_TITLES } from "./catalogReal";
import { isGenericSynopsis, synopsisFor } from "./synopsis";

/** Catálogo unificado para búsqueda y reproductor: solo títulos reales locales
 *  (más Toy Story y Spider-Man con video o trailer). Nada de pósters de internet. */
export function allTitles(): CatalogItem[] {
  const map = new Map<string, CatalogItem>();
  const push = (c: CatalogItem) => {
    if (!map.has(c.title)) map.set(c.title, c);
  };

  // Recents con video real o trailer sincronizado (Toy Story 5, Spider-Man).
  RECENTLY_ADDED.filter((r) => r.videoUrl || r.trailerYoutube).forEach((r) =>
    push({
      title: r.title,
      image: r.image,
      year: "2026",
      age: r.age ?? "16+",
      type: r.meta.includes("Serie") ? "Serie" : "Película",
      genres: r.meta.split("•").map((g) => g.trim()),
      synopsis: r.desc,
      rating: r.rating,
      meta: r.meta,
      videoUrl: r.videoUrl,
      trailerUrl: r.trailerUrl,
      trailerYoutube: (r as { trailerYoutube?: string }).trailerYoutube,
      posterUrl: r.posterUrl,
    })
  );
  REAL_TITLES.forEach((r) =>
    push(
      isGenericSynopsis(r.item.synopsis)
        ? {
            ...r.item,
            synopsis: synopsisFor(
              r.item.title,
              r.item.genres?.[0],
              r.item.year,
              r.item.type
            ),
          }
        : r.item
    )
  );

  return [...map.values()];
}

/** Normaliza para comparar: minúsculas, sin acentos ni signos ("Daredevil: Born
 *  Again" == "daredevil born again", "3 Body Problem" == "3 body problem"). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:;.,'"!?()[\]{}\-–—/\\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findTitle(title: string): CatalogItem | null {
  const q = normalize(title);
  if (!q) return null;
  const all = allTitles();
  // 1) Exacto (como hoy). 2) Normalizado. 3) Empieza con (por si trae sufijo).
  return (
    all.find((t) => t.title.toLowerCase() === title.trim().toLowerCase()) ??
    all.find((t) => normalize(t.title) === q) ??
    all.find((t) => normalize(t.title).startsWith(q)) ??
    null
  );
}

export function searchTitles(query: string): CatalogItem[] {
  const q = normalize(query);
  if (!q) return [];
  return allTitles().filter((t) =>
    normalize(
      `${t.title} ${t.synopsis ?? ""} ${(t.genres ?? []).join(" ")} ${t.type ?? ""} ${t.year ?? ""}`
    ).includes(q)
  );
}
