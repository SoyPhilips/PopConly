import { NextResponse } from "next/server";
import { getAllTitleDocs, getTitleBySlug, searchTitleDocs } from "@/lib/catalogDb";

/** Catálogo público (Módulo 2). Sin Mongo responde con el catálogo local. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const slugsParam = searchParams.get("slugs");
  const q = searchParams.get("q");

  if (slug) {
    const doc = await getTitleBySlug(slug);
    if (!doc) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ doc });
  }

  if (slugsParam !== null) {
    const list = slugsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
    const docs = await Promise.all(list.map((s) => getTitleBySlug(s)));
    return NextResponse.json({ items: docs.filter((d) => d !== null) });
  }

  if (q !== null) {
    const items = await searchTitleDocs(q);
    const genreSet = new Set(
      items.flatMap((t) => (t.genres ?? []).map((g) => g.toLowerCase()))
    );
    const seen = new Set(items.map((t) => t.slug));
    const related = (await getAllTitleDocs())
      .filter(
        (t) =>
          !seen.has(t.slug) &&
          (t.genres ?? []).some((g) => genreSet.has(g.toLowerCase()))
      )
      .slice(0, 20);
    return NextResponse.json({ items, related });
  }

  return NextResponse.json({ error: "bad-request" }, { status: 400 });
}
