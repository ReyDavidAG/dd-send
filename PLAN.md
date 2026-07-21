# PLAN — SaaS de invitaciones personalizadas

> Bitácora viva del proyecto. Se actualiza en cada cambio relevante.
> Última actualización: 2026-07-20 · Cumpleaños festivo.

## 1. Qué estamos construyendo

MVP de un SaaS donde un usuario: elige una plantilla cerrada (cita, cumpleaños,
boda…), llena un formulario con su contenido (texto, fecha, fotos, colores de
una paleta curada), **paga una vez**, y se genera una página única en
`/i/[slug]` que vive activa hasta una fecha de expiración.

Sin editor libre (nada de drag-and-drop). Plantillas cerradas con campos
editables.

## 2. Decisión de ramas y convivencia con el Astro existente

- Todo el trabajo va en la rama **`feature/saas-invitations`**, creada desde
  `develop`. **No se toca `main` ni `develop` directamente.**
- El proyecto Astro actual (invitación de Denisse, en la raíz del repo) es
  **solo referencia de diseño**, NO código reutilizable — Astro y Next.js son
  frameworks distintos. Su diseño (HTML/CSS + animaciones GSAP ScrollTrigger)
  se **reconstruye como componentes React** dentro de Next.
- El Astro se **eliminará del repo más adelante**, una vez que el MVP funcione.
  Por eso el producto vive en `/web` y el Astro se queda en la raíz: borrar el
  Astro luego es limpio, y `/web` se puede promover a la raíz (o Vercel apunta
  su *root directory* a `/web`).
- El deploy a producción (Vercel) se hará **después**, cuando el MVP esté listo.

## 3. Arquitectura (fijada por requerimiento, sin backend separado)

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend + servidor | **Next.js (App Router)** + TypeScript | Un solo proyecto en `/web` |
| Estilos | Tailwind CSS v4 | Mismo stack visual que el Astro de referencia |
| Lógica de servidor | **Server Actions** + **Route Handlers** (`/api`) | Corren en Vercel; sin Express/Nest/.NET |
| BD / Auth / Storage | **Supabase** (Postgres + Auth + Storage) | Cliente Supabase directo desde el servidor |
| Pagos | **Mercado Pago Checkout Pro** | Pago único por invitación + webhook |
| Hosting | **Vercel** | Frontend + Route Handlers en el mismo deploy |
| Animaciones | **GSAP + ScrollTrigger** | Portadas a React vía `useEffect`/`gsap.context` |

### Reglas de dónde vive cada lógica
- **En el navegador:** vista previa en vivo del formulario, animaciones GSAP.
- **En el servidor (Server Actions / Route Handlers):** crear/editar borrador,
  generar slug único, crear preferencia de pago, recibir webhook, verificar
  pago, activar invitación y calcular `expires_at`.
- **Service-role key** de Supabase: SOLO en el servidor (`lib/supabase/admin.ts`),
  nunca en el cliente. La usa el webhook para activar invitaciones (salta RLS).

## 4. Estructura de carpetas

```
/                              # raíz del repo
├── astro.config.mjs           # ─┐
├── src/                       #  │ Astro de referencia (borrable más adelante)
├── public/                    #  │
├── package.json               # ─┘  (Astro)
├── PLAN.md                     # este archivo (bitácora viva del repo)
└── web/                        # ← PRODUCTO: proyecto Next.js autocontenido
    ├── package.json            # deps de Next (independiente del Astro)
    ├── next.config.ts
    ├── tsconfig.json
    ├── middleware.ts           # refresco de sesión Supabase (auth)
    ├── .env.local.example      # variables de entorno documentadas
    ├── public/
    ├── supabase/
    │   ├── migrations/         # SQL: esquema + RLS (versionado)
    │   └── seed.sql            # alta de las plantillas iniciales
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                      # 1. Landing
        │   ├── (auth)/login/page.tsx         # 2. Login
        │   ├── (auth)/register/page.tsx      # 2. Registro
        │   ├── dashboard/page.tsx            # 6. Mis invitaciones + estado
        │   ├── create/[templateKey]/page.tsx # 4. Formulario + preview en vivo
        │   ├── i/[slug]/page.tsx             # public SSR (lee de Supabase)
        │   └── api/
        │       ├── checkout/route.ts         # crea preferencia Mercado Pago
        │       └── webhooks/mercadopago/route.ts  # 5. verifica pago → activa
        ├── actions/
        │   └── invitations.ts                # Server Actions (draft, update…)
        ├── lib/
        │   ├── supabase/
        │   │   ├── server.ts                 # cliente servidor (cookies)
        │   │   ├── client.ts                 # cliente navegador (anon)
        │   │   └── admin.ts                   # cliente service-role (server-only)
        │   ├── mercadopago.ts                 # SDK + helpers de pago
        │   └── slug.ts                        # generación de slug único
        ├── templates/                         # catálogo + diseños en React
        │   ├── registry.ts                    # key → { component, schema, meta }
        │   ├── hooks/useScrollReveal.ts       # GSAP ScrollTrigger en useEffect
        │   ├── cita/                          # 3. diseño portado del Astro
        │   │   ├── CitaTemplate.tsx
        │   │   ├── sections/                  # Hero, Message, DateDetails,
        │   │   │                              # Countdown, Rsvp (React)
        │   │   └── schema.ts                  # campos editables + paleta curada
        │   ├── cumpleanos/
        │   └── boda/
        └── components/                        # UI compartida (botones, inputs…)
```

## 5. Esquema de base de datos (Supabase / Postgres)

Cuatro tablas en `public` + `auth.users` (gestionada por Supabase Auth).
Dinero en **enteros (centavos)**. `expires_at` se calcula al activar; el estado
**"expirada" NO se guarda: se deriva** en la query (`expires_at < now()`), así
no hace falta ningún cron.

### `profiles` (1:1 con `auth.users`)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = `auth.users.id`, `on delete cascade` |
| email | text | |
| full_name | text null | |
| created_at | timestamptz | `default now()` |

Se crea automáticamente con un trigger `on auth.users insert` (security definer).

### `templates` (catálogo)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | `default gen_random_uuid()` |
| key | text unique | `'cita' \| 'cumpleanos' \| 'boda'` → mapea al componente React |
| name | text | |
| description | text | |
| category | text | |
| base_price | integer | **centavos MXN** (precio por plantilla) |
| currency | text | `default 'MXN'` |
| active_days_after | integer | `default 7` — margen para `expires_at` |
| preview_image | text | |
| is_active | boolean | `default true` |
| created_at | timestamptz | `default now()` |

> Nota de diseño: la **definición de campos editables + paleta** vive en el
> código (`templates/<key>/schema.ts`, tipado), no en la BD — no se puede
> serializar React ni validar bien desde jsonb. La tabla `templates` es el
> **catálogo** (metadata + precio + qué componente renderizar).

### `invitations`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | `default gen_random_uuid()` |
| user_id | uuid | → `auth.users.id`, `on delete cascade` |
| template_id | uuid | → `templates.id` |
| slug | text unique | generado en servidor, único |
| status | text | `'draft' \| 'pending_payment' \| 'active'` (default `'draft'`) |
| content | jsonb | datos del formulario (textos, fecha, fotos, paleta elegida) |
| event_date | timestamptz null | |
| published_at | timestamptz null | se setea al activar |
| expires_at | timestamptz null | = `event_date + template.active_days_after` |
| created_at / updated_at | timestamptz | |

Índices: `slug` (unique), `user_id`.
Flujo de estado: `draft` → `pending_payment` (al crear checkout) → `active`
(al aprobar el webhook). "Expirada" = `active` con `expires_at < now()`.

### `payments`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | `default gen_random_uuid()` |
| invitation_id | uuid | → `invitations.id`, `on delete cascade` |
| user_id | uuid | → `auth.users.id` |
| provider | text | `default 'mercadopago'` |
| mp_preference_id | text null | id de la preferencia de Checkout Pro |
| mp_payment_id | text null | id del pago (llega en el webhook) |
| amount | integer | centavos |
| currency | text | `default 'MXN'` |
| status | text | `'pending' \| 'approved' \| 'rejected' \| 'refunded'` |
| raw | jsonb null | payload del webhook (auditoría) |
| created_at / updated_at | timestamptz | |

Índices: `invitation_id`, `mp_payment_id`.

### Relaciones
```
auth.users 1─1 profiles
auth.users 1─N invitations ─N─1 templates
invitations 1─N payments ─N─1 auth.users
```

## 6. Row Level Security (RLS)

RLS **activado en las 4 tablas**. Resumen de políticas:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | `auth.uid() = id` | vía trigger | `auth.uid() = id` | — |
| `templates` | público si `is_active` | — (admin/service-role) | — | — |
| `invitations` | dueño **o** (`status='active'` y `expires_at > now()`) | `auth.uid() = user_id` | dueño y `status='draft'` | dueño |
| `payments` | `auth.uid() = user_id` | — (service-role) | — (service-role) | — |

Claves:
- **Página pública `/i/[slug]`**: la política de SELECT de `invitations` permite
  a cualquiera (anon) leer una invitación **solo si está activa y no expiró**.
- **Edición**: el usuario solo puede modificar sus invitaciones en `draft`
  (evita manipular una ya pagada). La activación (status→active, `expires_at`,
  `published_at`) la hace el **webhook con service-role** (salta RLS).
- **Pagos**: los escribe solo el servidor (checkout + webhook) con service-role.

### Storage (fotos)
- Bucket `invitation-photos`. Ruta: `{user_id}/{invitation_id}/{archivo}`.
- Escritura restringida al dueño (policy por prefijo `auth.uid()`).
- Lectura pública (las fotos se muestran en la invitación pública de todos
  modos). Si más adelante se requiere privacidad → URLs firmadas.

## 7. Flujo end-to-end

1. Usuario autenticado (Supabase Auth) llena el formulario de una plantilla →
   **Server Action** guarda `invitation` como `draft` (+ sube fotos a Storage).
2. Usuario paga: **Route Handler `/api/checkout`** crea la preferencia de
   Mercado Pago (monto = `template.base_price`), marca `pending_payment`, y
   redirige a **Checkout Pro**.
3. Mercado Pago llama a **`/api/webhooks/mercadopago`** → se **verifica la firma**
   → si el pago está aprobado: `payments.status='approved'`, `invitation.status
   ='active'`, `published_at=now()`, `expires_at = event_date + active_days_after`.
4. **`/i/[slug]`** renderiza server-side leyendo Supabase. Si `expires_at < now()`
   → muestra "invitación expirada".

## 8. Variables de entorno (`web/.env.local.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # SOLO server
MERCADOPAGO_ACCESS_TOKEN=         # SOLO server
MERCADOPAGO_WEBHOOK_SECRET=       # para verificar firma del webhook
NEXT_PUBLIC_SITE_URL=             # para back_urls y links de invitación
```

## 9. Fases de implementación

- [x] **Fase 0 — Planeación.** Rama `feature/saas-invitations`, este PLAN.md,
  estructura y esquema aprobados.
- [x] **Fase 1 — Scaffold + Supabase.** Next.js 16 en `/web` (TS + Tailwind v4).
  Migración `supabase/migrations/0001_init.sql` (esquema + RLS + trigger de
  profiles + `updated_at`) y `seed.sql` (3 plantillas). Clientes Supabase
  (`server`/`client`/`admin`) + `middleware.ts`. Deps: `@supabase/ssr`,
  `@supabase/supabase-js`, `mercadopago`, `gsap`, `@gsap/react`.
  **Pendiente manual del usuario** (§12) antes de Fase 2.
- [x] **Fase 2 — Auth + Landing.** Auth email/password (Supabase) vía Server
  Actions (`signIn`/`signUp`/`signOut`) + `AuthForm` compartido + páginas
  `/login` `/register` + route handler `/auth/confirm`. Landing que lista el
  catálogo desde Supabase. Dashboard mínimo protegido (redirige a `/login` sin
  sesión). Verificado end-to-end: landing renderiza plantillas, dashboard
  redirige. **Rutas usadas: `/login`, `/register`** (sin route group, más simple).
- [x] **Fase 3 — Plantillas.** `useScrollReveal` (GSAP ScrollTrigger en
  `useEffect` + `gsap.context`, reversa al subir), `InvitationView` (hero,
  mensaje+fotos, detalles, countdown en vivo, RSVP con corazones + WhatsApp),
  registry con 3 plantillas (`cita`/`cumpleanos`/`boda`) — paletas curadas +
  schema de campos + defaults — y ruta `/preview/[key]`. Verificado: las 3
  renderizan (200) y clave inválida → 404. También: **login con Google (OAuth)**.
  ponytail: un solo layout parametrizado por paleta; layouts distintos por
  plantilla cuando alguno lo necesite.
- [x] **Fase 4 — Formulario + preview en vivo.** Editor `/create/[templateKey]`
  (protegido): formulario generado desde el schema del registry + vista previa
  en vivo (`InvitationView animate={false}`) + subida de fotos a Supabase
  Storage. `saveDraft` (Server Action) crea/actualiza el borrador con slug
  único. Migración `0002_storage.sql` (bucket + RLS). Botón Google detrás de
  `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. Verificado: build limpio, `/create` sin
  sesión → `/login`, clave inválida → 404.
- [x] **Fase 5 — Pagos.** `/api/checkout` crea preferencia de Checkout Pro y
  marca `pending_payment`; `/api/webhooks/mercadopago` verifica la firma HMAC
  `x-signature` y al aprobarse activa la invitación + calcula `expires_at`.
  `PayButton` inicia el flujo. Requiere credenciales MP (§12.7).
- [x] **Fase 6 — Público + Dashboard.** `/i/[slug]` SSR (service-role +
  validación de estado/expiración, con aviso "no disponible"/"expirada").
  Dashboard lista las invitaciones con estado (borrador/pago pendiente/activa/
  expirada) y acciones (editar/ver/pagar). También: secciones mostrar/ocultar/
  reordenar en el editor + edición de borradores existentes (`?id`).
- [ ] **Fase 7 — Deploy.** Configuración de Vercel (root dir `/web`, envs).

## 10. Decisiones técnicas registradas
- **Sin backend separado** (requerimiento): toda la lógica de servidor en
  Server Actions / Route Handlers de Next.
- **`expires_at` derivado, sin cron**: se filtra en la query. Menos infraestructura.
- **Dinero en centavos (int)**: evita errores de flotante.
- **Precio por plantilla** (`templates.base_price`), moneda **MXN**.
- **Astro = referencia**, se reconstruye en React y se borra luego (§2).
- **GSAP en React**: init dentro de `useEffect` con `gsap.context()` para
  limpieza; `toggleActions: 'play reverse play reverse'` (mismo comportamiento
  que la referencia Astro).
- **Next.js 16 (breaking changes vs. versiones previas)** — ver `web/AGENTS.md`:
  - `cookies()`/`headers()`/`params`/`searchParams` son **async** (hay que
    `await`). Ya aplicado en los clientes Supabase y páginas.
  - **`middleware.ts` → `proxy.ts`** (export `proxy`, runtime nodejs). Con `src/`
    debe ir en **`src/proxy.ts`** para que Next lo detecte.
  - Server Actions con `useActionState(prevState, formData)`; `redirect()` fuera
    de try/catch; **re-verificar auth dentro de cada action/página protegida**.
  - `next lint` eliminado; Turbopack por defecto en dev/build.

## 12. Setup manual pendiente (usuario) antes de Fase 2
1. Crear proyecto en [supabase.com](https://supabase.com).
2. Copiar `web/.env.local.example` a `web/.env.local` y llenar
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
3. Ejecutar el SQL: pegar `web/supabase/migrations/0001_init.sql` y luego
   `web/supabase/seed.sql` en el SQL Editor de Supabase (o usar Supabase CLI).
4. Storage: correr `web/supabase/migrations/0002_storage.sql` en el SQL Editor
   (crea el bucket público `invitation-photos` + políticas por dueño). Ya no hay
   que crearlo a mano.
4b. Correr `web/supabase/migrations/0003_blank_template.sql` (plantilla "en
   blanco"; sin ella, guardar/pagar una invitación en blanco falla).
5. Mercado Pago y su webhook se configuran en Fase 5.
6. **Login con Google (OAuth)** — para que el botón funcione:
   - Supabase → Authentication → Providers → **Google**: activar y pegar
     Client ID / Secret (de Google Cloud Console → OAuth consent + credentials).
   - Supabase → Authentication → URL Configuration → **Redirect URLs**: agregar
     `http://localhost:3000/auth/callback` (y la URL de Vercel al desplegar).
   - En Google Cloud, el *Authorized redirect URI* es el callback de Supabase:
     `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
   - **Apple**: pospuesto (requiere Apple Developer de pago, $99/año; sin app
     iOS no aporta al MVP).
7. **Pagos (Mercado Pago)** — para probar el flujo de pago:
   - Llenar `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (lo usan checkout,
     webhook y la página pública `/i/[slug]`). **Sin esto, esas 3 cosas fallan.**
   - `MERCADOPAGO_ACCESS_TOKEN` (Mercado Pago → Tus integraciones → credenciales;
     usa las de **prueba** primero).
   - `MERCADOPAGO_WEBHOOK_SECRET` (la "clave secreta" de Webhooks en el panel MP).
   - Configurar la URL de webhook en MP → `${SITE}/api/webhooks/mercadopago`
     (evento *Pagos*). En local, exponer con un túnel (ngrok/cloudflared) porque
     MP necesita una URL pública.

## 11. Bitácora / Changelog
- **2026-07-20** — Fase 0. Creada rama `feature/saas-invitations` desde
  `develop`. Definidos arquitectura, estructura de carpetas, esquema de BD y
  RLS. Decisiones confirmadas: Astro en raíz + Next en `/web`; `expires_at =
  event_date + N días`; precio por plantilla en MXN.
- **2026-07-20** — Fase 1. Scaffold Next.js 16 en `/web` (App Router, TS,
  Tailwind v4). Añadidos clientes Supabase (server/client/admin), `middleware.ts`
  de refresco de sesión, migración `0001_init.sql` (4 tablas + RLS + triggers)
  y `seed.sql`. Instaladas deps del stack. Typecheck en verde. Falta setup
  manual de Supabase (§12).
- **2026-07-20** — Setup Supabase hecho por el usuario: SQL + seed corridos,
  env con URL + anon key (service_role pendiente hasta Fase 5). Verificado por
  REST: `templates` devuelve las 3 plantillas.
- **2026-07-20** — Fase 2. Auth email/password (Server Actions + `AuthForm` +
  `/login` `/register` + `/auth/confirm`), landing con catálogo, dashboard
  mínimo protegido. Renombrado `middleware.ts` → `src/proxy.ts` por Next 16.
  Build y smoke test en verde (landing lista plantillas; dashboard redirige a
  login sin sesión).
- **2026-07-20** — Fase 3. Sistema de plantillas: `useScrollReveal` (GSAP),
  `InvitationView`, registry de 3 plantillas + `/preview/[key]`. Añadido login
  con Google (OAuth) + `/auth/callback`. Apple pospuesto. Build en verde; las 3
  plantillas renderizan (200) y clave inválida → 404. Falta configurar el
  provider Google en Supabase (§12.6) para probar el OAuth.
- **2026-07-20** — Fase 4. Editor `/create/[templateKey]` con formulario
  generado del schema + vista previa en vivo + subida de fotos a Storage;
  `saveDraft` (borrador + slug único); migración `0002_storage.sql`. Botón
  Google detrás de env flag (OAuth diferido). Build limpio; smoke test OK.
  Pendiente manual: correr `0002_storage.sql` para habilitar la subida de fotos.
- **2026-07-20** — Rebrand + pase de diseño (antes de Fase 5). Producto ahora
  **DD-Send**. Nueva paleta de marca (atardecer plum→coral→ámbar) para el chrome
  (distinta a las paletas de invitación). Landing rediseñada (hero con gradiente
  animado, "cómo funciona", catálogo con hover), transición de navegación
  (`template.tsx`), pantalla de carga con marca (`loading.tsx` + `Loader`),
  editor responsivo (pestañas Editar/Vista previa en móvil, preview a pantalla
  completa, selector de paleta con muestras). `allowedDevOrigins` para probar en
  celular. Gotcha Next 16: si cambias el config y aparece el error
  `global-error.js#default ... React Client Manifest`, es caché stale →
  `rm -rf web/.next` y reinicia. **Pendiente (próxima iteración de diseño):**
  layouts visualmente distintos por plantilla.
- **2026-07-20** — Fases 5 y 6 + personalización de secciones. Pagos con Mercado
  Pago (`/api/checkout` + webhook con verificación de firma → activa + calcula
  `expires_at`), `PayButton`. Página pública `/i/[slug]` (SSR con aviso de
  no-disponible/expirada). Dashboard que lista invitaciones con estado y
  acciones (arregla "no salían los borradores"). Editor: secciones
  mostrar/ocultar/reordenar, edición de borrador existente (`?id`), feedback de
  guardado (spinner + "✓ Guardado"). Build limpio; smoke test OK. Pendiente
  manual: `SUPABASE_SERVICE_ROLE_KEY` + credenciales MP + URL de webhook (§12.7).
- **2026-07-20** — Personalización avanzada + nueva landing. **Encabezado
  editable** (`headline`, sin "&" fijo — soporta "Cumpleaños de Andrés").
  **Tipografía seleccionable** (librería `FONTS`, 5 opciones). **Animaciones
  elegibles** (suave/dinámica/ninguna) que controlan intensidad de reveals +
  **parallax del hero** (GSAP, como el Astro). **Drag-and-drop** nativo para
  reordenar secciones (flechas de respaldo). Nueva **landing editorial** (hero a
  dos columnas con preview en vivo enmarcado). `TemplateStyle` ahora solo define
  el `hero`; las fuentes son por contenido. Build y smoke test OK.

- **2026-07-20** — Iteración de plantillas/UX. Librería compartida de 14
  paletas para todas las plantillas. Plantillas ahora **visualmente distintas**
  vía `TemplateStyle` (tipografías Playfair/Poppins/Great Vibes + variantes de
  hero: photo/split/festive). Selector `/create` con **mini-previews en vivo** e
  incluye **"En blanco"** (`0003_blank_template.sql`, `is_active=false`). Landing
  y dashboard usan `MiniPreview`. Editor: al enfocar un campo, el preview
  (desktop) **se desliza a la sección** correspondiente; enlace "Cambiar
  plantilla". Build y smoke test OK (heroes distintos por plantilla verificados).
- **2026-07-20** — **Cumpleaños más festivo**. Variante `festive` del hero
  rediseñada: balloons (🎈) flotando a los lados, regalos (🎁) abajo, ✨⭐
  brillando, 🎂 central con bounce, fondo con dos halos radiales sobre el
  gradiente existente. 3 keyframes CSS puros nuevos
  (`ddBalloon`/`ddBounce`/`ddTwinkle` + utilidades `.dd-anim-*`); respetan
  `prefers-reduced-motion`. Registry: animationKey default `suave` →
  `dinamica`, copy celebratorio (`signature` "¡Te esperamos! 🎉",
  `rsvpMessage` "¡Ahí estaré! 🎂"). Sin nuevos campos ni deps. Editable
  completo desde el editor. Build + lint + smoke test OK en `/preview/cumpleanos`
  (cita/boda/blank sin regresión).
