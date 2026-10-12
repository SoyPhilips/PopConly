import { NextResponse } from "next/server";
import { getRecentTrailers } from "@/lib/catalogDb";

/** GET /api/recent?limit=12 → últimos trailers sincronizados (DB real).
 *  Pública. Vacío = aún sin sincronizar (el front usa vitrina local). */
export async function GET(req: Request) {
  let limit = 12;
  try {
    const v = Number(new URL(req.url).searchParams.get("limit") ?? 12);
    if (Number.isFinite(v)) limit = v;
  } catch {
    /* defecto */
  }
  const items = await getRecentTrailers(limit);
  return NextResponse.json({ items });
}
