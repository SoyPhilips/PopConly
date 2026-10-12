// Precalienta la caché de miniaturas (misma ruta y nombres que /api/stream).
// Uso: npm run thumbs:warm -- [limite]   (lee MEDIA_DIR del .env)
// Evita la estampida de sharp en la primera visita: todo servido al instante.
import "dotenv/config";
import path from "path";
import { promises as fs } from "fs";
import { REAL_TITLES } from "../lib/catalogReal";

const MEDIA = path.resolve(process.env.MEDIA_DIR ?? "./media");
const SIZES = [256, 640];
const CONCURRENCY = 4;

type Job = { abs: string; out: string };

// Rutas EXACTAS del catálogo (sin adivinar carpetas).
const EXTRA: string[][] = [
  ["peliculas", "comedia", "toy-story-5", "horizontal.jpg"],
  ["peliculas", "comedia", "toy-story-5", "vertical.jpg"],
  ["peliculas", "accion", "spider-man-brand-new-day", "horizontal.jpg"],
  ["peliculas", "accion", "spider-man-brand-new-day", "vertical.jpg"],
];

async function collect(limit: number): Promise<Job[]> {
  const jobs: Job[] = [];
  const pushFile = (rel: string[]) => {
    const file = rel[rel.length - 1];
    const safe = `${rel.slice(0, -1).join("_")}_${file.replace(/\./g, "_")}`;
    for (const w of SIZES) {
      jobs.push({
        abs: path.join(MEDIA, ...rel),
        out: path.join(MEDIA, ".cache", `${safe}_${w}.jpg`),
      });
    }
  };

  const titles = REAL_TITLES.slice(0, Math.min(Math.max(limit, 1), REAL_TITLES.length));
  for (const t of titles) {
    for (const base of ["horizontal.jpg", "vertical.jpg"]) {
      pushFile([t.kind, t.category, t.slug, base]);
    }
  }
  for (const rel of EXTRA) pushFile(rel);
  // Solo archivos que existen y faltan en caché.
  const out: Job[] = [];
  const seen = new Set<string>();
  for (const j of jobs) {
    if (seen.has(j.out)) continue;
    seen.add(j.out);
    try {
      await fs.stat(j.abs);
    } catch {
      continue;
    }
    try {
      await fs.stat(j.out);
      continue;
    } catch {
      /* falta: generar */
    }
    out.push(j);
  }
  return out;
}

async function main() {
  const limit = Math.min(Math.max(Number(process.argv[2] ?? 902), 1), 2000);
  const { default: sharp } = await import("sharp");
  await fs.mkdir(path.join(MEDIA, ".cache"), { recursive: true });
  const jobs = await collect(limit);
  console.log(`Miniaturas por generar: ${jobs.length} (límite ${limit} títulos).`);
  let done = 0;
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, jobs.length) },
    async () => {
      while (jobs.length > 0) {
        const j = jobs.shift();
        if (!j) break;
        try {
          const w = Number(/_(\d+)\.jpg$/.exec(j.out)?.[1] ?? 640);
          const buf = await sharp(j.abs)
            .resize({ width: w, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          await fs.writeFile(j.out, buf);
          done++;
          if (done % 200 === 0) console.log(`...${done}`);
        } catch {
          /* archivo corrupto: se genera bajo demanda */
        }
      }
    }
  );
  await Promise.all(workers);
  console.log(`Listo: ${done} miniaturas.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
