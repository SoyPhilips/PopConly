import { MongoClient, type Db } from "mongodb";
import type { CatalogItem } from "./catalog";
import { allTitles } from "./findTitle";
import { slugify } from "./slugs";
import { getRedis } from "./redis";

/** Documento del Módulo 2 (colección `titles` en MongoDB). */
export type TitleDoc = CatalogItem & {
  slug: string;
  cast?: string[];
  videoUrl?: string;
  /** Duración real del trailer (sincronizada con YouTube Data API). */
  trailerDurationSecs?: number;
  /** Candidatos alternos si el primario falla (bloqueo del dueño). */
  trailerAlts?: { videoId: string; durationSecs: number }[];
  /** Origen del trailer: "manual" | "youtube-api". */
  trailerSource?: string;
  trailerFetchedAt?: string;
  updatedAt?: string;
};

let client: MongoClient | null = null;
let lastFail = 0;
const FAIL_COOLDOWN_MS = 30000;

async function mongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null; // aún sin base: se usa el catálogo local
  // Si Mongo no responde (ej. contenedor apagado), no se reintenta en cada
  // búsqueda: se usa el local al instante hasta que pase el cooldown.
  if (Date.now() - lastFail < FAIL_COOLDOWN_MS) return null;
  try {
    client ??= new MongoClient(uri, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    await client.connect();
    return client.db();
  } catch {
    lastFail = Date.now();
    return null;
  }
}

function toDoc(item: CatalogItem): TitleDoc {
  return { ...item, slug: slugify(item.title) };
}

function fromDoc(doc: Record<string, unknown>): TitleDoc {
  const { _id: _omit, ...rest } = doc;
  void _omit;
  return rest as TitleDoc;
}

export async function getAllTitleDocs(): Promise<TitleDoc[]> {
  const db = await mongoDb();
  if (db) {
    try {
      const docs = await db.collection("titles").find({}).toArray();
      if (docs.length > 0) return docs.map(fromDoc);
    } catch {
      /* cae al catálogo local */
    }
  }
  return allTitles().map(toDoc);
}

export async function getTitleBySlug(slug: string): Promise<TitleDoc | null> {
  const db = await mongoDb();
  if (db) {
    try {
      const doc = await db.collection("titles").findOne({ slug });
      if (doc) return withCachedTrailer(fromDoc(doc));
    } catch {
      /* cae al catálogo local */
    }
  }
  const found = allTitles().find((t) => slugify(t.title) === slug);
  return found ? withCachedTrailer(toDoc(found)) : null;
}

/** Si el doc aún no tiene trailer pero YA se sincronizó con YouTube (caché
 *  Redis `popconly:yt:{slug}`), se adjunta para que /watch lo reproduzca sin
 *  esperar a que el documento Mongo se actualice. */
async function withCachedTrailer(doc: TitleDoc): Promise<TitleDoc> {
  if (doc.trailerYoutube) return doc;
  try {
    const r = getRedis();
    if (!r) return doc;
    const raw = await r.get(`popconly:yt:${doc.slug}`);
    if (!raw) return doc;
    const info = JSON.parse(raw) as {
      videoId?: string;
      durationSecs?: number;
      alts?: { videoId: string; durationSecs: number }[];
    };
    if (!info.videoId) return doc;
    return {
      ...doc,
      trailerYoutube: info.videoId,
      trailerDurationSecs: info.durationSecs ?? 0,
      trailerAlts: info.alts ?? doc.trailerAlts ?? [],
      trailerSource: "youtube-api",
    };
  } catch {
    return doc;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const db = await mongoDb();
  if (db) {
    try {
      const slugs = await db.collection("titles").distinct("slug");
      if (slugs.length > 0) return slugs as string[];
    } catch {
      /* cae al catálogo local */
    }
  }
  return allTitles().map((t) => slugify(t.title));
}

export async function searchTitleDocs(query: string, limit = 30): Promise<TitleDoc[]> {
  const q = query.trim();
  if (!q) return [];
  const db = await mongoDb();
  if (db) {
    try {
      const docs = await db
        .collection("titles")
        .find({ $text: { $search: q } }, { projection: { score: { $meta: "textScore" } } })
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .toArray();
      if (docs.length > 0) return docs.map(fromDoc);
    } catch {
      /* cae al catálogo local */
    }
  }
  const lq = q.toLowerCase();
  return allTitles()
    .filter((t) =>
      `${t.title} ${(t.genres ?? []).join(" ")} ${t.type ?? ""} ${t.year ?? ""} ${t.synopsis ?? ""}`
        .toLowerCase()
        .includes(lq)
    )
    .slice(0, limit)
    .map(toDoc);
}

export async function getRelated(doc: TitleDoc, limit = 6): Promise<TitleDoc[]> {
  const all = await getAllTitleDocs();
  const genres = new Set((doc.genres ?? []).map((g) => g.toLowerCase()));
  return all
    .filter(
      (t) =>
        t.slug !== doc.slug &&
        (t.genres ?? []).some((g) => genres.has(g.toLowerCase()))
    )
    .slice(0, limit);
}

/** Agregados recientemente: últimos trailers sincronizados (Mongo).
 *  Sin Mongo devuelve [] (el front usa vitrina local). */
export async function getRecentTrailers(limit = 12): Promise<TitleDoc[]> {
  const db = await mongoDb();
  if (!db) return [];
  try {
    const docs = await db
      .collection("titles")
      .find({ trailerYoutube: { $nin: [null, ""] } })
      .sort({ trailerFetchedAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 30))
      .toArray();
    return docs.map(fromDoc);
  } catch {
    return [];
  }
}

/** Guarda el trailer sincronizado con YouTube en el documento Mongo.
 *  Sin Mongo no hay dónde persistir: devuelve false (queda solo caché Redis). */
export async function saveTrailer(
  slug: string,
  info: { videoId: string; durationSecs: number; source: string; alts?: { videoId: string; durationSecs: number }[] }
): Promise<boolean> {
  const db = await mongoDb();
  if (!db) return false;
  try {
    const res = await db.collection("titles").updateOne(
      { slug },
      {
        $set: {
          trailerYoutube: info.videoId,
          trailerDurationSecs: info.durationSecs,
          trailerAlts: info.alts ?? [],
          trailerSource: info.source,
          trailerFetchedAt: new Date().toISOString(),
        },
      }
    );
    return res.matchedCount > 0;
  } catch {
    return false;
  }
}
