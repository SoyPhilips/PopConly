import { getRedis } from "./redis";

/**
 * Cliente de YouTube Data API v3 para sincronizar trailers reales del catálogo.
 *
 * - Requiere `YOUTUBE_API_KEY` (gratis, con cuota diaria) SOLO en el servidor.
 * - Cada título consume ~101 unidades de cuota (search=100 + videos=1 de ~10k).
 *   Por eso: caché en Redis (1 año) + persistencia en Mongo, y sincronización
 *   por lotes pequeños desde /admin/trailers. NO se importa el catálogo
 *   completo de una vez.
 * - Solo se aceptan videos EMBEBIBLES (status.embeddable): los que bloquean
 *   el embed se ven en negro en la app. Si ninguno de los 3 candidatos sirve,
 *   se guarda marca negativa (30 días) para no quemar cuota reintentando.
 */

export type TrailerInfo = {
  videoId: string;
  title: string;
  durationSecs: number;
  channel: string;
  /** Otros candidatos embebibles (el reproductor los intenta si el primario falla). */
  alts?: { videoId: string; durationSecs: number }[];
};

const API = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL = 60 * 60 * 24 * 365; // 1 año
const MISS_TTL = 60 * 60 * 24 * 30; // 30 días (marca negativa)

export function youtubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

/** Error de cuota agotada: NO se debe guardar marca negativa (se reintenta mañana). */
export class YoutubeQuotaError extends Error {
  constructor() {
    super("youtube-quota-exceeded");
  }
}

function isQuotaBody(body: unknown): boolean {
  try {
    const errs = (body as { error?: { errors?: { reason?: string }[] } })?.error?.errors ?? [];
    return errs.some((e) => e.reason === "quotaExceeded" || e.reason === "rateLimitExceeded");
  } catch {
    return false;
  }
}

function cacheKey(slug: string): string {
  return `popconly:yt:${slug}`;
}

/** "PT2M23S" (ISO 8601 de YouTube) → segundos. */
export function isoDurationToSecs(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return 0;
  return (
    Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
  );
}

type CachedTrailer = TrailerInfo & { miss?: boolean };

async function cachedRaw(slug: string): Promise<CachedTrailer | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(cacheKey(slug));
    if (!raw) return null;
    const info = JSON.parse(raw) as CachedTrailer;
    return info && typeof info === "object" ? info : null;
  } catch {
    return null;
  }
}

async function cached(slug: string): Promise<TrailerInfo | null> {
  const info = await cachedRaw(slug);
  // Marca negativa o entrada corrupta: como si no hubiera nada.
  if (!info || info.miss || !info.videoId) return null;
  return info;
}

async function store(
  slug: string,
  info: TrailerInfo,
  ttl: number = CACHE_TTL
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(cacheKey(slug), JSON.stringify(info), "EX", ttl);
  } catch {
    /* mejor esfuerzo */
  }
}

/** Busca el trailer oficial EMBEBIBLE de un título en YouTube (con caché).
 *  Devuelve null si no hay llave, no hay cuota o ningún candidato sirve.
 *  Con `force:true` se ignora la caché y se busca de nuevo (para reemplazar
 *  un video que falla al reproducir). */
export async function findTrailer(
  slug: string,
  title: string,
  year?: number | string,
  opts?: { force?: boolean }
): Promise<TrailerInfo | null> {
  const force = opts?.force === true;
  // Con force se busca un video DISTINTO al actual (para reemplazar uno que falla).
  const currentId = force ? (await cachedRaw(slug))?.videoId ?? null : null;
  if (!force) {
    const hit = await cached(slug);
    if (hit) return hit;
    // Marca negativa: ya se intentó y no hubo candidato servible (no se quema cuota).
    if ((await cachedRaw(slug))?.miss) return null;
  }
  const key = process.env.YOUTUBE_API_KEY ?? "";
  if (!key) return null;

  try {
    const q = `${title}${year ? ` ${year}` : ""} trailer oficial`;
    const fetchJson = async (url: string) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      // 403 con quotaExceeded o 429 = cuota/límite agotado: se propaga
      // (NO se guarda marca negativa; se reintenta otro día).
      if (res.status === 429) throw new YoutubeQuotaError();
      if (res.status === 403) {
        const body = await res.json().catch(() => null);
        if (isQuotaBody(body)) throw new YoutubeQuotaError();
        return null;
      }
      if (!res.ok) return null;
      return res.json().catch(() => null);
    };
    const sData = (await fetchJson(
      `${API}/search?${new URLSearchParams({
        key,
        q,
        part: "snippet",
        type: "video",
        videoEmbeddable: "true",
        maxResults: "3",
        relevanceLanguage: "es",
      })}`
    )) as {
      items?: { id?: { videoId?: string } }[];
    } | null;
    const ids = (sData?.items ?? [])
      .map((i) => i.id?.videoId)
      .filter((v): v is string => Boolean(v) && v !== currentId);
    const noteMiss = async () => {
      // Con force no se borra lo actual: solo se marca si no había nada.
      if (!force) {
        await store(slug, { videoId: "", title, durationSecs: 0, channel: "", miss: true } as TrailerInfo, MISS_TTL);
      }
    };
    if (ids.length === 0) {
      await noteMiss();
      return force ? await cached(slug) : null;
    }

    // UN solo llamado videos.list con los 3 candidatos (= 1 unidad):
    // duración real + filtro de embebibles (los no embebibles salen en negro).
    const vData = (await fetchJson(
      `${API}/videos?${new URLSearchParams({
        key,
        id: ids.join(","),
        part: "snippet,contentDetails,status",
      })}`
    )) as {
      items?: {
        id?: string;
        snippet?: { title?: string; channelTitle?: string };
        contentDetails?: { duration?: string };
        status?: { embeddable?: boolean };
      }[];
    } | null;

    const playable = (vData?.items ?? []).filter(
      (v) =>
        v.id &&
        v.id !== currentId &&
        v.status?.embeddable !== false &&
        isoDurationToSecs(v.contentDetails?.duration ?? "") > 0
    );
    // Se prefiere duración de trailer real (30s–4min): evita compilaciones
    // de 15 min o clips de 5s. Sin importar el orden, el reproductor tiene
    // alternos si el primario falla (bloqueos por dueño/dominio).
    const score = (secs: number) => (secs >= 30 && secs <= 240 ? 0 : 1);
    playable.sort(
      (a, b) =>
        score(isoDurationToSecs(a.contentDetails?.duration ?? "")) -
        score(isoDurationToSecs(b.contentDetails?.duration ?? ""))
    );
    const first = playable[0];
    if (!first?.id) {
      await noteMiss();
      return force ? await cached(slug) : null;
    }

    const info: TrailerInfo = {
      videoId: first.id,
      title: first.snippet?.title ?? title,
      durationSecs: isoDurationToSecs(first.contentDetails?.duration ?? ""),
      channel: first.snippet?.channelTitle ?? "",
      alts: playable.slice(1, 3).map((v) => ({
        videoId: v.id as string,
        durationSecs: isoDurationToSecs(v.contentDetails?.duration ?? ""),
      })),
    };
    await store(slug, info);
    return info;
  } catch (e) {
    // Cuota agotada: se propaga (el llamador avisa 429) y NO se marca fallo.
    if (e instanceof YoutubeQuotaError) throw e;
    return null;
  }
}
