# Módulos y bases de datos (trabajo por equipos)

## Módulo 1 — Autenticación y cuentas (PostgreSQL)
Usuarios, sesiones y perfiles de reproducción.
- `prisma/schema.prisma`, `prisma/migrations/`, `lib/auth.ts`, `lib/actions.ts`,
  `lib/mail.ts`, `lib/prisma.ts`, `proxy.ts`
- `app/login/**`, `app/signup/**` (excepto pago), `app/api/profiles/**`
- `app/profile/**` (sección de cuenta; facturación es Módulo 4)

## Módulo 2 — Catálogo de contenido (MongoDB)
Películas, series, categorías y trailers de YouTube.
- `lib/catalog*.ts`, `lib/findTitle.ts`, `lib/slugs.ts`, `lib/thumb.ts`,
  `lib/synopsis.ts`, `lib/youtube.ts`, `lib/catalogDb.ts`, `lib/seo.ts`
- `scripts/seed-catalog.ts`, `scripts/sync-trailers.ts`
- `app/api/titles/**`, `app/api/stream/**`, `app/api/admin/trailers/**`
- `app/browse`, `app/movies`, `app/series`, `app/categories`, `app/search`,
  `app/titulo/**`, `app/watch`, `app/admin/trailers`
- `components/`: TitleModal, SearchCard(s), *Cards, YoutubePlayer, Logo/Header/Footer
- `media/` (carátulas locales, NO va a git) y `db/` (referencia)

## Módulo 3 — Historial y recomendaciones (Redis)
Minuto exacto por perfil, favoritos, recomendados y héroe inteligente.
- `lib/redis.ts`, `lib/myListStore.ts`, `lib/myListSync.ts`,
  `lib/activeProfile.ts`, `lib/recsCache.ts`, `lib/useSmartHero.ts`
- `app/api/progress/**`, `app/api/favorites/**`, `app/api/recommendations/**`
- `app/my-list/**` (la facturación visible ahí es solo lectura del Módulo 4)

## Módulo 4 — Suscripciones y pagos (MySQL)
Planes, membresías, pagos Wompi y aprobaciones manuales.
- `db/billing.sql`, `lib/billing.ts`, `lib/mysql.ts`, `lib/plans.ts`
- `app/api/checkout/**`, `app/api/me/subscription/**`,
  `app/api/webhooks/wompi/**`, `app/api/payments/**`, `app/api/admin/payments/**`
- `app/signup/payment/**`, `app/signup/retorno/**`, `app/admin/subscriptions/**`

> Nota: `app/profile` y `app/browse` consumen varios módulos (muestran plan,
> progreso y recomendados), pero cada dato vive en la DB de su módulo.
