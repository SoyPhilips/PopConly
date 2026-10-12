import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis, redisUnavailable } from "@/lib/redis";
import { allTitles } from "@/lib/findTitle";
import { slugify } from "@/lib/slugs";

type Entry = { pos: number; total: number; at: number };

const keyFor = (userId: string, profile: string) =>
  `popconly:progress:${userId}:${profile.toLowerCase().slice(0, 32)}`;
const legacyKey = (userId: string) => `popconly:progress:${userId}`;

function profileOf(req: Request, body?: { profile?: string }): string {
  const fromBody = body?.profile?.trim();
  if (fromBody) return fromBody;
  try {
    return new URL(req.url).searchParams.get("profile")?.trim() || "Principal";
  } catch {
    return "Principal";
  }
}

async function readAll(userId: string, profile: string): Promise<Record<string, Entry>> {
  const r = getRedis();
  if (!r) return {};
  const parse = (raw: Record<string, string>) => {
    const out: Record<string, Entry> = {};
    for (const [slug, val] of Object.entries(raw)) {
      try {
        const e = JSON.parse(val) as Entry;
        if (typeof e.pos === "number" && typeof e.total === "number") out[slug] = e;
      } catch {
        /* entrada corrupta: se ignora */
      }
    }
    return out;
  };
  try {
    // Clave por perfil + clave anterior (migración: gana la del perfil).
    const [scoped, legacy] = await Promise.all([
      r.hgetall(keyFor(userId, profile)),
      r.hgetall(legacyKey(userId)),
    ]);
    return { ...parse(legacy), ...parse(scoped) };
  } catch {
    return {};
  }
}

/** GET /api/progress?slug=...&profile=... → {pos,total} | GET → {items:[...]}
 *  En modo lista solo devuelve entradas cuyo título EXISTE en el catálogo;
 *  las huérfanas (títulos retirados del catálogo) se purgan de Redis para
 *  que ninguna carátula aparezca y desaparezca en "Continuar viendo". */
export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!getRedis()) return NextResponse.json(redisUnavailable(), { status: 503 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const profile = profileOf(req);
  const all = await readAll(userId, profile);
  if (slug) {
    const e = all[slug];
    return NextResponse.json(e ?? { pos: 0, total: 0 });
  }

  const valid = new Set(allTitles().map((t) => slugify(t.title)));
  const live: typeof all = {};
  const dead: string[] = [];
  for (const [s, e] of Object.entries(all)) {
    if (valid.has(s)) live[s] = e;
    else dead.push(s);
  }
  if (dead.length > 0) await purge(userId, profile, dead);

  return NextResponse.json({
    items: Object.entries(live)
      .map(([s, e]) => ({ slug: s, ...e }))
      .sort((a, b) => b.at - a.at),
  });
}

/** Borra entradas de títulos que ya no existen en el catálogo. */
async function purge(userId: string, profile: string, slugs: string[]): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.hdel(keyFor(userId, profile), ...slugs);
    await r.hdel(legacyKey(userId), ...slugs);
  } catch {
    /* mejor esfuerzo */
  }
}

/** PUT /api/progress {slug,pos,total,profile?} — guarda el minuto exacto por perfil. */
export async function PUT(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = getRedis();
  if (!r) return NextResponse.json(redisUnavailable(), { status: 503 });

  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    pos?: number;
    total?: number;
    profile?: string;
  } | null;
  if (!body?.slug || typeof body.pos !== "number" || typeof body.total !== "number") {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const k = keyFor(userId, profileOf(req, body));
  try {
    await r.hset(
      k,
      body.slug,
      JSON.stringify({ pos: Math.floor(body.pos), total: Math.floor(body.total), at: Date.now() })
    );
    await r.expire(k, 60 * 60 * 24 * 365);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(redisUnavailable(), { status: 503 });
  }
}
