/** Miniatura: agrega w= a URLs de /api/stream (se redimensionan y cachean). */
export function thumb(src: string | undefined, w: 256 | 640 | 1280): string {
  if (!src) return "";
  if (src.startsWith("/api/stream?file=")) return `${src}&w=${w}`;
  return src;
}
