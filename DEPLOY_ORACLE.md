# PopConly — Despliegue en Oracle Cloud + SEO + Wompi

> Estado actual: frontend visual completo. Este documento es la ruta backend/infra.
> Nada de esto corre todavía: son los pasos en orden.

## 0. Aclaración honesta sobre las 4 bases de datos

Oracle Cloud **no** tiene "complementos" managed gratis para PostgreSQL, MongoDB ni Redis.
Lo que sí es gratis (Always Free):

- **1 VM Ampere A1**: 4 OCPU ARM + 24 GB RAM (tu VM actual). Aquí corre todo.
- **2× Autonomous Database** (Oracle SQL, 20 GB c/u): útil, pero es SQL Oracle, no Postgres/MySQL/Mongo.
- **MySQL HeatWave** con límites free pequeños (sirve para arrancar el Módulo 4 si prefieres managed).

La arquitectura elegida: **las 4 DBs en Docker dentro de tu VM** (`docker-compose.yml`).
24 GB de RAM sobran para Postgres + Mongo + Redis + MySQL + Next.js.

## 1. Preparar la VM (una sola vez)

```bash
# Conectarte por SSH (IP pública de tu instancia, llave .key de OCI)
ssh -i tu-llave.key ubuntu@TU_IP_PUBLICA

# Docker + compose
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# Firewall de Oracle (¡paso que siempre se olvida!): abre 80 y 443
# Consola OCI → Networking → tu VCN → Security List → Ingress Rules:
#   0.0.0.0/0 TCP 80, 0.0.0.0/0 TCP 443 (además del 22 que ya tienes)
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 2. Subir y levantar el proyecto

```bash
git clone <tu-repo-popconly> && cd popconly
cp .env.example .env   # crea este archivo (ver abajo) y pon claves reales
docker compose up -d --build
docker compose ps      # todo en "running"
```

`.env` (nunca se sube a git):

```env
POSTGRES_PASSWORD=xxx
MONGO_PASSWORD=xxx
REDIS_PASSWORD=xxx
MYSQL_ROOT_PASSWORD=xxx
MYSQL_PASSWORD=xxx
WOMPI_PUBLIC_KEY=pub_test_xxx
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_EVENTS_SECRET=xxx
```

## 3. Dominio + HTTPS (requisito para Google y para Wompi)

1. Compra `popconly.tv` (o el que elijas) en Namecheap/Cloudflare (~$10/año).
2. Apunta un registro **A** al IP pública de tu VM.
3. En la VM, instala Caddy (hace HTTPS solo con 2 líneas) delante del puerto 3000:

```text
popconly.tv {
    reverse_proxy 127.0.0.1:3000
}
```

4. Cambia `SITE_URL` en `app/layout.tsx`, `lib/seo.ts` y `app/robots.ts` al dominio real.

## 4. Google: aparecer como PopConly (expectativas reales)

El SEO técnico ya quedó en el repo (`metadata`, `sitemap.xml`, `robots.txt`,
JSON-LD, títulos por ruta). Pero ojo: **ninguna etiqueta te pone #1**.
Google posiciona por antigüedad, contenido, visitas y enlaces. Plan realista:

1. **Google Search Console**: registra el dominio, sube el `sitemap.xml`, pide indexación de `/`.
2. **Contenido indexable**: hoy el catálogo son datos quemados en código. Cuando el
   Módulo 2 (Mongo) esté vivo, cada película/serie debe tener su URL
   (`/titulo/slug`) con título, sinopsis y schema `Movie`/`TVSeries`. Eso es lo
   que Google muestra y rankea.
3. **Ritmo**: un sitio nuevo tarda 3–6 meses en posicionar, y "PopConly" (marca
   inventada, sin competencia) rankeará rápido para su propio nombre; para
   "ver películas online" compites con gigantes: ahí no hay atajo.
4. No pagues "SEO milagroso": con Search Console + contenido + velocidad basta.

## 5. Wompi (pasarela elegida)

Flujo que implementaremos (modo test primero):

1. `POST /api/checkout` (Next.js): recibe `planId`, crea la transacción en Wompi
   (API o Widget/LINK DE PAGO) y guarda `pending` en **MySQL** (Módulo 4).
2. Usuario paga en Wompi → Wompi llama a `POST /api/webhooks/wompi`
   (verificado con `WOMPI_EVENTS_SECRET`).
3. Webhook marca la membresía `active` + fecha de corte (+30 días) en MySQL.
4. El frontend lee `/api/me/subscription` para bloquear/desbloquear el catálogo.

Wompi necesita HTTPS público y cuenta verificada (persona natural sirve en CO).

## 6. Orden de construcción sugerido

1. ✅ SEO técnico (hecho).
2. ✅ Módulo 1: Postgres + Auth.js (magic-link + credenciales).
3. ✅ Módulo 2: Mongo + `/titulo/slug` + seed.
4. ✅ Módulo 3: Redis (minuto exacto + favoritos + recomendados).
5. ✅ Módulo 4: MySQL + Wompi (ver abajo).
6. Deploy según secciones 1–3 de este doc.

## 8. Módulo 4 — activar pagos reales (cuando tengas Wompi)

Estado actual: todo el código existe y **sin llaves funciona en modo visual**
(idéntico a antes). Además hay **pago manual por Nequi** (sin RUT ni pasarela):
el usuario transfiere, reporta la referencia y tú lo apruebas en
`/admin/subscriptions`. Para cobrar de verdad con tarjeta:

```bash
# 1. MySQL en Oracle/local
docker compose up -d mysql
mysql -h 127.0.0.1 -u popconly -p popconly_billing < db/billing.sql

# 2. Llaves en .env (empieza con las de PRUEBA del dashboard de Wompi)
WOMPI_PUBLIC_KEY=pub_test_xxx
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_EVENTS_SECRET=xxx
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxx
NEXT_PUBLIC_WOMPI_ENV=sandbox
NEXT_PUBLIC_SITE_URL=https://tu-dominio
```

3. En el dashboard de Wompi → Desarrolladores → Eventos, registra:
   `https://tu-dominio/api/webhooks/wompi`
4. Tarjetas de prueba de Wompi (docs) para simular aprobado/rechazado.
5. Para producción: cambia a llaves `pub_prod`/`prv_prod`, `WOMPI_ENV=production`
   y verifica los payloads contra https://docs.wompi.co/ (los formatos pueden
   cambiar; el código marca los puntos exactos a revisar).

Precios: hoy se cobra el número del plan en centavos COP
($4.99 → $499 COP, perfecto para la prueba real del profe).
Antes de producción define precios COP reales (ej. $16.900) en `lib/billing.ts`.

## 7. Módulo 1 — ponerlo a andar (local y Oracle)

```bash
# 1. Solo Postgres en local (Docker Desktop) u Oracle (docker-compose ya lo trae):
docker compose up -d postgres

# 2. Variables y migración
cp .env.example .env   # pon DATABASE_URL + AUTH_SECRET reales
npx prisma migrate dev --name init   # crea tablas User/Profile/Account/Session/VerificationToken

# 3. Probar login real
npm run dev
# /login con email nuevo → magic-link (sale por consola en dev, o por SMTP si lo configuraste)
# /signup → password → crea usuario con hash bcrypt + perfil "Principal"

# 4. SMTP para producción: Brevo gratis (smtp-relay.brevo.com:587) o Email Delivery de OCI.
# Sin SMTP, en dev el enlace mágico se imprime en la terminal del servidor.
```

Lo que te toca en Oracle cuando lleguemos al deploy completo:
`docker compose up -d --build` → `npx prisma migrate deploy` → listo.

## 9. Medios: videos, previews y posters

En local los videos viven en ./media/ (ignorada por git) y se sirven por GET /api/stream?file=nombre.mp4 con rangos (el seek funciona).

1. Pon el mp4 en media/ con nombre corto sin espacios (ej: toy-story-5.mp4)
2. Genera preview de 30s + poster (requiere ffmpeg): node scripts/make-preview.mjs media/toy-story-5.mp4
3. Conecta el titulo en Mongo (coleccion titles): videoUrl, trailerUrl y image apuntando a /api/stream?file=...

En Oracle sube los mp4 a /opt/popconly/media con scp y pon MEDIA_DIR=/opt/popconly/media.

