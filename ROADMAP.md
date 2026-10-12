# PopConly — Roadmap (después del catálogo real)

Fase actual: reproductor real, rutas dinámicas, perfil sincronizado. ✅

## 1. Trailers
- Campo `trailerUrl` en `titles` (Mongo) + seed.
- Botón "Tráiler" en fichas y hero → modal con `<video>` (primero en /watch con `?trailer=1` o modal dedicado).
- Sin URL: el botón no se muestra (como `videoUrl` hoy).

## 2. Motor de sugerencias (algoritmos)
Hoy: `/api/recommendations` = género dominante (regla simple, funciona sin datos).
Evolución por niveles:
- **Nivel 1 (actual)**: género más visto → no-vistos del mismo género.
- **Nivel 2**: ponderar por % completado (terminar algo pesa más que empezar),
  penalizar abandonos (<10% visto), mezclar géneros secundarios.
- **Nivel 3**: filtrado colaborativo en Redis (usuarios que vieron X también vieron Y)
  usando sets `popconly:seen:{slug}` por título.
- Todo vive en `app/api/recommendations/route.ts`; el front no cambia.

## 3. Pendientes conocidos
- Duración real: hoy es `duration` del video cuando hay URL, o estimada por hash.
  Con catálogo real, guardar `durationSecs` en Mongo al importar.
- Duración y carátulas de series por episodio: modelo `episodes` (serie → lista)
  cuando haya datos reales por temporada.
- Sitemap dinámico total: hoy revalida cada hora; con miles de títulos, paginar
  `sitemap.xml` (`/sitemap/0.xml`, etc.).
