"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import CoverImg from "@/components/CoverImg";
import { thumb } from "@/lib/thumb";
import { checkUser } from "@/lib/actions";
import TitleModal, { type TitleDetail } from "@/components/TitleModal";
import { allTitles } from "@/lib/findTitle";
import type { CatalogItem } from "@/lib/catalog";
import type { TrendingTitle } from "@/lib/data";
import {
  HERO_GRID,
  TRENDING_MOVIES,
  TRENDING_SERIES,
} from "@/lib/realPicks";
import { FAQS, SYNOPSIS } from "@/lib/data";

function EmailForm({ id }: { id: string }) {
  const [value, setValue] = useState("");
  const [existsMsg, setExistsMsg] = useState(false);
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  return (
    <>
    <form
      className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl bg-[#1b1b1f] shadow-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        const clean = value.trim();
        if (!clean) return;
        setChecking(true);
        try {
          const r = await checkUser(clean);
          if (r.ok && r.exists) {
            setExistsMsg(true);
            return;
          }
          setExistsMsg(false);
          router.push(`/signup?email=${encodeURIComponent(clean)}`);
        } finally {
          setChecking(false);
        }
      }}
    >
      <div className="relative flex-1 w-full">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e7bcbc] text-[20px]">
          mail
        </span>
        <input
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setExistsMsg(false);
          }}
          className="w-full pl-11 pr-4 py-3.5 rounded-lg bg-[#353439]/60 text-[#e4e1e7] placeholder:text-[#e7bcbc]/60 text-sm focus:outline-none focus:bg-[#353439] transition-all"
          placeholder="Ingresa tu correo electrónico"
          required
          type="email"
        />
      </div>
      <button
        type="submit"
        disabled={checking}
        className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#ff5262] text-white font-semibold text-base flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-[#ff5262]/30 transition-all flex-shrink-0 disabled:opacity-60 cursor-pointer"
      >
        <span>{checking ? "Verificando..." : "Comenzar"}</span>
        <span className="material-symbols-outlined text-[20px]">
          chevron_right
        </span>
      </button>
    </form>
    {existsMsg && (
      <p className="mt-3 text-xs font-semibold text-[#ff6b6b]">
        Esta cuenta ya existe. Inicia sesión para continuar con tu membresía.
      </p>
    )}
    </>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState("Español");
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState<"movies" | "series">("movies");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selected, setSelected] = useState<TitleDetail | null>(null);

  // Tendencias reales: lo más visto en toda la plataforma (null = cargando).
  type TrendRow = TrendingTitle & { synopsis?: string };
  const [trend, setTrend] = useState<{ movies: TrendRow[]; series: TrendRow[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const toRow = (x: CatalogItem, i: number): TrendRow => ({
        rank: `TOP ${i + 1}`,
        title: x.title,
        genre: (x.genres ?? []).slice(0, 2).join(" • ") || "Destacado",
        meta: `${x.year ?? ""} • ${(x.genres ?? [])[0] ?? ""}`.trim(),
        match: x.match ?? "",
        age: x.age ?? "16+",
        tech: "4K HDR",
        image: x.image,
        alt: `Póster de ${x.title}`,
        synopsis: x.synopsis,
      });
      try {
        const r = await fetch("/api/top");
        if (r.ok) {
          const d = (await r.json()) as { slugs?: string[] };
          if (d.slugs && d.slugs.length > 0) {
            const t = await fetch(`/api/titles?slugs=${encodeURIComponent(d.slugs.join(","))}`);
            if (t.ok) {
              const docs = (await t.json()) as { items?: CatalogItem[] };
              const items = docs.items ?? [];
              const movies = items.filter((x) => (x.type ?? "") === "Película").slice(0, 5);
              const series = items.filter((x) => (x.type ?? "") !== "Película").slice(0, 5);
              if (!cancelled && (movies.length > 0 || series.length > 0)) {
                setTrend({
                  movies: movies.map(toRow),
                  series: series.map(toRow),
                });
                return;
              }
            }
          }
        }
      } catch {
        /* vitrina de respaldo abajo */
      }
      if (!cancelled) {
        // Sin vistas aún: lo mejor valorado (real) por tipo.
        const byRating = [...allTitles()].sort(
          (a, b) => parseFloat(b.rating ?? "0") - parseFloat(a.rating ?? "0")
        );
        setTrend({
          movies: byRating.filter((x) => (x.type ?? "") === "Película").slice(0, 5).map(toRow),
          series: byRating.filter((x) => (x.type ?? "") !== "Película").slice(0, 5).map(toRow),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trending: TrendRow[] =
    trend != null
      ? tab === "movies"
        ? trend.movies
        : trend.series
      : tab === "movies"
        ? TRENDING_MOVIES
        : TRENDING_SERIES;

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 lg:px-14">
        {/* TOP HEADER */}
        <header className="w-full flex items-center justify-between py-4 z-30 relative">
          <Link href="/" aria-label="PopConly inicio">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a292e] text-[#e4e1e7] text-xs font-semibold hover:bg-[#39393d] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  language
                </span>
                <span>{lang}</span>
                <span className="material-symbols-outlined text-[16px]">
                  expand_more
                </span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-32 py-1.5 rounded-lg bg-[#353439] shadow-xl z-50 flex flex-col">
                  {["Español", "English"].map((l) => (
                    <button
                      key={l}
                      className="text-left px-3 py-1.5 text-xs font-semibold hover:bg-[#39393d] w-full"
                      onClick={() => {
                        setLang(l);
                        setLangOpen(false);
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 md:py-2 rounded-lg bg-[#ff5262] text-white text-sm font-semibold hover:brightness-110 shadow-lg shadow-[#ff5262]/25 transition-all"
            >
              Iniciar Sesión
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="relative w-full overflow-hidden rounded-2xl pt-12 pb-16 md:pb-24 px-4 md:px-6 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 transform -rotate-3 scale-110 -translate-y-12">
              {HERO_GRID.map((p, i) => (
                <div
                  key={i}
                  className="h-60 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url('${p.image}')` }}
                  title={p.alt}
                />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#131317]/80 via-[#131317]/95 to-[#0D0D11] pointer-events-none" />
          <div className="absolute top-1/3 w-96 h-96 bg-[#ff5262]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2a292e]/80 backdrop-blur-md shadow-md mb-6">
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff5262] animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                Nuevo • Disfruta en 4K HDR y Dolby Atmos
              </span>
            </div>
            <h1 className="text-4xl md:text-[56px] md:leading-[64px] font-extrabold tracking-tight max-w-3xl leading-tight">
              Cine y series en su{" "}
              <span className="bg-gradient-to-r from-[#ffb3b3] via-[#ffb3b3] to-[#ff5262] bg-clip-text text-transparent">
                estado más puro
              </span>
            </h1>
            <p className="mt-4 text-base text-[#e7bcbc] max-w-2xl">
              Películas ilimitadas, series de culto y producciones originales
              exclusivas. Cancela cuando quieras desde{" "}
              <strong className="text-[#feb700] font-semibold">
                $4.99/mes
              </strong>
              .
            </p>
            <div className="mt-8 w-full max-w-xl">
              <EmailForm id="hero-email" />
              <p className="mt-3 text-xs text-[#e7bcbc]/80">
                ¿Listo para ver? Ingresa tu email para crear o reiniciar tu
                membresía.
              </p>
            </div>
          </div>
        </section>

        {/* TRENDING */}
        <section className="w-full py-10 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#ff5262]/20 flex items-center justify-center text-[#ff5262]">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
              </div>
              <div>
                <h2 className="text-[28px] leading-9 font-bold tracking-tight">
                  Tendencias Ahora
                </h2>
                <p className="text-xs text-[#e7bcbc]">
                  Los títulos más reproducidos durante las últimas 24 horas
                </p>
              </div>
            </div>
            <div className="inline-flex p-1 rounded-xl bg-[#1b1b1f] self-start md:self-auto">
              <button
                onClick={() => setTab("movies")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === "movies"
                    ? "bg-[#39393d] text-white shadow-sm"
                    : "text-[#e7bcbc] hover:text-white"
                }`}
              >
                Películas
              </button>
              <button
                onClick={() => setTab("series")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === "series"
                    ? "bg-[#39393d] text-white shadow-sm"
                    : "text-[#e7bcbc] hover:text-white"
                }`}
              >
                Series
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {trend === null ? (
              [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-[#1b1b1f] animate-pulse">
                  <div className="w-full aspect-[2/3] bg-[#2a292e]" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-4 w-2/3 rounded bg-[#2a292e]" />
                    <div className="h-3 w-1/2 rounded bg-[#2a292e]" />
                  </div>
                </div>
              ))
            ) : (
            trending.map((c) => (
              <button
                key={c.title}
                onClick={() =>
                  setSelected({
                    title: c.title,
                    image: c.image,
                    year: c.meta.slice(0, 4),
                    age: c.age,
                    type: tab === "movies" ? "Película" : "Serie",
                    genres: c.genre.split("•").map((g) => g.trim()),
                    synopsis: c.synopsis ?? SYNOPSIS[c.title],
                    match: c.match,
                    meta: c.meta,
                  })
                }
                className="group relative rounded-xl bg-[#1b1b1f] overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#ff5262]/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.04] flex flex-col text-left cursor-pointer"
              >
                <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#0e0e12]">
                  <CoverImg
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    src={thumb(c.image, 256)}
                    alt={c.alt}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-transparent to-transparent opacity-90 pointer-events-none" />
                  <div
                    className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase tracking-wider shadow ${
                      c.rank === "TOP 1" ? "bg-[#ff5262]" : "bg-[#2a292e]"
                    }`}
                  >
                    {c.rank}
                  </div>
                  <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-[#0e0e12]/80 backdrop-blur-md text-[10px] font-bold">
                    {c.tech}
                  </div>
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded bg-[#feb700]/20 text-[#ffba20] text-[10px] font-bold">
                      {c.match}
                    </span>
                    <span className="text-[10px] text-[#e7bcbc]">{c.age}</span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold truncate group-hover:text-[#ffb3b3] transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[#e7bcbc]/80 truncate mt-0.5">
                      {c.genre}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#e7bcbc]/60 mt-2">
                    {c.meta}
                  </span>
                </div>
              </button>
            ))
            )}
          </div>
        </section>

        <TitleModal item={selected} onClose={() => setSelected(null)} hideWatchlist />

        {/* FEATURES */}
        <section className="w-full py-10 my-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-[#ff5262] font-semibold">
              Experiencia PopConly
            </span>
            <h2 className="mt-2 text-[28px] md:text-[40px] md:leading-[48px] font-bold tracking-tight">
              Todo lo que necesitas para tu maratón perfecto
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden p-6 rounded-2xl bg-[#1b1b1f] shadow-lg hover:bg-[#1f1f23] transition-all group flex flex-col items-start min-h-[290px] md:min-h-[300px]">
              <h3 className="text-xl font-bold mb-2">
                Disfruta en cualquier pantalla
              </h3>
              <p className="text-sm text-[#e7bcbc] pr-16 md:pr-20">
                Smart TVs, PlayStation, Xbox, Chromecast, Apple TV,
                reproductores Blu-ray, tablets, ordenadores y dispositivos
                móviles sin interrupciones.
              </p>
              <div className="mt-6 pr-28 md:pr-32 flex items-center gap-2 text-[#ffb3b3] text-xs font-semibold">
                <span>Hasta 4 pantallas simultáneas</span>
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
              </div>
              <img
                src="/feature-pantallas.webp"
                alt="Disfruta en cualquier pantalla"
                loading="lazy"
                className="absolute bottom-4 right-4 w-20 h-20 md:w-24 md:h-24 object-contain pointer-events-none drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="relative overflow-hidden p-6 rounded-2xl bg-[#1b1b1f] shadow-lg hover:bg-[#1f1f23] transition-all group flex flex-col items-start min-h-[290px] md:min-h-[300px]">
              <h3 className="text-xl font-bold mb-2">
                Descarga para ver offline
              </h3>
              <p className="text-sm text-[#e7bcbc] pr-16 md:pr-20">
                Guarda tus títulos preferidos en tus dispositivos móviles o
                tablets y disfrútalos en cualquier viaje o sin conexión a
                internet.
              </p>
              <div className="mt-6 pr-28 md:pr-32 flex items-center gap-2 text-[#ffba20] text-xs font-semibold">
                <span>Descargas automáticas inteligentes</span>
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
              </div>
              <img
                src="/feature-descargas.webp"
                alt="Descarga para ver offline"
                loading="lazy"
                className="absolute bottom-4 right-4 w-20 h-20 md:w-24 md:h-24 object-contain pointer-events-none drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="relative overflow-hidden p-6 rounded-2xl bg-[#1b1b1f] shadow-lg hover:bg-[#1f1f23] transition-all group flex flex-col items-start min-h-[290px] md:min-h-[300px]">
              <h3 className="text-xl font-bold mb-2">
                Perfiles y control parental
              </h3>
              <p className="text-sm text-[#e7bcbc] pr-16 md:pr-20">
                Crea un espacio exclusivo para los más pequeños con control PIN
                y clasificaciones por edad adaptadas a cada integrante de tu
                familia.
              </p>
              <div className="mt-6 pr-28 md:pr-32 flex items-center gap-2 text-[#c9bfff] text-xs font-semibold">
                <span>Protegido con código PIN</span>
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
              </div>
              <img
                src="/feature-perfiles.webp"
                alt="Perfiles y control parental"
                loading="lazy"
                className="absolute bottom-4 right-4 w-20 h-20 md:w-24 md:h-24 object-contain pointer-events-none drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full py-10 my-4 max-w-4xl mx-auto flex flex-col items-center">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-[#ff5262] font-semibold">
              Dudas comunes
            </span>
            <h2 className="mt-2 text-[28px] md:text-[40px] font-bold tracking-tight">
              Preguntas Frecuentes
            </h2>
          </div>
          <div className="w-full flex flex-col gap-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl bg-[#1b1b1f] overflow-hidden shadow-sm transition-all"
                >
                  <button
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-[#1f1f23] transition-colors"
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="text-base font-semibold">{f.q}</span>
                    <span
                      className="material-symbols-outlined text-[#ff5262] transition-transform duration-300"
                      style={{ transform: open ? "rotate(180deg)" : "none" }}
                    >
                      expand_more
                    </span>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 pt-0 text-[#e7bcbc] text-sm leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-12 w-full max-w-xl text-center">
            <h3 className="text-xl font-semibold mb-3">
              ¿Listo para comenzar a disfrutar?
            </h3>
            <p className="text-xs text-[#e7bcbc] mb-6">
              Ingresa tu correo para crear o reactivar tu suscripción de
              inmediato.
            </p>
            <EmailForm id="bottom-email" />
          </div>
        </section>

        <footer className="w-full pt-12 pb-8 text-[#e7bcbc]/70 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span>© 2024 Todos los derechos reservados.</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <Link href="/legal" className="hover:text-white transition-colors">
                Términos de Uso
              </Link>
              <Link href="/legal" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/legal" className="hover:text-white transition-colors">
                Preferencias de Cookies
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                Centro de Ayuda
              </Link>
              <Link
                href="/browse"
                className="hover:text-white transition-colors"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
