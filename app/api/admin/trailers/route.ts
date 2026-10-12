import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { allTitles } from "@/lib/findTitle";
import { slugify } from "@/lib/slugs";
import {
  getAllTitleDocs,
  getTitleBySlug,
  saveTrailer,
} from "@/lib/catalogDb";
import { findTrailer, youtubeConfigured, YoutubeQuotaError } from "@/lib/youtube";

/**
 * GET /api/admin/trailers → { configured, total, withTrailer, missing[] }.
 * POST /api/admin/trailers { slugs?: string[]; limit?: number }
 *   Sincroniza trailers con YouTube Data API (lotes pequeños por cuota:
 *   ~101 unidades por título de 10k diarias). Persiste videoId + duración
 *   real en Mongo para que la línea roja mida el trailer exacto.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const docs = await getAllTitleDocs();
  const missing = docs.filter((d) => !d.trailerYoutube).map((d) => d.slug);
  return NextResponse.json({
    configured: youtubeConfigured(),
    total: docs.length,
    withTrailer: docs.length - missing.length,
    missing: missing.slice(0, 100),
    missingTotal: missing.length,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!youtubeConfigured()) {
    return NextResponse.json(
      { error: "youtube-not-configured", hint: "Falta YOUTUBE_API_KEY en el servidor." },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    slugs?: string[];
    limit?: number;
  } | null;
  const limit = Math.min(Math.max(Number(body?.limit ?? 10), 1), 25);

  let targets: string[];
  if (Array.isArray(body?.slugs) && body.slugs.length > 0) {
    targets = body.slugs.slice(0, limit);
  } else {
    const docs = await getAllTitleDocs();
    targets = docs
      .filter((d) => !d.trailerYoutube)
      .slice(0, limit)
      .map((d) => d.slug);
  }

  const catalog = allTitles();
  const results: {
    slug: string;
    ok: boolean;
    videoId?: string;
    durationSecs?: number;
    persisted?: boolean;
  }[] = [];

  for (const slug of targets) {
    const item =
      catalog.find((c) => slugify(c.title) === slug) ??
      (await getTitleBySlug(slug));
    if (!item) {
      results.push({ slug, ok: false });
      continue;
    }
    let info;
    try {
      info = await findTrailer(slug, item.title, item.year);
    } catch (e) {
      // Cuota agotada: se corta el lote y se avisa (429), sin marcar fallos.
      if (e instanceof YoutubeQuotaError) {
        return NextResponse.json(
          { error: "quota-exceeded", hint: "Cuota diaria de YouTube agotada: reintenta mañana.", results },
          { status: 429 }
        );
      }
      results.push({ slug, ok: false });
      continue;
    }
    if (!info) {
      results.push({ slug, ok: false });
      continue;
    }
    const persisted = await saveTrailer(slug, {
      videoId: info.videoId,
      durationSecs: info.durationSecs,
      source: "youtube-api",
      alts: info.alts ?? [],
    });
    results.push({
      slug,
      ok: true,
      videoId: info.videoId,
      durationSecs: info.durationSecs,
      persisted,
    });
  }

  return NextResponse.json({
    processed: results.length,
    synced: results.filter((r) => r.ok).length,
    results,
  });
}
