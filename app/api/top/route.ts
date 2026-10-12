import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

/** GET /api/top → lo más visto por TODA la plataforma + lo más buscado.
 *  Pública (la landing la usa sin sesión).
 *  - Vistas: agrega claves popconly:progress:* (por perfil y legacy),
 *    cuenta espectadores ÚNICOS por título (pos/total ≥ 10%).
 *  - Búsquedas: top del ranking popconly:searches (lo alimenta /api/titles?q=).
 *  - Se guarda 30 min en Redis: estable y rápida para todos.
 *  - { slugs: string[10], topSearches: string[6] } (vacío = aún sin datos). */
export async function GET() {
  const r = getRedis();
  if (!r) return NextResponse.json({ slugs: [], topSearches: [] });

  const KEY = "popconly:top:global";
  try {
    const raw = await r.get(KEY);
    if (raw) {
      const d = JSON.parse(raw) as { slugs?: string[]; topSearches?: string[] };
      if (Array.isArray(d.slugs)) return NextResponse.json({ slugs: d.slugs, topSearches: d.topSearches ?? [] });
    }
  } catch {
    /* se recalcula */
  }

  try {
    const viewers = new Map<string, Set<string>>();
    const plays = new Map<string, number>();
    let cursor = "0";
    let scanned = 0;
    do {
      const [next, keys] = (await r.scan(cursor, "MATCH", "popconly:progress:*", "COUNT", 300)) as [
        string,
        string[]
      ];
      cursor = next;
      for (const k of keys) {
        if (++scanned > 3000) break;
        const userId = k.split(":")[2] ?? "?";
        let entries: Record<string, string> = {};
        try {
          entries = (await r.hgetall(k)) as Record<string, string>;
        } catch {
          continue;
        }
        for (const [slug, val] of Object.entries(entries)) {
          try {
            const e = JSON.parse(val) as { pos?: number; total?: number };
            const pos = Number(e.pos ?? 0);
            const total = Number(e.total ?? 0);
            if (!(total > 0) || pos / total < 0.1) continue;
            if (!viewers.has(slug)) viewers.set(slug, new Set());
            viewers.get(slug)!.add(userId);
            plays.set(slug, (plays.get(slug) ?? 0) + 1);
          } catch {
            /* entrada corrupta */
          }
        }
      }
    } while (cursor !== "0" && scanned <= 3000);

    const ranked = [...viewers.entries()]
      .map(([slug, set]) => ({ slug, viewers: set.size, plays: plays.get(slug) ?? 0 }))
      .sort((a, b) => b.viewers - a.viewers || b.plays - a.plays)
      .slice(0, 10);

    let topSearches: string[] = [];
    try {
      topSearches = await r.zrevrange("popconly:searches", 0, 5);
    } catch {
      /* sin búsquedas aún */
    }

    const out = { slugs: ranked.map((x) => x.slug), topSearches };
    try {
      await r.set(KEY, JSON.stringify(out), "EX", 1800);
    } catch {
      /* mejor esfuerzo */
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ slugs: [], topSearches: [] });
  }
}
