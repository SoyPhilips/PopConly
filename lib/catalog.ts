import {
  MOVIES_HERO_IMAGE,
  MOVIES_POSTERS,
  SERIES_HERO_IMAGE,
  SERIES_POSTERS,
  CATEGORY_IMAGES,
  MY_LIST_IMAGES,
} from "./images";

export type CatalogItem = {
  title: string;
  image: string;
  year?: string;
  age?: string;
  type?: string;
  genres?: string[];
  synopsis?: string;
  rating?: string;
  match?: string;
  meta?: string;
  progress?: number;
  downloaded?: boolean;
  /** URL directa del video completo (streaming). */
  videoUrl?: string;
  /** Clip corto (30s) para previsualizar en hover. */
  trailerUrl?: string;
  /** ID de YouTube del trailer oficial. */
  trailerYoutube?: string;
  /** Póster vertical para carátulas 2:3 (si no hay, se usa image). */
  posterUrl?: string;
};

/* ---------- PELÍCULAS ---------- */

export const MOVIES_HERO: CatalogItem = {
  title: "Ciber-Génesis 2026",
  image: MOVIES_HERO_IMAGE,
  year: "2026",
  age: "16+",
  type: "Película",
  genres: ["Ciencia Ficción", "Acción"],
  rating: "9.5",
  match: "98% Match",
  meta: "2h 18m • 4K Dolby Vision",
  synopsis:
    "En un Neo-Kioto fragmentado por corporaciones cuánticas, una inteligencia artificial disidente despierta recuerdos de una vida humana que jamás vivió, desatando una cacería implacable que alterará la línea temporal.",
};

const MOVIE_SYN: Record<string, string> = {
  "El Horizonte de Sombra":
    "Una tripulación científica se adentra en el vórtice de una anomalía gravitacional descubriendo secretos que trascienden el cosmos.",
  "Cadencia Obsesiva":
    "Un virtuoso maestro de orquesta arriesga su propia cordura en busca de una sinfonía imposible de ejecutar por manos humanas.",
  "El Murmullo del Brezo":
    "Un aislado asentamiento rural del siglo XIX enfrenta un antiguo ritual que despierta cuando los inviernos se vuelven eternos.",
  "Cenizas de Honor":
    "Un veterano samurái desterrado toma una última posición para proteger al heredero del clan frente a un ejército invasor.",
  "Protocolo Sombra":
    "Un agente encubierto debe decidir a quién traicionar cuando dos agencias rivales activan el mismo protocolo de eliminación.",
  "Mares de Kepler":
    "Tras un naufragio orbital, una oceanógrafa y un piloto cruzan un exo-océano vivo que lee sus recuerdos para guiarlos.",
  "Vigía Nocturno":
    "Un guardia de faro en una costa incomunicada registra señales que nadie más escucha. El turno de noche esconde respuestas.",
  "Neo Turbo":
    "Carreras clandestinas de hoverbikes por las arterias de la ciudad. Ganar significa salir del circuito para siempre.",
  "Jugada Ciega":
    "Un ex campeón de póker ciego debe volver a la mesa para saldar la deuda de su hermano frente al casino más cruel del desierto.",
  "Reflejos Rotos":
    "Una fotógrafa descubre que sus negativos muestran crímenes antes de que ocurran. Revelar la verdad la convierte en sospechosa.",
  "Furia Táctica: Extinción Urbana":
    "Un comando de extracción de élite queda atrapado tras las líneas enemigas con un arma biológica experimental que amenaza la metrópoli entera.",
  "Velocidad Terminal: El Último Tren":
    "Sin frenos y a 300 km/h en la cordillera alpina, un antiguo mercenario debe neutralizar a un cartel armado piso por piso antes de la colisión.",
};

const MOVIE_TITLES = [
  "El Horizonte de Sombra",
  "Cadencia Obsesiva",
  "El Murmullo del Brezo",
  "Cenizas de Honor",
  "Protocolo Sombra",
  "Mares de Kepler",
  "Vigía Nocturno",
  "Neo Turbo",
  "Jugada Ciega",
  "Reflejos Rotos",
  "Furia Táctica: Extinción Urbana",
  "Velocidad Terminal: El Último Tren",
];

const MOVIE_GENRES = [
  ["Drama", "Ciencia Ficción"],
  ["Drama", "Música"],
  ["Terror", "Drama"],
  ["Acción", "Épica"],
  ["Acción", "Espionaje"],
  ["Aventura", "Sci-Fi"],
  ["Suspenso", "Misterio"],
  ["Acción", "Carreras"],
  ["Crimen", "Drama"],
  ["Thriller", "Misterio"],
  ["Acción", "Táctica"],
  ["Acción", "Thriller"],
];

export const MOVIE_ROWS: { title: string; subtitle: string; items: CatalogItem[] }[] = [
  {
    title: "Aclamadas por la crítica",
    subtitle: "Obras maestras que definieron el año",
    items: MOVIE_TITLES.slice(0, 4).map((t, i) => ({
      title: t,
      image: MOVIES_POSTERS[i],
      year: "2026",
      age: i === 2 ? "18+" : "16+",
      type: "Película",
      genres: MOVIE_GENRES[i],
      synopsis: MOVIE_SYN[t],
      rating: ["9.4", "9.2", "9.0", "8.9"][i],
      match: `${96 - i}% Match`,
      meta: "4K Dolby Vision",
    })),
  },
  {
    title: "Lanzamientos 2026",
    subtitle: "Taquilleras de alto calibre recién llegadas",
    items: [
      {
        title: "Toy Story 5",
        image: "/api/stream?file=peliculas/toy-story-5/toy-story-5-backdrop-horizontal.jpeg",
        posterUrl: "/api/stream?file=peliculas/toy-story-5/toy-story-5-poster-vertical.jpg",
        videoUrl: "/api/stream?file=peliculas/toy-story-5/toy-story-5-pelicula-completa.mp4",
        trailerUrl: "/api/stream?file=peliculas/toy-story-5/toy-story-5-preview-30s.mp4",
        year: "2026",
        age: "7+",
        type: "Película",
        genres: ["Animación", "Comedia", "Aventura"],
        synopsis:
          "Los juguetes regresan y se enfrentan a la tecnología: una tablet llamada Lilypad pone en jaque el juego de Bonnie.",
        rating: "9.4",
        match: "98% Match",
        meta: "4K HDR",
      },
      {
        title: "Spider-Man: Brand New Day",
        image:
          "/api/stream?file=peliculas/spider-man-brand-new-day/spider-man-brand-new-day-backdrop-horizontal.jpeg",
        posterUrl:
          "/api/stream?file=peliculas/spider-man-brand-new-day/spider-man-brand-new-day-poster-vertical.jpg",
        videoUrl:
          "/api/stream?file=peliculas/spider-man-brand-new-day/spider-man-brand-new-day-pelicula-completa.mp4",
        trailerUrl:
          "/api/stream?file=peliculas/spider-man-brand-new-day/spider-man-brand-new-day-preview-30s.mp4",
        year: "2026",
        age: "13+",
        type: "Película",
        genres: ["Acción", "Aventura"],
        synopsis:
          "Tras los eventos que borraron su identidad, Peter Parker empieza de cero: nuevos villanos, nuevos aliados y un nuevo día como Spider-Man.",
        rating: "9.2",
        match: "97% Match",
        meta: "4K HDR",
      },
      ...MOVIE_TITLES.slice(4, 10).map((t, i) => ({
        title: t,
        image: MOVIES_POSTERS[i + 4],
        year: "2026",
        age: "13+",
        type: "Película",
        genres: MOVIE_GENRES[i + 4],
        synopsis: MOVIE_SYN[t],
        rating: ["8.8", "8.7", "8.6", "8.5", "8.4", "8.3"][i],
        meta: "4K HDR",
      })),
    ],
  },
  {
    title: "Especiales de Acción",
    subtitle: "Combates tácticos y persecuciones implacables",
    items: MOVIE_TITLES.slice(10, 12).map((t, i) => ({
      title: t,
      image: MOVIES_POSTERS[i + 10],
      year: "2026",
      age: "16+",
      type: "Película",
      genres: MOVIE_GENRES[i + 10],
      synopsis: MOVIE_SYN[t],
      rating: ["9.1", "9.0"][i],
      meta: "4K • Dolby Atmos",
    })),
  },
];

export const MOVIE_FILTERS = [
  "Todos",
  "Acción",
  "Ciencia Ficción",
  "Drama",
  "Terror",
  "Comedia",
  "Animación",
];

/* ---------- SERIES ---------- */

export const SERIES_HERO: CatalogItem = {
  title: "Sindicato Neón: Protocolo Omega",
  image: SERIES_HERO_IMAGE,
  year: "2026",
  age: "16+",
  type: "Serie",
  genres: ["Sci-Fi", "Cybernoir"],
  rating: "9.6",
  match: "99% Match",
  meta: "1 Temporada • 8 Episodios • 4K Dolby Vision",
  synopsis:
    "En una metrópoli gobernada por conglomerados neuro-cuánticos, un detective renegado descubre que los recuerdos colectivos de la humanidad están siendo borrados para instalar una sumisión dócil. Su única esperanza yace en el protocolo clandestino Omega.",
};

const SERIES_SYN: Record<string, string> = {
  "Archivos Cero: Código Berlín":
    "Una conspiración que abarca tres décadas de espionaje tecnológico en el corazón de Europa.",
  "Extracción Kepler-89":
    "Una tripulación de perforación minera queda aislada tras un cataclismo orbital que despierta algo oculto.",
  "La Mano Oculta: Dinastía":
    "Tres familias rivales disputan el monopolio de las apuestas globales mediante intrigas despiadadas.",
  "Viento Ártico: Silencio":
    "Una científica aislada en Laponia descubre una transmisión que no debería existir en frecuencias humanas.",
  "El Último Voto Imperial":
    "Las 72 horas previas a la votación clandestina que transformó una federación democrática en una teocracia silenciosa.",
  "Crescendo Sombra":
    "Un director de orquesta obsesionado con una partitura supuestamente maldita que altera la percepción temporal de quienes la escuchan.",
  "Frecuencia Roja: 1974":
    "Una sala de escuchas en Viena intercepta una señal fantasma que predice con exactitud siniestros accidentes diplomáticos.",
  "Cerebro de Enjambre: Redux":
    "Una inteligencia artificial táctica toma control de tres satélites meteorológicos para desencadenar un apagón global intencional.",
  "Cántico de la Sombra":
    "Un coro de pueblo esconde un ritual acústico que mantiene dormida a una entidad bajo la catedral.",
  "Distrito Ronin: Neo-Edo":
    "Un ronin sin amo patrulla un distrito flotante donde cada neón esconde una deuda y cada deuda, una espada.",
};

const SERIES_TITLES = Object.keys(SERIES_SYN);

export const SERIES_ROWS: { title: string; subtitle: string; items: CatalogItem[] }[] = [
  {
    title: "Series Maratoneables",
    subtitle: "Historias completas listas para consumir sin pausas",
    items: SERIES_TITLES.slice(0, 4).map((t, i) => ({
      title: t,
      image: SERIES_POSTERS[i],
      year: "2026",
      age: i === 3 ? "13+" : "16+",
      type: "Serie",
      genres: [["Espionaje", "Thriller"], ["Sci-Fi", "Terror"], ["Crimen", "Drama"], ["Misterio", "Drama"]][i],
      synopsis: SERIES_SYN[t],
      rating: ["9.3", "9.1", "9.0", "8.9"][i],
      meta: `${[3, 2, 4, 1][i]} Temporadas • 4K`,
    })),
  },
  {
    title: "Miniseries Exclusivas",
    subtitle: "Obras autoconclusivas de cineastas galardonados",
    items: SERIES_TITLES.slice(4, 7).map((t, i) => ({
      title: t,
      image: SERIES_POSTERS[i + 4],
      year: "2026",
      age: "16+",
      type: "Miniserie",
      genres: [["Drama", "Política"], ["Música", "Thriller"], ["Espionaje", "Años 70"]][i],
      synopsis: SERIES_SYN[t],
      rating: ["9.2", "9.0", "8.8"][i],
      meta: "Miniserie • 6 Episodios",
    })),
  },
  {
    title: "Episodios Semanales",
    subtitle: "Nuevas revelaciones cada semana, sin spoilers",
    items: SERIES_TITLES.slice(7, 10).map((t, i) => ({
      title: t,
      image: SERIES_POSTERS[i + 7],
      year: "2026",
      age: "16+",
      type: "Serie",
      genres: [["Sci-Fi", "Thriller"], ["Terror", "Misterio"], ["Acción", "Cyberpunk"]][i],
      synopsis: SERIES_SYN[t],
      rating: ["8.9", "8.7", "9.1"][i],
      meta: `Episodio ${7 + i} disponible el viernes`,
    })),
  },
];

export const SERIES_FILTERS = [
  "Todas las Series",
  "Sci-Fi & Cybernoir",
  "Thriller Psicológico",
  "Dramas Criminales",
  "Fantasía Oscura",
];

/* ---------- CATEGORÍAS ---------- */

export type Category = {
  name: string;
  count: string;
  mood: string;
  badge: string;
  tech: string;
  tags: string[];
  image: string;
};

const CAT_NAMES: Array<[string, string, string, string, string, string[]]> = [
  ["ACCIÓN", "1,240+ Títulos", "Explosivo & Adrenalina", "Trending #1", "4K UHD", ["movies", "series", "accion"]],
  ["ANIME", "890+ Series & OVAS", "Estrenos Japón", "Simulcast", "Sub & Dub", ["series", "movies", "anime"]],
  ["DOCUMENTALES", "540+ Exploraciones", "Ciencia & Planeta", "Dolby Atmos", "4K", ["docs", "movies", "series"]],
  ["CIENCIA FICCIÓN", "780+ Obras de Culto", "Distopías & IA", "Espacio & Futuro", "4K", ["movies", "series", "ciencia"]],
  ["COMEDIA", "620+ Títulos", "Sátira & Risas", "Stand-up & Films", "HD", ["movies", "series", "comedia"]],
  ["SUSPENSO", "910+ Intriga Pura", "Misterio & Giros", "Psicológico", "4K", ["movies", "series", "suspenso"]],
  ["TERROR", "470+ Pesadillas", "Slasher & Oculto", "Sobrenatural", "4K", ["movies", "terror"]],
  ["DRAMA", "1,150+ Historias", "Autor & Épica", "Premios Festival", "4K", ["movies", "series", "drama"]],
  ["FANTASÍA", "690+ Leyendas", "Magia & Mitología", "Universos Mágicos", "4K", ["movies", "series", "fantasia"]],
];

export const CATEGORIES: Category[] = CAT_NAMES.map((c, i) => ({
  name: c[0],
  count: c[1],
  mood: c[2],
  badge: c[3],
  tech: c[4],
  tags: c[5],
  image: CATEGORY_IMAGES[i],
}));

export const CURATED_COLLECTIONS = [
  { label: "Especial", title: "Cine Coreano", count: "134 Producciones" },
  { label: "Aclamado", title: "Ganadores Óscar", count: "98 Joyas" },
  { label: "Nostalgia", title: "Clásicos de los 80s", count: "215 Películas" },
  { label: "Sonido", title: "Conciertos 4K", count: "82 Recitales" },
];

/* ---------- MI LISTA ---------- */

const LIST_TITLES = [
  "Sombras del Neón",
  "Órbita Escarlata",
  "Código Cero",
  "Faro del Abismo",
  "Génesis Carmesí",
  "Trono de Cenizas",
  "Horizonte Terminal",
  "Protocolo Espejo",
  "Velocidad Sombra",
  "Dinastía de Sangre",
];

const LIST_SYN: Record<string, string> = {
  "Sombras del Neón":
    "Una detective de homicidios persigue a un imitador que recrea crímenes de hace 40 años bajo los neones del puerto.",
  "Órbita Escarlata":
    "La comandante de una estación en llamas debe elegir qué módulo salvar cuando la órbita decae sin remedio.",
  "Código Cero":
    "Cuando la red de vigilancia neural de la capital falla, una criptoanalista descubre simulaciones de vidas alternas.",
  "Faro del Abismo":
    "Dos fareros incomunicados documentan luces imposibles que emergen de la fosa durante la tormenta del siglo.",
  "Génesis Carmesí":
    "El primer bebé nacido en Marte cumple 18 años y exige saber por qué nunca podrá visitar la Tierra.",
  "Trono de Cenizas":
    "Dos hermanas se disputan un reino en ruinas mientras el volcán que lo destruyó vuelve a despertar.",
  "Horizonte Terminal":
    "Una expedición desolada cruza el perímetro del agujero de gusano buscando la última colonia perdida de la Tierra.",
  "Protocolo Espejo":
    "Un contrabandista de datos biométricos se ve obligado a atravesar una megalópolis bloqueada por fuerzas rebeldes.",
  "Velocidad Sombra":
    "Una mensajera nocturna en moto descubre que su último paquete contiene la prueba que puede tumbar al alcalde.",
  "Dinastía de Sangre":
    "Los herederos del consorcio aeroespacial más influyente se enfrentan en un juego mortal de chantaje y espionaje.",
};

export const MY_LIST_INITIAL: CatalogItem[] = LIST_TITLES.map((t, i) => ({
  title: t,
  image: MY_LIST_IMAGES[i],
  year: i % 2 ? "2025" : "2026",
  age: "16+",
  type: i % 3 === 0 ? "Serie" : "Película",
  genres: i < 6 ? ["Ciencia Ficción", "Thriller"] : ["Acción", "Drama"],
  synopsis: LIST_SYN[t],
  rating: (8.4 + ((i * 7) % 12) / 10).toFixed(1),
  meta: i % 3 === 0 ? "3 Temporadas • 4K" : "2h 05m • 4K HDR",
  progress: [65, 0, 82, 35, 0, 50, 0, 20, 0, 0][i],
  downloaded: [true, false, true, false, true, false, true, false, false, false][i],
}));
