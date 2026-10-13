"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** ES/EN real: landing completa + chrome del dashboard (header, footer,
 *  filas, búsqueda, modal, Mi Lista). El resto del contenido sigue en
 *  español por ahora (fase 2). Los títulos del catálogo NUNCA se traducen. */

export type Lang = "es" | "en";

const KEY = "popconly:lang";

export function getLang(): Lang {
  if (typeof window === "undefined") return "es";
  try {
    return window.localStorage.getItem(KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

const dict = {
  // Navegación
  nav_home: ["Inicio", "Home"],
  nav_movies: ["Películas", "Movies"],
  nav_series: ["Series", "TV Shows"],
  nav_categories: ["Categorías", "Categories"],
  nav_mylist: ["Mi Lista", "My List"],
  nav_profile: ["Mi Perfil", "My Profile"],
  nav_signout: ["Cerrar sesión", "Sign out"],
  // Header
  hdr_searchAria: ["Buscar", "Search"],
  hdr_searchPh: ["Títulos, géneros, personas...", "Titles, genres, people..."],
  hdr_notifs: ["Notificaciones", "Notifications"],
  hdr_notifsEmpty: [
    "Sin novedades por ahora. Mira un trailer y te avisaremos de más.",
    "Nothing new yet. Watch a trailer and we'll let you know.",
  ],
  hdr_profileAria: ["Mi Perfil", "My Profile"],
  hdr_clearSearch: ["Limpiar búsqueda", "Clear search"],
  // Héroe browse
  hero_badgeOrig: ["Original de PopConly", "A PopConly Original"],
  hero_top1: ["Top 1 Hoy en tu país", "Top 1 Today in your country"],
  hero_play: ["Reproducir", "Play"],
  hero_info: ["Más información", "More info"],
  hero_because: ["Porque viste", "Because you watched"],
  // Filas browse
  row_continue: ["Continuar Viendo para Ti", "Continue Watching for You"],
  row_seeAll: ["Ver todo", "See all"],
  row_recs: ["Recomendado para ti", "Recommended for you"],
  row_because: ["Porque viste", "Because you watched"],
  row_top5: ["Top 5 Más Vistos en PopConly", "Top 5 Most Watched on PopConly"],
  row_recent: ["Agregados Recientemente", "Recently Added"],
  row_recentSub: ["Estrenos de esta semana", "This week's premieres"],
  row_emptyContinue: [
    "Reproduce un trailer y tu avance aparecerá aquí con la línea roja real.",
    "Play a trailer and your progress will show up here with the real red bar.",
  ],
  row_noMatch: ["Sin coincidencias en esta fila.", "No matches in this row."],
  row_needsPlan1: ["Activa tu membresía", "Activate your membership"],
  row_needsPlan2: ["para seguir viendo sin límites.", "to keep watching without limits."],
  row_viewPlans: ["Ver planes", "View plans"],
  // Mi Lista
  ml_title: ["Mi Lista", "My List"],
  ml_sub: [
    "Todo lo que guardes con + aparece aquí, en todos tus dispositivos.",
    "Everything you save with + shows up here, on all your devices.",
  ],
  ml_all: ["Todos", "All"],
  ml_movies: ["Películas", "Movies"],
  ml_series: ["Series", "TV Shows"],
  ml_downloaded: ["Descargados", "Downloaded"],
  ml_empty: ["Tu lista está vacía", "Your list is empty"],
  ml_emptyMsg: [
    "Explora el catálogo y pulsa + en lo que quieras guardar. Se sincroniza con tu cuenta.",
    "Browse the catalog and tap + on anything you want to save. It syncs with your account.",
  ],
  ml_emptyFilter: ["Sin resultados en este filtro", "No results with this filter"],
  ml_emptyFilterMsg: [
    "Quita elementos o cambia de pestaña para seguir explorando.",
    "Remove items or switch tabs to keep exploring.",
  ],
  ml_dlActive: ["Descargas activas", "Active downloads"],
  ml_recs: ["Recomendaciones inspiradas en tu lista", "Recommendations inspired by your list"],
  ml_play: ["Reproducir", "Play"],
  ml_remove: ["Quitar", "Remove"],
  ml_gridView: ["Vista cuadrícula", "Grid view"],
  ml_listView: ["Vista lista", "List view"],
  // Footer dashboard
  ft_tagline: [
    "Tu portal cinematográfico definitivo. Miles de películas y series originales en ultra alta definición sin límites ni interrupciones.",
    "Your ultimate movie portal. Thousands of original movies and series in ultra high definition with no limits or interruptions.",
  ],
  ft_nav: ["Navegación", "Navigation"],
  ft_legal: ["Legal y Soporte", "Legal & Support"],
  ft_terms: ["Términos de servicio", "Terms of service"],
  ft_privacy: ["Política de privacidad", "Privacy policy"],
  ft_cookies: ["Preferencias de cookies", "Cookie preferences"],
  ft_help: ["Centro de ayuda", "Help center"],
  ft_app: ["Descarga la App", "Get the App"],
  ft_appSub: [
    "Lleva el mejor cine en tu bolsillo en cualquier dispositivo.",
    "Take the best cinema in your pocket on any device.",
  ],
  ft_avail: ["Disponible en", "Available on"],
  ft_rights: ["PopConly Inc. Todos los derechos reservados.", "PopConly Inc. All rights reserved."],
  ft_langLabel: ["Seleccionar idioma", "Select language"],
  // Landing
  lp_login: ["Iniciar Sesión", "Sign In"],
  lp_heroBadge: ["Nuevo • Disfruta en 4K HDR y Dolby Atmos", "New • Enjoy in 4K HDR and Dolby Atmos"],
  lp_heroT1: ["Cine y series en su", "Movies and series at their"],
  lp_heroT2: ["estado más puro", "purest state"],
  lp_heroSub: [
    "Disfruta de los trailers de tus películas y series favoritas. Cancela cuando quieras desde",
    "Enjoy trailers of your favorite movies and series. Cancel anytime from",
  ],
  lp_emailPh: ["Correo electrónico", "Email address"],
  lp_emailBtn: ["Comenzar", "Get Started"],
  lp_emailChecking: ["Verificando...", "Checking..."],
  lp_emailExists: [
    "Esta cuenta ya existe. Inicia sesión para continuar con tu membresía.",
    "This account already exists. Sign in to continue your membership.",
  ],
  lp_emailNote: [
    "¿Listo para ver? Ingresa tu email para crear o reiniciar tu membresía.",
    "Ready to watch? Enter your email to create or restart your membership.",
  ],
  lp_trend: ["Tendencias Ahora", "Trending Now"],
  lp_trendSub: [
    "Los títulos más reproducidos durante las últimas 24 horas",
    "The most played titles in the last 24 hours",
  ],
  lp_tabMovies: ["Películas", "Movies"],
  lp_tabSeries: ["Series", "TV Shows"],
  lp_featKicker: ["Experiencia PopConly", "PopConly Experience"],
  lp_featTitle: ["Todo lo que necesitas para tu maratón perfecto", "Everything you need for your perfect marathon"],
  lp_f1t: ["Disfruta en cualquier pantalla", "Enjoy on any screen"],
  lp_f1d: [
    "Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, reproductores Blu-ray, tablets, ordenadores y dispositivos móviles sin interrupciones.",
    "Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, tablets, computers and mobile devices with no interruptions.",
  ],
  lp_f1b: ["Hasta 4 pantallas simultáneas", "Up to 4 simultaneous screens"],
  lp_f2t: ["Descarga para ver offline", "Download to watch offline"],
  lp_f2d: [
    "Guarda tus títulos preferidos en tus dispositivos móviles o tablets y disfrútalos en cualquier viaje o sin conexión a internet.",
    "Save your favorite titles on your phones or tablets and enjoy them on any trip or without internet.",
  ],
  lp_f2b: ["Descargas automáticas inteligentes", "Smart automatic downloads"],
  lp_f3t: ["Perfiles y control parental", "Profiles and parental control"],
  lp_f3d: [
    "Crea un espacio exclusivo para los más pequeños con control PIN y clasificaciones por edad adaptadas a cada integrante de tu familia.",
    "Create an exclusive space for the little ones with PIN control and age ratings tailored to each family member.",
  ],
  lp_f3b: ["Protegido con código PIN", "Protected with PIN code"],
  lp_faqKicker: ["Dudas comunes", "Common questions"],
  lp_faqTitle: ["Preguntas Frecuentes", "Frequently Asked Questions"],
  lp_ctaT: ["¿Listo para comenzar a disfrutar?", "Ready to start enjoying?"],
  lp_ctaS: [
    "Ingresa tu correo para crear o reactivar tu suscripción de inmediato.",
    "Enter your email to create or reactivate your subscription right away.",
  ],
  lp_terms: ["Términos de Uso", "Terms of Use"],
  lp_privacy: ["Privacidad", "Privacy"],
  lp_cookies: ["Preferencias de Cookies", "Cookie Preferences"],
  lp_help: ["Centro de Ayuda", "Help Center"],
  lp_browse: ["Explorar catálogo", "Browse catalog"],
  lp_rights: ["Todos los derechos reservados.", "All rights reserved."],
  // Búsqueda
  sr_searchTitle: ["Busca en todo PopConly", "Search all of PopConly"],
  sr_searchSub: [
    "Títulos, géneros, personas y años de películas y series.",
    "Movie and series titles, genres, people and years.",
  ],
  sr_back: ["Volver al inicio", "Back to home"],
  sr_noRes: ["Sin coincidencias para", "No matches for"],
  sr_try: ["Prueba con otro título, género o año.", "Try another title, genre or year."],
  sr_more: ["Más contenido para explorar:", "More content to explore:"],
  sr_sameCat: ["Más títulos de la misma categoría", "More titles in the same category"],
  sr_playAria: ["Reproducir", "Play"],
  // Modal
  md_play: ["Comienza ya", "Start now"],
  md_list: ["Mi lista", "My list"],
  md_inList: ["En tu lista", "In your list"],
  md_full: ["Ver ficha completa", "View full details"],
  md_close: ["Cerrar", "Close"],
  // Películas
  mv_reviews: ["(34.8k reseñas)", "(34.8k reviews)"],
  mv_watchNow: ["Ver ahora", "Watch now"],
  mv_add: ["Añadir a mi lista", "Add to my list"],
  mv_inList: ["En tu lista", "In your list"],
  mv_infoAria: ["Información adicional", "More info"],
  mv_sortBy: ["Ordenar:", "Sort by:"],
  mv_sortAria: ["Ordenar películas por", "Sort movies by"],
  mv_optRel: ["Relevancia", "Relevance"],
  mv_optYear: ["Año (2026 - Reciente)", "Year (2026 - Newest)"],
  mv_optRate: ["Mayor Calificación", "Top Rated"],
  mv_optViews: ["Más Populares", "Most Popular"],
  mv_fTodos: ["Todos", "All"],
  mv_fAccion: ["Acción", "Action"],
  mv_fScifi: ["Ciencia Ficción", "Sci-Fi"],
  mv_fDrama: ["Drama", "Drama"],
  mv_fTerror: ["Terror", "Horror"],
  mv_fComedia: ["Comedia", "Comedy"],
  mv_fAnim: ["Animación", "Animation"],
  mv_accK: ["Selección Cinéfila Exclusiva", "Exclusive Cinephile Selection"],
  mv_accT: ["Aclamadas por la crítica", "Critically Acclaimed"],
  mv_prev: ["Anterior", "Previous"],
  mv_next: ["Siguiente", "Next"],
  mv_lauK: ["Cartelera Actualizada", "Updated Now Showing"],
  mv_lauT: ["Lanzamientos 2026", "2026 Releases"],
  mv_seeAll: ["Ver todos", "See all"],
  mv_speT: ["Especiales de Acción", "Action Specials"],
  mv_speS: [
    "Taquilleras de alto calibre, combates tácticos y persecuciones implacables",
    "High-caliber blockbusters, tactical combat and relentless chases",
  ],
  // Series
  sr_heroBadge: ["Serie original PopConly", "A PopConly Original Series"],
  sr_watchSeason: ["Ver Temporada 1", "Watch Season 1"],
  sr_trailer: ["Tráiler oficial", "Official trailer"],
  sr_sAll: ["Todas las Series", "All Series"],
  sr_sScifi: ["Sci-Fi & Cybernoir", "Sci-Fi & Cybernoir"],
  sr_sThriller: ["Thriller Psicológico", "Psychological Thriller"],
  sr_sCrime: ["Dramas Criminales", "Crime Dramas"],
  sr_sFantasy: ["Fantasía Oscura", "Dark Fantasy"],
  sr_sortBy: ["Ordenar por:", "Sort by:"],
  sr_sortVal: ["Más Vistas Este Mes", "Most Watched This Month"],
  sr_bingeK: ["Inmersión Continua", "Continuous Immersion"],
  sr_bingeT: ["Series Maratoneables", "Binge-Worthy Series"],
  sr_bingeS: ["Historias completas listas para consumir de inicio a fin sin pausas.", "Complete stories ready to enjoy from start to finish with no pauses."],
  sr_miniK: ["Obras maestras autoconclusivas", "Self-contained masterpieces"],
  sr_miniT: ["Miniseries Exclusivas", "Exclusive Miniseries"],
  sr_weekK: ["Sigue el ritmo de emisión mundial", "Follow the worldwide release rhythm"],
  sr_weekT: ["Episodios Semanales", "Weekly Episodes"],
  sr_weekS: ["Nuevas revelaciones cada semana, sin spoilers.", "New revelations every week, no spoilers."],
  sr_remind: ["Recordarme el viernes", "Remind me Friday"],
  sr_prev: ["Anterior", "Previous"],
  sr_next: ["Siguiente", "Next"],
  // Categorías
  cat_curated: ["Catálogo Curado", "Curated Catalog"],
  cat_title: ["Explora por Categorías", "Explore by Category"],
  cat_sub: [
    "Encuentra tu próxima obsesión cinematográfica por género, temática y colecciones curadas con calidad de sala prémium.",
    "Find your next movie obsession by genre, theme and curated collections with premium theater quality.",
  ],
  cat_tAll: ["Todos", "All"],
  cat_tMovies: ["Películas", "Movies"],
  cat_tSeries: ["Series", "TV Shows"],
  cat_tDocs: ["Documentales", "Documentaries"],
  cat_searchPh: ["Buscar categoría (ej. Acción, Suspenso, Cyberpunk)...", "Search categories (e.g. Action, Suspense, Cyberpunk)..."],
  cat_active: ["Categorías Activas", "Active Categories"],
  cat_empty: ["Sin categorías coincidentes.", "No matching categories."],
  cat_back: ["Todas las categorías", "All categories"],
  cat_kAll: ["Todo", "All"],
  cat_kMovies: ["Películas", "Movies"],
  cat_kSeries: ["Series", "TV Shows"],
  cat_emptyT: ["Muy pronto por aquí", "Coming soon here"],
  cat_emptyS: ["Estamos curando los títulos de", "We're curating the titles of"],
  cat_emptyS2: ["para esta vitrina. Mientras tanto explora el resto del catálogo.", "for this shelf. Meanwhile explore the rest of the catalog."],
  cat_collK: ["Colecciones Curadas", "Curated Collections"],
  cat_collT: ["¿No sabes qué ver hoy?", "Don't know what to watch today?"],
  cat_collS: [
    "Prueba nuestras selecciones automáticas basadas en tu estado de ánimo o déjate sorprender con el Selector Aleatorio de PopConly.",
    "Try our automatic picks based on your mood or let PopConly's Random Picker surprise you.",
  ],
  cat_surprise: ["Ruleta Sorpresa", "Surprise Roulette"],
  cat_top10: ["Top 10 Semanal", "Weekly Top 10"],
  cat_destiny: ["Tu destino:", "Your destiny:"],
} as const;

export type TKey = keyof typeof dict;

export function useLang(): { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string } {
  const ctx = useContext(LangCtx);
  if (ctx) return ctx;
  // Sin proveedor (fuera del árbol): estado local de respaldo.
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const setLang = useCallback((l: Lang) => {
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* sin almacenamiento */
    }
    setLangState(l);
  }, []);
  const t = useCallback((k: TKey) => (lang === "en" ? dict[k][1] : dict[k][0]), [lang]);
  return { lang, setLang, t };
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };

const LangCtx = createContext<Ctx | null>(null);

/** Proveedor global: un solo idioma para toda la app. Con sesión, se guarda
 *  en la DB del usuario (sobrevive cerrar sesión y otros dispositivos);
 *  sin sesión, solo localStorage (landing). */
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const { data: session, status } = useSession();

  // Al iniciar sesión: manda el idioma guardado en la DB del usuario.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/me/settings");
        if (!r.ok) return;
        const d = (await r.json()) as { lang?: string };
        if (!cancelled && (d.lang === "es" || d.lang === "en")) {
          setLangState(d.lang);
          try {
            window.localStorage.setItem(KEY, d.lang);
          } catch {
            /* sin almacenamiento */
          }
        }
      } catch {
        /* local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLangState(e.newValue === "en" ? "en" : "es");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = useCallback(
    (l: Lang) => {
      try {
        window.localStorage.setItem(KEY, l);
      } catch {
        /* sin almacenamiento */
      }
      setLangState(l);
      // Solo con sesión se persiste en DB (nunca en landing).
      if (status === "authenticated") {
        fetch("/api/me/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: l }),
        }).catch(() => {
          /* mejor esfuerzo */
        });
      }
    },
    [status]
  );

  const t = useCallback((k: TKey) => (lang === "en" ? dict[k][1] : dict[k][0]), [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}
