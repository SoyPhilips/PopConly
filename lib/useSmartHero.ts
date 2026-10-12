"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { CatalogItem } from "./catalog";
import { getActiveProfile } from "./activeProfile";

/** Héroe inteligente: si el perfil tiene historial, el primer plano es un
 *  recomendado del algoritmo (mismo motor que "Recomendado para ti"); si no,
 *  el héroe editorial de cada página. Nunca rompe nada.
 *
 *  - Primer render = editorial SIEMPRE (sin hydration error); la caché entra
 *    pre-pintado (invisible).
 *  - `type` estricto: Series jamás muestra una película (ni de caché).
 *  - `offset`: cada sección arranca en otro punto de la bolsa (portadas
 *    distintas entre Inicio/Películas/Series, estables por día).
 *  - `transition`: true solo cuando el algoritmo cambia lo visible (fundido);
 *    montar o aplicar caché no anima. */

// En servidor no hay layout-effect: se usa effect normal (no hace nada ahí).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cacheKey = (profile: string, type?: string) =>
  `popconly:hero:v2:${profile.toLowerCase().slice(0, 32)}:${type ?? "all"}`;

function typeOk(item: CatalogItem, type?: "Película" | "Serie"): boolean {
  return !type || item.type === type;
}

function readCache(fallback: CatalogItem, type?: "Película" | "Serie"): CatalogItem {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(cacheKey(getActiveProfile(), type));
    if (!raw) return fallback;
    const item = JSON.parse(raw) as CatalogItem;
    return item &&
      typeof item.title === "string" &&
      typeof item.image === "string" &&
      typeOk(item, type)
      ? item
      : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(item: CatalogItem, type?: "Película" | "Serie") {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(getActiveProfile(), type), JSON.stringify(item));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function useSmartHero(
  fallback: CatalogItem,
  type?: "Película" | "Serie",
  offset = 0
): { hero: CatalogItem; reason: string | null; personalized: boolean; ready: boolean } {
  // Primer render = editorial SIEMPRE (servidor y cliente idénticos) y SIN
  // imagen: el navegador pinta el HTML del servidor antes de hidratar, así
  // que pintar la editorial ahí garantiza "una imagen y luego otra".
  // La primera imagen que se pinta ya es la correcta (con fundido).
  const [hero, setHero] = useState<CatalogItem>(fallback);
  const [reason, setReason] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { status } = useSession();

  // Caché del perfil antes del primer pintado: sin flash, sin hydration error.
  // Si la caché no respeta el tipo, se ignora (sana cachés viejas).
  useIsomorphicLayoutEffect(() => {
    const cached = readCache(fallback, type);
    if (cached.title !== fallback.title) setHero(cached);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/recommendations?profile=${encodeURIComponent(getActiveProfile())}`
        );
        if (!r.ok) return;
        const d = (await r.json()) as { slugs?: string[]; reason?: string | null };
        const slugs = d.slugs ?? [];
        if (slugs.length === 0) return;
        const t = await fetch(`/api/titles?slugs=${encodeURIComponent(slugs.join(","))}`);
        if (!t.ok) return;
        const docs = (await t.json()) as { items?: CatalogItem[] };
        const items = docs.items ?? [];
        // Estricto por tipo + offset por sección. Sin match: editorial.
        const pool = type ? items.filter((i) => i.type === type) : items;
        if (pool.length === 0) {
          if (!cancelled) {
            writeCache(fallback, type);
            setHero((prev) => (prev.title === fallback.title ? prev : fallback));
          }
          return;
        }
        const pick = pool[offset % pool.length];
        if (!cancelled && pick) {
          setHero((prev) => {
            if (prev.title === pick.title) return prev;
            writeCache(pick, type);
            return pick;
          });
          setReason(d.reason ?? null);
        }
      } catch {
        /* héroe editorial */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return { hero, reason, personalized: hero.title !== fallback.title, ready };
}
