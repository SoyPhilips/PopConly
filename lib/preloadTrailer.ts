import { slugify } from "./slugs";

const cache = new Map<string, string>();
const warming = new Set<string>();

/** Precarga el trailer al pasar el cursor: al hacer click ya está en caché
 *  y el preview arranca siempre igual de rápido. */
export function warmTrailer(title: string) {
  if (typeof document === "undefined") return;
  const slug = slugify(title);
  if (cache.has(slug) || warming.has(slug)) return;
  warming.add(slug);
  fetch(`/api/titles?slug=${encodeURIComponent(slug)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const url = (d as { doc?: { trailerUrl?: string } } | null)?.doc?.trailerUrl;
      cache.set(slug, url ?? "");
      if (url) {
        const v = document.createElement("video");
        v.muted = true;
        v.preload = "auto";
        v.src = url;
        v.load();
      }
    })
    .catch(() => cache.set(slug, ""))
    .finally(() => warming.delete(slug));
}
