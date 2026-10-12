// Sincroniza trailers con YouTube Data API y los persiste (Mongo + caché Redis).
// Uso:  npm run trailers:sync -- [limite] | npm run trailers:sync -- --only="título" [--force]
// Lee .env solo (MONGODB_URI, REDIS_URL, YOUTUBE_API_KEY).
import "dotenv/config";
import { MongoClient } from "mongodb";
import { allTitles } from "../lib/findTitle";
import { slugify } from "../lib/slugs";
import { saveTrailer } from "../lib/catalogDb";
import { findTrailer, youtubeConfigured, YoutubeQuotaError } from "../lib/youtube";

// Los más visibles primero: héroe, Continuar viendo, Top 5, Recién llegado.
const PRIORITY = [
  "Deadpool & Wolverine",
  "Fallout",
  "Cobra Kai",
  "Avatar Fire and Ash",
  "Gladiator II",
  "Ballerina",
  "Gen V",
  "Daredevil Born Again",
  "3 Body Problem",
  "Captain America Brave New World",
  "F1",
  "Countdown",
];

async function mongoSlugsWithTrailer(): Promise<Set<string>> {
  const out = new Set<string>();
  const uri = process.env.MONGODB_URI;
  if (!uri) return out;
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const docs = await client
      .db()
      .collection("titles")
      .find({ trailerYoutube: { $nin: [null, ""] } }, { projection: { slug: 1 } })
      .toArray();
    docs.forEach((d) => d.slug && out.add(String(d.slug)));
    await client.close();
  } catch {
    /* sin Mongo: se intenta todo (la caché evita quemar cuota) */
  }
  return out;
}

async function main() {
  if (!youtubeConfigured()) {
    console.error("Falta YOUTUBE_API_KEY en el entorno.");
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const force = args.includes("--force");
  const limitArg = args.find((a) => !a.startsWith("--"));
  const limit = Math.min(Math.max(Number(limitArg ?? PRIORITY.length), 1), 500);
  const catalog = allTitles();
  const have = await mongoSlugsWithTrailer();

  const ordered: string[] = [];
  if (onlyArg) {
    const wanted = onlyArg
      .slice("--only=".length)
      .split("|")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    for (const c of catalog) {
      if (wanted.some((w) => c.title.toLowerCase().includes(w))) ordered.push(c.title);
    }
    if (ordered.length === 0) {
      console.error("Ningún título coincide con --only.");
      process.exit(1);
    }
  } else {
    for (const t of PRIORITY) {
      if (ordered.length >= limit) break;
      const item = catalog.find((c) => c.title === t);
      if (item) ordered.push(item.title);
    }
    if (ordered.length < limit) {
      for (const c of catalog) {
        if (ordered.length >= limit) break;
        if (c.trailerYoutube) continue; // manual (Toy Story, Spider-Man)
        if (have.has(slugify(c.title))) continue; // ya sincronizado
        if (ordered.includes(c.title)) continue;
        ordered.push(c.title);
      }
    }
  }

  let ok = 0;
  let miss = 0;
  let quotaOut = false;
  for (const title of ordered) {
    const item = catalog.find((c) => c.title === title);
    if (!item) continue;
    const slug = slugify(item.title);
    // Pausa pequeña entre títulos para no disparar el límite por segundo.
    await new Promise((r) => setTimeout(r, 300));
    let info;
    try {
      info = await findTrailer(slug, item.title, item.year, force ? { force: true } : undefined);
    } catch (e) {
      if (e instanceof YoutubeQuotaError) {
        console.log(`# Cuota de YouTube agotada en "${title}": se detiene el lote.`);
        quotaOut = true;
        break;
      }
      throw e;
    }
    if (!info) {
      miss++;
      console.log(`- ${title}: sin trailer embebible en YouTube`);
      continue;
    }
    const persisted = await saveTrailer(slug, {
      videoId: info.videoId,
      durationSecs: info.durationSecs,
      source: "youtube-api",
      alts: info.alts ?? [],
    });
    ok++;
    console.log(
      `+ ${title}: ${info.videoId} (${info.durationSecs}s)${persisted ? "" : " [solo caché]"}`
    );
  }
  console.log(`Listo: ${ok} sincronizados, ${miss} sin candidato, de ${ok + miss} procesados${quotaOut ? " (cuota agotada: continúa mañana)" : ""}.`);
  // Cierra el proceso: los clientes Redis/Mongo quedan con sockets abiertos.
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
