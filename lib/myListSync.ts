"use client";

import { slugify } from "./slugs";

/** Sincroniza favoritos con Redis cuando hay sesión; si no, no hace nada
 *  (Mi Lista local sigue funcionando igual). */
export async function pushFavorite(title: string, inList: boolean) {
  try {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slugify(title), action: inList ? "add" : "remove" }),
    });
  } catch {
    /* sin servidor: queda solo en local */
  }
}

/** Slugs guardados en el servidor, o null si no hay sesión/servidor. */
export async function pullFavorites(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/favorites");
    if (!res.ok) return null;
    const data = (await res.json()) as { slugs?: string[] };
    return Array.isArray(data.slugs) ? data.slugs : null;
  } catch {
    return null;
  }
}
