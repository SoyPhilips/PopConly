import { NextResponse } from "next/server";
import { allTitles } from "@/lib/findTitle";
import { getAllTitleDocs } from "@/lib/catalogDb";
import type { CatalogItem } from "@/lib/catalog";

/** GET /api/rows?year=2026&type=Película&genre=Acción&limit=60
 *  Filas reales desde Mongo (sin índice de texto: match exacto por campo).
 *  Sin Mongo: mismo filtro sobre el catálogo local. */
export async function GET(req: Request) {
  const sp = (() => {
    try {
      return new URL(req.url).searchParams;
    } catch {
      return new URLSearchParams();
    }
  })();
  const year = sp.get("year")?.trim() || null;
  const type = sp.get("type")?.trim() || null;
  const genre = sp.get("genre")?.trim().toLowerCase() || null;
  const q = sp.get("q")?.trim().toLowerCase() || null;
  let limit = Number(sp.get("limit") ?? 60);
  if (!Number.isFinite(limit)) limit = 60;
  limit = Math.min(Math.max(limit, 1), 200);

  const match = (t: CatalogItem) => {
    if (year && (t.year ?? "") !== year) return false;
    if (type && (t.type ?? "") !== type) return false;
    if (genre && !(t.genres ?? []).some((g) => g.toLowerCase() === genre)) return false;
    if (
      q &&
      !`${t.title} ${(t.genres ?? []).join(" ")} ${t.type ?? ""} ${t.year ?? ""} ${t.synopsis ?? ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  };

  try {
    const docs = await getAllTitleDocs();
    // getAllTitleDocs ya cae al local si no hay Mongo: una sola fuente.
    return NextResponse.json({ items: docs.filter(match).slice(0, limit), total: docs.filter(match).length });
  } catch {
    return NextResponse.json({ items: [], total: 0 });
  }
}
