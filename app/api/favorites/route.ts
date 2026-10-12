import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis, redisUnavailable } from "@/lib/redis";

const key = (userId: string) => `popconly:fav:${userId}`;

async function readFavs(userId: string): Promise<string[]> {
  const r = getRedis();
  if (!r) return [];
  try {
    return await r.smembers(key(userId));
  } catch {
    return [];
  }
}

/** GET /api/favorites → {slugs:[...]} */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!getRedis()) return NextResponse.json(redisUnavailable(), { status: 503 });
  return NextResponse.json({ slugs: await readFavs(userId) });
}

/** POST /api/favorites {slug, action:"add"|"remove"} */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = getRedis();
  if (!r) return NextResponse.json(redisUnavailable(), { status: 503 });

  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    action?: string;
  } | null;
  if (!body?.slug) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  try {
    if (body.action === "remove") await r.srem(key(userId), body.slug);
    else await r.sadd(key(userId), body.slug);
    return NextResponse.json({ slugs: await readFavs(userId) });
  } catch {
    return NextResponse.json(redisUnavailable(), { status: 503 });
  }
}
