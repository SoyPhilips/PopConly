import { NextResponse } from "next/server";
import { createReadStream, promises as fs } from "fs";
import path from "path";

const MEDIA_DIR = process.env.MEDIA_DIR ?? "./media";

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const CHUNK = 1024 * 1024; // 1 MB por rango

/** GET /api/stream?file=nombre.mp4 o ?file=subcarpeta/nombre.mp4 — streaming con rangos.
 *  Solo letras, números, guiones, puntos y UN nivel de subcarpeta (sin "..").
 *  En Oracle apunta MEDIA_DIR a /opt/popconly/media. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("file") ?? "";
  const parts = raw.split("/");
  const okShape =
    parts.length >= 1 &&
    parts.length <= 4 &&
    parts.every((p) => /^[a-z0-9][a-z0-9._-]*$/i.test(p));
  if (!okShape) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const base = path.resolve(/*turbopackIgnore: true*/ MEDIA_DIR);
  const abs = path.join(base, ...parts);
  if (!abs.startsWith(base + path.sep)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const file = parts[parts.length - 1];
  let stat;
  try {
    stat = await fs.stat(/*turbopackIgnore: true*/ abs);
    if (!stat.isFile()) throw new Error("no-file");
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const ext = path.extname(file).toLowerCase();

  // Miniatura ?w=256|640|1280 (solo imágenes): se genera una vez y se cachea.
  const wRaw = searchParams.get("w");
  const w = wRaw === "256" || wRaw === "640" || wRaw === "1280" ? Number(wRaw) : 0;
  const resizable = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  if (w > 0 && resizable) {
    try {
      const { default: sharp } = await import("sharp");
      const cacheDir = path.join(base, ".cache");
      await fs.mkdir(cacheDir, { recursive: true });
      const safe = `${parts.slice(0, -1).join("_")}_${file.replace(/\./g, "_")}_${w}.jpg`;
      const cached = path.join(cacheDir, safe);
      try {
        const cstat = await fs.stat(cached);
        const stream = createReadStream(/*turbopackIgnore: true*/ cached);
        return new NextResponse(stream as unknown as ReadableStream, {
          headers: {
            "Content-Type": "image/jpeg",
            "Content-Length": String(cstat.size),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        /* generar */
      }
      const buf = await sharp(abs).resize({ width: w, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      await fs.writeFile(cached, buf);
      return new NextResponse(buf as unknown as BodyInit, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": String(buf.length),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      /* cae al original */
    }
  }
  const type = MIME[ext] ?? "application/octet-stream";
  const range = req.headers.get("range");

  if (!range) {
    const stream = createReadStream(/*turbopackIgnore: true*/ abs);
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
      },
    });
  }

  const [startRaw, endRaw] = range.replace(/bytes=/, "").split("-");
  const start = Number(startRaw);
  const end = endRaw ? Number(endRaw) : Math.min(start + CHUNK - 1, stat.size - 1);
  if (Number.isNaN(start) || start >= stat.size) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${stat.size}` },
    });
  }
  const stream = createReadStream(/*turbopackIgnore: true*/ abs, { start, end });
  return new NextResponse(stream as unknown as ReadableStream, {
    status: 206,
    headers: {
      "Content-Type": type,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
    },
  });
}
