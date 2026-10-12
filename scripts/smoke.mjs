// Humo de contrato: verifica la app corriendo (local o CI).
// Uso: BASE_URL=http://localhost:3000 node scripts/smoke.mjs
// Falla (exit 1) si algún contrato se rompe.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function check(name, cond, extra = "") {
  if (!cond) {
    console.error(`FALLO: ${name} ${extra}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${name}`);
  }
}

const home = await get("/");
check("landing 200", home.status === 200, `(${home.status})`);

const t = await get("/api/titles?slug=fallout");
check("titles?slug=fallout 200", t.status === 200, `(${t.status})`);
check("fallout trae ficha completa", Boolean(t.body?.doc?.title && t.body?.doc?.synopsis));

const toy = await get("/api/titles?slug=toy-story-5");
check("toy-story-5 trae trailer manual", Boolean(toy.body?.doc?.trailerYoutube));

const q = await get("/api/titles?q=toy%20story");
check("titles?q=toy story trae resultados", q.status === 200 && Array.isArray(q.body?.items) && q.body.items.length > 0);

const p = await get("/api/progress");
check("progress sin sesión es 401", p.status === 401, `(${p.status})`);

const f = await get("/api/favorites");
check("favorites sin sesión es 401", f.status === 401, `(${f.status})`);

console.log(process.exitCode ? "HUMO ROJO" : "HUMO VERDE");
