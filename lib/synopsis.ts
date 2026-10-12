/** Sinopsis variadas y deterministas para el catálogo real.
 *  El catálogo traía 3-4 textos genéricos repetidos en 900 títulos; aquí cada
 *  título recibe una redacción distinta según hash (estable entre cargas),
 *  con datos reales (título, año, género, tipo). Sin inventar tramas. */

const BANK = [
  "{t} ({y}): una propuesta de {g} que combina tensión, ritmo y personajes al límite.",
  "En {t} ({y}), el {g} se vive sin freno: giros inesperados hasta el final.",
  "{t} ({y}) va con todo en {g}: emoción y un cierre memorable.",
  "Una historia de {g} con sello propio: {t} ({y}) no da tregua.",
  "{t} ({y}) mezcla {g} con momentos que se quedan en la memoria.",
  "Si buscas {g}, {t} ({y}) es apuesta segura: intensa de principio a fin.",
  "{t} ({y}): {g} con personajes que cargan con todo el peso de la historia.",
  "Directo al grano: {t} ({y}) entrega {g} del bueno, sin relleno.",
  "{t} ({y}) convierte el {g} en una experiencia que se ve de una sentada.",
  "Con pulso firme, {t} ({y}) recorre el {g} con estilo propio.",
  "{t} ({y}): una pieza de {g} para ver, comentar y repetir.",
  "{t} ({y}) demuestra por qué el {g} sigue mandando en el catálogo.",
  "Intensa y redonda: {t} ({y}) es {g} que cumple lo que promete.",
  "{t} ({y}): el {g} en su estado más puro, sin distracciones.",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Devuelve la sinopsis variada para un título del catálogo real. */
export function synopsisFor(
  title: string,
  genre?: string,
  year?: string | number,
  type?: string
): string {
  const g = (genre ?? "cine").toLowerCase();
  const y = String(year ?? "").trim() || "reciente";
  const kind = (type ?? "").toLowerCase().includes("serie") ? "serie" : "película";
  const tpl = BANK[hash(`${title}|${g}`) % BANK.length];
  const text = tpl
    .replaceAll("{t}", title)
    .replaceAll("{g}", g)
    .replaceAll("{y}", y);
  void kind;
  return text;
}

/** ¿Es una sinopsis del lote genérico repetido? (para no pisar textos curados) */
const GENERIC_BITS = [
  "adrenalina pura",
  "futuros posibles",
  "risas garantizadas",
  "tensión en cada escena",
];

export function isGenericSynopsis(s?: string): boolean {
  if (!s) return true;
  const l = s.toLowerCase();
  return GENERIC_BITS.some((b) => l.includes(b));
}
