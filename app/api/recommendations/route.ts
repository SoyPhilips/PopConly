import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis, redisUnavailable } from "@/lib/redis";
import { allTitles } from "@/lib/findTitle";
import { slugify } from "@/lib/slugs";

/** GET /api/recommendations?profile=... → bolsa variada y rotativa por día.
 *  - 2 géneros dominantes del perfil + relleno top unseen (no solo 8 del top1).
 *  - Se GUARDA por usuario+perfil en Redis (1 día): estable todo el día,
 *    rápida y verdaderamente "del usuario". La rotación cambia al día siguiente.
 *  - { slugs, reason, genre } (genre = dominante, para etiquetas). */
export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = getRedis();
  if (!r) return NextResponse.json(redisUnavailable(), { status: 503 });

  const profile = (() => {
    try {
      return new URL(req.url).searchParams.get("profile")?.trim() || "Principal";
    } catch {
      return "Principal";
    }
  })();
  const pkey = `popconly:progress:${userId}:${profile.toLowerCase().slice(0, 32)}`;
  const rkey = `popconly:recs:${userId}:${profile.toLowerCase().slice(0, 32)}`;
  const today = (() => {
    const now = new Date();
    return Math.floor(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000
    );
  })();

  try {
    // Lo ya guardado hoy para este usuario+perfil manda (estable, rápido).
    try {
      const raw = await r.get(rkey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          day?: number;
          slugs?: string[];
          reason?: string | null;
          genre?: string | null;
        };
        if (saved && saved.day === today && Array.isArray(saved.slugs)) {
          return NextResponse.json({
            slugs: saved.slugs,
            reason: saved.reason ?? null,
            genre: saved.genre ?? null,
          });
        }
      }
    } catch {
      /* se recalcula */
    }

    const [scoped, legacy, favs] = await Promise.all([
      r.hkeys(pkey),
      r.hkeys(`popconly:progress:${userId}`),
      r.smembers(`popconly:fav:${userId}`),
    ]);
    const prog = [...new Set([...legacy, ...scoped])];
    const seen = new Set([...prog, ...favs]);
    const catalog = allTitles();

    // Títulos que el perfil ya vio, en orden de catálogo (para reason).
    const seenTitles = catalog.filter((c) => seen.has(slugify(c.title)));

    // Dos géneros dominantes entre lo visto/guardado.
    const counts = new Map<string, number>();
    for (const t of seenTitles) {
      for (const g of t.genres ?? []) {
        const k = g.toLowerCase();
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top1 = ranked[0]?.[0];
    const top2 = ranked[1]?.[0];
    if (!top1) return NextResponse.json({ slugs: [], reason: null, genre: null });

    const unseen = catalog.filter((c) => !seen.has(slugify(c.title)));
    const ofGenre = (g: string) =>
      unseen.filter((c) => (c.genres ?? []).some((x) => x.toLowerCase() === g));
    const pool: typeof catalog = [];
    const pushUnique = (list: typeof catalog, n: number) => {
      let added = 0;
      for (const c of list) {
        if (added >= n || pool.length >= 30) break;
        if (pool.some((p) => slugify(p.title) === slugify(c.title))) continue;
        pool.push(c);
        added++;
      }
    };
    pushUnique(ofGenre(top1), 14);
    if (top2 && top2 !== top1) pushUnique(ofGenre(top2), 8);
    // Relleno: lo mejor no visto (rating) para que la bolsa no se agote.
    if (pool.length < 20) {
      const fill = [...unseen]
        .filter((c) => !pool.some((p) => slugify(p.title) === slugify(c.title)))
        .sort((a, b) => parseFloat(b.rating ?? "0") - parseFloat(a.rating ?? "0"));
      pushUnique(fill, 8);
    }

    // Rotación diaria determinista (perfil + día): varía entre días, estable hoy.
    let h = 0;
    const ps = profile.toLowerCase();
    for (let i = 0; i < ps.length; i++) h = (h * 31 + ps.charCodeAt(i)) >>> 0;
    const rot = pool.length > 0 ? (today + h) % pool.length : 0;
    const rotated = pool.length > 0 ? [...pool.slice(rot), ...pool.slice(0, rot)] : pool;

    const reasonTitle =
      seenTitles.find((t) => (t.genres ?? []).some((g) => g.toLowerCase() === top1))?.title ??
      seenTitles[0]?.title ??
      null;
    const out = {
      slugs: rotated.map((c) => slugify(c.title)),
      reason: reasonTitle,
      genre: top1,
    };
    // Se guarda para el usuario+perfil (estable todo el día en todo lugar).
    try {
      await r.set(rkey, JSON.stringify({ day: today, ...out }), "EX", 60 * 60 * 24 * 2);
    } catch {
      /* mejor esfuerzo */
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json(redisUnavailable(), { status: 503 });
  }
}
