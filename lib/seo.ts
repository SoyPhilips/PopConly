import type { Metadata } from "next";

import { allTitles } from "./findTitle";
import { slugify } from "./slugs";

const SITE =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://popconly.com").replace(/\/$/, "");

const PAGES: Record<string, { title: string; description: string; path: string }> = {
  browse: {
    title: "Inicio",
    description: "Sigue viendo tus películas y series, top 5 y estrenos en PopConly.",
    path: "/browse",
  },
  movies: {
    title: "Películas",
    description: "Aclamadas por la crítica, lanzamientos 2026 y especiales de acción en 4K.",
    path: "/movies",
  },
  series: {
    title: "Series",
    description: "Series maratoneables, miniseries exclusivas y episodios semanales.",
    path: "/series",
  },
  categories: {
    title: "Categorías",
    description: "Explora acción, anime, documentales, suspenso, terror, drama y fantasía.",
    path: "/categories",
  },
  "my-list": {
    title: "Mi Lista",
    description: "Tus películas y series guardadas y descargadas en PopConly.",
    path: "/my-list",
  },
  search: {
    title: "Buscar",
    description: "Busca títulos, géneros y años en todo el catálogo de PopConly.",
    path: "/search",
  },
  login: {
    title: "Iniciar sesión",
    description: "Inicia sesión en PopConly para seguir viendo tu contenido.",
    path: "/login",
  },
  signup: {
    title: "Crear cuenta",
    description: "Crea tu cuenta de PopConly y elige entre Essential, Plus y Ultra.",
    path: "/signup",
  },
  help: {
    title: "Centro de Ayuda",
    description: "Resuelve dudas sobre planes, pagos, dispositivos y tu cuenta PopConly.",
    path: "/help",
  },
  legal: {
    title: "Términos y Privacidad",
    description: "Términos de uso, política de privacidad y cookies de PopConly.",
    path: "/legal",
  },
};

export function routeMetadata(key: keyof typeof PAGES): Metadata {
  const p = PAGES[key];
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: {
      title: `${p.title} | PopConly`,
      description: p.description,
      url: p.path,
      siteName: "PopConly",
      type: "website",
      locale: "es_ES",
    },
  };
}

export function sitemapEntries() {
  const now = new Date();
  return [
    { url: SITE, lastModified: now },
    ...Object.values(PAGES).map((p) => ({
      url: `${SITE}${p.path}`,
      lastModified: now,
    })),
    // Módulo 2: cada título con su ficha indexable
    ...allTitles().map((t) => ({
      url: `${SITE}/titulo/${slugify(t.title)}`,
      lastModified: now,
    })),
  ];
}
