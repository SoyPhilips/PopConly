// Genera preview (30s, 720p) + póster desde un video local.
// Requiere ffmpeg: Windows → `winget install Gyan.FFmpeg`
//                    Oracle   → `sudo apt install -y ffmpeg`
// Uso: node scripts/make-preview.mjs media/mi-pelicula.mp4
// Sale:  media/mi-pelicula-preview.mp4 + media/mi-pelicula-poster.jpg
import { execFileSync } from "child_process";
import path from "path";

const input = process.argv[2];
if (!input) {
  console.error("Uso: node scripts/make-preview.mjs media/archivo.mp4");
  process.exit(1);
}

const ext = path.extname(input);
const base = input.slice(0, -ext.length);
const preview = `${base}-preview.mp4`;
const poster = `${base}-poster.jpg`;

const run = (args) => execFileSync("ffmpeg", ["-y", ...args], { stdio: "inherit" });

// 30 segundos desde el 10% (evita logos del inicio), 720p, peso liviano.
run(["-ss", "600", "-i", input, "-t", "30",
  "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
  "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", preview]);

// Póster del minuto 5.
run(["-ss", "300", "-i", input, "-frames:v", "1", "-q:v", "3", poster]);

console.log("\nListo:");
console.log("  video:   /api/stream?file=" + path.basename(input));
console.log("  preview: /api/stream?file=" + path.basename(preview));
console.log("  póster:  /api/stream?file=" + path.basename(poster));
