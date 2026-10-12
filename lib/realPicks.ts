/* Catalago real desde caratulas/. Generado por script, no editar a mano. */
import type { CatalogItem } from './catalog';
import type { ContinueItem, TopItem, TrendingTitle, RecentItem } from './data';

const H = (kind: string, cat: string, slug: string): string =>
  `/api/stream?file=${kind}/${cat}/${slug}/horizontal.jpg`;
const V = (kind: string, cat: string, slug: string): string =>
  `/api/stream?file=${kind}/${cat}/${slug}/vertical.jpg`;

export const HERO_GRID = [
  { image: H('peliculas', 'ciencia-ficcion', 'avatar-fire-and-ash'), alt: 'Odisea de fuego en Pandora' },
  { image: H('peliculas', 'accion', 'deadpool-wolverine'), alt: 'Acción irreverente del multiverso' },
  { image: H('series', 'ciencia-ficcion', '3-body-problem'), alt: 'Contacto extraterrestre y ciencia al límite' },
  { image: H('peliculas', 'fantasia', 'beetlejuice-beetlejuice'), alt: 'Fantasía oscura y humor del más allá' },
  { image: H('series', 'fantasia', 'avatar-the-last-airbender'), alt: 'Aventura épica de los cuatro elementos' },
  { image: H('peliculas', 'terror', 'a-quiet-place-day-one'), alt: 'Terror silencioso en Nueva York' },
];

export const TRENDING_MOVIES: TrendingTitle[] = [
  { rank: 'TOP 1', title: 'Deadpool & Wolverine', genre: 'Acción', meta: '2024 • Acción', match: '95% Match', age: '13+', tech: '4K UHD', image: V('peliculas', 'accion', 'deadpool-wolverine'), alt: 'Póster de Deadpool & Wolverine' },
  { rank: 'TOP 2', title: 'Gladiator II', genre: 'Acción • Épica', meta: '2024 • Acción', match: '90% Match', age: '13+', tech: 'Dolby Atmos', image: V('peliculas', 'accion', 'gladiator-ii'), alt: 'Póster de Gladiator II' },
  { rank: 'TOP 3', title: 'Ballerina', genre: 'Acción', meta: '2025 • Acción', match: '96% Match', age: '13+', tech: '4K HDR', image: V('peliculas', 'accion', 'ballerina'), alt: 'Póster de Ballerina' },
  { rank: 'TOP 4', title: 'A Minecraft Movie', genre: 'Comedia • Aventura', meta: '2025 • Comedia', match: '95% Match', age: '13+', tech: 'HDR10', image: V('peliculas', 'comedia', 'a-minecraft-movie'), alt: 'Póster de A Minecraft Movie' },
  { rank: 'TOP 5', title: '28 Years Later', genre: 'Terror', meta: '2025 • Terror', match: '90% Match', age: '16+', tech: 'IMAX Enhanced', image: V('peliculas', 'terror', '28-years-later'), alt: 'Póster de 28 Years Later' },
];

export const TRENDING_SERIES: TrendingTitle[] = [
  { rank: 'TOP 1', title: 'Fallout', genre: 'Ciencia Ficción', meta: '2024 • Acción', match: '93% Match', age: '16+', tech: '4K HDR', image: V('series', 'accion', 'fallout'), alt: 'Póster de Fallout' },
  { rank: 'TOP 2', title: 'Cobra Kai', genre: 'Acción • Drama', meta: '2018 • Acción', match: '91% Match', age: '16+', tech: 'HDR10', image: V('series', 'accion', 'cobra-kai'), alt: 'Póster de Cobra Kai' },
  { rank: 'TOP 3', title: 'Gen V', genre: 'Acción', meta: '2023 • Acción', match: '98% Match', age: '16+', tech: 'IMAX Enhanced', image: V('series', 'accion', 'gen-v'), alt: 'Póster de Gen V' },
  { rank: 'TOP 4', title: 'Daredevil Born Again', genre: 'Acción • Crimen', meta: '2025 • Acción', match: '93% Match', age: '16+', tech: '4K UHD', image: V('series', 'accion', 'daredevil-born-again'), alt: 'Póster de Daredevil Born Again' },
  { rank: 'TOP 5', title: '3 Body Problem', genre: 'Ciencia Ficción', meta: '2024 • Ciencia Ficción', match: '94% Match', age: '16+', tech: 'Dolby Atmos', image: V('series', 'ciencia-ficcion', '3-body-problem'), alt: 'Póster de 3 Body Problem' },
];

export const CONTINUE_WATCHING: ContinueItem[] = [
  { title: 'Fallout', episode: 'T1 : E4 • Quedan 24 min',
    desc: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', progress: 68, tech: 'Dolby Atmos',
    image: H('series', 'accion', 'fallout') },
  { title: 'Deadpool & Wolverine', episode: 'Película • Quedan 32 min',
    desc: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', progress: 70, tech: '4K HDR',
    image: H('peliculas', 'accion', 'deadpool-wolverine') },
  { title: 'Cobra Kai', episode: 'T6 : E2 • Quedan 28 min',
    desc: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', progress: 45, tech: '4K HDR',
    image: H('series', 'accion', 'cobra-kai') },
  { title: 'Avatar Fire and Ash', episode: 'Película • Quedan 51 min',
    desc: 'Futuros posibles, inteligencias artificiales y viajes más allá de lo conocido.', progress: 55, tech: 'IMAX Enhanced',
    image: H('peliculas', 'ciencia-ficcion', 'avatar-fire-and-ash') },
];

export const TOP_FIVE: TopItem[] = [
  { rank: 1, title: 'Deadpool & Wolverine', genre: 'Acción', rating: '9.0',
    image: V('peliculas', 'accion', 'deadpool-wolverine') },
  { rank: 2, title: 'Fallout', genre: 'Acción', rating: '9.1',
    image: V('series', 'accion', 'fallout') },
  { rank: 3, title: 'Gladiator II', genre: 'Acción', rating: '8.5',
    image: V('peliculas', 'accion', 'gladiator-ii') },
  { rank: 4, title: 'Cobra Kai', genre: 'Acción', rating: '8.7',
    image: V('series', 'accion', 'cobra-kai') },
  { rank: 5, title: 'Ballerina', genre: 'Acción', rating: '8.9',
    image: V('peliculas', 'accion', 'ballerina') },
];

export const RECENTLY_ADDED: RecentItem[] = [
  {
    title: 'Toy Story 5',
    desc: 'Los juguetes regresan y se enfrentan a la tecnología.',
    meta: 'Animación • Comedia • 1h 42m • Estreno 2026',
    tag: 'ESTRENO EXCLUSIVO',
    rating: '9.4',
    tech: '4K HDR',
    badgeStyle: 'red',
    image: '/api/stream?file=peliculas/comedia/toy-story-5/horizontal.jpg',
    trailerYoutube: 'WDiqhcTci9M',
    
    posterUrl: '/api/stream?file=peliculas/comedia/toy-story-5/vertical.jpg',
    age: '7+',
  },
  {
    title: 'Spider-Man: Brand New Day',
    desc: 'Peter Parker empieza de cero tras ser olvidado por el mundo.',
    meta: 'Acción • 2h 25m • Estreno 2026',
    tag: 'ESTRENO EXCLUSIVO',
    rating: '9.2',
    tech: '4K HDR',
    badgeStyle: 'red',
    image: '/api/stream?file=peliculas/accion/spider-man-brand-new-day/horizontal.jpg',
    trailerYoutube: 'xqwcsQxXBBU',
    
    posterUrl: '/api/stream?file=peliculas/accion/spider-man-brand-new-day/vertical.jpg',
    age: '13+',
  },
  { title: 'Captain America Brave New World',
    desc: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.',
    meta: 'Acción • 2025 • Película Original',
    tag: 'RECIÉN LLEGADO', rating: '9.4', tech: '4K HDR', badgeStyle: 'red',
    image: H('peliculas', 'accion', 'captain-america-brave-new-world') },
  { title: 'F1',
    desc: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.',
    meta: 'Acción • 2025 • Película Original',
    tag: 'RECIÉN LLEGADO', rating: '9.3', tech: '4K HDR', badgeStyle: 'red',
    image: H('peliculas', 'accion', 'f1') },
  { title: 'Countdown',
    desc: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.',
    meta: 'Acción • 2025 • Serie Original',
    tag: 'NUEVA TEMPORADA', rating: '8.7', tech: '4K HDR', badgeStyle: 'amber',
    image: H('series', 'accion', 'countdown') },
];

export const MY_LIST_INITIAL: CatalogItem[] = [
  { title: 'Deadpool & Wolverine',
    image: V('peliculas', 'accion', 'deadpool-wolverine'),
    year: '2024', age: '13+', type: 'Película',
    genres: ['Acción'],
    synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.0',
    meta: '2024 • Acción', progress: 70, downloaded: true },
  { title: 'Fallout',
    image: V('series', 'accion', 'fallout'),
    year: '2024', age: '13+', type: 'Serie',
    genres: ['Acción'],
    synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.1',
    meta: '2024 • Acción', progress: 45, downloaded: false },
  { title: 'Gladiator II',
    image: V('peliculas', 'accion', 'gladiator-ii'),
    year: '2024', age: '13+', type: 'Película',
    genres: ['Acción'],
    synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.5',
    meta: '2024 • Acción', progress: 0, downloaded: true },
  { title: 'Cobra Kai',
    image: V('series', 'accion', 'cobra-kai'),
    year: '2018', age: '13+', type: 'Serie',
    genres: ['Acción'],
    synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.7',
    meta: '2018 • Acción', progress: 0, downloaded: false },
  { title: 'Ballerina',
    image: V('peliculas', 'accion', 'ballerina'),
    year: '2025', age: '13+', type: 'Película',
    genres: ['Acción'],
    synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.9',
    meta: '2025 • Acción', progress: 0, downloaded: true },
  { title: '3 Body Problem',
    image: V('series', 'ciencia-ficcion', '3-body-problem'),
    year: '2024', age: '13+', type: 'Serie',
    genres: ['Ciencia Ficción'],
    synopsis: 'Futuros posibles, inteligencias artificiales y viajes más allá de lo conocido.', rating: '9.5',
    meta: '2024 • Ciencia Ficción', progress: 20, downloaded: false },
];

export const BROWSE_HERO: CatalogItem =
  {
    title: 'Deadpool & Wolverine',
    image: H('peliculas', 'accion', 'deadpool-wolverine'),
    year: '2024', age: '16+', type: 'Película',
    genres: ['Acción'],
    rating: '9.0', match: '95% Match', meta: '2024 • 2h 08m • Acción',
    synopsis: 'Wade Wilson recluta a un Lobezno muy distinto al esperado para salvar su universo.',
  };
export const MOVIES_HERO: CatalogItem =
  {
    title: 'Gladiator II',
    image: H('peliculas', 'accion', 'gladiator-ii'),
    year: '2024', age: '16+', type: 'Película',
    genres: ['Acción'],
    rating: '8.5', match: '90% Match', meta: '2024 • 2h 28m • Épica',
    synopsis: 'Lucius debe entrar al Coliseo y enfrentar el poder de Roma para forjar su destino.',
  };
export const SERIES_HERO: CatalogItem =
  {
    title: 'Fallout',
    image: H('series', 'accion', 'fallout'),
    year: '2024', age: '16+', type: 'Serie',
    genres: ['Acción'],
    rating: '9.1', match: '93% Match', meta: '1 Temporada • 8 Episodios • 4K Dolby Vision',
    synopsis: 'Una habitante del refugio, un escudero y un cazador ghoul cruzan el Yermo.',
  };
export const MOVIE_ROWS = [
  { title: 'Aclamadas por la crítica', subtitle: 'Lo mejor del cine actual', items: [
    {
      title: 'Gladiator II',
      image: H('peliculas', 'accion', 'gladiator-ii'),
      posterUrl: V('peliculas', 'accion', 'gladiator-ii'),
      year: '2024', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.5', match: '90% Match',
      meta: '2024 • Acción',
    },
    {
      title: 'Ballerina',
      image: H('peliculas', 'accion', 'ballerina'),
      posterUrl: V('peliculas', 'accion', 'ballerina'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.9', match: '96% Match',
      meta: '2025 • Acción',
    },
    {
      title: 'Bad Boys Ride or Die',
      image: H('peliculas', 'accion', 'bad-boys-ride-or-die'),
      posterUrl: V('peliculas', 'accion', 'bad-boys-ride-or-die'),
      year: '2024', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.9', match: '92% Match',
      meta: '2024 • Acción',
    },
    {
      title: 'F1',
      image: H('peliculas', 'accion', 'f1'),
      posterUrl: V('peliculas', 'accion', 'f1'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.3', match: '95% Match',
      meta: '2025 • Acción',
    },
  ] },
  { title: 'Lanzamientos 2026', subtitle: 'Lo recién llegado', items: [
    {
      title: 'Ballerina',
      image: H('peliculas', 'accion', 'ballerina'),
      posterUrl: V('peliculas', 'accion', 'ballerina'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.9', match: '96% Match',
      meta: '2025 • Acción',
    },
    {
      title: 'Captain America Brave New World',
      image: H('peliculas', 'accion', 'captain-america-brave-new-world'),
      posterUrl: V('peliculas', 'accion', 'captain-america-brave-new-world'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.4', match: '96% Match',
      meta: '2025 • Acción',
    },
    {
      title: 'F1',
      image: H('peliculas', 'accion', 'f1'),
      posterUrl: V('peliculas', 'accion', 'f1'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.3', match: '95% Match',
      meta: '2025 • Acción',
    },
    {
      title: '28 Years Later',
      image: H('peliculas', 'terror', '28-years-later'),
      posterUrl: V('peliculas', 'terror', '28-years-later'),
      year: '2025', age: '16+', type: 'Película',
      genres: ['Terror'],
      synopsis: 'Apaga la luz: pesadillas, sustos y horror del bueno.', rating: '8.7', match: '90% Match',
      meta: '2025 • Terror',
    },
    {
      title: 'Anaconda',
      image: H('peliculas', 'comedia', 'anaconda'),
      posterUrl: V('peliculas', 'comedia', 'anaconda'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Comedia'],
      synopsis: 'Risas garantizadas: enredos, sátira y personajes inolvidables.', rating: '9.2', match: '91% Match',
      meta: '2025 • Comedia',
    },
    {
      title: 'A Minecraft Movie',
      image: H('peliculas', 'comedia', 'a-minecraft-movie'),
      posterUrl: V('peliculas', 'comedia', 'a-minecraft-movie'),
      year: '2025', age: '13+', type: 'Película',
      genres: ['Comedia'],
      synopsis: 'Risas garantizadas: enredos, sátira y personajes inolvidables.', rating: '9.5', match: '95% Match',
      meta: '2025 • Comedia',
    },
  ] },
  { title: 'Especiales de Acción', subtitle: 'Adrenalina sin freno', items: [
    {
      title: 'Deadpool & Wolverine',
      image: H('peliculas', 'accion', 'deadpool-wolverine'),
      posterUrl: V('peliculas', 'accion', 'deadpool-wolverine'),
      year: '2024', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.0', match: '95% Match',
      meta: '2024 • Acción',
    },
    {
      title: 'Furiosa A Mad Max Saga',
      image: H('peliculas', 'accion', 'furiosa-a-mad-max-saga'),
      posterUrl: V('peliculas', 'accion', 'furiosa-a-mad-max-saga'),
      year: '2024', age: '13+', type: 'Película',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.9', match: '98% Match',
      meta: '2024 • Acción',
    },
  ] },
];

export const SERIES_ROWS = [
  { title: 'Series Maratoneables', subtitle: 'Para ver de un tirón', items: [
    {
      title: 'Fallout',
      image: H('series', 'accion', 'fallout'),
      posterUrl: V('series', 'accion', 'fallout'),
      year: '2024', age: '13+', type: 'Serie',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.1', match: '93% Match',
      meta: '2024 • Acción',
    },
    {
      title: 'Cobra Kai',
      image: H('series', 'accion', 'cobra-kai'),
      posterUrl: V('series', 'accion', 'cobra-kai'),
      year: '2018', age: '13+', type: 'Serie',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.7', match: '91% Match',
      meta: '2018 • Acción',
    },
    {
      title: 'Gen V',
      image: H('series', 'accion', 'gen-v'),
      posterUrl: V('series', 'accion', 'gen-v'),
      year: '2023', age: '13+', type: 'Serie',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '8.6', match: '98% Match',
      meta: '2023 • Acción',
    },
    {
      title: '3 Body Problem',
      image: H('series', 'ciencia-ficcion', '3-body-problem'),
      posterUrl: V('series', 'ciencia-ficcion', '3-body-problem'),
      year: '2024', age: '13+', type: 'Serie',
      genres: ['Ciencia Ficción'],
      synopsis: 'Futuros posibles, inteligencias artificiales y viajes más allá de lo conocido.', rating: '9.5', match: '94% Match',
      meta: '2024 • Ciencia Ficción',
    },
  ] },
  { title: 'Miniseries Exclusivas', subtitle: 'Historias cerradas', items: [
    {
      title: 'Adolescence',
      image: H('series', 'suspenso', 'adolescence'),
      posterUrl: V('series', 'suspenso', 'adolescence'),
      year: '2025', age: '16+', type: 'Serie',
      genres: ['Suspenso'],
      synopsis: 'Tensión en cada escena: giros que no verás venir.', rating: '9.4', match: '95% Match',
      meta: '2025 • Suspenso',
    },
    {
      title: 'Black Bird',
      image: H('series', 'suspenso', 'black-bird'),
      posterUrl: V('series', 'suspenso', 'black-bird'),
      year: '2022', age: '16+', type: 'Serie',
      genres: ['Suspenso'],
      synopsis: 'Tensión en cada escena: giros que no verás venir.', rating: '8.9', match: '91% Match',
      meta: '2022 • Suspenso',
    },
    {
      title: 'Beckham',
      image: H('series', 'documentales', 'beckham'),
      posterUrl: V('series', 'documentales', 'beckham'),
      year: '2023', age: '13+', type: 'Serie',
      genres: ['Documentales'],
      synopsis: 'Historias reales que importan: naturaleza, ciencia y humanidad.', rating: '8.5', match: '94% Match',
      meta: '2023 • Documentales',
    },
  ] },
  { title: 'Episodios Semanales', subtitle: 'Un capítulo cada semana', items: [
    {
      title: 'Daredevil Born Again',
      image: H('series', 'accion', 'daredevil-born-again'),
      posterUrl: V('series', 'accion', 'daredevil-born-again'),
      year: '2025', age: '13+', type: 'Serie',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.0', match: '93% Match',
      meta: '2025 • Acción',
    },
    {
      title: 'Citadel',
      image: H('series', 'accion', 'citadel'),
      posterUrl: V('series', 'accion', 'citadel'),
      year: '2023', age: '13+', type: 'Serie',
      genres: ['Acción'],
      synopsis: 'Adrenalina pura: misiones imposibles, persecuciones y héroes al límite.', rating: '9.1', match: '96% Match',
      meta: '2023 • Acción',
    },
    {
      title: 'Ahsoka',
      image: H('series', 'ciencia-ficcion', 'ahsoka'),
      posterUrl: V('series', 'ciencia-ficcion', 'ahsoka'),
      year: '2023', age: '13+', type: 'Serie',
      genres: ['Ciencia Ficción'],
      synopsis: 'Futuros posibles, inteligencias artificiales y viajes más allá de lo conocido.', rating: '9.4', match: '91% Match',
      meta: '2023 • Ciencia Ficción',
    },
  ] },
];

export const BINGE_PATCH: Record<string, { seasons: string; episodes: string; match: string; marathon: string }> = {
  'Fallout': { seasons: '2 Temporadas completas', episodes: '20 Episodios', match: '94% de coincidencia', marathon: '~18h maratón' },
  'Cobra Kai': { seasons: '3 Temporadas completas', episodes: '27 Episodios', match: '93% de coincidencia', marathon: '~27h maratón' },
  'Gen V': { seasons: '4 Temporadas completas', episodes: '34 Episodios', match: '92% de coincidencia', marathon: '~36h maratón' },
  '3 Body Problem': { seasons: '2 Temporadas completas', episodes: '41 Episodios', match: '91% de coincidencia', marathon: '~45h maratón' },
};

export const WEEKLY_PATCH: Record<string, { dur: string }> = {
  'Daredevil Born Again': { dur: '58 min' },
  'Citadel': { dur: '61 min' },
  'Ahsoka': { dur: '64 min' },
};
