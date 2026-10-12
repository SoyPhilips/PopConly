# PopConly — Plataforma de Streaming (estilo mini-Netflix)

Next.js 16 (App Router) + TypeScript + Tailwind + Auth.js v5.
4 módulos, 4 bases de datos (ver `MODULES.md`):

| Módulo | Área | DB |
|---|---|---|
| 1 | Autenticación y cuentas | PostgreSQL |
| 2 | Catálogo de contenido | MongoDB |
| 3 | Historial y recomendaciones | Redis |
| 4 | Suscripciones y pagos | MySQL |

## Arranque local

```bash
docker compose up -d postgres mysql mongo redis
npx prisma migrate dev
npm run db:seed:catalog   # 902 títulos a Mongo
npm run dev               # http://localhost:3000
```

Variables: copia `.env.example` a `.env` y completa SMTP, Wompi y
`YOUTUBE_API_KEY` (gratis, para sincronizar trailers).

## Scripts útiles

```bash
npm run trailers:sync -- 95   # lote diario de trailers (~101 u. c/u de 10k)
npm run build                 # verificación de producción
```

## Ramas por equipo

`modulo-1-autenticacion`, `modulo-2-catalogo`, `modulo-3-historial`,
`modulo-4-pagos` (ver `MODULES.md` para archivos de cada uno).

## Despliegue

Ver `DEPLOY_ORACLE.md` (VM Oracle Ampere + Docker) y `ROADMAP.md`.
