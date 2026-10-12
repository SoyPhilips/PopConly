import Redis from "ioredis";

let client: Redis | null = null;
let warned = false;
let listenerOn = false;

/** Redis del Módulo 3. Sin REDIS_URL (aún sin Oracle) devuelve null y la app
 *  usa el fallback local (localStorage), sin romper nada. */
export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    client ??= new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      connectTimeout: 2000,
      commandTimeout: 2000,
      // Sin reintentos eternos: si no hay Redis, se falla rápido al fallback local.
      retryStrategy: () => null,
    });
    // Evita el spam de "Unhandled error event" en consola cuando no hay Redis.
    if (!listenerOn) {
      listenerOn = true;
      client.on("error", () => {});
    }
    return client;
  } catch {
    return null;
  }
}

export function redisUnavailable(): { fallback: true } {
  if (!warned) {
    warned = true;
    console.log("[PopConly] Redis no configurado: usando fallback local.");
  }
  return { fallback: true };
}
