// Limpia marcas negativas de trailers (caché "miss") para reintentar.
// Uso: npm run trailers:clear-miss   (lee REDIS_URL del .env)
// Necesario cuando un lote falló por causas externas (cuota, región)
// y dejó "sin candidato" falsos.
import "dotenv/config";
import { getRedis } from "../lib/redis";

async function main() {
  const r = getRedis();
  if (!r) {
    console.error("Sin Redis (REDIS_URL).");
    process.exit(1);
  }
  let cursor = "0";
  let seen = 0;
  let cleared = 0;
  do {
    const [next, keys] = (await r.scan(cursor, "MATCH", "popconly:yt:*", "COUNT", 200)) as [
      string,
      string[]
    ];
    cursor = next;
    for (const k of keys) {
      seen++;
      try {
        const raw = await r.get(k);
        if (raw && raw.includes('"miss":true')) {
          await r.del(k);
          cleared++;
        }
      } catch {
        /* sigue */
      }
    }
  } while (cursor !== "0");
  console.log(`Revisadas ${seen} entradas, marcas falsas borradas: ${cleared}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
