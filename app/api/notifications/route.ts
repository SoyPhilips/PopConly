import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis, redisUnavailable } from "@/lib/redis";
import { getRecentTrailers } from "@/lib/catalogDb";
import { allTitles } from "@/lib/findTitle";
import { slugify } from "@/lib/slugs";

export type NotifItem = {
  id: string;
  kind: "nuevo" | "recomendado";
  title: string;
  body: string;
  slug: string;
  image: string;
  at: number;
  read: boolean;
};

const keyFor = (userId: string, profile: string) =>
  `popconly:notif:${userId}:${profile.toLowerCase().slice(0, 32)}`;
const seenKeyFor = (userId: string, profile: string) =>
  `popconly:notifseen:${userId}:${profile.toLowerCase().slice(0, 32)}`;

function profileOf(req: Request, body?: { profile?: string }): string {
  const fromBody = body?.profile?.trim();
  if (fromBody) return fromBody;
  try {
    return new URL(req.url).searchParams.get("profile")?.trim() || "Principal";
  } catch {
    return "Principal";
  }
}

async function readAll(userId: string, profile: string): Promise<NotifItem[]> {
  const r = getRedis();
  if (!r) return [];
  try {
    const raw = await r.get(keyFor(userId, profile));
    if (!raw) return [];
    const list = JSON.parse(raw) as NotifItem[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeAll(userId: string, profile: string, items: NotifItem[]): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(keyFor(userId, profile), JSON.stringify(items.slice(0, 20)), "EX", 60 * 60 * 24 * 60);
  } catch {
    /* mejor esfuerzo */
  }
}

/** Genera novedades para el perfil: trailers sincronizados desde su última
 *  visita + recomendados del algoritmo que aún no se le avisaron. */
async function ensureFresh(userId: string, profile: string): Promise<NotifItem[]> {
  const r = getRedis();
  if (!r) return [];
  const existing = await readAll(userId, profile);
  let lastSeen = 0;
  try {
    lastSeen = Number((await r.get(seenKeyFor(userId, profile))) ?? 0) || 0;
  } catch {
    /* primera vez */
  }
  const now = Date.now();
  const knownSlugs = new Set(existing.map((n) => n.slug));
  const fresh: NotifItem[] = [];

  // 1. Novedades: trailers sincronizados después de su última visita.
  try {
    const recent = await getRecentTrailers(12);
    for (const doc of recent) {
      if (fresh.length >= 3) break;
      const at = Date.parse(doc.trailerFetchedAt ?? "") || 0;
      const slug = doc.slug;
      if (!at || at <= lastSeen || knownSlugs.has(slug)) continue;
      fresh.push({
        id: `nuevo-${slug}`,
        kind: "nuevo",
        title: `Nuevo trailer: ${doc.title}`,
        body: `Ya puedes ver el avance en ${doc.type ?? "PopConly"}.`,
        slug,
        image: doc.image,
        at,
        read: false,
      });
      knownSlugs.add(slug);
    }
  } catch {
    /* sin catálogo */
  }

  // 2. Recomendados del algoritmo (género dominante del historial).
  try {
    const pkey = `popconly:progress:${userId}:${profile.toLowerCase().slice(0, 32)}`;
    const [scoped, legacy] = await Promise.all([
      r.hkeys(pkey).catch(() => [] as string[]),
      r.hkeys(`popconly:progress:${userId}`).catch(() => [] as string[]),
    ]);
    const seen = new Set([...scoped, ...legacy]);
    if (seen.size > 0) {
      const catalog = allTitles();
      const counts = new Map<string, number>();
      for (const slug of seen) {
        const t = catalog.find((c) => slugify(c.title) === slug);
        for (const g of t?.genres ?? []) {
          const k = g.toLowerCase();
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (top) {
        for (const c of catalog) {
          if (fresh.length >= 5) break;
          const slug = slugify(c.title);
          if (seen.has(slug) || knownSlugs.has(slug)) continue;
          if (!(c.genres ?? []).some((g) => g.toLowerCase() === top)) continue;
          fresh.push({
            id: `rec-${slug}`,
            kind: "recomendado",
            title: `Porque viste ${top}: ${c.title}`,
            body: `${c.year ?? ""} • ${(c.genres ?? []).slice(0, 2).join(" • ")}`.trim(),
            slug,
            image: c.image,
            at: now,
            read: false,
          });
          knownSlugs.add(slug);
          if (fresh.filter((f) => f.kind === "recomendado").length >= 2) break;
        }
      }
    }
  } catch {
    /* sin historial */
  }

  const merged = [...fresh, ...existing].slice(0, 20);
  if (fresh.length > 0) await writeAll(userId, profile, merged);
  try {
    await r.set(seenKeyFor(userId, profile), String(now), "EX", 60 * 60 * 24 * 60);
  } catch {
    /* mejor esfuerzo */
  }
  return merged;
}

/** GET /api/notifications?profile=... → { items } (genera si hay novedades). */
export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!getRedis()) return NextResponse.json(redisUnavailable(), { status: 503 });
  const items = await ensureFresh(userId, profileOf(req));
  return NextResponse.json({ items });
}

/** POST /api/notifications { profile?, action:"read", id? } |
 *  { profile?, action:"read-all" } */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!getRedis()) return NextResponse.json(redisUnavailable(), { status: 503 });
  const body = (await req.json().catch(() => null)) as {
    profile?: string;
    action?: string;
    id?: string;
  } | null;
  const profile = profileOf(req, body ?? undefined);
  const list = await readAll(userId, profile);
  if (body?.action === "read-all") {
    await writeAll(
      userId,
      profile,
      list.map((n) => ({ ...n, read: true }))
    );
    return NextResponse.json({ ok: true });
  }
  if (body?.action === "read" && body.id) {
    await writeAll(
      userId,
      profile,
      list.map((n) => (n.id === body.id ? { ...n, read: true } : n))
    );
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad-request" }, { status: 400 });
}
